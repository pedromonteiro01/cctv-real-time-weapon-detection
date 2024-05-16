import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './Modal';

describe('Modal Component', () => {
  const mockCloseModal = jest.fn();
  const base64ImageString = 'base64ImageStringHere';

  const setup = () => render(<Modal frame={base64ImageString} closeModal={mockCloseModal} />);

  it('renders the modal with the provided image', () => {
    setup();
    expect(screen.getByAltText('Detection Frame')).toBeInTheDocument();
    const image = screen.getByAltText('Detection Frame');
    expect(image.src).toContain(`data:image/jpeg;base64,${base64ImageString}`);
  });

  it('calls the closeModal function when the backdrop is clicked', () => {
    setup();
    const backdrop = screen.getByTestId('modal-backdrop'); 
    fireEvent.click(backdrop);
    expect(mockCloseModal).toHaveBeenCalledTimes(1);
  });

  it('does not close the modal when the modal content is clicked', () => {
    setup();
    const modalContent = screen.getByTestId('modal-content');
    fireEvent.click(modalContent);
    expect(mockCloseModal).not.toHaveBeenCalled();
  });

  it('calls the closeModal function when the close button is clicked', () => {
    setup();
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);
    expect(mockCloseModal).toHaveBeenCalledTimes(1);
  });
});
