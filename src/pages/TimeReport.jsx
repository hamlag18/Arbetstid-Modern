import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import supabase from "../supabase";

export default function TimeReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    project: "",
    date: "",
    hours: "",
    material: "",
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
          .select('id, name, address')
          .order('name');

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
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Ny tidrapport</h1>
        
        <Card className="mb-6">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="project" className="block text-sm font-medium mb-2">
                  Projekt
                </label>
                <select
                  id="project"
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Välj projekt</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.address}
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
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  readOnly={!!new URLSearchParams(location.search).get('datum')}
                />
              </div>

              <div>
                <label htmlFor="hours" className="block text-sm font-medium mb-2">
                  Antal timmar
                </label>
                <input
                  type="number"
                  id="hours"
                  name="hours"
                  value={formData.hours}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="material" className="block text-sm font-medium mb-2">
                  Material
                </label>
                <textarea
                  id="material"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium mb-2">
                  Bild
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleChange}
                  accept="image/*"
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-700 file:text-white hover:file:bg-zinc-600"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? "Sparar..." : "Spara tidrapport"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Tillbaka
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 