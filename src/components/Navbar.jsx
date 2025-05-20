import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cog6ToothIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { supabase } from '../supabase';

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);

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
          </div>
        </div>
      </div>
    </nav>
  );
} 