import './PersonalInfoDetails.css';
import profile from './profile.jpg';

const PersonalInfoDetails = () => {
    return (
        <div className='personal-info-details'>
            <div className='personal-info-details-items'>
                <div className='personal-info-details-items-item'>
                    <p>Name</p>
                    <p>Pedro Monteiro</p>
                </div>
                <div className='personal-info-details-items-item'>
                    <p>Email</p>
                    <p>pmapm@ua.pt</p>
                </div>
                <div className='personal-info-details-items-item'>
                    <p>Number</p>
                    <p>97484</p>
                </div>
                <div className='personal-info-details-items-item'>
                    <p>City</p>
                    <p>Aveiro</p>
                </div>
            </div>
            <div className='personal-info-details-image'>
                <img src={profile} alt='profile' />
            </div>
        </div>
    )
}

export default PersonalInfoDetails;