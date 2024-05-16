// TopFrameOverlay.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import TopFrameOverlay from './TopFrameOverlay';

describe('TopFrameOverlay Component', () => {
    const props = {
      id: '123',
      location: 'Front Gate',
      day: 'Monday',
      hour: '12:00 PM'
    };
  
    it('renders without crashing', () => {
      render(<TopFrameOverlay {...props} />);
      const overlayElement = screen.getByTestId('overlay-top');
      expect(overlayElement).toBeInTheDocument();
    });
  
    it('displays camera info with correct props', () => {
      render(<TopFrameOverlay {...props} />);
      expect(screen.getByText(/Camera 123/i)).toBeInTheDocument();
      expect(screen.getByText(/Front Gate/i)).toBeInTheDocument();
      expect(screen.getByText(/Monday/i)).toBeInTheDocument();
      expect(screen.getByText(/12:00 PM/i)).toBeInTheDocument();
    });
  
    it('includes icons for each piece of information', () => {
      render(<TopFrameOverlay {...props} />);
      // The icons don't have text, so we use the icon components directly
      // and check for their presence.
      const icons = screen.getAllByTestId('icon');
      expect(icons.length).toBe(4); // Checks if there are four icons rendered
    });
  });
  