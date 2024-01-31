import React, { useState } from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';
import dashboard from './dashboard.png';
import database from './database.png';
import personal from './user.png';
import settings from './setting.png';
import logout from './logout.png';
import logo from './logo.png';

const Navbar = () => {
    const [selectedItem, setSelectedItem] = useState(null);

    const handleItemClick = (item) => {
        setSelectedItem(item);
    };

    const navbarItems = [
        { name: 'dashboard', path: '/' },
        { name: 'database', path: '/database' },
        { name: 'personal', path: '/personal' },
        { name: 'settings', path: '/settings' },
        { name: 'logout', path: '/logout' },
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
                            <img src={{ dashboard, database, personal, settings, logout }[item.name]} alt={item.name} />
                            {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Navbar;
