import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SendHours from './pages/SendHours';
import Settings from './pages/Settings';
import { PWAInstaller } from './components/PWAInstaller';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-zinc-900">
          <Navbar />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tidrapport" element={<SendHours />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
          <PWAInstaller />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App; 