import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
const app = express();
app.use('/api', createProxyMiddleware({
  target: 'https://streamx.frontmk.online',
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-API-Key', 'test');
    }
  }
}));
console.log("compiles!");
