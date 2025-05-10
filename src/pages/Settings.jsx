import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NotificationManager from '../components/NotificationManager';

export default function Settings() {
  const { currentUser } = useAuth();
  const [dailyReminderTime, setDailyReminderTime] = useState('17:00');
  const [weeklyReminderDay, setWeeklyReminderDay] = useState('friday');
  const [weeklyReminderTime, setWeeklyReminderTime] = useState('16:00');

  useEffect(() => {
    // Ladda sparade inställningar
    const savedSettings = localStorage.getItem('reminderSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setDailyReminderTime(settings.dailyReminderTime || '17:00');
      setWeeklyReminderDay(settings.weeklyReminderDay || 'friday');
      setWeeklyReminderTime(settings.weeklyReminderTime || '16:00');
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      dailyReminderTime,
      weeklyReminderDay,
      weeklyReminderTime
    };
    localStorage.setItem('reminderSettings', JSON.stringify(settings));

    // Schemalägg påminnelser
    scheduleReminders();
  };

  const scheduleReminders = () => {
    // Schemalägg daglig påminnelse
    const [hours, minutes] = dailyReminderTime.split(':');
    const dailyTime = new Date();
    dailyTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (dailyTime < new Date()) {
      dailyTime.setDate(dailyTime.getDate() + 1);
    }

    // Schemalägg veckovis påminnelse
    const [weeklyHours, weeklyMinutes] = weeklyReminderTime.split(':');
    const weeklyTime = new Date();
    weeklyTime.setHours(parseInt(weeklyHours), parseInt(weeklyMinutes), 0, 0);
    
    // Beräkna nästa förekommande av vald veckodag
    const daysUntilNext = (getDayNumber(weeklyReminderDay) - weeklyTime.getDay() + 7) % 7;
    weeklyTime.setDate(weeklyTime.getDate() + daysUntilNext);

    // Skicka till Service Worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_REMINDER',
        reminderType: 'daily',
        time: dailyTime.toISOString(),
        userId: currentUser?.uid
      });

      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_REMINDER',
        reminderType: 'weekly',
        time: weeklyTime.toISOString(),
        userId: currentUser?.uid
      });
    }
  };

  const getDayNumber = (day) => {
    const days = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 0
    };
    return days[day.toLowerCase()];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Inställningar</h1>
      
      <div className="bg-zinc-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Påminnelser</h2>
        
        <div className="space-y-6">
          {/* Daglig påminnelse */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Daglig påminnelse för tidregistrering
            </label>
            <input
              type="time"
              value={dailyReminderTime}
              onChange={(e) => setDailyReminderTime(e.target.value)}
              className="w-full bg-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Veckovis påminnelse */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Veckovis påminnelse för tidrapport
            </label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={weeklyReminderDay}
                onChange={(e) => setWeeklyReminderDay(e.target.value)}
                className="bg-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monday">Måndag</option>
                <option value="tuesday">Tisdag</option>
                <option value="wednesday">Onsdag</option>
                <option value="thursday">Torsdag</option>
                <option value="friday">Fredag</option>
                <option value="saturday">Lördag</option>
                <option value="sunday">Söndag</option>
              </select>
              <input
                type="time"
                value={weeklyReminderTime}
                onChange={(e) => setWeeklyReminderTime(e.target.value)}
                className="bg-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={saveSettings}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
          >
            Spara inställningar
          </button>
        </div>
      </div>

      <NotificationManager />
    </div>
  );
} 