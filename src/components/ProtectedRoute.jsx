import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Fel vid kontroll av session:", error);
          navigate("/login");
          return;
        }

        if (!session) {
          navigate("/login");
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error("Fel vid kontroll av session:", error);
        navigate("/login");
      }
    };

    checkSession();

    // Lyssna på auth-ändringar
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/login");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-lg">Laddar...</div>
      </div>
    );
  }

  return children;
} 