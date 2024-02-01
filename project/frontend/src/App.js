import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './views/Dashboard/Dashboard';
import './App.css';
import Personal from './views/Personal/Personal';
import Database from './views/Database/Database';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="content-container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/personal" element={<Personal />} />
            <Route path="/database" element={<Database />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
