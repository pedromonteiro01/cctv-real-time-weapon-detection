import { render, screen } from '@testing-library/react';
import TableHeader from './TableHeader';

describe('TableHeader', () => {
  it('renders table headers correctly', () => {
    render(<table><TableHeader /></table>);    
    expect(screen.getByText('No.')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('Weapon Type')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Site')).toBeInTheDocument();
    expect(screen.getByText('Confidence')).toBeInTheDocument();
  });
});
