// CustomAccordion.js
import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import './Accordion.css'; // Importing CSS for styling

const CustomAccordion = ({ children }) => {
    return (
        <Accordion style={{ backgroundColor: '#2F2F2F' }} defaultActiveKey="0">
            {children}
        </Accordion>
    );
};

export default CustomAccordion;
