// DetectionFrame.js
import React from 'react';
import './DetectionFrame.css';
import frame from './frame.png'; // Assuming this is the background frame image
import ControllButton from '../../../components/ControllButton/ControllButton';
import { CgMaximizeAlt, CgController } from "react-icons/cg";
import { IoCameraOutline } from "react-icons/io5";
import { PiFilmSlateLight } from "react-icons/pi";
import { BiCctv, BiTargetLock } from "react-icons/bi";
import { MdOutlineCalendarToday, MdOutlineWatchLater } from "react-icons/md";
import { BsSkipBackward } from "react-icons/bs";

const DetectionFrame = () => {
    return (
        <div className='video-frame'>
            <img src={frame} alt='Surveillance feed' className='frame-image' />
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
                        <ControllButton icon={<CgMaximizeAlt />} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DetectionFrame;
