import React, { useState, useEffect } from 'react';
import './PersonalInfoDetails.css';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { ClipLoader } from 'react-spinners';
import ProfileItem from '../../../components/ProfileItem/ProfileItem';
import ProfileImage from '../../../components/ProfileImage/ProfileImage';

const PersonalInfoDetails = () => {
    const [user, setUserData] = useState(null);
    const { authToken } = useAuth();

    useEffect(() => {
        const fetchUserData = async () => {
            const response = await fetch('http://localhost:8080/api/user/', {
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
                <ProfileItem label="Name" value={`${user.first_name} ${user.last_name}`} />
                <ProfileItem label="Email" value={user.email} />
                <ProfileItem label="Number" value={user.number} />
                <ProfileItem label="City" value={user.city} />
            </div>
            <ProfileImage />
        </div>
    );
};

export default PersonalInfoDetails;
