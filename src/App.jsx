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
          <Route path="/projects" element={<Projects />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App; 