import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.2.0',
    uptime: process.uptime()
  });
});

const PORT = Number(process.env.PORT) || 3000;
const distPath = path.resolve(__dirname, 'dist');
const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
const isDevScript = process.env.npm_lifecycle_event === 'dev';
const isProduction = process.env.NODE_ENV === 'production' || (!isDevScript && hasDist);

async function startServer() {
  if (isProduction) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Floor Up System running live on http://0.0.0.0:${PORT} (production=${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
