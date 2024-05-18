import React from 'react';
import { render, screen } from '@testing-library/react';
import TopFrameOverlay from './TopFrameOverlay';
import '@testing-library/jest-dom';

describe('TopFrameOverlay Component', () => {
  const props = {
    id: "01",
    location: "Main Entrance",
    dateTime: "2023-05-18 12:00",
    detections: 3,
    showDetections: true,
  };

  it('renders the component with provided information', () => {
    render(<TopFrameOverlay {...props} />);
    expect(screen.getByTestId('overlay-top')).toBeInTheDocument();
    expect(screen.getByText(/Camera 01/)).toBeInTheDocument();
    expect(screen.getByText(/Main Entrance/)).toBeInTheDocument();
    expect(screen.getByText(/2023-05-18 12:00/)).toBeInTheDocument();
  });

  it('shows detections when showDetections is true', () => {
    render(<TopFrameOverlay {...props} />);
    expect(screen.getByText('3')).toBeInTheDocument(); // Check for detection count
  });

  it('does not show detections when showDetections is false', () => {
    const newProps = { ...props, showDetections: false };
    render(<TopFrameOverlay {...newProps} />);
    expect(screen.queryByText('3')).toBeNull(); // Detection count should not be present
  });

  // Test for icons (optional)
  it('renders all icons correctly', () => {
    render(<TopFrameOverlay {...props} />);
    expect(screen.getAllByTestId('icon').length).toBe(4); // Including conditional detection icon
  });
});
