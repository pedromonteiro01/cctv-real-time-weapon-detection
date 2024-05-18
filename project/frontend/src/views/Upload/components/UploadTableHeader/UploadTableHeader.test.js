import React from 'react';
import { render, screen } from '@testing-library/react';
import UploadTableHeader from './UploadTableHeader';

describe('UploadTableHeader', () => {
    it('renders the table headers correctly', () => {
        render(<table><UploadTableHeader /></table>);
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Video Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });
});
