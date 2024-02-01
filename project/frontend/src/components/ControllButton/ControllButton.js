import './ControllButton.css';

const ControllButton = (props) => {
    return (
        <button className='controll-button' onClick={props.onClick}>
            {props.icon}
        </button>
    )
}

export default ControllButton;