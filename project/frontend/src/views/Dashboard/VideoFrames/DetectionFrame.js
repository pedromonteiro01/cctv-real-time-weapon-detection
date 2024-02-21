import React, { useEffect, useRef, useState } from 'react';
import './DetectionFrame.css';
import ControllButton from '../../../components/ControllButton/ControllButton';
import { CgMaximizeAlt, CgController, CgClose } from "react-icons/cg";
import { IoCameraOutline } from "react-icons/io5";
import { PiFilmSlateLight } from "react-icons/pi";
import { BsSkipBackward } from "react-icons/bs";
import toast from 'react-hot-toast';
import TopFrameOverlay from '../../../components/TopFrameOverlay/TopFrameOverlay';

const DetectionFrame = ({ onWeaponDetected }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [cameraInfo, setCameraInfo] = useState({ id: '', location: '', day: '', hour: '' });
    const canvasRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws/video/');
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'warning') {
                toast(data.message, {
                    icon: '⚠️',
                    style: {
                        border: '1px solid #f97316',
                        padding: '16px',
                        color: '#f97316',
                    },
                });

                onWeaponDetected({
                    camera: `Camera ${data.id}`,
                    weaponType: "Weapon",
                    day: data.day,
                    hour: data.hour,
                    location: data.location,
                });
            }

            if (data.type === 'time_update') {
                setCameraInfo({
                    id: data.id,
                    location: data.location,
                    day: data.day,
                    hour: data.hour
                });
            }

            const context = canvasRef.current.getContext('2d');
            const image = new Image();
            image.onload = () => {
                context.drawImage(image, 0, 0, canvasRef.current.width, canvasRef.current.height);
            };
            image.src = `data:image/jpeg;base64,${data.frame}`;
        };

        return () => ws.close();
    }, []);


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
    )
}

export default DetectionFrame;
