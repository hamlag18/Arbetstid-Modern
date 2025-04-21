import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

import HomePage from "./pages/HomePage";
import NewProject from "./pages/NewProject";
import TimeReport from "./pages/TimeReport";
import TimeReports from "./pages/TimeReports";
import SendHours from "./pages/SendHours";
import Login from "./pages/Login";
import ProjectManagement from "./pages/ProjectManagement";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/nytt-projekt" element={<PrivateRoute><NewProject /></PrivateRoute>} />
          <Route path="/tidrapport" element={<PrivateRoute><TimeReport /></PrivateRoute>} />
          <Route path="/tidrapporter" element={<PrivateRoute><TimeReports /></PrivateRoute>} />
          <Route path="/skicka-timmar" element={<PrivateRoute><SendHours /></PrivateRoute>} />
          <Route path="/project-management" element={<PrivateRoute><ProjectManagement /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><ProjectManagement /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
