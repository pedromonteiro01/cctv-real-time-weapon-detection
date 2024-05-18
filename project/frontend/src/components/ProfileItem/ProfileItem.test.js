// ProfileItem.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileItem from './ProfileItem';

describe('ProfileItem', () => {
    it('renders the profile item with label and value', () => {
        render(<ProfileItem label="Email" value="user@example.com" />);
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
});
