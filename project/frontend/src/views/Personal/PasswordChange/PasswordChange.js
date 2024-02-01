import './PasswordChange.css';

const PasswordChange = () => {
    return (
        <div className='password-change-wrapper'>
            <p className='password-change-header'>Change Password</p>
            <div className='password-change-items'>
                <input type='password' placeholder='Enter Password'></input>
                <input type='password' placeholder='New Password'></input>
            </div>
        </div>
    )
}

export default PasswordChange;