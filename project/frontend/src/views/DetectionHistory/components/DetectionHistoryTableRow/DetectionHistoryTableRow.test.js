import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DetectionHistoryTableRow from './DetectionHistoryTableRow';

jest.mock("react-icons/fa", () => ({
  FaEye: ({ onClick }) => <div aria-label="view" onClick={onClick}>View</div>  // Ensure onClick is properly mocked
}));

describe('DetectionHistoryTableRow', () => {
  const record = {
    no: 1,
    camera: 'Camera 1',
    weapon_type: 'Pistol',
    date: '2021-09-01',
    time: '12:00 PM',
    site: 'Entrance',
    confidence: 95,
    frame: 'frame.jpg'
  };

  it('renders the detection data correctly', () => {
    render(
      <table>
        <tbody>
          <DetectionHistoryTableRow record={record} onOpenFrame={() => {}} />
        </tbody>
      </table>
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Camera 1')).toBeInTheDocument();
    expect(screen.getByText('Pistol')).toBeInTheDocument();
    expect(screen.getByText('2021-09-01')).toBeInTheDocument();
    expect(screen.getByText('12:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Entrance')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByLabelText('view')).toBeInTheDocument();
  });

  it('calls onOpenFrame with the correct frame when the eye icon is clicked', () => {
    const mockOpenFrame = jest.fn();
    render(
      <table>
        <tbody>
          <DetectionHistoryTableRow record={record} onOpenFrame={mockOpenFrame} />
        </tbody>
      </table>
    );
    const viewIcon = screen.getByLabelText('view');
    fireEvent.click(viewIcon);
    expect(mockOpenFrame).toHaveBeenCalledWith('frame.jpg');
  });
});
