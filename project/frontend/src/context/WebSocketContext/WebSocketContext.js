import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

export const WebSocketContext = createContext();
export const WebSocketProvider = ({ children, authToken }) => {
    const [cameras, setCameras] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const ws = useRef(null);
    const isMounted = useRef(true);
    const processedDetections = useRef({});
    const workerRefs = useRef({});

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
            const { camera_id, timestamp, frame, detections, detection_id, location } = data;

            if (!processedDetections.current[camera_id]) {
                processedDetections.current[camera_id] = new Set();
                workerRefs.current[camera_id] = new Worker(new URL('./frameWorker.js', import.meta.url));
            }

            const frameWorker = workerRefs.current[camera_id];
            const dateTime = new Date(timestamp).toLocaleString();

            if (frame && detections.length > 0 && !processedDetections.current[camera_id].has(detection_id)) {
                processedDetections.current[camera_id].add(detection_id);

                toast(`New detection found on Camera ${camera_id}`, {
                    icon: '🚨',
                    style: {
                        border: '1px solid #ff0000',
                        padding: '16px',
                        color: '#ff0000',
                    },
                });

                const detectedInfo = {
                    camera: camera_id,
                    frame: frame,
                    weaponType: detections[0].label,
                    location: location,
                    confidence: detections[0].confidence,
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

            if (frameWorker) {
                frameWorker.postMessage({ frame: frame, mime: 'image/jpeg' });

                frameWorker.onmessage = (e) => {
                    setCameras(prev => ({
                        ...prev,
                        [camera_id]: {
                            ...prev[camera_id],
                            id: camera_id,
                            location: location,
                            frameSrc: e.data,
                            dateTime: dateTime,
                            detections: (prev[camera_id]?.detections || 0) + detections.length,
                        }
                    }));
                };
            }
            setIsLoading(false);
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
            Object.values(workerRefs.current).forEach(worker => worker.terminate());
        };
    }, [authToken]);

    return (
        <WebSocketContext.Provider value={{ cameras, isLoading }}>
            {children}
        </WebSocketContext.Provider>
    );
};
