import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import './Accordion.css';

const CustomAccordion = ({ children }) => {
    return (
        <Accordion className="custom-accordion">
            {children}
        </Accordion>
    );
};

export default CustomAccordion;