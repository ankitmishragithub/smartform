import React from "react";
import { useDrop } from "react-dnd";
import DeleteIcon from '@mui/icons-material/Delete';
import Canvas from "./Canvas";
import { FIELD } from "./constants";

export default function Column({
  parentId,
  row,
  col,
  childrenNodes = [],
  onDrop,
  onSelect,
  onDelete,
  onMove,
  handleDeleteColumn,
  onAddColumn
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
    <div
      ref={dropRef}
      className="canvas-column"
      style={{ flex: 1, minWidth: 0 }}
    >

        {/* ADD‑COLUMN BUTTON */}
      <button
        type="button"
        aria-label="Insert a column to the right"
        className="add-column-btn"
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "4px 8px",
          fontSize: "0.8rem",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "scale(1.1)";
          e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.boxShadow = "0 2px 8px rgba(16, 185, 129, 0.3)";
        }}
       onClick={() => onAddColumn(parentId, col)}
      >
        +
      </button>

<button
        className="delete-column-btn"
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
        onClick={() => handleDeleteColumn(parentId, col)}
      >
        <DeleteIcon fontSize="small"/>
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
        onAddColumn={onAddColumn}
        handleDeleteColumn={handleDeleteColumn}
      />
    </div>
  );
}
