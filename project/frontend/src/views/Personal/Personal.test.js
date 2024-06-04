import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Personal from './Personal';

jest.mock('./PersonalInfoDetails/PersonalInfoDetails', () => () => <div data-testid="mock-personal-info-details">PersonalInfoDetails</div>);
jest.mock('./PasswordChange/PasswordChange', () => () => <div data-testid="mock-password-change">PasswordChange</div>);

describe('Personal Component', () => {
    it('renders correctly', () => {
        render(<Personal />);

        expect(screen.getByTestId('personal-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('personal-header')).toHaveTextContent('Personal Info');
        expect(screen.getByTestId('mock-personal-info-details')).toHaveTextContent('PersonalInfoDetails');
        expect(screen.getByTestId('mock-password-change')).toHaveTextContent('PasswordChange');
    });
});
