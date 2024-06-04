import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext/AuthContext';
import LoginForm from './Login';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast');

describe('LoginForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.fetch = jest.fn();
    localStorage.clear();
  });

  const customRender = (ui, { ...renderOptions }) => {
    return render(<AuthProvider>{ui}</AuthProvider>, renderOptions);
  };

  it('renders the login form correctly', () => {
    customRender(<LoginForm />, { wrapper: Router });
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('allows user to enter credentials', () => {
    customRender(<LoginForm />, { wrapper: Router });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    expect(screen.getByPlaceholderText('Username').value).toBe('testuser');
    expect(screen.getByPlaceholderText('Password').value).toBe('password123');
  });

  it('submits the form and calls login on successful authentication', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'fakeToken' }),
    });
    customRender(<LoginForm />, { wrapper: Router });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(localStorage.getItem('token')).toBe('fakeToken'));
    expect(toast.success).toHaveBeenCalledWith('Successfully Login!');
  });

  it('displays an error toast on login failure', async () => {
    window.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });
    customRender(<LoginForm />, { wrapper: Router });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Incorrect Credentials."));
  });
});
