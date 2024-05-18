import React from 'react';
import { FaEye } from "react-icons/fa";

const DetectionHistoryTableRow = ({ record, onOpenFrame }) => (
    <tr className='detection-history-row'>
        <td>{record.no}</td>
        <td>{record.camera}</td>
        <td>{record.weapon_type}</td>
        <td>{record.date}</td>
        <td>{record.time}</td>
        <td>{record.site}</td>
        <td>{`${record.confidence}%`}</td>
        <td>
            <FaEye onClick={() => onOpenFrame(record.frame)} className="open-frame-button" />
        </td>
    </tr>
);

export default DetectionHistoryTableRow;