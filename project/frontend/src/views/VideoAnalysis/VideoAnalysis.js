import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import './VideoAnalysis.css';
import { useAuth } from '../../context/AuthContext/AuthContext';

function VideoAnalysis() {
    const { videoId } = useParams();
    const canvasRef = useRef(null);
    const [detections, setDetections] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const { authToken } = useAuth();

    const persistDetections = (detections) => {
        fetch(`http://localhost:8000/api/uploaded_videos/${videoId}/detections/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization':  `Token ${authToken}`,
            },
            body: JSON.stringify({ detections })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Detections persisted successfully:', data);
        })
        .catch(error => {
            console.error('Error persisting detections:', error);
        });
    };

    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8000/ws/upload/${videoId}/`);
        console.log(`Attempting to connect to WebSocket with videoId: ${videoId}`);

        ws.onopen = () => console.log('WebSocket connection established');
        ws.onerror = (error) => console.log('WebSocket error:', error);
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            console.log('Received data:', data);
            if (data.frame) {
                drawFrame(data.frame);
            }
            if (data.detections) {
                setDetections((prevDetections) => [...prevDetections, ...data.detections]);
                persistDetections(data.detections);
            }
        };

        return () => {
            console.log('Closing WebSocket connection');
            ws.close();
        };
    }, [videoId]);

    const drawFrame = (frameBase64) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const image = new Image();

        image.onload = function () {
            console.log(`Image loaded, size: ${image.width}x${image.height}`);
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);
        };
        image.onerror = (e) => {
            console.error('Image loading error:', e);
        };
        image.src = `data:image/jpeg;base64,${frameBase64}`;
    };

    const handlePageChange = (event) => {
        setCurrentPage(Number(event.target.value));
    };

    const maxPage = Math.ceil(detections.length / itemsPerPage);
    const indexOfLastDetection = detections.length - ((currentPage - 1) * itemsPerPage);
    const indexOfFirstDetection = Math.max(indexOfLastDetection - itemsPerPage, 0);
    const currentDetections = detections.slice(indexOfFirstDetection, indexOfLastDetection).reverse();

    return (
        <div className='video-analysis-wrapper'>
            <div className='video-analysis-wrapper-flex'>
                <div className='video-analysis-canva'>
                    <canvas ref={canvasRef}></canvas>
                </div>
                <div className='video-analysis-detections'>
                    <div className="video-analysis-detections-label">
                        <label>
                            Page Number:
                            <select value={currentPage} onChange={handlePageChange} className="records-dropdown">
                                {Array.from({ length: maxPage }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {i + 1}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Weapon Type</th>
                                <th>Confidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentDetections.map((detection, index) => (
                                <tr key={index}>
                                    <td>{detection.label}</td>
                                    <td>{(detection.confidence * 100).toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default VideoAnalysis;
