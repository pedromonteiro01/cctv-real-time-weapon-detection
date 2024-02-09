import React, { useEffect, useState } from 'react';
import './DetectionFrame.css';
import ControllButton from '../../../components/ControllButton/ControllButton';
import { CgMaximizeAlt, CgController, CgClose } from "react-icons/cg";
import { IoCameraOutline } from "react-icons/io5";
import { PiFilmSlateLight } from "react-icons/pi";
import { BiCctv, BiTargetLock } from "react-icons/bi";
import { MdOutlineCalendarToday, MdOutlineWatchLater } from "react-icons/md";
import { BsSkipBackward } from "react-icons/bs";

const DetectionFrame = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [videoUrl, setVideoUrl] = useState([]);
    const [wsConnection, setWsConnection] = useState(null);

    const startVideoStream = () => {
        if (wsConnection === null) {
            const ws = new WebSocket('ws://localhost:8000/ws/video/');
            ws.onopen = () => {
                console.log('WebSocket Connected');
            };
            ws.onmessage = (event) => {
                const blob = new Blob([event.data], { type: 'image/jpeg' });
                const url = URL.createObjectURL(blob);
                setVideoUrl(url);
            };
            ws.onerror = (error) => {
                console.log('WebSocket Error:', error);
            };
            ws.onclose = () => {
                console.log('WebSocket Disconnected');
                setWsConnection(null);
            };
            setWsConnection(ws);
        }
    };

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws/text/');

        ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Message from WebSocket:', data.message);
            setVideoUrl((prevMessages) => [...prevMessages, data.message]);
        };

        ws.onerror = (error) => {
            console.log('WebSocket Error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
        };

        return () => {
            ws.close();
        };
    }, []);


    const toggleExpandVideo = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`video-frame ${isExpanded ? 'expanded' : ''}`}>
                        <button>Start Video Stream</button>

            <img src={videoUrl} alt='Surveillance feed' className='frame-video' />
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
                        <ControllButton onClick={startVideoStream} icon={<IoCameraOutline />} />
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
