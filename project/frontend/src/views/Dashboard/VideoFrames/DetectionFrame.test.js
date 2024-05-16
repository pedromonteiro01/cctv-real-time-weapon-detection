import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Server } from 'mock-socket';
import DetectionFrame from './DetectionFrame';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

jest.mock('react-router-dom', () => ({
  useParams: jest.fn()
}));

jest.mock('react-hot-toast');

describe('DetectionFrame', () => {
  let mockServer;
  const mockOnWeaponDetected = jest.fn();

  beforeEach(() => {
    useParams.mockReturnValue({ cameraId: '123' });
    const fakeURL = 'ws://localhost:8000/ws/video/123/';
    mockServer = new Server(fakeURL);
    global.WebSocket = window.WebSocket;

    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage: jest.fn()
    }));
    global.URL.createObjectURL = jest.fn(() => "http://url.com");
  });

  afterEach(() => {
    mockServer.stop();
    jest.clearAllMocks();
  });

  it('connects to WebSocket and handles messages', async () => {
    render(<DetectionFrame onWeaponDetected={mockOnWeaponDetected} />);

    const message = {
      camera_id: '123',
      location: 'Main Entrance',
      day: '2023-05-10',
      hour: '12:00',
      detections: [
        { label: 'Pistol', confidence: 0.95 }
      ],
      frame: 'someBase64String'
    };

    mockServer.on('connection', socket => {
      socket.send(JSON.stringify(message));
    });

    await waitFor(() => expect(mockOnWeaponDetected).toHaveBeenCalledWith({
      camera: '123',
      weaponType: 'Pistol',
      date: '2023-05-10',
      time: '12:00',
      location: 'Main Entrance',
      frame: 'someBase64String',
      confidence: 0.95
    }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(
      expect.stringContaining('Detection: Pistol with 95%'),
      expect.any(Object)
    ));
  });
});
