import React from 'react';
import { FaExternalLinkAlt, FaCheck, FaTimes } from "react-icons/fa";
import PropTypes from 'prop-types';

const UploadTableRow = ({ video, onNavigate }) => (
    <tr>
        <td>{video.id}</td>
        <td>{video.video}</td>
        <td>
            {video.analyzed ?
                <FaCheck style={{ color: 'green' }} data-testid="icon-checked" /> :
                <FaTimes style={{ color: 'red' }} data-testid="icon-unchecked" />
            }
        </td>
        <td>
            <FaExternalLinkAlt
                data-testid="navigate-icon"
                onClick={() => onNavigate(`/upload/${video.id}`)}
                className="redirect-upload-video"
            />
        </td>
    </tr>
);

UploadTableRow.propTypes = {
    video: PropTypes.shape({
        id: PropTypes.number.isRequired,
        video: PropTypes.string.isRequired,
        analyzed: PropTypes.bool.isRequired
    }).isRequired,
    onNavigate: PropTypes.func.isRequired
};

export default UploadTableRow;
