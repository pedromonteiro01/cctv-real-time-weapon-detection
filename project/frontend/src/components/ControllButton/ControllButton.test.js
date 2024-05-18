import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ControllButton from './ControllButton';

describe('ControllButton Component', () => {
    it('renders the button with an icon', () => {
        const mockIcon = <span>Test Icon</span>; // Mock icon for testing
        render(<ControllButton icon={mockIcon} />);

        const buttonElement = screen.getByRole('button');
        expect(buttonElement).toBeInTheDocument();
        expect(screen.getByText('Test Icon')).toBeInTheDocument();
    });

    it('calls onClick when the button is clicked', () => {
        const onClickMock = jest.fn();
        const mockIcon = <span>Test Icon</span>;
        render(<ControllButton icon={mockIcon} onClick={onClickMock} />);

        const buttonElement = screen.getByRole('button');
        fireEvent.click(buttonElement);
        expect(onClickMock).toHaveBeenCalled();
    });
});
