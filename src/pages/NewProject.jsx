import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { supabase } from "../supabase";

export default function NewProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectName: "",
    address: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name: formData.projectName,
            address: formData.address,
            description: formData.description,
            status: 'active'
          }
        ])
        .select();

      if (error) {
        console.error("Fel vid sparande av projekt:", error);
        setError("Kunde inte spara projektet. Försök igen.");
        return;
      }

      console.log("Projekt sparat:", data);
      navigate("/");
    } catch (error) {
      console.error("Ett fel uppstod:", error);
      setError("Ett oväntat fel uppstod. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-6 text-center">Nytt projekt</h2>
            
            {error && (
              <div className="bg-red-500 bg-opacity-20 text-red-500 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium mb-2">
                  Projektnamn
                </label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-2">
                  Adress
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Beskrivning
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Sparar..." : "Spara projekt"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full text-zinc-400 hover:text-white transition-colors text-sm"
              >
                Tillbaka
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
