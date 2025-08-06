import React from "react";
import ColumnsLayout from "./ColumnsLayout";
import TableLayout from "./TableLayout";
import TabsLayout from "./TabsLayout";
import FieldCard from "./FieldCard";
import AgGridSheet from "./AgGridSheet";
import SpreadsheetComponent from "../../components/SpreadsheetComponent";
import JSpreadsheetComponent from "../../components/JSpreadsheetComponent";

export default function CanvasNode({
  node,
  idx,
  parentId,
  row,
  col,
  onDrop,
  onSelect,
  onDelete,
  onMove,
  onUpdateField,
  handleDeleteColumn,
  handleDeleteTableColumn,
  handleDeleteTableRow,
  onAddColumn
}) {
  switch (node.type) {
    case "heading":
      return (
        <div
          key={node.id}
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1.6rem",
            marginBottom: "1rem",
            background: "#f8f9fa",
            padding: "8px",
            borderRadius: "4px",
            cursor: "default" // not clickable
          }}
        >
          {node.label || "Untitled Form"}
        </div>
      );
    case "columns":
      return (
        <div
          style={{ position: "relative" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelect(node.id);
          }}
        >
          <ColumnsLayout
            node={node}
            parentId={node.id}
            row={row}
            col={col}
            onDrop={onDrop}
            onSelect={onSelect}
            onDelete={onDelete}
            onMove={onMove}
            handleDeleteColumn={handleDeleteColumn}
            onAddColumn={onAddColumn}
          />
        </div>
      );
    case "table":
      return (
        <div
          style={{ position: "relative" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelect(node.id);
          }}
        >
          <TableLayout
            node={node}
            parentId={node.id}
            onDrop={onDrop}
            onSelect={onSelect}
            onDelete={onDelete}
            onMove={onMove}
            handleDeleteTableColumn={handleDeleteTableColumn}
            handleDeleteTableRow={handleDeleteTableRow}
            handleDeleteColumn={handleDeleteColumn}
          />
        </div>
      );
    case "tabs":
      return (
        <div
          style={{ position: "relative" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelect(node.id);
          }}
        >
          <TabsLayout
            key={`${node.id}-${node.tabs?.length || 0}-${node.activeTab || 0}`}
            node={node}
            parentId={node.id}
            row={row}
            col={col}
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
        </div>
      );
    case "agSpreadsheet":
      return (
        <div className="canvas-field">
          <AgGridSheet node={node} onUpdateField={onUpdateField} />
        </div>
      );
    case "spreadsheet":
      return (
        <div className="canvas-field">
          <SpreadsheetComponent 
            field={node} 
            onChange={(updatedField) => {
              // If all sheets are deleted, trigger component deletion
              if (!updatedField.sheets || updatedField.sheets.length === 0) {
                setTimeout(() => {
                  onDelete(node.id);
                }, 100);
                return;
              }
              onUpdateField(node.id, updatedField);
            }} 
          />
        </div>
      );
    case "jspreadsheet":
      return (
        <div className="canvas-field jspreadsheet-field">
          <JSpreadsheetComponent 
            field={node} 
            onChange={(updatedField) => {
              onUpdateField(node.id, updatedField);
            }}
            isFormFill={false}
          />
        </div>
      );
    default:
      return (
        <FieldCard
          field={node}
          idx={idx}
          parentId={parentId}
          row={row}
          col={col}
          onSelect={onSelect}
          onDelete={onDelete}
          onMove={onMove}
        />
      );
  }
}
