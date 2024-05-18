import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './Navbar';

describe('Navbar Component', () => {
    it('renders all navbar items', () => {
        render(<Router><Navbar /></Router>);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Cameras')).toBeInTheDocument();
        expect(screen.getByText('History')).toBeInTheDocument();
        expect(screen.getByText('Upload')).toBeInTheDocument();
        expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('updates active item on click', () => {
        render(<Router><Navbar /></Router>);
        const camerasLink = screen.getByText('Cameras').closest('a');
        fireEvent.click(camerasLink);
        expect(camerasLink).toHaveClass('selected');
    });
});