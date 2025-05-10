import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { supabase } from '../supabase';

export default function Navbar() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Ladda sparade notifikationer från localStorage
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    }

    // Kontrollera om det är dags för påminnelse
    const checkReminders = () => {
      const settings = localStorage.getItem('reminderSettings');
      if (settings) {
        const { daily, weekly, time } = JSON.parse(settings);
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        
        if (now.getHours() === hours && now.getMinutes() === minutes) {
          const isWeekend = now.getDay() === 5 || now.getDay() === 6;
          
          if ((daily && !isWeekend) || (weekly && isWeekend)) {
            addNotification(
              weekly && isWeekend
                ? 'Påminnelse: Skicka in din tidrapport för veckan!'
                : 'Påminnelse: Registrera dina timmar för idag!'
            );
          }
        }
      }
    };

    // Kontrollera varje minut
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = (message) => {
    const newNotification = {
      id: Date.now(),
      message,
      timestamp: new Date().toISOString(),
      read: false
    };

    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    setUnreadCount(prev => prev + 1);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  const markAsRead = (id) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    );
    setNotifications(updatedNotifications);
    setUnreadCount(prev => Math.max(0, prev - 1));
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.setItem('notifications', JSON.stringify([]));
  };

  return (
    <nav className="bg-zinc-800 border-b border-zinc-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white font-bold text-xl">
              Arbetstid
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 py-1 z-50">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-white">Notifikationer</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-sm text-zinc-400 hover:text-white"
                        >
                          Rensa alla
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-zinc-400 text-sm">Inga notifikationer</p>
                      ) : (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`px-4 py-2 hover:bg-zinc-700 cursor-pointer ${
                              !notification.read ? 'bg-zinc-700/50' : ''
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <p className="text-sm text-white">{notification.message}</p>
                            <p className="text-xs text-zinc-400">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/settings"
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              title="Inställningar"
            >
              <Cog6ToothIcon className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 