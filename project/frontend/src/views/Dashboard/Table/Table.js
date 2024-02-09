import React, { useState } from 'react';
import './RecordTable.css';

// mock data
const initialData = [
  { no: 5, camera: 'Camera Hall', weaponType: 'Knife', date: '01.02.24', time: '10:01:21', site: 'Hall' },
  { no: 4, camera: 'Camera Hall', weaponType: 'Weapon', date: '01.2.24', time: '10:00:51', site: 'Hall' },
  { no: 3, camera: 'Camera Hall', weaponType: 'Weapon', date: '01.2.24', time: '10:00:51', site: 'Hall' },
  // ... more records
];

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

const RecordTable = () => {
  const [data, setData] = useState(initialData);

  return (
    <div className="table-container">
      <div className="table-header">
        <span>5,000 records</span>
        <div>
          <label>
            No of row in table:
            <select className="records-dropdown dropdown">
              <option value="3">3</option>
            </select>
          </label>
          <label>
            Sort by:
            <select className="sort-dropdown dropdown">
              <option value="date">Date</option>
            </select>
          </label>
        </div>
      </div>
      <table>
        <TableHeader />
        <tbody>
          {data.map((record, index) => (
            <TableRow key={index} record={record} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecordTable;
