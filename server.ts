import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createHttpServer } from "http";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

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
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.run.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS')); 
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  }));
  const PORT = 3000;
  const httpServer = createHttpServer(app);
  
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
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

  // Storage Health Check
  app.get("/api/storage/health", async (req, res) => {
    try {
      let baseUrl = process.env.STREAMX_BASE_URL || "https://streamx.frontmk.online/api/storage/v1";
      // Ensure the URL correctly points to the API if the env var was misconfigured
      if (baseUrl === "https://streamx.frontmk.online") {
         baseUrl = "https://streamx.frontmk.online/api/storage/v1";
      } else if (baseUrl === "https://streamx.frontmk.online/api/storage") {
         baseUrl = "https://streamx.frontmk.online/api/storage/v1";
      }

      const bucketId = process.env.STREAMX_BUCKET_ID || "5500ceff-6d51-4f33-aee4-a07e2725ddaf";
      
      let apiKey = process.env.STREAMX_API_KEY || process.env.MYCLOUD_API_KEY;
      if (apiKey === 'mk_f3bc057a386d4d337b3524a2c1f82311db71cc047cea2b42' && process.env.MYCLOUD_API_KEY) {
         apiKey = process.env.MYCLOUD_API_KEY; // Safeguard against the old wrong key stuck in the container env
      }

      if (!apiKey) {
        return res.json({
          configured: false,
          error: "KEY_MISSING",
          code: "KEY_MISSING"
        });
      }

      if (bucketId !== "5500ceff-6d51-4f33-aee4-a07e2725ddaf") {
         return res.json({
          configured: false,
          error: "BUCKET_NOT_FOUND",
          code: "BUCKET_NOT_FOUND"
        });
      }

      const checkUrl = `${baseUrl}/buckets/${bucketId}/objects`;
      const response = await fetch(checkUrl, {
        headers: {
          "X-API-Key": apiKey,
          "Authorization": `Bearer ${apiKey}`
        }
      });

      if (response.status === 401) {
         return res.json({ configured: false, error: "UNAUTHORIZED", code: "UNAUTHORIZED" });
      }
      if (response.status === 403) {
         return res.json({ configured: false, error: "FORBIDDEN", code: "FORBIDDEN" });
      }
      if (response.status === 404) {
         return res.json({ configured: false, error: "BUCKET_NOT_FOUND", code: "BUCKET_NOT_FOUND" });
      }

      if (response.ok) {
         return res.json({
            configured: true,
            bucketId,
            baseUrl,
            upstreamStatus: response.status,
            code: "OK"
         });
      }

      return res.json({ configured: false, error: "UPSTREAM_ERROR", code: "UPSTREAM_ERROR", upstreamStatus: response.status });
    } catch (e: any) {
      return res.json({ configured: false, error: "UPSTREAM_ERROR", code: "UPSTREAM_ERROR", details: e.message });
    }
  });

  // MyCloud Storage API Proxy (mounted before express.json() to stream multipart and binary payloads cleanly)
  // We use pathFilter so Express preserves the full path (/api/storage/...) when proxying to streamx.frontmk.online
  const myCloudProxy = createProxyMiddleware({
    target: "https://streamx.frontmk.online",
    changeOrigin: true,
    pathFilter: ["/api/storage", "/api/s3", "/storage"],
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Limitar rotas e métodos
        const method = req.method;
        if (!['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'].includes(method!)) {
           res.writeHead(405, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify({ error: "Method not allowed" }));
           proxyReq.destroy();
           return;
        }

        // Validar tamanho (max 250MB fallback)
        const contentLength = parseInt(req.headers['content-length'] || '0', 10);
        if (method === 'POST' && contentLength > 262144000) { // 250MB
           res.writeHead(413, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify({ error: "Payload too large" }));
           proxyReq.destroy();
           return;
        }

        const url = req.url || '';
        let apiKey = process.env.STREAMX_API_KEY || process.env.MYCLOUD_API_KEY;
        if (apiKey === 'mk_f3bc057a386d4d337b3524a2c1f82311db71cc047cea2b42' && process.env.MYCLOUD_API_KEY) {
           apiKey = process.env.MYCLOUD_API_KEY; // Safeguard for old key
        }

        if (!apiKey) {
           res.writeHead(500, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify({ error: "Storage API Key is not configured." }));
           proxyReq.destroy();
           return;
        }
        proxyReq.setHeader("X-API-Key", apiKey);
        proxyReq.setHeader("Authorization", `Bearer ${apiKey}`);
      }
    }
  });

  app.use(myCloudProxy);

  app.use(express.json());

  // QR Auth endpoint (rotates strings to prevent frontend generation)
  app.get("/api/auth/qr", (req, res) => {
    const sessionId = "qr_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 10);
    const deviceName = req.query.device as string || "Desktop Browser";
    const qrData = JSON.stringify({ 
        type: "login", 
        sessionId, 
        generatedAt: Date.now(),
        deviceInfo: {
            id: sessionId,
            device: deviceName,
            lastActive: Date.now()
        }
    });
    res.json({ sessionId, qrData });
  });

  // API Root route
  app.get("/", (req, res, next) => {
    // To preserve Vite's SSR and SPA handling, only return JSON if the client doesn't explicitly want HTML.
    if (req.accepts('html')) {
       return next();
    }
    
    res.json({
      success: true,
      name: "Nexus Calls API",
      version: "1.0.0",
      api: process.env.PUBLIC_API_URL || "https://call.ironvalecraft.shop",
      socket: "/socket.io",
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
