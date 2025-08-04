import React from "react";
import TableCell from "./TableCell";

export default function TableLayout({
  node,
  parentId,
  onDrop,
  onSelect,
  onDelete,
  onMove,
  handleDeleteTableColumn,
  handleDeleteTableRow,
}) {
  return (
    <table className="canvas-table" style={{ borderCollapse: "collapse", width: "100%" }}>
      <tbody>
        {node.children.map((rowArr, rowIdx) => (
          <tr key={rowIdx}>
            {rowArr.map((cellArr, colIdx) => (
              <TableCell
                key={colIdx}
                parentId={parentId}
                row={rowIdx}
                col={colIdx}
                childrenNodes={cellArr}
                onDrop={onDrop}
                onSelect={onSelect}
                onDelete={onDelete}
                onMove={onMove}
                handleDeleteTableColumn={handleDeleteTableColumn}
                handleDeleteTableRow={handleDeleteTableRow}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
