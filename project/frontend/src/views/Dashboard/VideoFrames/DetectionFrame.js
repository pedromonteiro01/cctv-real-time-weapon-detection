import React, { useEffect, useRef, useState } from 'react';
import './DetectionFrame.css';
import ControllButton from '../../../components/ControllButton/ControllButton';
import { CgMaximizeAlt, CgController, CgClose } from "react-icons/cg";
import { IoCameraOutline } from "react-icons/io5";
import { PiFilmSlateLight } from "react-icons/pi";
import { BiCctv, BiTargetLock } from "react-icons/bi";
import { MdOutlineCalendarToday, MdOutlineWatchLater } from "react-icons/md";
import { BsSkipBackward } from "react-icons/bs";
import frame from './frame.png';
import toast from 'react-hot-toast';

const DetectionFrame = ({ onWeaponDetected }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [videoUrl, setVideoUrl] = useState([]);
    const canvasRef = useRef(null);
    
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws/video/');
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            const frame = data.frame;
            if (data.type === 'warning') {
                toast(data.message, {
                  icon: '⚠️',
                  style: {
                    border: '1px solid #f97316',
                    padding: '16px',
                    color: '#f97316',
                  },
                });

                onWeaponDetected && onWeaponDetected();
              }
            const context = canvasRef.current.getContext('2d');
            const image = new Image();
            image.onload = () => {
                context.drawImage(image, 0, 0, canvasRef.current.width, canvasRef.current.height);
            };
            image.src = `data:image/jpeg;base64,${frame}`;
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
                <div className='camera-info'>
                    <div className='camera-info-wrapper'>
                        <p><BiCctv /> Camera 04</p>
                        <p><BiTargetLock /> Hall</p>
                    </div>
                    <div className='camera-info-wrapper'>
                        <p><MdOutlineCalendarToday /> 22/09/2018</p>
                        <p><MdOutlineWatchLater /> 09:27:00</p>
                    </div>
                </div>
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
