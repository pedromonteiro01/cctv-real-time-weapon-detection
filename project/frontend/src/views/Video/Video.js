const Video = () => {

    const videoSrc = 'http://localhost:8000/api/video/';

    return (
        <div>
            <video width="720" height="480" controls>
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    )
}

export default Video;