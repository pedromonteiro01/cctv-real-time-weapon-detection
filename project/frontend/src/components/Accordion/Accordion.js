import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import './Accordion.css'; // Importing CSS for styling

const CustomAccordion = ({ children }) => {
    return (
        // Apply the custom class to the Accordion component
        <Accordion className="custom-accordion">
            {children}
        </Accordion>
    );
};

export default CustomAccordion;