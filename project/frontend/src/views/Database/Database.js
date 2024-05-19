import React, { useContext } from 'react';
import { WebSocketContext } from '../../context/WebSocketContext/WebSocketContext';
import './Database.css';
import { ClipLoader } from 'react-spinners';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import CameraStream from '../../components/CameraStream/CameraStream';
import IconButton from '../../components/IconButton/IconButton';

const Database = () => {
    const { cameras, isLoading } = useContext(WebSocketContext);

    return (
        <div className='database-wrapper'>
            <div className="database-buttons">
                <IconButton icon={FaArrowLeft} label="Previous" onClick={null} position="left" />
                <IconButton icon={FaArrowRight} label="Next" onClick={null} position="right" />
            </div>
            <div className='database-images-grid'>
                {isLoading ? (
                    <div className="loader-container" data-testid="loader">
                        <ClipLoader color="#ffffff" />
                    </div>
                ) : (
                    Object.keys(cameras).length > 0 ?
                        Object.values(cameras).map(camera => (
                            <CameraStream key={camera.id} camera={camera} frameSrc={camera.frameSrc} />
                        )) : <div style={{ color: '#fff' }}>No camera data available.</div>
                )}
            </div>
        </div>
    );
};

export default Database;
