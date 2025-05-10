import React, { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

export function ReminderSettings() {
  const [dailyReminder, setDailyReminder] = useState(false);
  const [weeklyReminder, setWeeklyReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('17:00');
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    // Ladda sparade inställningar
    const savedSettings = localStorage.getItem('reminderSettings');
    if (savedSettings) {
      const { daily, weekly, time } = JSON.parse(savedSettings);
      setDailyReminder(daily);
      setWeeklyReminder(weekly);
      setReminderTime(time);
    }

    // Kontrollera notifikationstillstånd
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

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

  const saveSettings = () => {
    const settings = {
      daily: dailyReminder,
      weekly: weeklyReminder,
      time: reminderTime
    };
    localStorage.setItem('reminderSettings', JSON.stringify(settings));
    
    // Skapa påminnelse
    if (dailyReminder || weeklyReminder) {
      scheduleReminder(settings);
    }
  };

  const scheduleReminder = (settings) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Rensa eventuella tidigare påminnelser
    if (window.reminderInterval) {
      clearInterval(window.reminderInterval);
    }

    // Kontrollera varje minut om det är dags för påminnelse
    window.reminderInterval = setInterval(() => {
      const now = new Date();
      const [hours, minutes] = settings.time.split(':').map(Number);
      
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        // Kontrollera om det är rätt dag för påminnelsen
        const isWeekend = now.getDay() === 5 || now.getDay() === 6; // Fredag eller lördag
        
        if ((settings.daily && !isWeekend) || (settings.weekly && isWeekend)) {
          new Notification('Påminnelse från Arbetstid', {
            body: settings.weekly && isWeekend 
              ? 'Glöm inte att skicka in din tidrapport för veckan!'
              : 'Glöm inte att registrera dina timmar för idag!',
            icon: '/favicon.ico'
          });
        }
      }
    }, 60000); // Kontrollera varje minut
  };

  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <BellIcon className="h-5 w-5 text-zinc-400" />
        <h3 className="text-lg font-medium text-white">Påminnelser</h3>
      </div>

      {notificationPermission !== 'granted' && (
        <div className="mb-4 p-3 bg-zinc-700 rounded-lg">
          <p className="text-sm text-zinc-300 mb-2">
            För att kunna få påminnelser behöver du ge tillstånd för notifikationer.
          </p>
          <button
            onClick={requestNotificationPermission}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
          >
            Aktivera notifikationer
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm text-zinc-300">
            Daglig påminnelse (vardagar)
          </label>
          <input
            type="checkbox"
            checked={dailyReminder}
            onChange={(e) => setDailyReminder(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-zinc-300">
            Veckovis påminnelse (fredag/lördag)
          </label>
          <input
            type="checkbox"
            checked={weeklyReminder}
            onChange={(e) => setWeeklyReminder(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-zinc-300">
            Tid för påminnelse
          </label>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white"
          />
        </div>

        <button
          onClick={saveSettings}
          disabled={notificationPermission !== 'granted'}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Spara inställningar
        </button>
      </div>
    </div>
  );
} 