import React from 'react';
import { FaEye } from "react-icons/fa";

const UploadAnalysisTableRow = ({ detection, formatTime, openDetectionFrame }) => {
    console.log("detection timestamp: ", detection)
    return (
        <tr>
            <td>{detection.label}</td>
            <td>{(detection.confidence * 100).toFixed(2)}%</td>
            <td>
                <FaEye aria-label="View Frame" className="open-frame-button"  onClick={() => openDetectionFrame(detection.frame)}  />
            </td>
            <td>{formatTime(detection.timestamp)}</td>
        </tr>
    );
}

export default UploadAnalysisTableRow;
