import PasswordChange from './PasswordChange/PasswordChange';
import './Personal.css';
import PersonalInfoDetails from './PersonalInfoDetails/PersonalInfoDetails';

const Personal = () => {
    return (
        <div className='personal-wrapper'>
            <p className='personal-header'>Personal Info</p>
            <div className='personal-info-wrapper'>
                <PersonalInfoDetails />
                <PasswordChange />
            </div>
        </div>
    )
}

export default Personal;