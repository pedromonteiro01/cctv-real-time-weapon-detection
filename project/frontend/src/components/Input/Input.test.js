import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input Component', () => {
    it('renders input element', () => {
        render(<Input type="text" placeholder="Username" />);
        expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    });

    it('updates on change', () => {
        const handleChange = jest.fn();
        render(<Input type="text" value="" onChange={handleChange} placeholder="Username" />);
        const input = screen.getByPlaceholderText('Username');
        fireEvent.change(input, { target: { value: 'testuser' } });
        expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.anything() }));
    });
});
