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
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // Assuming you are connecting to Django running locally on port 8000
        const ws = new WebSocket('ws://localhost:8000/ws/text/');

        ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Message from WebSocket:', data.message); // Log each message received
            setMessages((prevMessages) => [...prevMessages, data.message]);
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


    // Handler to toggle video expansion
    const toggleExpandVideo = () => {
        setIsExpanded(!isExpanded);
    };
    
    return (
        <div className={`video-frame ${isExpanded ? 'expanded' : ''}`}>
            <video src={""} alt='Surveillance feed' className='frame-video' loop autoPlay muted></video>
            {isExpanded && (
                <button className="exit-fullscreen-button" onClick={toggleExpandVideo}>
                    <CgClose /> {/* Icon for closing or minimizing */}
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
                        <ControllButton icon={<CgMaximizeAlt onClick={toggleExpandVideo} />}  />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DetectionFrame;
