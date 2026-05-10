import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createHttpServer } from "http";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const s3Client = new S3Client({
  forcePathStyle: true,
  region: process.env.SUPABASE_S3_REGION || "sa-east-1",
  endpoint: process.env.SUPABASE_S3_ENDPOINT || "https://hofehxzukldxdewgntof.storage.supabase.co/storage/v1/s3",
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || "",
  }
});
const BUCKET_NAME = process.env.SUPABASE_S3_BUCKET || "chatgeral";

async function startServer() {
  const app = express();
  const allowedOrigins = [
    "https://nexuschat.cysmk.online",
    "https://nexuschat-55d.pages.dev",
    "https://call.ironvalecraft.shop",
    "https://painelcall.ironvalecraft.shop",
    "http://localhost:5173", // For development
    "http://localhost:3000"  // For development
  ];

  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  }));
  const PORT = process.env.API_PORT || process.env.PORT || 4000;
  const httpServer = createHttpServer(app);
  
  const io = new SocketIOServer(httpServer, {
    path: process.env.SOCKET_PATH || '/socket.io',
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-room", (data) => {
      const { roomId, userId, displayName } = data;
      socket.join(roomId);
      socket.to(roomId).emit("participant-joined", { userId, displayName, participant: data });
      
      // Store userId in socket to handle disconnects gracefully
      (socket as any).userId = userId;
      (socket as any).roomId = roomId;
    });

    // Handle generic WebRTC signaling
    socket.on("webrtc:offer", (data) => {
      // data: { callId, targetId, sourceId, offer }
      socket.to(data.callId).emit("webrtc:offer", data);
    });

    socket.on("webrtc-offer", (data) => {
      socket.to(data.roomId).emit("webrtc-offer", data);
    });

    socket.on("webrtc:answer", (data) => {
      socket.to(data.callId).emit("webrtc:answer", data);
    });

    socket.on("webrtc-answer", (data) => {
      socket.to(data.roomId).emit("webrtc-answer", data);
    });

    socket.on("webrtc:ice-candidate", (data) => {
      socket.to(data.callId).emit("webrtc:ice-candidate", data);
    });

    socket.on("webrtc-ice-candidate", (data) => {
      socket.to(data.roomId).emit("webrtc-ice-candidate", data);
    });

    socket.on("disconnect", () => {
      const userId = (socket as any).userId;
      const roomId = (socket as any).roomId;
      if (userId && roomId) {
        socket.to(roomId).emit("participant-left", { userId });
      }
    });
  });

  app.use(express.json());

  // API Root route
  app.get("/", (req, res) => {
    // Only return the JSON if explicitly hit as an API or missing Accept header for HTML,
    // Note: since this is also a Vite SSR/SPA host, we check if it's the specific domain or just return it for testing.
    // To preserve Vite's SSR, we only respond to JSON requests here or if explicitly matched.
    if (req.accepts('html') && process.env.NODE_ENV === 'production') {
       return res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    }
    
    res.json({
      success: true,
      name: "Nexus Calls API",
      version: "1.0.0",
      api: process.env.PUBLIC_API_URL || "https://call.ironvalecraft.shop",
      socket: process.env.SOCKET_PATH || "/socket.io",
      panel: process.env.PUBLIC_PANEL_URL || "https://painelcall.ironvalecraft.shop",
      docs: "/docs",
      health: "/health"
    });
  });

  // Health route
  app.get("/health", (req, res) => {
    res.json({
      ok: true,
      service: "Nexus Calls API",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    });
  });

  // Docs route
  app.get("/docs", (req, res) => {
    res.sendFile(path.join(process.cwd(), "docs.html"));
  });

  // Storage API endpoints
  app.post("/api/storage/presign", async (req, res) => {
    try {
      const { filename, contentType } = req.body;
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
        ContentType: contentType,
      });
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      res.json({ url });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/storage/delete", async (req, res) => {
    try {
      const { filename } = req.body;
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filename,
      });
      await s3Client.send(command);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/storage/list", async (req, res) => {
    try {
      const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
      const response = await s3Client.send(command);
      res.json({ contents: response.Contents || [] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/auth/google/url", (req, res) => {
    const { scope, action } = req.query;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("Missing GOOGLE_CLIENT_ID environment variable");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const host = req.headers['x-forwarded-host'] || req.get('host') || "";
    const protocol = host.includes('localhost') ? 'http' : 'https';
    let backendOrigin = `${protocol}://${host}`;
    
    // Override origins for Cloudflare Pages deployment or specific domains
    let redirectUri = process.env.GOOGLE_REDIRECT_URI || `${backendOrigin}/api/auth/google/callback`;
    
    // Fallback overrides to fixing domain issue
    if (!redirectUri.includes("localhost")) {
       redirectUri = process.env.GOOGLE_REDIRECT_URI || "https://nexuschat-55d.pages.dev/api/auth/google/callback";
    }

    const stateObj = { origin: backendOrigin, action: action as string };
    const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scope as string || "email profile",
      state: stateStr,
      access_type: "offline",
      prompt: "consent"
    });

    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, state, error } = req.query;
    if (error || !code) {
      return res.send(`<script>window.opener?.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${error}' }, '*'); window.close();</script>`);
    }

    try {
      let parsedState: any = {};
      try {
        parsedState = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
      } catch (err) {
        return res.send(`<script>window.opener?.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Invalid state' }, '*'); window.close();</script>`);
      }
      
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variable");
        return res.send(`<script>window.opener?.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'Server configuration error' }, '*'); window.close();</script>`);
      }
      
      let redirectUri = process.env.GOOGLE_REDIRECT_URI || `${parsedState.origin}/api/auth/google/callback`;
      
      if (!redirectUri.includes("localhost")) {
         redirectUri = process.env.GOOGLE_REDIRECT_URI || "https://nexuschat-55d.pages.dev/api/auth/google/callback";
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code as string,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });
      const tokenData = await tokenRes.json();
      
      if (!tokenRes.ok) {
        return res.send(`<script>window.opener?.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${tokenData.error_description || tokenData.error}' }, '*'); window.close();</script>`);
      }

      // Fetch user info for profile/email
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userRes.json();

      res.send(`
        <html><body><script>
          window.opener?.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            action: '${parsedState.action}',
            accessToken: '${tokenData.access_token}',
            user: ${JSON.stringify(userData)}
          }, '*');
          window.close();
        </script>
        <p>Autenticação concluída. Pode fechar esta janela.</p>
        </body></html>
      `);

    } catch (e: any) {
      res.send(`<script>window.opener?.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${e.message}' }, '*'); window.close();</script>`);
    }
  });

  app.post("/api/contacts/sync", async (req, res) => {

    try {
      const { accessToken } = req.body;
      if (!accessToken) return res.status(400).json({ error: "Access token is required" });
      
      const url = `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=1000`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      console.error("/api/contacts/sync Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
