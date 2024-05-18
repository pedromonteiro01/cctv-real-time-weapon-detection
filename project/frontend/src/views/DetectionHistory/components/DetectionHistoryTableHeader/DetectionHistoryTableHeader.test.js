import React from 'react';
import { render, screen } from '@testing-library/react';
import DetectionHistoryTableHeader from './DetectionHistoryTableHeader';

describe('DetectionHistoryTableHeader', () => {
  it('renders the table headers correctly', () => {
    render(<DetectionHistoryTableHeader />);
    expect(screen.getByText('No.')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('Weapon Type')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Site')).toBeInTheDocument();
    expect(screen.getByText('Confidence')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});
