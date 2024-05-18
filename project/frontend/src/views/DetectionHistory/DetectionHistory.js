import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import './DetectionHistory.css';
import { ClipLoader } from 'react-spinners';
import Modal from '../../components/Modal/Modal';
import DetectionHistoryTableRow from './components/DetectionHistoryTableRow/DetectionHistoryTableRow';
import DetectionHistoryTableHeader from './components/DetectionHistoryTableHeader/DetectionHistoryTableHeader';

const DetectionHistory = () => {
    const [detections, setDetections] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedFrame, setSelectedFrame] = useState('');
    const { authToken } = useAuth();

    useEffect(() => {
        setIsLoading(true);
        fetch('http://localhost:8080/api/detections/', {
            headers: { 'Authorization': `Token ${authToken}` }
        })
            .then(response => response.ok ? response.json() : Promise.reject('Failed to load'))
            .then(data => {
                setDetections(data.map((detection, index) => ({ ...detection, no: index + 1 })));
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching detections:', error);
                setIsLoading(false);
            });
    }, [authToken]);

    const openDetectionFrame = (frame) => {
        setSelectedFrame(frame);
        setShowModal(true);
    };

    const closeDetectionFrame = () => setShowModal(false);

    return (
        <div className="table-container-wrapper">
            {isLoading ? (
                <div className="spinner-container">
                    <ClipLoader color='#fff' />
                </div>
            ) : (
                <>
                    <div className="table-header">
                        <span>{detections.length} records</span>
                    </div>
                    <table>
                        <DetectionHistoryTableHeader />
                        <tbody>
                            {detections.map((record, index) => (
                                <DetectionHistoryTableRow key={index} record={record} onOpenFrame={openDetectionFrame} />
                            ))}
                        </tbody>
                    </table>
                </>
            )}
            {showModal && <Modal frame={selectedFrame} closeModal={closeDetectionFrame} />}
        </div>
    );
};

export default DetectionHistory;
