import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { supabase } from "../supabase";
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
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasUnsentReports, setHasUnsentReports] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hämta inloggad användare
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Fel vid hämtning av användare:", userError);
          setError("Kunde inte hämta användarinformation");
          setLoading(false);
          return;
        }

        // Kontrollera om användaren är admin baserat på e-post
        const isAdminByEmail = user.email === 'tidrapport1157@gmail.com';
        setIsAdmin(isAdminByEmail);

        // Hämta alla projekt först
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name');

        if (projectsError) {
          console.error("Fel vid hämtning av projekt:", projectsError);
          setError("Kunde inte hämta projektinformation");
          setLoading(false);
          return;
        }

        // Skapa en map av projekt för snabb lookup
        const projectsMap = {};
        projectsData.forEach(project => {
          projectsMap[project.id] = project;
        });
        setProjects(projectsMap);

        // Hämta tidrapporter baserat på behörighet
        let query = supabase
          .from('time_reports')
          .select('*')
          .order('date', { ascending: false });

        // Om användaren inte är admin, visa bara egna tidrapporter
        if (!isAdminByEmail) {
          query = query.eq('user_id', user.id);
        }

        const { data: reportsData, error: reportsError } = await query;

        if (reportsError) {
          console.error("Fel vid hämtning av tidrapporter:", reportsError);
          setError("Kunde inte hämta tidrapporter");
          setLoading(false);
          return;
        }

        console.log("Tidrapporter från databasen:", reportsData);
        console.log("Projekt från databasen:", projectsMap);

        setReports(reportsData || []);
        setHasUnsentReports(reportsData?.some(report => !report.sent) || false);
        setLoading(false);
      } catch (error) {
        console.error("Ett fel uppstod:", error);
        setError("Ett oväntat fel uppstod");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-lg">Laddar tidrapporter...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="max-w-screen-sm mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-0">Tidrapporter</h1>
          <button
            onClick={() => navigate("/tidrapport")}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-base sm:text-lg"
          >
            Ny tidrapport
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="bg-zinc-800 rounded-lg p-6 text-center">
            <p className="text-lg sm:text-xl text-zinc-400">Inga tidrapporter hittades</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const project = projects[report.project];
              return (
                <div
                  key={report.id}
                  className="bg-zinc-800 rounded-lg p-4 sm:p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold mb-1">
                        {project?.name || "Okänt projekt"}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-medium">{formatDate(report.date)}</p>
                      <p className="text-sm sm:text-base text-zinc-400">{report.hours} timmar</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm sm:text-base font-medium text-zinc-400 mb-1">Material</h3>
                    <p className="text-sm sm:text-base whitespace-pre-line">{report.materials || "Inget material angivet"}</p>
                  </div>
                  
                  {report.image_url && (
                    <div className="mt-4">
                      <h3 className="text-sm sm:text-base font-medium text-zinc-400 mb-2">Bild</h3>
                      <img 
                        src={report.image_url} 
                        alt="Tidrapport bild" 
                        className="w-full h-auto rounded-lg max-h-48 sm:max-h-64 object-cover"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => navigate("/")}
          className="mt-8 text-sm sm:text-base text-zinc-400 hover:text-white transition-colors"
        >
          Tillbaka till startsidan
        </button>
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