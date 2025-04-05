import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Statiska filer
app.use(express.static('dist'));

// API routes här om det behövs
// app.use('/api', apiRouter);

// Hantera alla andra routes
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Catch-all route för SPA
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Felhantering
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Något gick fel!');
});

// Starta servern
try {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server körs på port ${port}`);
  });
} catch (error) {
  console.error('Kunde inte starta servern:', error);
} 