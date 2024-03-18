import { useState, useEffect } from 'react';
import './PersonalInfoDetails.css';
import profile from './profile.jpg';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { ClipLoader } from 'react-spinners';

const PersonalInfoDetails = () => {
    const [user, setUserData] = useState(null);
    const { authToken } = useAuth();


    useEffect(() => {
        const fetchUserData = async () => {
            
            const response = await fetch('http://localhost:8000/api/user/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${authToken}`,
                },
            });
    
            if (response.ok) {
                const data = await response.json();
                setUserData(data);
            } else {
                console.error('Failed to fetch user data:', response.statusText);
            }
        };
    
        fetchUserData();
    }, [authToken]);
    if (!user) {
        return <ClipLoader color="#fff" />;
    }

    return (
        <div className='personal-info-details'>
            <div className='personal-info-details-items'>
                <div className='personal-info-details-items-item'>
                    <p>Name</p>
                    <p>{user.first_name} {user.last_name}</p>
                </div>
                <div className='personal-info-details-items-item'>
                    <p>Email</p>
                    <p>{user.email}</p>
                </div>
                <div className='personal-info-details-items-item'>
                    <p>Number</p>
                    <p>{user.number}</p>
                </div>
                <div className='personal-info-details-items-item'>
                    <p>City</p>
                    <p>{user.city}</p>
                </div>
            </div>
            <div className='personal-info-details-image'>
                <img src={profile} alt='profile' />
            </div>
        </div>
    );
};

export default PersonalInfoDetails;
