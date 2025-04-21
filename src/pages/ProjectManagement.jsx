import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import supabase from "../supabase";
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, IconButton, Typography, Box, Paper } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function ProjectManagement() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectHours, setProjectHours] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });

  const fetchData = async () => {
    try {
      if (!user) {
        setError("Du måste vara inloggad för att hantera projekt");
        setLoading(false);
        return;
      }

      if (!isAdmin) {
        setError("Du har inte behörighet att hantera projekt");
        setLoading(false);
        return;
      }

      // Hämta alla projekt
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (projectsError) {
        console.error("Fel vid hämtning av projekt:", projectsError);
        setError("Kunde inte hämta projektinformation");
        setLoading(false);
        return;
      }

      setProjects(projectsData || []);
      setLoading(false);
    } catch (error) {
      console.error("Ett fel uppstod:", error);
      setError("Ett oväntat fel uppstod");
      setLoading(false);
    }
  };

  const fetchProjectHours = async (projectId) => {
    try {
      // Hämta tidrapporter med användarinformation i en enda fråga
      const { data: timeReports, error: timeReportsError } = await supabase
        .from('time_reports')
        .select(`
          *,
          profiles!time_reports_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq('project', projectId)
        .order('date', { ascending: false });

      if (timeReportsError) throw timeReportsError;

      setProjectHours(timeReports || []);
    } catch (error) {
      console.error("Fel vid hämtning av projektets timmar:", error);
      setError("Kunde inte hämta projektets timmar");
    }
  };

  const handleViewHours = async (project) => {
    setSelectedProject(project);
    await fetchProjectHours(project.id);
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin]);

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;

      // Uppdatera lokala projektlistan
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, status: newStatus }
          : project
      ));
    } catch (error) {
      console.error("Fel vid uppdatering av projektstatus:", error);
      setError("Kunde inte uppdatera projektstatus");
    }
  };

  const handleEdit = async (project) => {
    if (editingProject?.id === project.id) {
      try {
        const { error } = await supabase
          .from('projects')
          .update({
            name: editingProject.name,
            description: editingProject.description,
            status: editingProject.status
          })
          .eq('id', project.id);

        if (error) throw error;

        setEditingProject(null);
        // Uppdatera projektlistan
        const { data: updatedProjects } = await supabase
          .from('projects')
          .select('*')
          .order('name');

        setProjects(updatedProjects);
      } catch (error) {
        console.error("Fel vid uppdatering av projekt:", error);
        setError("Kunde inte uppdatera projektet");
      }
    } else {
      setEditingProject({ ...project });
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Är du säker på att du vill ta bort detta projekt?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      // Uppdatera projektlistan
      setProjects(prev => prev.filter(project => project.id !== projectId));
    } catch (error) {
      console.error("Fel vid radering av projekt:", error);
      setError("Kunde inte radera projektet");
    }
  };

  const handleOpenDialog = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update({
            name: formData.name,
            description: formData.description,
            status: formData.status
          })
          .eq('id', editingProject.id)
          .select('id, name, description, status, created_at, updated_at');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([{
            name: formData.name,
            description: formData.description,
            status: formData.status
          }])
          .select('id, name, description, status, created_at, updated_at');
        if (error) throw error;
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving project:', error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-lg">Laddar projekt...</div>
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-lg text-red-500">Du har inte behörighet att hantera projekt</div>
      </div>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/")}
            sx={{ 
              color: 'black', 
              borderColor: 'black', 
              '&:hover': { 
                borderColor: 'black', 
                backgroundColor: 'rgba(0, 0, 0, 0.1)' 
              } 
            }}
          >
            ← Tillbaka
          </Button>
          <Typography variant="h4" component="h1">
            Projekthantering
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nytt projekt
        </Button>
      </Box>

      {loading ? (
        <Typography>Laddar projekt...</Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {projects.map((project) => (
            <Paper key={project.id} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6">{project.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {project.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'inline-block',
                      mt: 1,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: project.status === 'active' ? 'success.light' : 
                               project.status === 'completed' ? 'info.light' : 'warning.light',
                      color: project.status === 'active' ? 'success.dark' :
                             project.status === 'completed' ? 'info.dark' : 'warning.dark'
                    }}
                  >
                    {project.status === 'active' ? 'Aktiv' :
                     project.status === 'completed' ? 'Avslutad' : 'Arkiverad'}
                  </Typography>
                </Box>
                <Box>
                  <IconButton onClick={() => handleViewHours(project)}>
                    <AccessTimeIcon />
                  </IconButton>
                  <IconButton onClick={() => handleOpenDialog(project)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(project.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog 
        open={!!selectedProject} 
        onClose={() => setSelectedProject(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Timmar för {selectedProject?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="h6">
                Totalt: {projectHours.reduce((sum, report) => sum + report.hours, 0).toFixed(1)} timmar
              </Typography>
            </Paper>
            {projectHours.map((report) => (
              <Paper key={report.id} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle1">
                      {report.profiles?.full_name || 'Okänd användare'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(report.date).toLocaleDateString('sv-SE')}
                    </Typography>
                    {report.materials && (
                      <Typography variant="body2" color="text.secondary">
                        Material: {report.materials}
                      </Typography>
                    )}
                    {report.comment && (
                      <Typography variant="body2" color="text.secondary">
                        Kommentar: {report.comment}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="h6">
                    {report.hours}h
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedProject(null)}>Stäng</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingProject ? 'Redigera projekt' : 'Nytt projekt'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Projektnamn"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="Beskrivning"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="active">Aktiv</MenuItem>
                <MenuItem value="completed">Avslutad</MenuItem>
                <MenuItem value="archived">Arkiverad</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Avbryt</Button>
            <Button type="submit" variant="contained">
              {editingProject ? 'Spara' : 'Skapa'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
} 