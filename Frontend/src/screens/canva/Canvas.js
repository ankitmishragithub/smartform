import React from "react";
import { useDrop } from "react-dnd";
import { FIELD } from "./constants";
import CanvasNode from "./CanvasNode";
import "../../css/App.css";

export default function Canvas({
  fields,
  parentId = null,
  row = null,
  col = null,
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
  const safeFields = Array.isArray(fields) ? fields : [];
  const isTable = safeFields.length > 0 && Array.isArray(safeFields[0]);
  const isRoot = parentId === null;

  const [, dropRef] = useDrop({
    accept: FIELD,
    drop(item, monitor) {
      if (monitor.didDrop() || !monitor.isOver()) return;
      onDrop(item, parentId, row, col);
      return { handled: true };
    },
  });

  return (
    <div ref={isRoot ? dropRef : null} className="canvas-drop-zone" style={{ minHeight: 50 }}>
      {safeFields.length === 0 ? (
        <p className="canvas-placeholder">Drag fields here</p>
      ) : isTable ? (
        safeFields.map((rowArr, rIdx) => (
          <div key={rIdx} className="table-row" style={{ display: "flex" }}>
            {rowArr.map((cell, cIdx) => (
              <CanvasNode
                key={cell.id}
                node={cell}
                idx={cIdx}
                parentId={parentId}
                row={rIdx}
                col={cIdx}
                onDrop={onDrop}
                onSelect={onSelect}
                onDelete={onDelete}
                onMove={onMove}
                handleDeleteColumn={handleDeleteColumn}
                handleDeleteTableColumn={handleDeleteTableColumn}
                handleDeleteTableRow={handleDeleteTableRow}
                onAddColumn={onAddColumn}
                onUpdateField={onUpdateField}
                
              >
                <Canvas
                  fields={Array.isArray(cell.children) ? cell.children : []}
                  parentId={cell.id}
                  row={rIdx}
                  col={cIdx}
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
              </CanvasNode>
            ))}
          </div>
        ))
      ) : (
        safeFields.map((node, idx) => (
          <CanvasNode
            key={node.id}
            node={node}
            idx={idx}
            parentId={parentId}
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
            
          >
            <Canvas
              fields={Array.isArray(node.children) ? node.children : []}
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
          </CanvasNode>
        ))
      )}
    </div>
  );
}
