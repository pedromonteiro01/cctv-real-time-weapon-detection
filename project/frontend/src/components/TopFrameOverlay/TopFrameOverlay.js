import { BiCctv, BiTargetLock } from "react-icons/bi";
import { MdOutlineCalendarToday, MdOutlineWatchLater } from "react-icons/md";
import './TopFrameOverlay.css';

const TopFrameOverlay = (props) => {
    return (
        <div className='overlay-top'>
            <div className='camera-info-top'>
                <div className='camera-info-wrapper-top'>
                    <p><BiCctv /> Camera {props.id}</p>
                    <p><BiTargetLock /> {props.location}</p>
                </div>
                <div className='camera-info-wrapper-top'>
                    <p><MdOutlineCalendarToday /> {props.day}</p>
                    <p><MdOutlineWatchLater /> {props.hour}</p>
                </div>
            </div>
        </div>
    )
}

export default TopFrameOverlay;