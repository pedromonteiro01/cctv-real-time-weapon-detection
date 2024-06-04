import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TopFrameOverlay from "../TopFrameOverlay/TopFrameOverlay";

const CameraStream = ({ camera, frameSrc }) => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    const handleCameraClick = () => {
        console.log("Camera clicked:", camera); // Log the camera object
        console.log("Navigating to camera id:", camera.id); 
        navigate(`/camera/${camera.id}`);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const image = new Image();
        
        image.src = frameSrc;
        image.onload = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);
        };
    }, [frameSrc]);

    return (
        <div className="database-image" onClick={handleCameraClick} style={{ cursor: 'pointer' }}>
            <TopFrameOverlay {...camera} showDetections={true} />
            <canvas ref={canvasRef} style={{ width: '100%', height: 'auto' }} />
        </div>
    );
};

export default CameraStream;
