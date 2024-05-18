import { useNavigate } from "react-router-dom";
import TopFrameOverlay from "../TopFrameOverlay/TopFrameOverlay";

const CameraStream = ({ camera, frameSrc }) => {
    const navigate = useNavigate();

    const handleCameraClick = () => {
        navigate(`/camera/${camera.id}`);
    };

    return (
        <div className="database-image" onClick={handleCameraClick} style={{ cursor: 'pointer' }}>
            <TopFrameOverlay {...camera} showDetections={true} />
            <img src={frameSrc} alt={`Camera ${camera.id}`} style={{ width: '100%', height: 'auto' }} />
            <div className="camera-timestamp">{camera.dateTime}</div>
        </div>
    );
};

export default CameraStream;