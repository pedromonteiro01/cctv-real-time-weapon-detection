import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // Import Navigate
import Navbar from './components/Navbar/Navbar';
import Dashboard from './views/Dashboard/Dashboard';
import './App.css';
import Personal from './views/Personal/Personal';
import Dataset from './views/Database/Database';
import { Toaster } from 'react-hot-toast';
import Login from './views/Login/Login';
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import PrivateRoute from './views/PrivateRoute/PrivateRoute';

const AppContent = () => {
  const { authToken } = useAuth();

  return (
    <div className="app-container">
      {authToken && <Navbar />}
      <div className="content-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/camera/:cameraId" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/personal" element={<PrivateRoute><Personal /></PrivateRoute>} />
          <Route path="/database" element={<PrivateRoute><Dataset /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} /> {/* Catch-all route */}
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
