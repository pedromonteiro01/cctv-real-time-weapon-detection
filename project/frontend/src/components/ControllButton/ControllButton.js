import './ControllButton.css';

const ControllButton = (props) => {
    return (
        <button className='controll-button'>
            {props.icon}
        </button>
    )
}

export default ControllButton;