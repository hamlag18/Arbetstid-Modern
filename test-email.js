const RAILWAY_API_KEY = 'e0192ffd-d77d-4fa6-9579-1bde3661efdf';
const RAILWAY_ENDPOINT = 'https://email-server-production-a333.up.railway.app';

async function testEmailServer() {
  try {
    const response = await fetch(RAILWAY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_API_KEY}`
      },
      body: JSON.stringify({
        to: 'hampus.lagerstrom@gmail.com',
        subject: 'Test Email',
        text: 'This is a test email from the email server.',
        from: 'noreply@arbetstid.se'
      })
    });

    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmailServer(); 