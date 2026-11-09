import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Running the bundled file (dist/server.js) => production, even if NODE_ENV is not set
const isProduction =
  process.env.NODE_ENV === 'production' || __dirname.split(path.sep).pop() === 'dist';
if (isProduction) process.env.NODE_ENV = 'production';

async function startServer() {
  // Import after env is final (api.ts reads JWT_SECRET / NODE_ENV at load time)
  const { apiRouter } = await import('./server/api');
  const { initializeDatabase, isConnected } = await import('./server/db');

  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.set('trust proxy', 1); // Hostinger sits behind a proxy (needed for correct client IP)
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cors({ origin: process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL' ? process.env.APP_URL : true }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', database: isConnected() ? 'connected' : 'disconnected', time: new Date().toISOString() });
  });

  app.use('/api', apiRouter);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));

  const db = await initializeDatabase();
  console.log(`[DB] ${db.message}`);
  if (!db.connected) {
    // Hostinger DB may not be ready/configured yet: keep retrying instead of staying disconnected until restart
    const retry = setInterval(async () => {
      if (isConnected()) return clearInterval(retry);
      const r = await initializeDatabase();
      console.log(`[DB retry] ${r.message}`);
      if (r.connected) clearInterval(retry);
    }, 30000);
  }

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.basename(__dirname) === 'dist' ? __dirname : path.resolve(__dirname, 'dist');
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      console.error(`[Server] index.html not found in ${distPath}. Run "npm run build" first.`);
    }
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Tutor Monk] Running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('[Tutor Monk Server Error]', err);
  process.exit(1);
});
