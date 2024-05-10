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

export default TableRow;