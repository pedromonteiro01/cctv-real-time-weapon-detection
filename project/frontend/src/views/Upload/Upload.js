import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import './Upload.css';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FaExternalLinkAlt } from "react-icons/fa";


function VideoUpload() {
    const [videos, setVideos] = useState([]);
    const [video, setVideo] = useState(null);
    const { authToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:8000/api/uploaded_videos/', {
            headers: {
                'Authorization': `Token ${authToken}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                console.log(data); // Log the data to inspect its structure
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

        fetch('http://localhost:8000/api/upload_video/', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Token ${authToken}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                toast.success('Video uploaded successfully');
                navigate(`/upload/${data.id}`);
            })
            .catch(error => {
                console.error('Error:', error);
                toast.error('Error uploading video');
            });
    };

    return (
        <div className='upload-wrapper'>
            <input type="file" accept="video/*" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload Video</button>

            <table className='upload-video-table'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Video Name</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(videos) && videos.map((video) => (
                        <tr key={video.id}>
                            <td>{video.id}</td>
                            <td>{video.video}</td>
                            <td>
                                <FaExternalLinkAlt
                                    onClick={() => navigate(`/upload/${video.id}`)}
                                    className="redirect-upload-video"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default VideoUpload;
