import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SendHours from './pages/SendHours';
import Settings from './pages/Settings';
import Login from './pages/Login';
import TimeReport from './pages/TimeReport';
import TimeReports from './pages/TimeReports';
import NewProject from './pages/NewProject';
import ProjectManagement from './pages/ProjectManagement';
import { PWAInstaller } from './components/PWAInstaller';
import './App.css';

// Skyddad rutt som kräver inloggning
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-zinc-400">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-zinc-900">
          <Navbar />
          <main className="pt-16">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tidrapport"
                element={
                  <ProtectedRoute>
                    <TimeReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tidrapporter"
                element={
                  <ProtectedRoute>
                    <TimeReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/skicka-timmar"
                element={
                  <ProtectedRoute>
                    <SendHours />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nytt-projekt"
                element={
                  <ProtectedRoute>
                    <NewProject />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectManagement />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <PWAInstaller />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App; 