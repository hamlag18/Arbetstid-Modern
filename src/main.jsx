import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";

import HomePage from "./pages/HomePage";
import NewProject from "./pages/NewProject";
import TimeReport from "./pages/TimeReport";
import TimeReports from "./pages/TimeReports";
import SendHours from "./pages/SendHours";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/nytt-projekt" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
        <Route path="/tidrapport" element={<ProtectedRoute><TimeReport /></ProtectedRoute>} />
        <Route path="/tidrapporter" element={<ProtectedRoute><TimeReports /></ProtectedRoute>} />
        <Route path="/skicka-timmar" element={<ProtectedRoute><SendHours /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        {/* Här kan vi lägga till fler sidor senare */}
      </Routes>
    </Router>
  </React.StrictMode>
);
