// Database.js

import React, { useState, useEffect, useRef } from 'react';
import TopFrameOverlay from '../../components/TopFrameOverlay/TopFrameOverlay';
import './Database.css';
import { ClipLoader } from 'react-spinners';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CameraStream = ({ camera, frameSrc }) => {
    const navigate = useNavigate();

    const handleCameraClick = () => {
        navigate(`/camera/${camera.id}`);
    };

    return (
        <div className="database-image" onClick={handleCameraClick} style={{ cursor: 'pointer' }}>
            <TopFrameOverlay {...camera} showDetections={true} />
            <img src={frameSrc} alt={`Camera ${camera.id}`} style={{ width: '100%', height: 'auto' }} />
        </div>
    );
};

const Database = () => {
    const [cameras, setCameras] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const ws = useRef(null);
    const { authToken } = useAuth();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        if (!authToken) {
            console.error("authToken is undefined!");
            return;
        }
        ws.current = new WebSocket(`ws://localhost:8000/ws/multi_camera/${authToken}/`);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
            setIsLoading(true);
        };

        ws.current.onmessage = (event) => {
            if (!isMounted.current) return;

            const data = JSON.parse(event.data);
            const frameDetails = {
                timestamp: data.hour,  // Assuming the timestamp is sent as part of the data
                frame: data.frame
            };

            const dateTime = formatTimestamp(frameDetails.timestamp);
            if (frameDetails && frameDetails.frame) {
                const detections = data.detections ? data.detections.length : 0;
                if (detections > 0) {
                    toast(`New detection found on Camera ${data.camera_id}`, {
                        icon: '🚨',
                        style: {
                            border: '1px solid #ff0000',
                            padding: '16px',
                            color: '#ff0000',
                        },
                    });

                    // Post request for detection
                    const detectedInfo = {
                        camera: data.camera_id,
                        frame: data.frame,
                        weaponType: data.detections[0].label,  // Assuming the first detection's label
                        location: data.location,
                        confidence: data.detections[0].confidence,  // Assuming the first detection's confidence
                    };

                    fetch('http://localhost:8000/api/detections/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${authToken}`,
                        },
                        body: JSON.stringify({
                            camera: parseInt(detectedInfo.camera, 10),
                            frame: detectedInfo.frame,
                            weapon_type: detectedInfo.weaponType,
                            site: detectedInfo.location,
                            confidence: Math.round(detectedInfo.confidence * 100),
                        }),
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Detection saved:', data);
                    })
                    .catch((error) => {
                        console.error('Error saving detection:', error);
                    });
                }

                setCameras(prev => ({
                    ...prev,
                    [data.camera_id]: {
                        id: data.camera_id,
                        ...prev[data.camera_id],
                        location: data.location,
                        frameSrc: `data:image/jpeg;base64,${frameDetails.frame}`,
                        dateTime: dateTime,
                        detections: (prev[data.camera_id]?.detections || 0) + detections,
                    },
                }));
                setIsLoading(false);
            }
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            setIsLoading(false);
        };

        return () => {
            isMounted.current = false;
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [authToken]);

    const formatTimestamp = (timestamp) => {
        if (isNaN(timestamp) || timestamp === undefined) {
            console.error("Invalid timestamp:", timestamp);
            return 'Invalid DateTime';
        }

        const date = new Date(timestamp);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
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
