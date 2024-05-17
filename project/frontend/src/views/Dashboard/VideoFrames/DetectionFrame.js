import React, { useEffect, useRef, useState } from 'react';
import './DetectionFrame.css';
import ControllButton from '../../../components/ControllButton/ControllButton';
import { CgMaximizeAlt, CgController, CgClose } from "react-icons/cg";
import { IoCameraOutline } from "react-icons/io5";
import { PiFilmSlateLight } from "react-icons/pi";
import { BsSkipBackward } from "react-icons/bs";
import toast from 'react-hot-toast';
import TopFrameOverlay from '../../../components/TopFrameOverlay/TopFrameOverlay';
import { useParams, useLocation } from 'react-router-dom';

const DetectionFrame = ({ onWeaponDetected }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [cameraInfo, setCameraInfo] = useState({ id: '', location: '', day: '', hour: '' });
    const canvasRef = useRef(null);
    const { cameraId } = useParams();
    const location = useLocation();
    const timestamp = location.state?.timestamp || 0;
    const ws = useRef(null);
    const isMounted = useRef(true);
    const processedDetections = useRef(new Set());

    const connectWebSocket = () => {
        ws.current = new WebSocket(`ws://localhost:8000/ws/video/${cameraId}/?timestamp=${timestamp}`);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
        };

        ws.current.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (!isMounted.current) return;

            setCameraInfo({
                id: data.camera_id || cameraInfo.id,
                location: data.location || cameraInfo.location,
                day: new Date(data.timestamp).toLocaleDateString(),
                hour: new Date(data.timestamp).toLocaleTimeString()
            });

            if (data.detections && data.detections.length > 0 && !processedDetections.current.has(data.detection_id)) {
                processedDetections.current.add(data.detection_id);  // Mark detection as processed

                data.detections.forEach((detection) => {
                    const message = `Detection: ${detection.label} with ${Math.round(detection.confidence * 100)}% confidence`;
                    toast(message, {
                        icon: '🚨',
                        style: {
                            border: '1px solid #ff0000',
                            padding: '16px',
                            color: '#ff0000',
                        },
                    });

                    onWeaponDetected({
                        camera: data.camera_id,
                        weaponType: detection.label,
                        date: data.timestamp,
                        location: data.location,
                        frame: data.frame,
                        confidence: detection.confidence
                    });
                });
            }

            if (data.frame && canvasRef.current) {
                const context = canvasRef.current.getContext('2d');
                const blob = base64ToBlob(data.frame, 'image/jpeg');
                const image = new Image();
                image.onload = () => {
                    context.drawImage(image, 0, 0, canvasRef.current.width, canvasRef.current.height);
                };
                image.src = URL.createObjectURL(blob);
            }
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.current.onclose = () => {
            console.log("WebSocket closed. Reconnecting...");
            if (isMounted.current) {
                setTimeout(() => connectWebSocket(), 1000);
            }
        };
    };

    useEffect(() => {
        isMounted.current = true;
        connectWebSocket();

        return () => {
            isMounted.current = false;
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [cameraId, timestamp]);

    const base64ToBlob = (base64, mime) => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mime });
    };

    const toggleExpandVideo = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`video-frame ${isExpanded ? 'expanded' : ''}`}>
            <canvas className='frame-video' ref={canvasRef}></canvas>
            {isExpanded && (
                <button className="exit-fullscreen-button" onClick={toggleExpandVideo}>
                    <CgClose />
                </button>
            )}
            <div className='overlay'>
                <TopFrameOverlay id={cameraInfo.id} location={cameraInfo.location} day={cameraInfo.day} hour={cameraInfo.hour} />
                <div className='controll-buttons'>
                    <div className='controll-buttons-1'>
                        <ControllButton icon={<PiFilmSlateLight />} />
                        <ControllButton icon={<IoCameraOutline />} />
                        <ControllButton icon={<BsSkipBackward />} />
                    </div>
                    <div className='controll-buttons-2'>
                        <ControllButton icon={<CgController />} />
                        <ControllButton icon={<CgMaximizeAlt onClick={toggleExpandVideo} />} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetectionFrame;
