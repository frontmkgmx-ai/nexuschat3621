const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`        const url = req.url || '';`,
`        const url = req.url || '';
        const bucketId = process.env.STREAMX_BUCKET_ID || '5500ceff-6d51-4f33-aee4-a07e2725ddaf';
        // Fix bucket server-side by intercepting uploads if needed
        if (req.method === 'POST' && url.includes('/objects') && !url.includes(bucketId)) {
           res.writeHead(403, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify({ error: "Invalid bucket destination" }));
           proxyReq.destroy();
           return;
        }`
);

fs.writeFileSync('server.ts', code);
