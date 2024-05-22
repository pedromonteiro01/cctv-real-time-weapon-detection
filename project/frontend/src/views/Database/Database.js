import React, { useContext, useState } from 'react';
import { WebSocketContext } from '../../context/WebSocketContext/WebSocketContext';
import './Database.css';
import { ClipLoader } from 'react-spinners';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import CameraStream from '../../components/CameraStream/CameraStream';
import IconButton from '../../components/IconButton/IconButton';

const Database = () => {
    const { cameras, isLoading } = useContext(WebSocketContext);
    const [currentPage, setCurrentPage] = useState(0);
    const camerasPerPage = 4;

    const cameraArray = Object.values(cameras);
    const pageCount = Math.ceil(cameraArray.length / camerasPerPage);

    const handlePrevious = () => {
        setCurrentPage(prevPage => (prevPage > 0 ? prevPage - 1 : prevPage));
    };

    const handleNext = () => {
        setCurrentPage(prevPage => (prevPage < pageCount - 1 ? prevPage + 1 : prevPage));
    };

    const displayedCameras = cameraArray.slice(
        currentPage * camerasPerPage,
        (currentPage + 1) * camerasPerPage
    );

    return (
        <div className='database-wrapper'>
            <div className="database-buttons">
                <IconButton icon={FaArrowLeft} label="Previous" onClick={handlePrevious} position="left" />
                <IconButton icon={FaArrowRight} label="Next" onClick={handleNext} position="right" />
            </div>
            <div className='database-images-grid'>
                {isLoading ? (
                    <div className="loader-container" data-testid="loader">
                        <ClipLoader color="#ffffff" />
                    </div>
                ) : (
                    displayedCameras.length > 0 ? (
                        displayedCameras.map(camera => (
                            <CameraStream key={camera.id} camera={camera} frameSrc={camera.frameSrc} />
                        ))
                    ) : (
                        <div style={{ color: '#fff' }}>No camera data available.</div>
                    )
                )}
            </div>
        </div>
    );
};

export default Database;
