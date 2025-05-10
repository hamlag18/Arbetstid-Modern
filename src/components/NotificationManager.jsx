import React, { useEffect, useState } from 'react';
import { format, isFriday, isSaturday } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function NotificationManager() {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Kontrollera om webbläsaren stödjer notifieringar
    if (!('Notification' in window)) {
      console.log('Denna webbläsare stödjer inte notifieringar');
      return;
    }

    // Be om tillstånd om det behövs
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setPermission(permission);
      });
    } else {
      setPermission(Notification.permission);
    }

    // Kontrollera varje timme om det är fredag eller lördag
    const checkTime = () => {
      const now = new Date();
      const isWeekend = isFriday(now) || isSaturday(now);
      
      if (isWeekend && permission === 'granted') {
        // Kontrollera om användaren redan har fått en notifiering idag
        const lastNotification = localStorage.getItem('lastNotificationDate');
        const today = format(now, 'yyyy-MM-dd');
        
        if (lastNotification !== today) {
          new Notification('Påminnelse om tidrapport', {
            body: 'Glöm inte att skicka in din tidrapport för veckan!',
            icon: '/favicon.ico', // Lägg till en ikon i public-mappen
            tag: 'time-report-reminder'
          });
          
          localStorage.setItem('lastNotificationDate', today);
        }
      }
    };

    // Kör första kontrollen direkt
    checkTime();

    // Sätt upp en timer för att kontrollera varje timme
    const interval = setInterval(checkTime, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [permission]);

  // Visa en knapp för att aktivera notifieringar om de inte är aktiverade
  if (permission !== 'granted') {
    return (
      <div className="fixed bottom-4 right-4 bg-zinc-800 text-white p-4 rounded-lg shadow-lg max-w-sm">
        <p className="mb-2">Aktivera påminnelser för tidrapporter?</p>
        <button
          onClick={() => {
            Notification.requestPermission().then(permission => {
              setPermission(permission);
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Aktivera notifieringar
        </button>
      </div>
    );
  }

  return null;
} 