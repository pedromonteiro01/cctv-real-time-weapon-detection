import PasswordChange from './PasswordChange/PasswordChange';
import PersonalInfoDetails from './PersonalInfoDetails/PersonalInfoDetails';
import './Personal.css';

const Personal = () => {
    return (
        <div className='personal-wrapper' data-testid="personal-wrapper">
            <p className='personal-header' data-testid="personal-header">Personal Info</p>
            <div className='personal-info-wrapper' data-testid="personal-info-wrapper">
                <PersonalInfoDetails data-testid="personal-info-details" />
                <PasswordChange data-testid="password-change" />
            </div>
        </div>
    )
}

export default Personal;