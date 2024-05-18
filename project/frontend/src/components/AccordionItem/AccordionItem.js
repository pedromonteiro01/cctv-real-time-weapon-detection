import React from 'react';
import { Accordion } from 'react-bootstrap';

const AccordionItem = ({ eventKey, header, bodyP, bodyC }) => {
    return (
        <Accordion.Item className='accordion-item' eventKey={eventKey}>
            <Accordion.Header>{header}</Accordion.Header>
            <Accordion.Body>
                <p>{bodyP}</p>
                <p>{bodyC}</p>
            </Accordion.Body>
        </Accordion.Item>
    );
};

export default AccordionItem;