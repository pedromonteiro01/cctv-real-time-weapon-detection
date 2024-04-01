import { useState } from 'react';
import DashboardItems from './DashBoardItems/DashBoardItems';
import './Dashboard.css';
import RecordTable from './Table/Table';
import DetectionFrame from './VideoFrames/DetectionFrame';
import warning from './warning.png';
import { useAuth } from '../../context/AuthContext/AuthContext';

const Dashboard = () => {
    const [isAlert, setIsAlert] = useState(false);
    const [records, setRecords] = useState([]);
    const [lastDetectedCamera, setLastDetectedCamera] = useState('');
    const { authToken } = useAuth();

    const handleWeaponDetection = (detectedInfo) => {
        setIsAlert(true);

        const currentDate = new Date();
        const date = currentDate.toISOString().split('T')[0]; // Formats the current date as YYYY-MM-DD
        const time = currentDate.toTimeString().split(' ')[0]; // Gets the current time in HH:MM:SS format

        const newRecord = {
            no: records.length + 1,
            camera: detectedInfo.camera,
            weapon_type: detectedInfo.weaponType,
            date: detectedInfo.date,
            time: detectedInfo.time,
            site: detectedInfo.location,
            confidence: Math.round(detectedInfo.confidence * 100)
        };

        setRecords([newRecord, ...records]);
        setLastDetectedCamera(detectedInfo.camera);

        console.log(detectedInfo)
        fetch('http://localhost:8000/api/detections/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}`, // Assuming you have the user's token stored somewhere
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
                <DashboardItems />
                <DetectionFrame onWeaponDetected={handleWeaponDetection} />
            </div>
            <div className='recorded-warning-wrapper'>
                <div className='recorded-data'>
                    <p>Recorded Data</p>
                    <RecordTable records={records} setRecords={setRecords} />
                </div>
                <div className='unsolved-issue'>
                    <p>Unsolved Issue</p>
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
        </div>
    )
}

export default Dashboard;