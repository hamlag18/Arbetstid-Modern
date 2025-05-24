import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cog6ToothIcon, ClipboardDocumentListIcon, PlusIcon, DocumentTextIcon, PaperAirplaneIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../supabase';

export default function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasUnsentReports, setHasUnsentReports] = useState(false);

  useEffect(() => {
    // Kontrollera om användaren är admin
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Inloggad användare:", user?.email);
      
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        console.log("Profil data:", profile);
        console.log("Profil error:", error);
        
        if (error) {
          console.error("Fel vid hämtning av profil:", error);
        }
        
        setIsAdmin(profile?.role === 'admin');
        console.log("Är admin:", profile?.role === 'admin');
      }
    };

    // Kontrollera om det finns oskickade tidrapporter
    const checkUnsentReports = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: reports } = await supabase
          .from('time_reports')
          .select('sent')
          .eq('user_id', user.id)
          .eq('sent', false);

        setHasUnsentReports(reports && reports.length > 0);
      }
    };

    checkAdminStatus();
    checkUnsentReports();
  }, []);

  const handleSendHours = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Hämta alla oskickade tidrapporter med projektinformation
      const { data: unsentReports, error: reportsError } = await supabase
        .from('time_reports')
        .select(`
          id,
          date,
          hours,
          materials,
          projects (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('sent', false);

      if (reportsError) throw reportsError;
      if (!unsentReports || unsentReports.length === 0) return;

      // Skapa e-postinnehåll
      const emailContent = unsentReports.map(report => {
        const date = new Date(report.date).toLocaleDateString('sv-SE');
        return `
          Datum: ${date}
          Projekt: ${report.projects?.name || 'Okänt projekt'}
          Timmar: ${report.hours}
          Material: ${report.materials || 'Inget material angivet'}
        `;
      }).join('\n\n');

      // Skicka e-post via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-time-report', {
        body: {
          email: user.email,
          content: emailContent
        }
      });

      if (emailError) throw emailError;

      // Markera tidrapporterna som skickade
      for (const report of unsentReports) {
        const { error } = await supabase
          .from('time_reports')
          .update({ sent: true })
          .eq('id', report.id);

        if (error) throw error;
      }

      setHasUnsentReports(false);
    } catch (error) {
      console.error("Fel vid skickande av timmar:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Fel vid utloggning:", error);
        return;
      }
      navigate("/login");
    } catch (error) {
      console.error("Ett fel uppstod vid utloggning:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-zinc-800 border-b border-zinc-700 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white font-bold text-xl">
              Arbetstid
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSendHours}
              disabled={!hasUnsentReports}
              className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg"
              title="Skicka timmar"
            >
              <PaperAirplaneIcon className="h-6 w-6" />
              <span className="text-sm font-medium">Skicka timmar</span>
            </button>

            <Link
              to="/nytt-projekt"
              className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg"
              title="Nytt projekt"
            >
              <PlusIcon className="h-6 w-6" />
              <span className="text-sm font-medium">Nytt projekt</span>
            </Link>

            <Link
              to="/tidrapporter"
              className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg"
              title="Visa tidrapporter"
            >
              <DocumentTextIcon className="h-6 w-6" />
              <span className="text-sm font-medium">Tidrapporter</span>
            </Link>

            {isAdmin && (
              <Link
                to="/projects"
                className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg"
                title="Hantera projekt"
              >
                <ClipboardDocumentListIcon className="h-6 w-6" />
                <span className="text-sm font-medium">Projekt</span>
              </Link>
            )}

            <Link
              to="/settings"
              className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg"
              title="Inställningar"
            >
              <Cog6ToothIcon className="h-6 w-6" />
              <span className="text-sm font-medium">Inställningar</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg"
              title="Logga ut"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
              <span className="text-sm font-medium">Logga ut</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 