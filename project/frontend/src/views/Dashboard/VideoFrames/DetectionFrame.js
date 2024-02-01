import React, { useState } from 'react';
import './DetectionFrame.css';
import ControllButton from '../../../components/ControllButton/ControllButton';
import { CgMaximizeAlt, CgController, CgClose } from "react-icons/cg";
import { IoCameraOutline } from "react-icons/io5";
import { PiFilmSlateLight } from "react-icons/pi";
import { BiCctv, BiTargetLock } from "react-icons/bi";
import { MdOutlineCalendarToday, MdOutlineWatchLater } from "react-icons/md";
import { BsSkipBackward } from "react-icons/bs";
import shoot from './shoot6.mp4'

const DetectionFrame = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Handler to toggle video expansion
    const toggleExpandVideo = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`video-frame ${isExpanded ? 'expanded' : ''}`}>
            <video src={shoot} alt='Surveillance feed' className='frame-video' loop autoPlay muted></video>
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
