import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Grundläggande middleware
app.use(cors());
app.use(express.json());

// Servera statiska filer
app.use('/', express.static('dist'));

// Hantera alla routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Starta servern
app.listen(port, '0.0.0.0', () => {
  console.log(`Server körs på port ${port}`);
}); 