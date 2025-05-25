import React, { useState, useEffect } from 'react';
import { Calendar } from 'react-calendar';
import { Navbar } from './Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState('');
  const [hours, setHours] = useState('');
  const [materials, setMaterials] = useState('');
  const [projects, setProjects] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const hasTimeReport = async (dateStr) => {
    try {
      const { data, error } = await supabase
        .from('time_reports')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking time report:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('time_reports')
        .insert([
          {
            user_id: user.id,
            date: date.toISOString().split('T')[0],
            hours: parseFloat(hours),
            materials: materials,
            project_id: selectedProject,
            sent: false
          }
        ]);

      if (error) throw error;

      setHours('');
      setMaterials('');
      setSelectedProject('');
      setDate(new Date());

      setNotification({
        message: "Tidrapport sparad!",
        type: "success"
      });
    } catch (error) {
      console.error('Error saving time report:', error);
      setNotification({
        message: "Kunde inte spara tidrapport. Försök igen senare.",
        type: "error"
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-20">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <div className="bg-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Kalender</h2>
              <Calendar
                onChange={setDate}
                value={date}
                className="w-full"
                tileClassName={({ date }) => {
                  const dateStr = date.toISOString().split('T')[0];
                  return hasTimeReport(dateStr) ? 'bg-blue-500' : '';
                }}
              />
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <div className="bg-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Tidrapport</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Datum</label>
                  <input
                    type="date"
                    value={date ? date.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDate(new Date(e.target.value))}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Projekt</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2"
                    required
                  >
                    <option value="">Välj projekt</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timmar</label>
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2"
                    min="0"
                    step="0.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Material</label>
                  <input
                    type="text"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Spara
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 