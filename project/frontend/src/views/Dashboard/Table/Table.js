import React, { useState } from 'react';
import './RecordTable.css';

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
      </tr>
    </thead>
  );
};

const TableRow = ({ record }) => {
  return (
    <tr>
      <td>{record.no}</td>
      <td>{record.camera}</td>
      <td>{record.weaponType}</td>
      <td>{record.date}</td>
      <td>{record.time}</td>
      <td>{record.site}</td>
    </tr>
  );
};

const RecordTable = ({ records }) => {
  const recordsPerPage = 3;
  const [currentPage, setCurrentPage] = useState(1);
  const maxPage = Math.ceil(records.length / recordsPerPage);

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
