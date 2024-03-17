import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';
import './Login.css';
import logo from './logo.png';

function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { isLoggedIn, login } = useAuth(); // Destructure the login function from the AuthContext

    useEffect(() => {
        if (isLoggedIn) {
            navigate('/personal');
        }
    }, [isLoggedIn, navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const loginData = {
            username,
            password,
        };

        try {
            const response = await fetch('http://localhost:8000/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            const data = await response.json();
            if (response.ok) {
                console.log('Login successful:', data);
                login();
                toast.success('Successfully Login!');
                navigate('/');
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error("Incorrect Credentials.");
        }
    };

    if (isLoggedIn) {
        return <Navigate to="/personal" />;
    }

    return (
        <div className='login-form'>
            <div className='login-img-wrapper'>
                <img src={logo} alt='login'/>
            </div>
            <form className='login-form-wrapper' onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                />
                <button type="submit">Login</button>
            </form>
            {toast}
        </div>
    );
}

export default LoginForm;
