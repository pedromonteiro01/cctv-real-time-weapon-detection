import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import IconButton from './IconButton';
import { FaArrowLeft } from 'react-icons/fa';

describe('IconButton', () => {
    it('renders correctly with left icon', () => {
        render(<IconButton icon={FaArrowLeft} label="Previous" position="left" />);
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByRole('button')).toContainElement(screen.getByText('Previous'));
    });

    it('calls onClick when button is clicked', () => {
        const mockOnClick = jest.fn();
        render(<IconButton icon={FaArrowLeft} label="Previous" onClick={mockOnClick} />);
        fireEvent.click(screen.getByText('Previous'));
        expect(mockOnClick).toHaveBeenCalled();
    });

    it('renders correctly with right icon', () => {
        render(<IconButton icon={FaArrowLeft} label="Next" position="right" />);
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByRole('button')).toContainElement(screen.getByText('Next'));
    });
});
