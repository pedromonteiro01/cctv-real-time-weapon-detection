import React, { useState, useEffect } from 'react';
import TopFrameOverlay from '../../components/TopFrameOverlay/TopFrameOverlay';
import './Database.css';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { SyncLoader } from 'react-spinners';

const DatabaseImage = ({ src, alt, camera }) => {
    return (
        <div className="database-image">
            {camera && (
                <TopFrameOverlay
                    id={camera.id}
                    location={camera.location}
                    day={camera.day}
                    hour={camera.hour}
                />
            )}
            <img src={src} alt={alt} style={{ width: '100%', height: 'auto' }} />
        </div>
    );
};

const Database = () => {
    const [cameraDetails, setCameraDetails] = useState({});
    const [currentPage, setCurrentPage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const camerasPerPage = 4;

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws/multi_camera/');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.camera_id && data.frame) {
                setCameraDetails(prevDetails => ({
                    ...prevDetails,
                    [data.camera_id]: {
                        src: `data:image/jpeg;base64,${data.frame}`,
                        id: data.camera_id,
                        location: data.location,
                        day: data.day,
                        hour: data.hour,
                    },
                }));
                setIsLoading(false);
            }
        };

        return () => ws.close();
    }, []);

    const cameraEntries = Object.entries(cameraDetails);
    const totalPages = Math.ceil(cameraEntries.length / camerasPerPage);
    const camerasToShow = cameraEntries.slice(
        currentPage * camerasPerPage,
        (currentPage + 1) * camerasPerPage
    );

    const handlePreviousClick = () => {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
    };

    const handleNextClick = () => {
        setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
    };

    return (
        <div className="database-wrapper">
            {isLoading ? (
                <div style={{marginTop: '2rem'}}>
                    <SyncLoader color="#fff" size={11} margin={3} />
                </div>
            ) : (
                <>
                    <div className="database-buttons">
                        <button onClick={handlePreviousClick}><FaArrowLeft /> Previous</button>
                        <button onClick={handleNextClick}>Next <FaArrowRight /></button>
                    </div>
                    <div className='database-images-grid'>
                        {camerasToShow.map(([cameraId, details]) => (
                            <DatabaseImage
                                key={cameraId}
                                src={details.src}
                                alt={`Camera ${cameraId}`}
                                camera={details}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default Database;
