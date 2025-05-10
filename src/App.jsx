import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import TimeReport from './pages/TimeReport';
import SendHours from './pages/SendHours';
import ProjectManagement from './pages/ProjectManagement';
import Projects from './pages/Projects';
import PrivateRoute from './components/PrivateRoute';
import NotificationManager from './components/NotificationManager';
import Settings from './pages/Settings';
import { PWAInstaller } from './components/PWAInstaller';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/time-report" element={<PrivateRoute><TimeReport /></PrivateRoute>} />
          <Route path="/send-hours" element={<PrivateRoute><SendHours /></PrivateRoute>} />
          <Route path="/project-management" element={<PrivateRoute><ProjectManagement /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><ProjectManagement /></PrivateRoute>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <NotificationManager />
        <PWAInstaller />
      </AuthProvider>
    </Router>
  );
}

export default App; 