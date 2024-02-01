import DashboardItems from './DashBoardItems/DashBoardItems';
import './Dashboard.css';
import RecordTable from './Table/Table';
import DetectionFrame from './VideoFrames/DetectionFrame';
import warning from './warning.png';

const Dashboard = () => {

    return (
        <div className="dashboard-wrapper">
            <div className='dashboard-video-wrapper'>
                <DashboardItems />
                <DetectionFrame />
            </div>
            <div className='recorded-warning-wrapper'>
                <div className='recorded-data'>
                    <p>Recorded Data</p>
                    <RecordTable />
                </div>
                <div className='unsolved-issue'>
                    <p>Unsolved Issue</p>
                    <div className='unsolved-issue-content'>
                        <h3>Warning</h3>
                        <div className='unsolved-issue-content-weapon'>
                            <p>Weapon detection on:</p>
                            <p>Camera Hall</p>
                        </div>
                        <div className='warning-img-wrapper'>
                            <img src={warning} alt='warning' />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard;