import './VideoFrames.css';
import frame from './frame.png';

const VideoFrames = () => {
    return (
        <div className='video-frame'>
            <img src={frame} alt='frame' />
        </div>
    )
}

export default VideoFrames;