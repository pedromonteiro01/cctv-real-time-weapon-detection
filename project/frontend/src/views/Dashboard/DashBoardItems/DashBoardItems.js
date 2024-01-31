import CustomAccordion from "../../../components/Accordion/Accordion";
import AccordionItem from "../../../components/AccordionItem/AccordionItem";
import './DashBoardItems.css';

const DashboardItems = () => {
    return (
        <div className='dashboard-items'>
                    <p>Dashboard</p>
                    <div className='dashboard-items-selectors'>
                        <ul>
                            <li>Watching</li>
                            <li>List</li>
                            <li>All Cameras</li>
                        </ul>
                    </div>
                    <div className='dashboard-items-selectors-items'>
                    <CustomAccordion>
                            <AccordionItem
                                eventKey="0"
                                header="1. Camera Entrance"
                                body="Live"
                            />
                            <AccordionItem
                                eventKey="1"
                                header="2. Camera Hall"
                                body="Live"                            
                                />
                            <AccordionItem
                                eventKey="2"
                                header="3. Camera Hall"
                                body="Live"
                            />
                        </CustomAccordion>
                    </div>
                </div>
    )
}

export default DashboardItems;