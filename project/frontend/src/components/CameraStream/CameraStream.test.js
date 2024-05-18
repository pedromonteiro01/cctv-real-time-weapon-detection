import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import CameraStream from './CameraStream';
import TopFrameOverlay from '../TopFrameOverlay/TopFrameOverlay';
import { useNavigate } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

jest.mock('../TopFrameOverlay/TopFrameOverlay', () => jest.fn(() => <div>TopFrameOverlay</div>));

describe('CameraStream', () => {
  const camera = {
    id: '123',
    dateTime: '2021-09-01T12:00:00Z'
  };
  const frameSrc = 'http://example.com/frame.jpg';

  it('renders correctly and navigates on click', () => {
    const mockNavigate = jest.fn();
    useNavigate.mockImplementation(() => mockNavigate);

    render(<CameraStream camera={camera} frameSrc={frameSrc} />);

    expect(TopFrameOverlay).toHaveBeenCalledWith(expect.objectContaining({
      ...camera,
      showDetections: true
    }), expect.anything());

    fireEvent.click(screen.getByRole('img', { name: `Camera ${camera.id}` }));

    expect(mockNavigate).toHaveBeenCalledWith(`/camera/${camera.id}`);
  });

  it('displays the camera timestamp', () => {
    render(<CameraStream camera={camera} frameSrc={frameSrc} />);
    expect(screen.getByText(camera.dateTime)).toBeInTheDocument();
  });
});
