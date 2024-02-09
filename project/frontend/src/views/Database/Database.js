import React from 'react';
import FrameOverlayUp from '../../components/FrameOverlayUp/FrameOverlayUp';
import './Database.css';
import frame from './frame.png';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

const DatabaseImage = ({ src, alt }) => {
    return (
        <div className="database-image">
            <FrameOverlayUp />
            <img src={src} alt={alt} />
        </div>
    );
};

const Database = () => {
    return (
        <div className="database-wrapper">
            <div className="database-buttons">
                <button><FaArrowLeft /> Previous</button>
                <button>Next <FaArrowRight /></button>
            </div>
            <div className='database-images-grid'>
                {[...Array(6)].map((_, index) => (
                    <DatabaseImage key={index} src={frame} alt="Placeholder" />
                ))}
            </div>
        </div>
    );
}

export default Database;