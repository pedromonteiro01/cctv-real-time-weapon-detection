import React from 'react';
import './Modal.css';
import { IoCloseSharp } from "react-icons/io5";

const Modal = ({ frame, closeModal }) => {
    return (
        <div className="modal-backdrop" onClick={closeModal} data-testid="modal-backdrop">
            <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="modal-content">
                <button className="close-modal-button" onClick={closeModal} aria-label="Close">
                    <IoCloseSharp className="close-icon" />
                </button>
                <img src={`data:image/jpeg;base64,${frame}`} alt="Detection Frame" />
            </div>
        </div>
    );
};


export default Modal;
