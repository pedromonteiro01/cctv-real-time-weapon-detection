import { BiCctv, BiTargetLock } from "react-icons/bi";
import { MdOutlineCalendarToday, MdOutlineWatchLater } from "react-icons/md";
import './FrameOverlayUp.css';

const FrameOverlayUp = () => {
    return (
        <div className='overlay-top'>
            <div className='camera-info-top'>
                <div className='camera-info-wrapper-top'>
                    <p><BiCctv /> Camera 04</p>
                    <p><BiTargetLock /> Hall</p>
                </div>
                <div className='camera-info-wrapper-top'>
                    <p><MdOutlineCalendarToday /> 22/09/2018</p>
                    <p><MdOutlineWatchLater /> 09:27:00</p>
                </div>
            </div>
        </div>
    )
}

export default FrameOverlayUp;