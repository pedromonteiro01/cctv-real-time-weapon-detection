import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './views/Dashboard/Dashboard';
import './App.css';
import Personal from './views/Personal/Personal';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="content-container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/personal" element={<Personal />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
