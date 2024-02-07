import FrameOverlayUp from '../../components/FrameOverlayUp/FrameOverlayUp';
import './Database.css';
import frame from './frame.png';
import { FaArrowRight, FaArrowLeft } from "react-icons/fa6";



const Database = () => {
    return (
        <div className="database-wrapper">
            <div className="database-buttons">
                <button><FaArrowLeft /> Previous</button>
                <button>Next<FaArrowRight /></button>
            </div>
            <div className='database-images-wrapper'>
                <div>
                    <div className="database-image">
                        <FrameOverlayUp />
                        <img src={frame} alt="Placeholder" />
                    </div>
                    <div className="database-image" style={{ marginTop: '3vh' }}>
                        <FrameOverlayUp />
                        <img src={frame} alt="Placeholder" />
                    </div>
                </div>
                <div>
                    <div className="database-image">
                        <FrameOverlayUp />
                        <img src={frame} alt="Placeholder" />
                    </div>
                    <div className="database-image" style={{ marginTop: '3vh' }}>
                        <FrameOverlayUp />
                        <img src={frame} alt="Placeholder" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Database;