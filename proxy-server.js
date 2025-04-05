import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 3001;

// Aktivera CORS för alla domäner
app.use(cors());
app.use(express.json());

// Proxy-endpoint för att skicka e-post
app.post('/send-email', async (req, res) => {
  try {
    console.log('Tar emot förfrågan:', req.body);
    
    const requestBody = {
      recipient: req.body.to,
      subject: req.body.subject,
      content: req.body.html
    };
    
    console.log('Skickar till Railway:', requestBody);

    const response = await fetch('https://email-server-production-a333.up.railway.app/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('Svar från Railway:', data);
    
    res.json(data);
  } catch (error) {
    console.error('Fel vid vidarebefordran av e-post:', error);
    res.status(500).json({ error: 'Kunde inte skicka e-post' });
  }
});

app.listen(port, () => {
  console.log(`Proxy-server körs på http://localhost:${port}`);
}); 