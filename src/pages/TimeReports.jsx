import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import supabase from "../supabase";

export default function TimeReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
          .select('id, name, address');

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
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tidrapporter</h1>
          <button
            onClick={() => navigate("/tidrapport")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Ny tidrapport
          </button>
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-lg">Inga tidrapporter hittades</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => {
              const project = projects[report.project];
              return (
                <Card key={report.id} className="hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold mb-1">
                          {project?.name || "Okänt projekt"}
                        </h2>
                        <p className="text-zinc-400 text-sm">
                          {project?.address || "Ingen adress angiven"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatDate(report.date)}</p>
                        <p className="text-zinc-400">{report.hours} timmar</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-zinc-400 mb-1">Material</h3>
                      <p className="whitespace-pre-line">{report.materials || "Inget material angivet"}</p>
                    </div>
                    
                    {report.image_url && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-zinc-400 mb-2">Bild</h3>
                        <img 
                          src={report.image_url} 
                          alt="Tidrapport bild" 
                          className="max-w-full h-auto rounded-lg max-h-48 object-cover"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <button
          onClick={() => navigate("/")}
          className="mt-8 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Tillbaka till startsidan
        </button>
      </div>
    </div>
  );
} 