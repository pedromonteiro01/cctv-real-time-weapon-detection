import React, { useContext } from 'react';
import { WebSocketContext } from '../../context/WebSocketContext/WebSocketContext';
import './Database.css';
import { ClipLoader } from 'react-spinners';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import CameraStream from '../../components/CameraStream/CameraStream';

const Database = () => {
    const { cameras, isLoading } = useContext(WebSocketContext);

    return (
        <div className='database-wrapper'>
            <div className="database-buttons">
                <button onClick={null}><FaArrowLeft /> Previous</button>
                <button onClick={null}>Next <FaArrowRight /></button>
            </div>
            <div className='database-images-grid'>
                {isLoading ? (
                    <div className="loader-container">
                        <ClipLoader color="#ffffff" />
                    </div>
                ) : (
                    Object.keys(cameras).length > 0 ?
                        Object.values(cameras).map(camera => (
                            <CameraStream key={camera.id} camera={camera} frameSrc={camera.frameSrc} />
                        )) : <div style={{color: '#fff'}}>No camera data available.</div>
                )}
            </div>
        </div>
    );
};

export default Database;
