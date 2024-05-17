import React, { createContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children, authToken }) => {
    const [cameras, setCameras] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const ws = useRef(null);
    const isMounted = useRef(true);
    const processedDetections = useRef(new Set());

    useEffect(() => {
        isMounted.current = true;

        if (!authToken) {
            console.error("authToken is undefined!");
            return;
        }

        ws.current = new WebSocket(`ws://localhost:8080/ws/multi_camera/${authToken}/`);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
            setIsLoading(true);
        };

        ws.current.onmessage = (event) => {
            if (!isMounted.current) return;

            const data = JSON.parse(event.data);
            const timestamp = data.timestamp;
            const dateTime = new Date(timestamp).toLocaleString();

            if (data.frame) {
                const detections = data.detections ? data.detections.length : 0;
                if (detections > 0 && !processedDetections.current.has(data.detection_id)) {
                    processedDetections.current.add(data.detection_id);  // Mark detection as processed

                    toast(`New detection found on Camera ${data.camera_id}`, {
                        icon: '🚨',
                        style: {
                            border: '1px solid #ff0000',
                            padding: '16px',
                            color: '#ff0000',
                        },
                    });

                    const detectedInfo = {
                        camera: data.camera_id,
                        frame: data.frame,
                        weaponType: data.detections[0].label,
                        location: data.location,
                        confidence: data.detections[0].confidence,
                    };

                    fetch('http://localhost:8080/api/detections/', {
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
                        frameSrc: `data:image/jpeg;base64,${data.frame}`,
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

    return (
        <WebSocketContext.Provider value={{ cameras, isLoading }}>
            {children}
        </WebSocketContext.Provider>
    );
};
