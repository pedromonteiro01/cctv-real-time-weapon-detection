import React, { useState, useEffect } from 'react';
import './RecordTable.css';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useParams } from 'react-router-dom'; 


const TableHeader = () => {
  return (
    <thead>
      <tr>
        <th>No.</th>
        <th>Camera</th>
        <th>Weapon Type</th>
        <th>Date</th>
        <th>Time</th>
        <th>Site</th>
        <th>Confidence</th>
      </tr>
    </thead>
  );
};

const TableRow = ({ record }) => {
  return (
    <tr>
      <td>{record.no}</td>
      <td>{record.camera}</td>
      <td>{record.weapon_type}</td>
      <td>{record.date}</td>
      <td>{record.time}</td>
      <td>{record.site}</td>
      <td>{record.confidence}%</td>
    </tr>
  );
};

const RecordTable = ({ records, setRecords }) => {
  const recordsPerPage = 3;
  const [currentPage, setCurrentPage] = useState(1);
  const maxPage = Math.ceil(records.length / recordsPerPage);
  const { authToken } = useAuth();
  const { cameraId } = useParams();

  useEffect(() => {
    const url = cameraId 
      ? `http://localhost:8000/api/detections/camera/${cameraId}/` 
      : 'http://localhost:8000/api/detections/';
      
    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`
      },
    })
    .then(response => {
        if(response.ok) {
            return response.json();
        }
        throw new Error('Network response was not ok.');
    })
    .then(data => {
        const transformedRecords = data.map((item, index) => ({
            ...item,
            no: index + 1,
        }));
        setRecords(transformedRecords);
        console.log("transformedRecords: ", transformedRecords);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}, [authToken]);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);

  const handlePageChange = (event) => {
    setCurrentPage(Number(event.target.value));
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <span>{records.length} records</span>
        <div>
          <label>
            Page Number:
            <select
              value={currentPage}
              onChange={handlePageChange}
              className="records-dropdown"
            >
              {Array.from({ length: maxPage }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <table>
        <TableHeader />
        <tbody>
          {currentRecords.length > 0 ? (
            currentRecords.map((record, index) => <TableRow key={index} record={record} />)
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>No records available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RecordTable;
