import { render, screen } from '@testing-library/react';
import TableRow from './TableRow';

describe('TableRow', () => {
  it('renders record data correctly', () => {
    const record = {
      no: 1,
      camera: 'Camera 1',
      weapon_type: 'Rifle',
      date: '2021-07-21',
      time: '12:00',
      site: 'Site 1',
      confidence: 98
    };
    render(<table><tbody><TableRow record={record} /></tbody></table>);
    expect(screen.getByText('Camera 1')).toBeInTheDocument();
    expect(screen.getByText('Rifle')).toBeInTheDocument();
    expect(screen.getByText('2021-07-21')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('Site 1')).toBeInTheDocument();
    expect(screen.getByText('98%')).toBeInTheDocument();
  });
});
