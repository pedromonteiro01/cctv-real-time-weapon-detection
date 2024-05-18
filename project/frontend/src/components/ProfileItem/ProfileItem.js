import React from 'react';

const ProfileItem = ({ label, value }) => (
    <div className='personal-info-details-items-item'>
        <p>{label}</p>
        <p>{value}</p>
    </div>
);

export default ProfileItem;
