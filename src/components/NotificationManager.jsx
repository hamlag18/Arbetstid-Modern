import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationManager() {
  const { currentUser } = useAuth();
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Kontrollera notifikationstillstånd
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Registrera Service Worker om det inte redan är gjort
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        console.log('Service Worker redo:', registration);
      });
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Din webbläsare stöder inte notifikationer');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        // Skicka en testnotifikation
        new Notification('Arbetstid', {
          body: 'Notifikationer är nu aktiverade!',
          icon: '/icons/icon-192x192.png'
        });
      }
    } catch (error) {
      console.error('Fel vid begäran av notifikationstillstånd:', error);
    }
  };

  const scheduleReminder = async (type, time) => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      console.error('Service Worker är inte redo');
      return;
    }

    try {
      // Skicka meddelande till Service Worker
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_REMINDER',
        reminderType: type,
        time: time,
        userId: currentUser?.uid
      });
    } catch (error) {
      console.error('Fel vid schemaläggning av påminnelse:', error);
    }
  };

  if (permission === 'granted') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-80 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 p-4 z-50">
      <h3 className="text-lg font-medium text-white mb-2">Aktivera notifikationer</h3>
      <p className="text-sm text-zinc-300 mb-3">
        Få påminnelser om att registrera timmar och skicka tidrapporter.
      </p>
      <button
        onClick={requestPermission}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
      >
        Aktivera notifikationer
      </button>
    </div>
  );
} 