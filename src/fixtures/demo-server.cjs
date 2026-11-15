const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const page = readFileSync(join(__dirname, 'demo.html'));
const todos = new Map();
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:4173');
  const send = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'",
    });
    return res.end(page);
  }
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(200, { status: 'ok' });
  }
  if (url.pathname === '/api/todos' && req.method === 'POST') {
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 4096) {
          send(413, { error: 'Body too large' });
          return;
        }
      }
      const { title } = JSON.parse(body);
      if (typeof title !== 'string' || !title.trim() || title.length > 200) {
        return send(400, { error: 'Title must contain 1–200 characters' });
      }
      if (todos.size >= 1000) return send(429, { error: 'Demo capacity reached' });
      const todo = { id: randomUUID(), title: title.trim() };
      todos.set(todo.id, todo);
      return send(201, todo);
    } catch {
      return send(400, { error: 'Invalid JSON body' });
    }
  }
  const match = /^\/api\/todos\/([a-f0-9-]+)$/.exec(url.pathname);
  if (match) {
    const todo = todos.get(match[1]);
    if (!todo) return send(404, { error: 'Not found' });
    if (req.method === 'GET') return send(200, todo);
    if (req.method === 'DELETE') {
      todos.delete(match[1]);
      res.writeHead(204);
      return res.end();
    }
  }
  send(404, { error: 'Not found' });
});
server.requestTimeout = 10_000;
server.listen(4173, '127.0.0.1', () => console.log('Demo ready on http://127.0.0.1:4173'));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
