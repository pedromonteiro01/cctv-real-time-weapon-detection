// TopFrameOverlay.js

import React from 'react';
import { BiCctv, BiTargetLock } from "react-icons/bi";
import { MdOutlineCalendarToday, MdOutlineWatchLater } from "react-icons/md";
import './TopFrameOverlay.css';

const TopFrameOverlay = ({ id, location, day, hour }) => {
    return (
        <div className='overlay-top' data-testid="overlay-top">
            <div className='camera-info-top'>
                <div className='camera-info-wrapper-top'>
                    <p><BiCctv data-testid="icon" /> Camera {id}</p>
                    <p><BiTargetLock data-testid="icon" /> {location}</p>
                </div>
                <div className='camera-info-wrapper-top'>
                    <p><MdOutlineCalendarToday data-testid="icon" /> {day}</p>
                    <p><MdOutlineWatchLater data-testid="icon" /> {hour}</p>
                </div>
            </div>
        </div>
    )
}

export default TopFrameOverlay;
