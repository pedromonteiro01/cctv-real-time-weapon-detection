import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadAnalysisTableRow from './UploadAnalysisTableRow';

const mockDetection = {
  label: 'Gun',
  confidence: 0.92,
  frame: 'frame123',
  timestamp: 3599 // 59 minutes and 59 seconds
};

const mockFormatTime = jest.fn().mockImplementation(seconds => {
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(14, 8);
});

describe('UploadAnalysisTableRow', () => {    
    
  test('calls formatTime correctly', () => {
    render(
      <table>
        <tbody>
          <UploadAnalysisTableRow 
            detection={mockDetection} 
            formatTime={mockFormatTime} 
            openDetectionFrame={() => {}} 
          />
        </tbody>
      </table>
    );
    expect(mockFormatTime).toHaveBeenCalledWith(3599);
  });

  test('opens modal on frame icon click', async () => {
    const mockOpenDetectionFrame = jest.fn();
    render(
      <table>
        <tbody>
          <UploadAnalysisTableRow 
            detection={mockDetection} 
            formatTime={mockFormatTime} 
            openDetectionFrame={mockOpenDetectionFrame} 
          />
        </tbody>
      </table>
    );
    
    userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(mockOpenDetectionFrame).toHaveBeenCalledWith('frame123'));
  });
});
