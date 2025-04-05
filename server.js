import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Aktivera CORS
app.use(cors());

// Servera statiska filer från dist-mappen
app.use(express.static(join(__dirname, 'dist')));

// Hantera alla routes genom att servera index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Starta servern
app.listen(port, '0.0.0.0', () => {
  console.log(`Server körs på port ${port}`);
}); 