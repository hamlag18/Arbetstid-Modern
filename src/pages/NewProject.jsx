import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import supabase from "../supabase";

export default function NewProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectName: "",
    address: "",
    description: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Hämta användarens ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Fel vid hämtning av användare:", userError);
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name: formData.projectName,
            address: formData.address,
            description: formData.description,
            user_id: user.id
          }
        ]);

      if (error) {
        console.error("Fel vid sparande av projekt:", error);
        return;
      }

      console.log("Projekt sparat:", data);
      navigate("/");
    } catch (error) {
      console.error("Ett fel uppstod:", error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center px-4">
      <h2 className="text-2xl font-semibold mb-6">Nytt projekt</h2>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-zinc-800 p-6 rounded-xl shadow-lg space-y-4"
      >
        <input
          type="text"
          placeholder="Projektnamn"
          className="w-full p-2 rounded bg-zinc-700 text-white"
          name="projectName"
          value={formData.projectName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          placeholder="Adress"
          className="w-full p-2 rounded bg-zinc-700 text-white"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />
        <textarea
          placeholder="Beskrivning"
          className="w-full p-2 rounded bg-zinc-700 text-white"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />

        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded w-full"
        >
          Spara projekt
        </button>
        <button
          type="button"
          className="text-sm text-gray-400 mt-2 underline"
          onClick={() => navigate("/")}
        >
          Tillbaka
        </button>
      </form>
    </div>
  );
}
