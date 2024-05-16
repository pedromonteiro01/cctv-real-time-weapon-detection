import React from 'react';
import './Input.css';

const Input = ({ type, value, onChange, name, placeholder }) => {
    return (
        <input
            type={type}
            value={value}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            className="login-input"
        />
    );
};

export default Input;
