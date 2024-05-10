import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import './DetectionHistory.css';
import { FaEye } from "react-icons/fa";
import { ClipLoader } from 'react-spinners';
import Modal from '../../components/Modal/Modal';

const DetectionHistory = () => {
    const [detections, setDetections] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedFrame, setSelectedFrame] = useState('');
    const { authToken } = useAuth();

    useEffect(() => {
        setIsLoading(true);
        fetch('http://localhost:8000/api/detections/', {
            headers: { 'Authorization': `Token ${authToken}` }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok');
                }
            })
            .then(data => {
                console.log("data: ", data);
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

    const closeDetectionFrame = () => {
        setShowModal(false);
    };

    const TableHeader = () => (
        <thead>
            <tr>
                <th>No.</th>
                <th>Camera</th>
                <th>Weapon Type</th>
                <th>Date</th>
                <th>Time</th>
                <th>Site</th>
                <th>Confidence</th>
                <th>Action</th>
            </tr>
        </thead>
    );

    const TableRow = ({ record }) => (
        <tr className='detection-history-row'>
            <td>{record.no}</td>
            <td>{record.camera}</td>
            <td>{record.weapon_type}</td>
            <td>{record.date}</td>
            <td>{record.time}</td>
            <td>{record.site}</td>
            <td>{`${record.confidence}%`}</td>
            <td>
                <FaEye onClick={() => openDetectionFrame(record.frame)} className="open-frame-button" />
            </td>
        </tr>
    );

    return (
        <div className="table-container-wrapper">
            {isLoading ? (
                <div className="spinner-container">
                    <ClipLoader
                        color='#fff'
                    />
                </div>
            ) : (
                <>
                    <div className="table-header">
                        <span>{detections.length} records</span>
                    </div>
                    <table>
                        <TableHeader />
                        <tbody>
                            {detections.map((record, index) => (
                                <TableRow key={index} record={record} />
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
