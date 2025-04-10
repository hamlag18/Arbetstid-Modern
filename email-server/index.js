import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS-konfiguration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://web-production-2e81.up.railway.app',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/', (_, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// E-post endpoint
app.post('/', async (req, res) => {
  try {
    console.log('Tar emot förfrågan');
    const { recipient, subject, content } = req.body;

    if (!recipient || !subject || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Saknade fält i förfrågan' 
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.USERNAME,
        pass: process.env.PASSWORD
      }
    });

    // Skapa en textversion av innehållet genom att ta bort HTML-taggar
    const textContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: recipient,
      subject: subject,
      text: textContent, // Textversion för e-postklienter som inte stödjer HTML
      html: content // Behåll original HTML-innehållet
    });

    console.log('E-post skickad');
    res.json({ success: true });
  } catch (error) {
    console.error('Fel:', error);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server körs på port ${port}`);
  console.log('Miljövariabler:', {
    host: process.env.SMTP_HOST ? 'finns' : 'saknas',
    port: process.env.SMTP_PORT ? 'finns' : 'saknas',
    username: process.env.USERNAME ? 'finns' : 'saknas',
    password: process.env.PASSWORD ? 'finns' : 'saknas',
    fromEmail: process.env.FROM_EMAIL ? 'finns' : 'saknas',
    corsOrigin: process.env.CORS_ORIGIN ? 'finns' : 'saknas'
  });
}); 