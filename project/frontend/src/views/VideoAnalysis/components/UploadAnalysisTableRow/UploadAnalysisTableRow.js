import React from 'react';
import { FaEye } from "react-icons/fa";

const UploadAnalysisTableRow = ({ detection, formatTime, openDetectionFrame }) => {
    return (
        <tr>
            <td>{detection.label}</td>
            <td>{(detection.confidence * 100).toFixed(2)}%</td>
            <td>
                <button 
                    onClick={() => openDetectionFrame(detection.frame)} 
                    className="open-frame-button" 
                    aria-label="View Frame"
                >
                    <FaEye />
                </button>
            </td>
            <td>{formatTime(detection.timestamp)}</td>
        </tr>
    );
}

export default UploadAnalysisTableRow;
