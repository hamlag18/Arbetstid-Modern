import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Skapa Vite-servern i development-läge
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  // Använd Vite's connect middleware
  app.use(vite.middlewares);

  // Servera statiska filer från dist-mappen
  app.use(express.static(join(__dirname, 'dist')));

  // Hantera alla andra routes genom att servera index.html
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server körs på port ${port}`);
  });
}

createServer(); 