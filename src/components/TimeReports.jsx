import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

function Notification({ message, type, onClose }) {
  return (
    <div className={`fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } text-white`}>
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:text-white/80">✕</button>
      </div>
    </div>
  );
}

export default function TimeReports() {
  const [reports, setReports] = useState([]);
  const [hasUnsentReports, setHasUnsentReports] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('time_reports')
        .select(`
          id,
          date,
          hours,
          materials,
          sent,
          projects (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setReports(data || []);
      setHasUnsentReports(data?.some(report => !report.sent) || false);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Tidrapporter</h1>
        <button
          disabled={!hasUnsentReports}
          className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          title="Skicka timmar"
        >
          <PaperAirplaneIcon className="h-6 w-6" />
          <span className="text-sm font-medium">Skicka timmar</span>
        </button>
      </div>

      <div className="bg-zinc-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-700">
          <thead className="bg-zinc-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Datum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Projekt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Timmar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-zinc-700/30">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                  {new Date(report.date).toLocaleDateString('sv-SE')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                  {report.projects?.name || 'Okänt projekt'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                  {report.hours}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                  {report.materials || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    report.sent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.sent ? 'Skickad' : 'Ej skickad'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
} 