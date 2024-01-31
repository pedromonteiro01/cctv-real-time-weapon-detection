import React from 'react';
import { Accordion } from 'react-bootstrap';

const AccordionItem = ({ eventKey, header, body }) => {
    return (
        <Accordion.Item style={{backgroundColor: '#2F2F2F', marginBottom:'0.7rem'}} className='accordion-item' eventKey={eventKey}>
            <Accordion.Header style={{color: '#fff'}}>{header}</Accordion.Header>
            <Accordion.Body style={{color: '#fff'}}>
                {body}
            </Accordion.Body>
        </Accordion.Item>
    );
};

export default AccordionItem;
