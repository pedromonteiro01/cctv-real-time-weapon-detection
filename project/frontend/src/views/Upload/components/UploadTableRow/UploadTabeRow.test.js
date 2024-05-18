import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadTableRow from './UploadTableRow';

describe('UploadTableRow', () => {
    const videoDataAnalyzed = {
        id: 1,
        video: 'example_video.mp4',
        analyzed: true
    };

    const videoDataNotAnalyzed = {
        id: 2,
        video: 'another_video.mp4',
        analyzed: false
    };

    const mockNavigate = jest.fn();

    it('renders video data with analysis status correctly for analyzed videos', () => {
        render(<table><tbody><UploadTableRow video={videoDataAnalyzed} onNavigate={mockNavigate} /></tbody></table>);
        
        expect(screen.getByText(videoDataAnalyzed.id.toString())).toBeInTheDocument();
        expect(screen.getByText(videoDataAnalyzed.video)).toBeInTheDocument();
        expect(screen.getByTestId('icon-checked')).toBeInTheDocument();
    });

    it('renders video data with analysis status correctly for not analyzed videos', () => {
        render(<table><tbody><UploadTableRow video={videoDataNotAnalyzed} onNavigate={mockNavigate} /></tbody></table>);
        
        expect(screen.getByText(videoDataNotAnalyzed.id.toString())).toBeInTheDocument();
        expect(screen.getByText(videoDataNotAnalyzed.video)).toBeInTheDocument();
        expect(screen.getByTestId('icon-unchecked')).toBeInTheDocument();
    });

    it('calls navigate function on icon click', () => {
        render(<table><tbody><UploadTableRow video={videoDataAnalyzed} onNavigate={mockNavigate} /></tbody></table>);
        const linkIcon = screen.getByTestId('navigate-icon');
        fireEvent.click(linkIcon);
        expect(mockNavigate).toHaveBeenCalledWith(`/upload/${videoDataAnalyzed.id}`);
    });
});
