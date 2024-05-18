import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import './Upload.css';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import UploadTableRow from './components/UploadTableRow/UploadTableRow';
import UploadTableHeader from './components/UploadTableHeader/UploadTableHeader';

function VideoUpload() {
    const [videos, setVideos] = useState([]);
    const [video, setVideo] = useState(null);
    const { authToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:8080/api/uploaded_videos/', {
            headers: {
                'Authorization': `Token ${authToken}`,
            },
        })
        .then(response => response.json())
        .then(data => {
            console.log("data: ", data);
            setVideos(data);
        })
        .catch(error => {
            console.error('Error:', error);
            toast.error('Error fetching videos');
        });
    }, [authToken]);

    const handleFileChange = (e) => {
        setVideo(e.target.files[0]);
    };

    const handleUpload = () => {
        if (!video) {
            toast.error('Please select a video to upload.');
            return;
        }
    
        const formData = new FormData();
        formData.append('video', video);
    
        fetch('http://localhost:8080/api/uploaded_videos/upload_video/', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Token ${authToken}`,
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            toast.success('Video uploaded successfully');
            navigate(`/upload/${data.id}`);
        })
        .catch(error => {
            console.error('Error:', error);
            toast.error('Error uploading video: ' + error.message);
        });
    };
    
    return (
        <div className='upload-wrapper'>
            <input type="file" accept="video/*" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload Video</button>

            <table className='upload-video-table'>
                <UploadTableHeader />
                <tbody>
                    {Array.isArray(videos) && videos.map(video => (
                        <UploadTableRow key={video.id} video={video} onNavigate={navigate} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default VideoUpload;
