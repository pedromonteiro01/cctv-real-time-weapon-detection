import React from 'react';
import profile from './profile.jpg';

const ProfileImage = () => (
    <div className='personal-info-details-image'>
        <img src={profile} alt='Profile' />
    </div>
);

export default ProfileImage;
