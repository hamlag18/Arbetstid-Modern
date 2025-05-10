import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReminderSettings } from '../components/ui/ReminderSettings';

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center py-6 px-3 sm:py-10 sm:px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Inställningar</h1>
          <button
            onClick={() => navigate("/")}
            className="text-zinc-400 hover:text-white p-2 active:bg-zinc-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <ReminderSettings />
        </div>
      </div>
    </div>
  );
} 