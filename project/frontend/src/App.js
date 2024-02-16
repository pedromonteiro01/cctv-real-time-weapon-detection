import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './views/Dashboard/Dashboard';
import './App.css';
import Personal from './views/Personal/Personal';
import Dataset from './views/Database/Database';
import { WebSocketProvider } from './context/WebSocketContext/WebSocketContext';
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <WebSocketProvider wsUrl="ws://localhost:8000/ws/video/">
      <Router>
        <div className="app-container">
          <Navbar />
          <div className="content-container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/personal" element={<Personal />} />
              <Route path="/database" element={<Dataset />} />
            </Routes>
          </div>
        </div>
      </Router>
      </WebSocketProvider>
      </>
  );
};

export default App;
