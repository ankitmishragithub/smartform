import React from "react";
import Column from "./Column";

export default function ColumnsLayout({
  node,
  parentId,
  row,
  col,
  onDrop,
  onSelect,
  onDelete,
  onMove,
  handleDeleteColumn,
  onAddColumn
}) {
  return (
    <div
      className="canvas-columns"
      style={{
        display: "flex",
        width: "100%",
        overflowX: "auto",
        paddingBottom: 8,
      }}
    >
      {node.children.map((colArr, colIdx) => (
        <div key={colIdx} style={{ minWidth: 180, flex: 1 }}>
          <Column
            parentId={parentId}
            row={row}
            col={colIdx}
            childrenNodes={colArr}
            onDrop={onDrop}
            onSelect={onSelect}
            onDelete={onDelete}
            onMove={onMove}
            handleDeleteColumn={handleDeleteColumn}
            onAddColumn={onAddColumn}
          />
        </div>
      ))}
    </div>
  );
}
