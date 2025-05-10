import React, { useState, useEffect } from 'react';

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Kontrollera om det är en mobil enhet
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

    // Registrera Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registrerad:', registration);
          })
          .catch(error => {
            console.error('Service Worker registrering misslyckades:', error);
          });
      });
    }

    // Hantera PWA-installationsprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    });

    // Kontrollera notifikationstillstånd
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Om det inte finns någon deferredPrompt, öppna appen i nytt fönster
      window.open(window.location.href, '_blank');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Användaren installerade appen');
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Din webbläsare stöder inte notifikationer');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (error) {
      console.error('Fel vid begäran av notifikationstillstånd:', error);
    }
  };

  // Visa alltid på mobila enheter
  if (!isMobile && !showInstallButton && notificationPermission === 'granted') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-80 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 p-4 z-50">
      {showInstallButton && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white mb-2">Installera Arbetstid</h3>
          <p className="text-sm text-zinc-300 mb-3">
            Installera appen för att få push-notifikationer och använda den offline.
          </p>
          <button
            onClick={handleInstallClick}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
          >
            Installera
          </button>
        </div>
      )}

      {isMobile && !showInstallButton && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white mb-2">Installera Arbetstid</h3>
          <p className="text-sm text-zinc-300 mb-3">
            Klicka på "Dela" i din webbläsare och välj "Lägg till på hemskärmen" för att installera appen.
          </p>
          <button
            onClick={handleInstallClick}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
          >
            Öppna i app
          </button>
        </div>
      )}

      {notificationPermission !== 'granted' && (
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Aktivera notifikationer</h3>
          <p className="text-sm text-zinc-300 mb-3">
            Få påminnelser om att registrera timmar och skicka tidrapporter.
          </p>
          <button
            onClick={requestNotificationPermission}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
          >
            Aktivera notifikationer
          </button>
        </div>
      )}
    </div>
  );
} 