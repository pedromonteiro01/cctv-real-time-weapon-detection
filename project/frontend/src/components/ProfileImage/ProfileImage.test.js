// ProfileImage.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileImage from './ProfileImage';

describe('ProfileImage', () => {
    it('renders the profile image correctly', () => {
        render(<ProfileImage />);
        expect(screen.getByRole('img', { name: /profile/i })).toBeInTheDocument();
    });
});
