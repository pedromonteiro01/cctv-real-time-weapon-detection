import PasswordChange from './PasswordChange/PasswordChange';
import PersonalInfoDetails from './PersonalInfoDetails/PersonalInfoDetails';
import './Personal.css';

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