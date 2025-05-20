import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { supabase } from "../supabase";

export default function TimeReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    project: "",
    date: "",
    hours: "",
    material: "",
    comment: "",
    image: null
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Läs datum från URL:en
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dateParam = searchParams.get('datum');
    
    if (dateParam) {
      console.log("Datum från URL:", dateParam);
      setFormData(prev => ({
        ...prev,
        date: dateParam
      }));
    }
  }, [location.search]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Fel vid hämtning av projekt:", error);
          return;
        }

        setProjects(data || []);
      } catch (error) {
        console.error("Ett fel uppstod vid hämtning av projekt:", error);
      }
    };

    fetchProjects();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Fel vid hämtning av användare:", userError);
        setError("Kunde inte hämta användarinformation");
        setLoading(false);
        return;
      }
      
      if (!user) {
        console.error("Ingen inloggad användare hittades");
        setError("Du måste vara inloggad för att skapa en tidrapport");
        setLoading(false);
        return;
      }
      
      console.log("Användare ID:", user.id);
      
      // Kontrollera att ett projekt har valts
      if (!formData.project) {
        setError("Du måste välja ett projekt");
        setLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('time_reports')
        .insert([
          {
            date: formData.date,
            hours: parseFloat(formData.hours),
            materials: formData.material,
            comment: formData.comment,
            project: formData.project,
            user_id: user.id
          }
        ]);

      if (error) {
        console.error("Fel vid sparande av tidrapport:", error);
        throw error;
      }

      setLoading(false);
      // Navigera tillbaka till startsidan istället för tidrapporter
      navigate('/');
    } catch (error) {
      console.error('Error:', error);
      setError('Kunde inte spara tidrapporten: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-3 sm:p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Ny Tidrapport</h1>
          <button
            onClick={() => navigate("/")}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="project" className="block text-sm font-medium mb-2">
                  Projekt
                </label>
                <select
                  id="project"
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  required
                >
                  <option value="">Välj projekt</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  required
                />
              </div>

              <div>
                <label htmlFor="hours" className="block text-sm font-medium mb-2">
                  Timmar
                </label>
                <input
                  type="number"
                  id="hours"
                  name="hours"
                  value={formData.hours}
                  onChange={handleChange}
                  step="0.5"
                  min="0"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  required
                />
              </div>

              <div>
                <label htmlFor="material" className="block text-sm font-medium mb-2">
                  Material (valfritt)
                </label>
                <textarea
                  id="material"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>

              <div>
                <label htmlFor="comment" className="block text-sm font-medium mb-2">
                  Kommentar (valfritt)
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>

              {error && (
                <div className="bg-red-500 bg-opacity-20 text-red-500 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? "Sparar..." : "Spara Tidrapport"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="w-full sm:flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 