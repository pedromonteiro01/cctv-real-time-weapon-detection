import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import './VideoAnalysis.css';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { FaEye, FaDownload } from "react-icons/fa";
import Modal from '../../components/Modal/Modal';

function VideoAnalysis() {
    const { videoId } = useParams();
    const canvasRef = useRef(null);
    const [detections, setDetections] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [isAnalyzed, setIsAnalyzed] = useState(false);
    const { authToken } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [selectedFrame, setSelectedFrame] = useState('');
    const [processedVideoUrl, setProcessedVideoUrl] = useState('');

    useEffect(() => {
        fetch(`http://localhost:8080/api/uploaded_videos/${videoId}/`, {
            headers: {
                'Authorization': `Token ${authToken}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setIsAnalyzed(data.analyzed);
                if (!data.analyzed) {
                    fetch(`http://localhost:8080/api/detections/${videoId}/delete/`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Token ${authToken}`,
                        },
                    })
                        .then(response => {
                            if (!response.ok) throw new Error('Network response was not ok.');
                            if (response.status === 204) {
                                console.log('Detections deleted successfully');
                                return null;
                            } else {
                                return response.json();
                            }
                        })
                        .then(result => {
                            if (result) console.log('Detections deleted:', result.message);
                        })
                        .catch(error => console.error('Error deleting detections:', error));

                }
            })
            .catch(error => {
                console.error('Error fetching video details:', error);
            });
    }, []);

    useEffect(() => {
        fetch(`http://localhost:8080/api/uploaded_videos/${videoId}/`, {
            headers: {
                'Authorization': `Token ${authToken}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setIsAnalyzed(data.analyzed);
                if (data.analyzed) {
                    setProcessedVideoUrl(`http://localhost:8080/api/download_video/${videoId}/`);
                }
            })
            .catch(error => {
                console.error('Error fetching video details:', error);
            });
    }, [videoId, authToken]);

    const handleDownloadClick = async (e) => {
        e.preventDefault(); // Prevent the default anchor behavior

        try {
            const response = await fetch(`http://localhost:8080/api/download_video/${videoId}/`, {
                headers: {
                    'Authorization': `Token ${authToken}`,
                },
            });

            if (!response.ok) throw new Error('Network response was not ok.');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `${videoId}_processed_video.mp4`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading the file:', error);
        }
    };

    const persistDetections = (detections) => {
        const payload = {
            detections: detections.map(detection => ({
                ...detection,
                frame: detection.frame,
            })),
        };

        fetch(`http://localhost:8080/api/uploaded_videos/${videoId}/detections/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}`,
            },
            body: JSON.stringify({
                detections: detections.map(detection => ({
                    ...detection,
                    frame: detection.frame,
                })),
            }),
        })
            .then(response => response.json())
            .catch(error => {
                console.error('Error persisting detections:', error);
            });
    };

    useEffect(() => {
        fetchVideoDetails();

        fetchDetections();
    }, [videoId, authToken]);

    const fetchDetections = () => {
        fetch(`http://localhost:8080/api/uploaded_videos/${videoId}/detections/`, {
            headers: {
                'Authorization': `Token ${authToken}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setDetections(data);
            })
            .catch(error => {
                console.error('Error fetching detections:', error);
            });
    };

    useEffect(() => {
        if (!isAnalyzed) {
            const ws = new WebSocket(`ws://localhost:8080/ws/upload/${videoId}/`);

            ws.onopen = () => console.log('WebSocket connection established');
            ws.onerror = (error) => console.log('WebSocket error:', error);
            ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.frame) {
                    drawFrame(data.frame);
                }
                if (data.detections) {
                    const detectionsWithFrames = data.detections.map(detection => ({
                        ...detection,
                        frame: data.frame,
                        timestamp: detection.timestamp
                    }));
                    persistDetections(detectionsWithFrames);
                    setDetections((prevDetections) => [...prevDetections, ...detectionsWithFrames]);
                }
                if (data.status && data.status === 'completed') {
                    setIsAnalyzed(data.analyzed);
                    setProcessedVideoUrl(`http://localhost:8080/api/download_video/${videoId}/`);
                }
            };

            return () => {
                console.log('Closing WebSocket connection');
                ws.close();
            };
        }
    }, [isAnalyzed, videoId]);

    const fetchVideoDetails = () => {
        fetch(`http://localhost:8080/api/uploaded_videos/${videoId}/`, {
            headers: {
                'Authorization': `Token ${authToken}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                setIsAnalyzed(data.analyzed);
                if (data.analyzed) {
                    setProcessedVideoUrl(`http://localhost:8080/api/download_video/${videoId}/`);
                }
            })
            .catch(error => {
                console.error('Error fetching video details:', error);
            });
    };

    const drawFrame = (frameBase64) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const image = new Image();

        image.onload = function () {
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

    const openDetectionFrame = (frame) => {
        setSelectedFrame(frame);
        setShowModal(true);
    };

    const closeDetectionFrame = () => {
        setShowModal(false);
    };

    const formatTime = (seconds) => {
        const pad = (num, size) => num.toString().padStart(size, '0');
        const totalSeconds = Math.floor(seconds);
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
        const milliseconds = Math.floor((seconds % 1) * 1000);

        return `${pad(minutes, 2)}:${pad(remainingSeconds, 2)}.${pad(milliseconds, 3)}`;
    };

    const maxPage = Math.ceil(detections.length / itemsPerPage);
    const indexOfLastDetection = detections.length - ((currentPage - 1) * itemsPerPage);
    const indexOfFirstDetection = Math.max(indexOfLastDetection - itemsPerPage, 0);
    const currentDetections = detections.slice(indexOfFirstDetection, indexOfLastDetection).reverse();

    return (
        <div className='video-analysis-wrapper'>
            <div className='video-analysis-wrapper-flex'>
                {isAnalyzed ? (
                    <div className="message">
                        This video has been analyzed.
                        {processedVideoUrl && (
                            <div>
                                <a onClick={handleDownloadClick} className="download-link">
                                    <FaDownload /> Download Processed Video
                                </a>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className='video-analysis-canva'>
                        <canvas ref={canvasRef}></canvas>
                    </div>
                )}
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
                                <th>Frame</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentDetections.map((detection, index) => (
                                <tr key={index}>
                                    <td>{detection.label}</td>
                                    <td>{(detection.confidence * 100).toFixed(2)}%</td>
                                    <td>
                                        <FaEye onClick={() => openDetectionFrame(detection.frame)} className="open-frame-button">

                                        </FaEye>
                                    </td>
                                    <td>{formatTime(detection.timestamp)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {showModal && <Modal frame={selectedFrame} closeModal={closeDetectionFrame} />}
                </div>
            </div>
        </div>
    );
}

export default VideoAnalysis;