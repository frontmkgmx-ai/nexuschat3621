import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

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
  const PORT = 3000;

  app.use(express.json());

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
    const backendOrigin = `${protocol}://${host}`;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${backendOrigin}/api/auth/google/callback`;

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
      
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${parsedState.origin}/api/auth/google/callback`;

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
