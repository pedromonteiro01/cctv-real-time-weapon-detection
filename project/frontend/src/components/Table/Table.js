import React, { useState, useEffect } from 'react';
import './RecordTable.css';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useParams } from 'react-router-dom'; 
import TableHeader from './TableHeader';
import TableRow from './TableRow';

const RecordTable = ({ records, setRecords }) => {
  const recordsPerPage = 3;
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true); // Add loading state
  const { authToken } = useAuth();
  const { cameraId } = useParams();

  useEffect(() => {
    setLoading(true); // Set loading to true when starting the fetch
    const url = cameraId 
      ? `http://localhost:8080/api/detections/camera/${cameraId}/` 
      : 'http://localhost:8080/api/detections/';
      
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
        setLoading(false); // Set loading to false when data is fetched
    })
    .catch((error) => {
        console.error('Error:', error);
        setLoading(false); // Set loading to false in case of error
    });
  }, [cameraId, authToken, setRecords]);

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
              disabled={loading} // Disable dropdown while loading
            >
              {Array.from({ length: Math.ceil(records.length / recordsPerPage) }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div> // Display loading indicator
      ) : (
        <table>
          <TableHeader />
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((record, index) => <TableRow key={index} record={record} />)
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No records available</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecordTable;
