import { useEffect, useState } from 'react';
import DashboardItems from './DashBoardItems/DashBoardItems';
import './Dashboard.css';
import RecordTable from './Table/Table';
import DetectionFrame from './VideoFrames/DetectionFrame';
import warning from './warning.png';

const Dashboard = () => {
    const [isAlert, setIsAlert] = useState(false);
    const [records, setRecords] = useState([]);
    const [lastDetectedCamera, setLastDetectedCamera] = useState('');
    const [lastDetectionTime, setLastDetectionTime] = useState(0);

    const handleWeaponDetection = (detectedInfo) => {
        setIsAlert(true);
        const newRecord = {
            no: records.length + 1,
            camera: detectedInfo.camera,
            weaponType: detectedInfo.weaponType,
            date: detectedInfo.day,
            time: detectedInfo.hour,
            site: detectedInfo.location,
        };
        setRecords([newRecord, ...records]);
        setLastDetectedCamera(detectedInfo.camera);
        setLastDetectionTime(Date.now());
        setTimeout(() => setIsAlert(false), 5000);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (Date.now() - lastDetectionTime >= 60000) {
                setLastDetectedCamera('No recent detections');
            }
        }, 60000);

        return () => clearTimeout(timer);
    }, [lastDetectionTime]);


    return (
        <div className="dashboard-wrapper">
            <div className='dashboard-video-wrapper'>
                <DashboardItems />
                <DetectionFrame onWeaponDetected={handleWeaponDetection} />
            </div>
            <div className='recorded-warning-wrapper'>
                <div className='recorded-data'>
                    <p>Recorded Data</p>
                    <RecordTable records={records} />
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