import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';
import './Login.css';
import logo from './logo.png';
import Input from '../../components/Input/Input';

function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { authToken, login } = useAuth();

    useEffect(() => {
        if (authToken) {
            navigate('/personal');
        }
    }, [authToken, navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const loginData = {
            username,
            password,
        };
    
        try {
            const response = await fetch('http://localhost:8080/api/user/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });
    
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                login(data.token);
                toast.success('Successfully Login!');
                navigate('/database');
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error("Incorrect Credentials.");
        }
    };
    

    if (authToken) {
        return <Navigate to="/personal" />;
    }

    return (
        <div className='login-form'>
            <div className='login-img-wrapper'>
                <img src={logo} alt='login' />
            </div>
            <form className='login-form-wrapper' onSubmit={handleSubmit}>
                <Input
                    type="text"
                    value={username}
                    name="username"
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                />
                <Input
                    type="password"
                    value={password}
                    name="password"
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
