import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleQuote } from './quote.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png' };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/quote') {
      let size = 0; const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 20000) { res.writeHead(413); res.end('Request too large'); return; }
        chunks.push(chunk);
      }
      const request = new Request(new URL('/api/quote', process.env.SITE_ORIGIN || 'http://localhost'), {
        method: req.method, headers: req.headers,
        ...(!['GET', 'HEAD'].includes(req.method) ? { body: Buffer.concat(chunks) } : {})
      });
      // Use the direct peer address. Do not trust arbitrary forwarded IP headers.
      const result = await handleQuote(request, process.env, { ip: req.socket.remoteAddress });
      res.writeHead(result.status, Object.fromEntries(result.headers)); res.end(await result.text()); return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    else if (!path.extname(pathname)) pathname += '.html';
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const bytes = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(Number(process.env.PORT || 8765), process.env.HOST || '127.0.0.1', () => console.log(`Homepage server listening on port ${process.env.PORT || 8765}`));
