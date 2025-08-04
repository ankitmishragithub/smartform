import React from "react";
import { useDrop } from "react-dnd";
import DeleteIcon from '@mui/icons-material/Delete';
import Canvas from "./Canvas";
import { FIELD } from "./constants";

export default function TableCell({
  parentId,
  row,
  col,
  childrenNodes = [],
  onDrop,
  onSelect,
  onDelete,
  onMove,
  handleDeleteTableColumn,
  handleDeleteTableRow,
}) {
  const [, dropRef] = useDrop({
    accept: FIELD,
    drop(item, monitor) {
      if (monitor.didDrop() || !monitor.isOver()) return;
      onDrop(item, parentId, row, col);
      return { handled: true };
    },
  });

  return (
    <td
      ref={dropRef}
      className="canvas-cell"
    >

       {/* delete‑column button */}
      <button
        type="button"
        aria-label="Delete this column"
        className="delete-table-column-btn"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "scale(1.1) rotate(90deg)";
          e.target.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "scale(1) rotate(0deg)";
          e.target.style.boxShadow = "0 2px 8px rgba(239, 68, 68, 0.3)";
        }}
        onClick={() => handleDeleteTableColumn(parentId, col)}
      >
        <DeleteIcon fontSize="small"/>
      </button>

      {/* DELETE‑ROW BUTTON */}
      <button
        type="button"
        aria-label="Delete this row"
        className="delete-table-row-btn"
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "scale(1.1) rotate(90deg)";
          e.target.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "scale(1) rotate(0deg)";
          e.target.style.boxShadow = "0 2px 8px rgba(245, 158, 11, 0.3)";
        }}
        onClick={() => handleDeleteTableRow(parentId, row)}
      >
        <DeleteIcon fontSize="small" />
      </button>

      
      <Canvas
        fields={childrenNodes}
        parentId={parentId}
        row={row}
        col={col}
        onDrop={onDrop}
        onSelect={onSelect}
        onDelete={onDelete}
        onMove={onMove}
      />
    </td>
  );
}
