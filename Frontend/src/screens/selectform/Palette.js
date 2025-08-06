import React, { useState } from "react";
import { useDrag } from "react-dnd";
import "../../css/palette.css";
import { SECTIONS } from "./sections"; 

export default function Palette({ onAdd }) {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].name);
  const section = SECTIONS.find((s) => s.name === activeSection);

  return (
    <div className="palette">
      <div className="palette-header">
        <h3 className="palette-title">🎨 Form Fields</h3>
        <p className="palette-subtitle">Drag or click to add fields</p>
      </div>
      
      <div className="palette-tabs">
        {SECTIONS.map((s) => (
          <button
            key={s.name}
            className={s.name === activeSection ? "active" : ""}
            onClick={() => setActiveSection(s.name)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="palette-items">
        {section.fields.map((field) => (
          <PaletteItem key={field.type} field={field} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}

function PaletteItem({ field, onAdd }) {
  const [, dragRef] = useDrag({ type: "FIELD", item: field });

  const handleAdd = () => {
    if (field.type === "columns") {
      const input = prompt(
        "Enter number of columns:",
        String(field.defaultCols || 2)
      );
      const cols = parseInt(input, 10);
      if (!isNaN(cols) && cols > 0) onAdd({ ...field, defaultCols: cols });
    } else if (field.type === "table") {
      const r = prompt("Enter number of rows:", String(field.defaultRows || 2));
      const rows = parseInt(r, 10);
      const c = prompt(
        "Enter number of columns:",
        String(field.defaultCols || 2)
      );
      const cols = parseInt(c, 10);
      if ([rows, cols].every((n) => !isNaN(n) && n > 0))
        onAdd({ ...field, defaultRows: rows, defaultCols: cols });
    } else if (field.type === "spreadsheet") {
      const sheets = prompt("Enter number of sheets:", String(field.defaultSheets || 1));
      const numSheets = parseInt(sheets, 10);
      const rows = prompt("Enter number of rows:", String(field.defaultRows || 5));
      const numRows = parseInt(rows, 10);
      const cols = prompt("Enter number of columns:", String(field.defaultCols || 5));
      const numCols = parseInt(cols, 10);
      if ([numSheets, numRows, numCols].every((n) => !isNaN(n) && n > 0))
        onAdd({ ...field, defaultSheets: numSheets, defaultRows: numRows, defaultCols: numCols });
          } else if (field.type === "jspreadsheet") {
        const rows = prompt("Enter number of rows:", String(field.defaultRows || 3));
        const numRows = parseInt(rows, 10);
        const cols = prompt("Enter number of columns:", String(field.defaultCols || 4));
        const numCols = parseInt(cols, 10);
        if ([numRows, numCols].every((n) => !isNaN(n) && n > 0))
          onAdd({ ...field, defaultRows: numRows, defaultCols: numCols });
      } else {
      onAdd(field);
    }
  };

  return (
    <div 
      ref={dragRef} 
      className="palette-item" 
      data-type={field.type}
      onClick={handleAdd}
    >
      <div className="palette-item-header">
        <span className="palette-item-icon">{field.icon}</span>
        <div className="palette-item-content">
          <div className="palette-item-title">{field.label}</div>
        </div>
      </div>
      {field.description && (
        <div className="palette-item-description">
          {field.description}
        </div>
      )}
    </div>
  );
}
