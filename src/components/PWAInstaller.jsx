import React, { useState, useEffect } from 'react';

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    // Kontrollera om användaren redan stängt rutan
    const installerClosed = localStorage.getItem('pwaInstallerClosed');
    if (installerClosed === 'true') {
      setClosed(true);
      return;
    }

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
      handleClose(); // Stäng popupen när appen är installerad
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleClose = () => {
    setClosed(true);
    localStorage.setItem('pwaInstallerClosed', 'true');
  };

  // Visa inte om användaren stängt rutan eller om appen är installerad
  if (closed || (!isMobile && !showInstallButton)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-80 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 p-4 z-50">
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-zinc-400 hover:text-white text-xl font-bold focus:outline-none"
        aria-label="Stäng"
      >
        ×
      </button>
      {showInstallButton && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white mb-2">Installera Arbetstid</h3>
          <p className="text-sm text-zinc-300 mb-3">
            Installera appen för att använda den offline.
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
    </div>
  );
} 