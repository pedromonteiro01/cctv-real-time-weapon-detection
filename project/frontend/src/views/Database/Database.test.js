import React from 'react';
import { render, screen } from '@testing-library/react';
import { WebSocketContext } from '../../context/WebSocketContext/WebSocketContext';
import Database from './Database';

jest.mock('../../components/CameraStream/CameraStream', () => (props) => <div data-testid="camera-stream">{props.camera.id}</div>);
jest.mock('../../components/IconButton/IconButton', () => (props) => <button>{props.label}</button>);

describe('Database component', () => {
  it('should display loading indicator when isLoading is true', () => {
    const contextValue = {
      cameras: {},
      isLoading: true
    };
    render(
      <WebSocketContext.Provider value={contextValue}>
        <Database />
      </WebSocketContext.Provider>
    );

    // Updated to use getByTestId
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should display camera data when cameras are available and not loading', () => {
    const contextValue = {
      cameras: {
        1: { id: '1', frameSrc: 'url-to-frame-1' },
        2: { id: '2', frameSrc: 'url-to-frame-2' }
      },
      isLoading: false
    };
    render(
      <WebSocketContext.Provider value={contextValue}>
        <Database />
      </WebSocketContext.Provider>
    );

    const streams = screen.getAllByTestId('camera-stream');
    expect(streams.length).toBe(2);
    expect(streams[0]).toHaveTextContent('1');
    expect(streams[1]).toHaveTextContent('2');
  });

  it('should display "No camera data available." when there are no cameras and not loading', () => {
    const contextValue = {
      cameras: {},
      isLoading: false
    };
    render(
      <WebSocketContext.Provider value={contextValue}>
        <Database />
      </WebSocketContext.Provider>
    );

    expect(screen.getByText(/no camera data available/i)).toBeInTheDocument();
  });
});
