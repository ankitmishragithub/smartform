
import { registerLicense } from '@syncfusion/ej2-base';
registerLicense(process.env.REACT_APP_SYNCFUSION_LICENSE_KEY);
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SpreadsheetComponent,
  SheetsDirective,
  SheetDirective,
} from "@syncfusion/ej2-react-spreadsheet";

// Import Syncfusion base styles
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-react-spreadsheet/styles/material.css';

// Import additional styles for navbar/ribbon functionality (only installed packages)
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-inputs/styles/material.css';
import '@syncfusion/ej2-popups/styles/material.css';
import '@syncfusion/ej2-lists/styles/material.css';
import '@syncfusion/ej2-navigations/styles/material.css';
import '@syncfusion/ej2-dropdowns/styles/material.css';
import '@syncfusion/ej2-calendars/styles/material.css';

import '@syncfusion/ej2-splitbuttons/styles/material.css';
import '@syncfusion/ej2-treegrid/styles/material.css';



// Debug CSS loading
console.log('SyncfusionSpreadsheetComponent: Importing component...');
console.log('SyncfusionSpreadsheetComponent: SpreadsheetComponent available:', !!SpreadsheetComponent);

/**
 * EJ2SpreadsheetField
 * --------------------
 * Props:
 *  - id:            string (required) unique field id
 *  - label:         string (shown above the sheet)
 *  - value:         { data?: string[][] }  // value object from preview stage
 *  - rows:          number (initial grid rows, default 15)
 *  - cols:          number (initial grid cols, default 8)
 *  - height:        number|string (sheet height, e.g. 420 or "420px")
 *  - readOnly:      boolean (default false)
 *  - className:     string (optional wrapper class)
 *  - onChange:      function(id, nextValueObj)  // called when cells change
 *
 * Stored value shape (suggested):
 *   values[id] = { data: string[][] }
 */

const DEFAULT_ROWS = 15;
const DEFAULT_COLS = 8;

// ----- Helpers: Excel address <-> indices -----
function numToCol(n0) {
  // 0 -> A, 25 -> Z, 26 -> AA
  let n = n0;
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}
function colToNum(colLetters) {
  // 'A' -> 0, 'Z' -> 25, 'AA' -> 26
  let n = 0;
  for (let i = 0; i < colLetters.length; i++) {
    n *= 26;
    n += colLetters.charCodeAt(i) - 64;
  }
  return n - 1;
}
function parseAddress(addr) {
  // 'A1' or 'Sheet1!B3' -> { row: 0-based, col: 0-based }
  const last = addr.includes("!") ? addr.split("!").pop() : addr;
  const m = last.match(/^([A-Z]+)(\d+)$/i);
  if (!m) return { row: 0, col: 0 };
  const col = colToNum(m[1].toUpperCase());
  const row = parseInt(m[2], 10) - 1;
  return { row, col };
}

// expand a 2D array to contain [row][col]
function ensureSize2D(arr, row, col) {
  const rLen = Math.max(arr.length, row + 1);
  const cLen = Math.max(arr[0]?.length ?? 0, col + 1);
  const next = Array.from({ length: rLen }, (_, r) => {
    const rowArr = arr[r] ? [...arr[r]] : [];
    if (rowArr.length < cLen) {
      rowArr.length = cLen;
      for (let i = 0; i < cLen; i++) {
        if (typeof rowArr[i] === "undefined") rowArr[i] = "";
      }
    }
    return rowArr;
  });
  return next;
}

const SyncfusionSpreadsheetComponent = ({
  field,
  value,
  onChange,
  readOnly = false,
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
  height = 420,
  className = "",
}) => {
  console.log('SyncfusionSpreadsheetComponent: Component rendered with props:', { field, value, readOnly, rows, cols, height, className });
  
  const ssRef = useRef(null);
  const id = field?.id || 'spreadsheet';

  // Test if CSS is loaded by checking if styles are applied
  useEffect(() => {
    setTimeout(() => {
      const testElement = document.querySelector('.ej2-spreadsheet-field');
      if (testElement) {
        const computedStyle = window.getComputedStyle(testElement);
        console.log('SyncfusionSpreadsheetComponent: CSS test - background-color:', computedStyle.backgroundColor);
        console.log('SyncfusionSpreadsheetComponent: CSS test - border:', computedStyle.border);
        console.log('SyncfusionSpreadsheetComponent: CSS test - computed styles:', computedStyle);
      } else {
        console.log('SyncfusionSpreadsheetComponent: CSS test - element not found');
      }
    }, 1000); // Wait a bit for the component to render
  }, []);

  // local grid mirrors the value data; kept minimal (strings)
  const initialGrid = useMemo(() => {
    const v = value?.sheets?.[0]?.data || value?.data;
    if (Array.isArray(v) && v.length) {
      // normalize jagged arrays
      const maxC = Math.max(...v.map((r) => r.length));
      return v.map((r) => {
        const row = r.slice();
        if (row.length < maxC) row.length = maxC;
        for (let i = 0; i < maxC; i++) if (typeof row[i] === "undefined") row[i] = "";
        return row;
      });
    }
    // start with empty grid rows x cols
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
  }, [value, rows, cols]);

  const [grid, setGrid] = useState(initialGrid);

  // write initial grid into the Spreadsheet after creation
  const applyInitialGrid = () => {
    console.log('SyncfusionSpreadsheetComponent: Applying initial grid...');
    const ss = ssRef.current;
    if (!ss || !ss.getRange) {
      console.warn('SyncfusionSpreadsheetComponent: Spreadsheet ref not available or missing getRange method');
      return;
    }

    // Efficiently push only non-empty cells
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
        const v = grid[r][c];
        if (v !== "" && v != null) {
          const addr = `${numToCol(c)}${r + 1}`;
          try {
            ss.updateCell({ value: String(v) }, addr);
          } catch (error) {
            console.warn('SyncfusionSpreadsheetComponent: Error updating cell:', error);
          }
        }
      }
    }
  };

  const handleCreated = () => {
    console.log('SyncfusionSpreadsheetComponent: Spreadsheet created, applying initial grid...');
    // Limit visible columns/rows by setting default col widths/row heights lightly (optional)
    // Just ensure initial data appears:
    applyInitialGrid();
  };

  // capture cell edits
  const handleCellSave = (args) => {
    console.log('SyncfusionSpreadsheetComponent: Cell save event:', args);
    // args: { address: 'A1', value: 'newVal', element, oldValue, cancel }
    const { address, value: newVal } = args;
    const { row, col } = parseAddress(address);
    setGrid((prev) => {
      const next = ensureSize2D(prev, row, col);
      console.log("Updated grid snapshot:", next);
      if (ssRef.current) {
    console.log("EJ2 internal sheets model:", ssRef.current.sheets);
  }
      next[row][col] = newVal ?? "";
      return next;
    });
  };

  // debounce pushing to onChange to avoid spamming parent
  const changeTimer = useRef(null);
  useEffect(() => {
    if (!onChange || !id) return;
    if (changeTimer.current) clearTimeout(changeTimer.current);
    changeTimer.current = setTimeout(() => {
      console.log('SyncfusionSpreadsheetComponent: Debounced onChange triggered with grid:', grid);
      // Convert to the expected format for SmartForm
      const newValue = {
        ...value,
        sheets: [{
          ...value?.sheets?.[0],
          data: grid,
          rows: grid.length,
          cols: grid[0]?.length || 0
        }]
      };
      onChange(newValue);
    }, 250);
    return () => {
      if (changeTimer.current) clearTimeout(changeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid]);

  // expose quick export/import helpers (optional UI below)
  const saveAsJson = async () => {
    console.log('SyncfusionSpreadsheetComponent: Saving as JSON...');
    const ss = ssRef.current;
    if (!ss || !ss.saveAsJson) {
      console.warn('SyncfusionSpreadsheetComponent: saveAsJson method not available');
      return;
    }
    try {
      const json = await ss.saveAsJson();
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(field?.label || "spreadsheet").replace(/\s+/g, "_")}.ej2.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (error) {
      console.error('SyncfusionSpreadsheetComponent: Error saving JSON:', error);
    }
  };

  const loadFromJsonFile = (file) => {
    console.log('SyncfusionSpreadsheetComponent: Loading from JSON file...');
    const ss = ssRef.current;
    if (!ss || !ss.openFromJson) {
      console.warn('SyncfusionSpreadsheetComponent: openFromJson method not available');
      return;
    }
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        ss.openFromJson({ file: json });
      } catch (error) {
        console.error('SyncfusionSpreadsheetComponent: Error parsing JSON file:', error);
        alert("Invalid EJ2 JSON file.");
      }
    };
  };

  // UX: height normalize
  const sheetHeight = typeof height === "number" ? `${height}px` : height;

  console.log('SyncfusionSpreadsheetComponent: Rendering component with height:', sheetHeight);

  return (
    <div className={`ej2-spreadsheet-field ${className}`} style={{ 
      width: "100%",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
    }}>
      {field?.label && (
        <div style={{ 
          marginBottom: 8, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          padding: "8px 0"
        }}>
          <div style={{ fontWeight: 600, fontSize: "14px" }}>{field.label}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={saveAsJson}
              style={btnStyle(readOnly ? 0.5 : 1)}
              disabled={readOnly}
              title="Export EJ2 workbook JSON"
            >
              Export JSON
            </button>
            <label style={labelBtnStyle}>
              Import JSON
              <input
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) loadFromJsonFile(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        </div>
      )}

      <div style={{ 
        border: "1px solid #E5E7EB", 
        borderRadius: 8, 
        overflow: "hidden",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
      }}>
        <SpreadsheetComponent
          ref={ssRef}
          height={sheetHeight}
          allowEditing={!readOnly}
          allowAutoFill={!readOnly}
          allowInsert={!readOnly}
          allowDelete={!readOnly}
          allowSorting={!readOnly}
          allowFiltering={!readOnly}
          allowFormatting={!readOnly}
          allowResizing={!readOnly}
          allowMerging={!readOnly}
          allowConditionalFormat={!readOnly}
          allowDataValidation={!readOnly}
          allowHyperlink={!readOnly}
          allowImage={!readOnly}
          allowChart={!readOnly}
          allowFindAndReplace={!readOnly}
          allowFreezePanes={!readOnly}
          allowProtectSheet={!readOnly}
          allowProtectWorkbook={!readOnly}
          showSheetTabs={false}
          showRibbon={!readOnly}
          showFormulaBar={!readOnly}
          showContextMenu={!readOnly}
          showStatusBar={true}
          showScrollBars={true}
          showGridLines={true}
          showHeadings={true}
          enableKeyboardNavigation={true}
          enableTouch={true}
          enableVirtualization={true}
          enableLazyLoading={true}
          enableBatchUpdate={true}
          created={handleCreated}
          cellSave={handleCellSave}
        >
          <SheetsDirective>
            <SheetDirective name="Sheet1" />
          </SheetsDirective>
        </SpreadsheetComponent>
      </div>
    </div>
  );
};

// simple pill buttons
function btnStyle(opacity = 1) {
  return {
    opacity,
    cursor: "pointer",
    border: "1px solid #D1D5DB",
    background: "#111827",
    color: "white",
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
  };
}
const labelBtnStyle = {
  cursor: "pointer",
  border: "1px solid #D1D5DB",
  background: "white",
  color: "#111827",
  padding: "6px 10px",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  display: "inline-block",
};

console.log('SyncfusionSpreadsheetComponent: Component defined, exporting...');

export default SyncfusionSpreadsheetComponent; 
