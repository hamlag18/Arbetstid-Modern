import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Registrera Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      console.log('Service Worker registrerad:', registration);
    } catch (error) {
      console.error('Service Worker registrering misslyckades:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
