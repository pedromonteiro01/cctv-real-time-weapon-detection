import React, { useState, useEffect, useRef } from 'react';
import TopFrameOverlay from '../../components/TopFrameOverlay/TopFrameOverlay';
import './Database.css';
import { ClipLoader } from 'react-spinners';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useNavigate } from 'react-router-dom';

const CameraStream = ({ camera, frameSrc }) => {
    const navigate = useNavigate();

    const handleCameraClick = () => {
        navigate(`/camera/${camera.id}`);
    };

    return (
        <div className="database-image" onClick={handleCameraClick} style={{ cursor: 'pointer' }}>
            <TopFrameOverlay {...camera} />
            <img src={frameSrc} alt={`Camera ${camera.id}`} style={{ width: '100%', height: 'auto' }} />
        </div>
    );
};

const Database = () => {
    const [cameras, setCameras] = useState({});
    const [isLoading, setIsLoading] = useState(true);  // Initialize loading state as true
    const ws = useRef(null);
    const { authToken } = useAuth();

    useEffect(() => {
        if (!authToken) {
            console.error("authToken is undefined!");
            return;
        }
        ws.current = new WebSocket(`ws://localhost:8000/ws/multi_camera/${authToken}/`);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
            setIsLoading(true);  // Set loading to true when the connection opens
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            let frameDetails;
            try {
                frameDetails = JSON.parse(data.frame); 
            } catch (error) {
                console.error("Error parsing data.frame as JSON:", error);
                return; 
            }
            const { formattedDate, formattedTime } = formatTimestamp(frameDetails.timestamp);
            if (frameDetails && frameDetails.frame) {
                setCameras(prev => ({
                    ...prev,
                    [data.camera_id]: {
                        id: data.camera_id,
                        ...prev[data.camera_id],
                        location: data.location,
                        frameSrc: `data:image/jpeg;base64,${frameDetails.frame}`,
                        day: formattedDate,
                        hour: formattedTime,
                    },
                }));
                setIsLoading(false);  // Set loading to false when frames are updated
            }
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            setIsLoading(false);  // Ensure loading is set to false even if there is an error
        };

        return () => ws.current?.close();
    }, [authToken]);

    const formatTimestamp = (timestamp) => {
        if (isNaN(timestamp) || timestamp === undefined) {
            console.error("Invalid timestamp:", timestamp);
            return { formattedDate: 'Invalid Date', formattedTime: 'Invalid Time' };
        }

        const date = new Date(timestamp);
        const day = date.getDate().toString().padStart(2, '0'); // dd
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // mm
        const year = date.getFullYear(); // yyyy

        const hours = date.getHours(); // h
        const minutes = date.getMinutes().toString().padStart(2, '0'); // min

        const formattedDate = `${day}/${month}/${year}`; // dd/mm/yyyy
        const formattedTime = `${hours}:${minutes}`; // h:min

        return { formattedDate, formattedTime };
    };

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
                        )) : <div>No camera data available.</div>
                )}
            </div>
        </div>
    );
};

export default Database;
