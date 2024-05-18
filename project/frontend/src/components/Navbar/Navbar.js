import React, { useState } from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';
import dashboard from './dashboard.png';
import cameras from './cameras2.png';
import personal from './user.png';
import history from './history.png';
import upload from './upload.png';
import logo from './logo.png';

const Navbar = () => {
    const [selectedItem, setSelectedItem] = useState('dashboard');

    const handleItemClick = (item) => {
        setSelectedItem(item);
    };

    const navbarItems = [
        { name: 'dashboard', path: '/' },
        { name: 'cameras', path: '/cameras' },
        { name: 'history', path: '/history' },
        { name: 'upload', path: '/upload' },
        { name: 'personal', path: '/personal' },
    ];

    return (
        <div className="navbar-wrapper">
            <div className="navbar-logo">
                <img src={logo} alt="Logo" />
            </div>
            <ul className="navbar-items">
                {navbarItems.map((item, index) => (
                    <li key={index} onClick={() => handleItemClick(item.name)}>
                        <Link to={item.path} className={`navbar-item ${selectedItem === item.name ? 'selected' : ''}`}>
                            <img src={{ dashboard, history, cameras, upload, personal }[item.name]} alt={item.name} />
                            {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Navbar;
