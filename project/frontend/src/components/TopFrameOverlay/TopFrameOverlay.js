// TopFrameOverlay.js

import React from 'react';
import { BiCctv, BiTargetLock } from "react-icons/bi";
import { MdOutlineCalendarToday } from "react-icons/md";
import { GoAlertFill } from "react-icons/go";

import './TopFrameOverlay.css';

const TopFrameOverlay = ({ id, location, dateTime, detections, showDetections }) => {
    return (
        <div className='overlay-top' data-testid="overlay-top">
            <div className='camera-info-top'>
                <div className='camera-info-wrapper-top'>
                    <p><BiCctv data-testid="icon" /> Camera {id}</p>
                    <p><BiTargetLock data-testid="icon" /> {location}</p>
                </div>
                <div className='camera-info-wrapper-top'>
                    <p><MdOutlineCalendarToday data-testid="icon" /> {dateTime}</p>
                    {showDetections && (
                        <div className='detection-info'>
                            <GoAlertFill data-testid="icon" />
                            <span className='detection-count'>{detections}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TopFrameOverlay;
