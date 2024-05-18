// UploadAnalysisTableHeader.test.js
import { render, screen } from '@testing-library/react';
import UploadAnalysisTableHeader from './UploadAnalysisTableHeader';

describe('UploadAnalysisTableHeader', () => {
  test('renders table headers correctly', () => {
    render(<UploadAnalysisTableHeader />);
    expect(screen.getByText('Weapon Type')).toBeInTheDocument();
    expect(screen.getByText('Confidence')).toBeInTheDocument();
    expect(screen.getByText('Frame')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
  });
});
