import { render, screen, waitFor } from '@testing-library/react';
import RecordTable from './Table';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';

jest.mock('../../context/AuthContext/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn()
}));

describe('RecordTable', () => {
  let recordsState = [];

  beforeEach(() => {
    useAuth.mockReturnValue({ authToken: 'fake-token' });
    useParams.mockReturnValue({ cameraId: '123' });
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, camera: 'Camera 1', weapon_type: 'Rifle', date: '2021-07-21', time: '12:00', site: 'Site 1', confidence: 98 }])
      })
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    recordsState = [];
  });

  it('fetches records and displays them', async () => {
    const setRecords = jest.fn(data => {
      recordsState = data;  // Update local state simulation
    });

    const { rerender } = render(<RecordTable records={recordsState} setRecords={setRecords} />);
    
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(setRecords).toHaveBeenCalled());

    // Rerender with the new state to simulate state update
    rerender(<RecordTable records={recordsState} setRecords={setRecords} />);

    await waitFor(() => expect(screen.getByText('Camera 1')).toBeInTheDocument());
  });
});
