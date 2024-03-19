import React, { useState, useEffect, useRef } from 'react';
import TopFrameOverlay from '../../components/TopFrameOverlay/TopFrameOverlay';
import './Database.css';
import { SyncLoader } from 'react-spinners';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useAuth } from '../../context/AuthContext/AuthContext';

const CameraStream = ({ camera, frameSrc }) => (
    <div className="database-image">
        <TopFrameOverlay {...camera} />
        <img src={frameSrc} alt={`Camera ${camera.id}`} style={{ width: '100%', height: 'auto' }} />
    </div>
);

const Database = () => {
    const [cameras, setCameras] = useState({});
    const ws = useRef(null);
    const { authToken } = useAuth();

    useEffect(() => {
        if (!authToken) {
            console.error("authToken is undefined!");
            return;
        }
        ws.current = new WebSocket(`ws://localhost:8000/ws/multi_camera/${authToken}/`);

        const formatTimestamp = (timestamp) => {
            // Check if timestamp is a number
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

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Assuming data.frame is a JSON string representing an object with a 'frame' key.
            let frameDetails;
            try {
                frameDetails = JSON.parse(data.frame); // This will throw an error if data.frame is not a valid JSON string
            } catch (error) {
                console.error("Error parsing data.frame as JSON:", error);
                return; // Exit the function if parsing fails
            }
            console.log("Received timestamp:", data.timestamp);
            const { formattedDate, formattedTime } = formatTimestamp(frameDetails.timestamp);
            if (frameDetails && frameDetails.frame) {
                // Use frameDetails.frame which is expected to be a base64 string
                setCameras(prev => ({
                    ...prev,
                    [data.camera_id]: {
                        ...prev[data.camera_id],
                        location: data.location,
                        frameSrc: `data:image/jpeg;base64,${frameDetails.frame}`,
                        day: formattedDate,
                        hour: formattedTime,
                    },
                }));
            }
        };

        return () => ws.current?.close();
    }, [authToken]);

    return (
        <div className='database-wrapper'>
            <div className="database-buttons">
                <button onClick={null}><FaArrowLeft /> Previous</button>
                <button onClick={null}>Next <FaArrowRight /></button>
            </div>
            <div className='database-images-grid'>
                {Object.keys(cameras).length > 0 ? (
                    Object.values(cameras).map(camera => (
                        <CameraStream key={camera.id} camera={camera} frameSrc={camera.frameSrc} />
                    ))
                ) :
                    null}
            </div>
        </div>
    );
};

export default Database;