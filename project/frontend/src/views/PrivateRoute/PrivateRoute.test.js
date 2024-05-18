import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';
import PrivateRoute from './PrivateRoute';

jest.mock('../../context/AuthContext/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('PrivateRoute', () => {
  it('renders children when there is an authToken', () => {
    useAuth.mockReturnValue({ authToken: 'some-token' });
    render(
      <BrowserRouter>
        <PrivateRoute><div>Test Child</div></PrivateRoute>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('redirects to login when there is no authToken', () => {
    useAuth.mockReturnValue({ authToken: null });
    render(
      <BrowserRouter>
        <PrivateRoute><div>Test Child</div></PrivateRoute>
      </BrowserRouter>
    );

    // Since <Navigate> does not actually redirect in Jest environment, check for absence of 'Test Child'
    expect(screen.queryByText('Test Child')).not.toBeInTheDocument();
    // Check if it tries to navigate to "/login"
    // This might require checking for a mock of Navigate if necessary
  });
});
