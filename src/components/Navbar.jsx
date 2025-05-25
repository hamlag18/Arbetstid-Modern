import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cog6ToothIcon, ClipboardDocumentListIcon, PlusIcon, DocumentTextIcon, ArrowRightOnRectangleIcon, PaperAirplaneIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

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

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [notification, setNotification] = useState(null);
  const [hasUnsentReports, setHasUnsentReports] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    checkAdminStatus();
  }, []);

  React.useEffect(() => {
    checkUnsentReports();
  }, []);

  const checkUnsentReports = async () => {
    try {
      const { data: reports } = await supabase
        .from('time_reports')
        .select('sent')
        .eq('user_id', user.id)
        .eq('sent', false);

      setHasUnsentReports(reports && reports.length > 0);
    } catch (error) {
      console.error('Error checking unsent reports:', error);
    }
  };

  const handleSendHours = () => {
    navigate('/send-hours');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-zinc-800 border-b border-zinc-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-white font-bold text-xl">
                Arbetstid
              </Link>
            </div>

            {/* Desktop links */}
            <div className="hidden sm:flex items-center gap-4">
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
                onClick={handleSendHours}
                disabled={!hasUnsentReports}
                className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Skicka timmar"
              >
                <PaperAirplaneIcon className="h-6 w-6" />
                <span className="text-sm font-medium">Skicka timmar</span>
              </button>

              <button
                onClick={handleSignOut}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Logga ut
              </button>
            </div>

            {/* Mobil: Skicka timmar alltid synlig */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={handleSendHours}
                disabled={!hasUnsentReports}
                className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Skicka timmar"
              >
                <PaperAirplaneIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-zinc-400 hover:text-white focus:outline-none"
                title="Meny"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-7 w-7" />
                ) : (
                  <Bars3Icon className="h-7 w-7" />
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Mobilmeny */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-zinc-800 border-t border-zinc-700 px-4 pb-4 pt-2 flex flex-col gap-2">
            <Link
              to="/nytt-projekt"
              className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg"
              title="Nytt projekt"
              onClick={() => setMobileMenuOpen(false)}
            >
              <PlusIcon className="h-6 w-6" />
              <span className="text-sm font-medium">Nytt projekt</span>
            </Link>
            <Link
              to="/tidrapporter"
              className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg"
              title="Visa tidrapporter"
              onClick={() => setMobileMenuOpen(false)}
            >
              <DocumentTextIcon className="h-6 w-6" />
              <span className="text-sm font-medium">Tidrapporter</span>
            </Link>
            {isAdmin && (
              <Link
                to="/projects"
                className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg"
                title="Hantera projekt"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ClipboardDocumentListIcon className="h-6 w-6" />
                <span className="text-sm font-medium">Projekt</span>
              </Link>
            )}
            <Link
              to="/settings"
              className="flex items-center gap-2 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-700/50 hover:bg-zinc-700 rounded-lg"
              title="Inställningar"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Cog6ToothIcon className="h-6 w-6" />
              <span className="text-sm font-medium">Inställningar</span>
            </Link>
            <button
              onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 p-2"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
              <span className="text-sm font-medium">Logga ut</span>
            </button>
          </div>
        )}
      </nav>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
} 