const fs = require('fs');
const path = require('path');

// Skapa en enkel HTML-fil som innehåller SVG-koden
const svgContent = fs.readFileSync('public/icons/icon.svg', 'utf8');

// Skapa en HTML-fil som kan öppnas direkt i webbläsaren
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Arbetstid Ikoner</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .icon-preview {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .icon-item {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .icon-item img {
      max-width: 100%;
      height: auto;
    }
    .icon-item p {
      margin: 10px 0 0;
      color: #666;
    }
    .download-all {
      display: block;
      background: #3B82F6;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      text-decoration: none;
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>Arbetstid App Ikoner</h1>
  <p>Klicka på "Ladda ner alla ikoner" för att få alla ikoner i rätt storlekar.</p>
  
  <a href="#" class="download-all" onclick="downloadAllIcons()">Ladda ner alla ikoner</a>
  
  <div class="icon-preview">
    <div class="icon-item">
      <img src="data:image/svg+xml;base64,${btoa(svgContent)}" alt="72x72">
      <p>72x72</p>
    </div>
    <div class="icon-item">
      <img src="data:image/svg+xml;base64,${btoa(svgContent)}" alt="96x96">
      <p>96x96</p>
    </div>
    <div class="icon-item">
      <img src="data:image/svg+xml;base64,${btoa(svgContent)}" alt="128x128">
      <p>128x128</p>
    </div>
    <div class="icon-item">
      <img src="data:image/svg+xml;base64,${btoa(svgContent)}" alt="144x144">
      <p>144x144</p>
    </div>
    <div class="icon-item">
      <img src="data:image/svg+xml;base64,${btoa(svgContent)}" alt="152x152">
      <p>152x152</p>
    </div>
    <div class="icon-item">
      <img src="data:image/svg+xml;base64,${btoa(svgContent)}" alt="192x192">
      <p>192x192</p>
    </div>
    <div class="icon-item">
      <img src="data:image/svg+xml;base64,${btoa(svgContent)}" alt="384x384">
      <p>384x384</p>
    </div>
    <div class="icon-item">
      <img src="data:image/svg+xml;base64,${btoa(svgContent)}" alt="512x512">
      <p>512x512</p>
    </div>
  </div>

  <script>
    function downloadAllIcons() {
      const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
      const svg = \`${svgContent}\`;
      
      sizes.forEach(size => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size);
          const link = document.createElement('a');
          link.download = \`icon-\${size}x\${size}.png\`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svg);
      });
    }
  </script>
</body>
</html>
`;

// Skriv HTML-filen
fs.writeFileSync('public/icons.html', html);

console.log('Öppna public/icons.html i din webbläsare för att se och ladda ner ikonerna.'); 