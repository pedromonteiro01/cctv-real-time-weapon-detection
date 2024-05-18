import React from 'react';
import PropTypes from 'prop-types';

const IconButton = ({ icon: Icon, label, onClick, position = 'left' }) => (
    <button onClick={onClick} className={`icon-button icon-${position}`}>
        {position === 'left' && <Icon />}
        {label}
        {position === 'right' && <Icon />}
    </button>
);

IconButton.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string,
    onClick: PropTypes.func,
    position: PropTypes.oneOf(['left', 'right'])
};

export default IconButton;
