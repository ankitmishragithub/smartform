import React from "react";
import { useDrop } from "react-dnd";
import Canvas from "./Canvas";
import { FIELD } from "./constants";

export default function TabComponent({
  parentId,
  tabIndex,
  childrenNodes = [],
  onDrop,
  onSelect,
  onDelete,
  onMove,
  handleDeleteColumn,
  handleDeleteTableColumn,
  handleDeleteTableRow,
  onAddColumn,
  onUpdateField
}) {

  const [, dropRef] = useDrop({
    accept: FIELD,
    drop(item, monitor) {
      if (monitor.didDrop() || !monitor.isOver()) return;
      // Pass tabIndex as row parameter for tabs
      onDrop(item, parentId, tabIndex, null);
      return { handled: true };
    },
  });

  return (
    <div
      ref={dropRef}
      className="tab-component"
      style={{
        position: "relative"
      }}
    >
      {childrenNodes.length === 0 ? (
        <div
          className="empty-tab-zone"
          style={{
            textAlign: "center",
            padding: "60px 20px",
            fontSize: "16px",
            color: "#9ca3af",
            border: "2px dashed #d1d5db",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
            transition: "all 0.3s ease",
            position: "relative",
            cursor: "default"
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = "#667eea";
            e.target.style.background = "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)";
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 8px 25px -8px rgba(102, 126, 234, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "#d1d5db";
            e.target.style.background = "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "none";
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.3 }}>📋</div>
          <div style={{ fontWeight: "600", marginBottom: "8px" }}>Drop fields here</div>
          <div style={{ fontSize: "14px", opacity: 0.7 }}>Drag any field from the palette to get started</div>
        </div>
      ) : (
        <Canvas
          fields={childrenNodes}
          parentId={parentId}
          row={tabIndex}
          col={null}
          onDrop={onDrop}
          onSelect={onSelect}
          onDelete={onDelete}
          onMove={onMove}
          handleDeleteColumn={handleDeleteColumn}
          handleDeleteTableColumn={handleDeleteTableColumn}
          handleDeleteTableRow={handleDeleteTableRow}
          onAddColumn={onAddColumn}
          onUpdateField={onUpdateField}
        />
      )}
    </div>
  );
} 