import { useState } from 'react';
import './Dashboard.css';
import DetectionFrame from './VideoFrames/DetectionFrame';
import warning from './warning.png';
import { useAuth } from '../../context/AuthContext/AuthContext';
import RecordTable from '../../components/Table/Table';

const Dashboard = () => {
    const [isAlert, setIsAlert] = useState(false);
    const [records, setRecords] = useState([]);
    const [lastDetectedCamera, setLastDetectedCamera] = useState('');
    const { authToken } = useAuth();

    const handleWeaponDetection = (detectedInfo) => {
        setIsAlert(true);

        // Extracting date and time from detectedInfo.date
        const dateTime = new Date(detectedInfo.date);
        const date = dateTime.toISOString().split('T')[0];
        const time = dateTime.toTimeString().split(' ')[0];

        const newRecord = {
            camera: detectedInfo.camera,
            weapon_type: detectedInfo.weaponType,
            date: date,
            time: time,
            site: detectedInfo.location,
            confidence: Math.round(detectedInfo.confidence * 100)
        };

        setRecords(prevRecords => {
            const updatedNo = prevRecords.length + 1;
            return [{...newRecord, no: updatedNo}, ...prevRecords];
        });       
        setLastDetectedCamera(detectedInfo.camera);

        console.log(detectedInfo);
        fetch('http://localhost:8000/api/detections/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}`,
            },
            body: JSON.stringify({
                camera: parseInt(detectedInfo.camera, 10),
                frame: detectedInfo.frame,
                weapon_type: detectedInfo.weaponType,
                site: detectedInfo.location,
                confidence: Math.round(detectedInfo.confidence * 100),
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Detection saved:', data);
        })
        .catch((error) => {
            console.error('Error saving detection:', error);
        });

        setTimeout(() => setIsAlert(false), 5000);
    };

    return (
        <div className="dashboard-wrapper">
            <div className='dashboard-video-wrapper'>
                <DetectionFrame onWeaponDetected={handleWeaponDetection} />
                <div className='unsolved-issue'>
                    <div className='unsolved-issue-content'>
                        <h3>Warning</h3>
                        <div className='unsolved-issue-content-weapon'>
                            <p>Weapon detection on:</p>
                            <p className={`${isAlert ? 'animate-alert' : ''}`}>{lastDetectedCamera || 'No recent detections'}</p>
                        </div>
                        <div className={`warning-img-wrapper ${isAlert ? 'animate-alert' : ''}`}>
                            <img src={warning} alt='warning' />
                        </div>
                    </div>
                </div>
            </div>
            <div className='recorded-warning-wrapper'>
                <div className='recorded-data'>
                    <p>Recorded Data</p>
                    <RecordTable records={records} setRecords={setRecords} />
                </div>
            </div>
        </div>
    )
}

export default Dashboard;
