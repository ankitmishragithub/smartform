
import { registerLicense } from '@syncfusion/ej2-base';
registerLicense(process.env.REACT_APP_SYNCFUSION_LICENSE_KEY);
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SpreadsheetComponent,
  SheetsDirective,
  SheetDirective,
} from "@syncfusion/ej2-react-spreadsheet";
import api from '../api/api';

// Import Syncfusion base styles
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-react-spreadsheet/styles/material.css';

// Import additional 
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
  console.log('SyncfusionSpreadsheetComponent: Value structure:', {
    value,
    valueType: typeof value,
    hasSheets: value?.sheets?.length > 0,
    firstSheetData: value?.sheets?.[0]?.data,
    valueData: value?.data
  });
  
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
    console.log('SyncfusionSpreadsheetComponent: ReadOnly mode:', readOnly);
    console.log('SyncfusionSpreadsheetComponent: Initial grid data:', grid);
    
    // Apply initial data regardless of readonly mode
    applyInitialGrid();
    
    // In readonly mode, ensure data is visible by forcing a refresh
    if (readOnly) {
      setTimeout(() => {
        console.log('SyncfusionSpreadsheetComponent: Readonly mode - forcing data refresh');
        applyInitialGrid();
      }, 100);
    }
  };

  // capture cell edits
  const handleCellSave = (args) => {
    console.log('SyncfusionSpreadsheetComponent: Cell save event:', args);
    // args: { address: 'A1', value: 'newVal', element, oldValue, cancel }
    const { address, value: newVal, oldValue } = args;
    const { row, col } = parseAddress(address);
    
    // Enhanced logging for cell changes
    console.group(`📝 Cell Update: ${address}`);
    console.log('Old Value:', oldValue);
    console.log('New Value:', newVal);
    console.log('Position:', { row, col });
    
    // Get current cell style/format if available
    const ss = ssRef.current;
    if (ss && ss.getRange) {
      try {
        const range = ss.getRange(address);
        if (range) {
          console.log('Cell Style/Format:', {
            style: range.style,
            format: range.format,
            wrap: range.wrap
          });
        }
      } catch (error) {
        console.warn('Could not get cell range info:', error);
      }
    }
    console.groupEnd();
    
    setGrid((prev) => {
      const next = ensureSize2D(prev, row, col);
      next[row][col] = newVal ?? "";
      
      // Log updated grid after change
      console.log('🔄 Updated Grid State:', next);
      
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
      
      // Auto-log the JSON data when it changes
      console.group('📈 Auto-log: Data Changed');
      console.log('Updated SmartForm Value:', newValue);
      console.log('Updated SmartForm Value JSON:', JSON.stringify(newValue, null, 2));
      console.groupEnd();
      
      onChange(newValue);
    }, 250);
    return () => {
      if (changeTimer.current) clearTimeout(changeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid]);

  // Console log current spreadsheet data as JSON
  const consoleLogJsonData = async () => {
    console.log('🔍 SyncfusionSpreadsheetComponent: Getting JSON data...');
    const ss = ssRef.current;
    
    // Log the internal grid data (simplified format)
    console.group('📊 Spreadsheet Data - Internal Grid Format');
    console.log('Grid Data (2D Array):', grid);
    console.log('Grid JSON:', JSON.stringify(grid, null, 2));
    console.groupEnd();
    
    // Log the SmartForm compatible format
    const smartFormData = {
      sheets: [{
        data: grid,
        rows: grid.length,
        cols: grid[0]?.length || 0
      }]
    };
    console.group('📋 Spreadsheet Data - SmartForm Format');
    console.log('SmartForm Data:', smartFormData);
    console.log('SmartForm JSON:', JSON.stringify(smartFormData, null, 2));
    console.groupEnd();
    
    // If Syncfusion's saveAsJson method is available, get the full EJ2 format
    if (ss && ss.saveAsJson) {
      try {
        const fullJson = await ss.saveAsJson();
        console.group('🎨 Spreadsheet Data - Full EJ2 Format (with styles)');
        console.log('Full EJ2 JSON (includes styles, formatting, etc.):', fullJson);
        console.log('Full EJ2 JSON String:', JSON.stringify(fullJson, null, 2));
        
        // Extract and log cell data with styles
        if (fullJson.Workbook && fullJson.Workbook.sheets) {
          fullJson.Workbook.sheets.forEach((sheet, sheetIndex) => {
            console.group(`📄 Sheet ${sheetIndex + 1}: ${sheet.name || 'Unnamed'}`);
            
            if (sheet.rows) {
              console.log('Rows with data and styles:', sheet.rows);
              sheet.rows.forEach((row, rowIndex) => {
                if (row.cells && row.cells.some(cell => cell.value || cell.style)) {
                  console.group(`Row ${rowIndex + 1}`);
                  row.cells.forEach((cell, cellIndex) => {
                    if (cell.value || cell.style) {
                      const cellAddr = `${numToCol(cellIndex)}${rowIndex + 1}`;
                      console.log(`${cellAddr}:`, {
                        value: cell.value,
                        style: cell.style,
                        format: cell.format
                      });
                    }
                  });
                  console.groupEnd();
                }
              });
            }
            console.groupEnd();
          });
        }
        console.groupEnd();
      } catch (error) {
        console.error('Error getting full EJ2 JSON:', error);
      }
    }
  };

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

  // Save spreadsheet data to backend API (using /forms endpoint)
  const saveToBackend = async () => {
    console.log('💾 SyncfusionSpreadsheetComponent: Saving to backend...');
    const ss = ssRef.current;
    if (!ss || !ss.saveAsJson) {
      console.warn('SyncfusionSpreadsheetComponent: saveAsJson method not available');
      alert('❌ Cannot save - spreadsheet not ready');
      return;
    }
    
    try {
      // Force save any pending changes first
      if (ss.save) {
        await ss.save();
      }
      
      // Try to refresh the spreadsheet to ensure all styles are captured
      if (ss.refresh) {
        ss.refresh();
      }
      
      // Wait a moment for any async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the full EJ2 JSON using multiple methods to ensure styles are captured
      let ej2Json;
      
      // Method 1: Try saveAsJson (standard)
      ej2Json = await ss.saveAsJson();
      
      // Method 2: If styles are missing, try getting workbook data directly
      if (ss.workbook && (!ej2Json?.Workbook?.sheets?.[0]?.rows || 
          !ej2Json.Workbook.sheets[0].rows.some(row => 
            row.cells && row.cells.some(cell => cell.style || cell.format)))) {
        
        console.log('🔍 Styles not found in saveAsJson, trying workbook data...');
        
        // Try to get data from workbook directly
        const workbookData = ss.workbook;
        if (workbookData) {
          console.log('📊 Workbook data:', workbookData);
          
          // Create enhanced EJ2 JSON with workbook data
          ej2Json = {
            Workbook: {
              ...ej2Json?.Workbook,
              sheets: workbookData.sheets || ej2Json?.Workbook?.sheets
            }
          };
        }
      }
      
      // Method 3: Try to get styles from sheet data
      if (ss.sheets && ss.sheets.length > 0) {
        const sheet = ss.sheets[0];
        if (sheet && sheet.rows) {
          console.log('🎨 Found sheet with rows:', sheet.rows.length);
          console.log('📋 Sheet data:', sheet);
          
          // Enhance the EJ2 JSON with sheet data
          if (ej2Json?.Workbook?.sheets?.[0]) {
            ej2Json.Workbook.sheets[0] = {
              ...ej2Json.Workbook.sheets[0],
              rows: sheet.rows,
              columns: sheet.columns
            };
          }
        }
      }
      
      // Log detailed information about what we captured
      console.log('🎨 Captured EJ2 JSON:', ej2Json);
      if (ej2Json?.Workbook?.sheets?.[0]?.rows) {
        console.log('📊 Number of rows with data:', ej2Json.Workbook.sheets[0].rows.length);
        ej2Json.Workbook.sheets[0].rows.forEach((row, idx) => {
          if (row.cells && row.cells.some(cell => cell.style || cell.format)) {
            console.log(`🎨 Row ${idx} has styled cells:`, row.cells.filter(cell => cell.style || cell.format));
          }
        });
      }
      
      // Convert to internal format for compatibility  
      const internalData = convertEJ2ToInternalFormat(ej2Json);
      
      // Create a rich data object that includes BOTH formats
      const richData = {
        ...internalData,  // Keep the simple format for compatibility
        ej2Format: ej2Json,  // Add the full EJ2 format
        source: "SaveToField",
        timestamp: new Date().toISOString()
      };
      
      // Update the field's value with BOTH formats
      if (onChange) {
        console.log('🔄 Canvas: Updating field value with BOTH EJ2 and internal data');
        console.log('📊 EJ2 Format:', ej2Json);
        console.log('📋 Internal Format:', internalData);
        onChange(richData); // This will update the field.value with rich data
      }
      
      console.log('💾 Canvas: Spreadsheet data updated in field. Use main form Save button to persist to backend.');
      alert('✅ Spreadsheet data saved to field! Click the main "Save" button to save the entire form.');
      
    } catch (error) {
      console.error('❌ Canvas: Error saving spreadsheet data:', error);
      alert('❌ Failed to save spreadsheet data: ' + error.message);
    }
  };

  // Save spreadsheet data and auto-save form (combines both steps)
  const saveDirectlyToAPI = async () => {
    console.log('🚀 SyncfusionSpreadsheetComponent: Auto-saving to API...');
    const ss = ssRef.current;
    if (!ss || !ss.saveAsJson) {
      console.warn('SyncfusionSpreadsheetComponent: saveAsJson method not available');
      alert('❌ Cannot save - spreadsheet not ready');
      return;
    }
    
    try {
      // Force save any pending changes first
      if (ss.save) {
        await ss.save();
      }
      
      // Try to refresh the spreadsheet to ensure all styles are captured
      if (ss.refresh) {
        ss.refresh();
      }
      
      // Wait a moment for any async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 1: Get the full EJ2 JSON using multiple methods to ensure styles are captured
      let ej2Json;
      
      // Method 1: Try saveAsJson (standard)
      ej2Json = await ss.saveAsJson();
      
      // Method 2: If styles are missing, try getting workbook data directly
      if (ss.workbook && (!ej2Json?.Workbook?.sheets?.[0]?.rows || 
          !ej2Json.Workbook.sheets[0].rows.some(row => 
            row.cells && row.cells.some(cell => cell.style || cell.format)))) {
        
        console.log('🔍 Quick Save: Styles not found in saveAsJson, trying workbook data...');
        
        // Try to get data from workbook directly
        const workbookData = ss.workbook;
        if (workbookData) {
          console.log('📊 Quick Save: Workbook data:', workbookData);
          
          // Create enhanced EJ2 JSON with workbook data
          ej2Json = {
            Workbook: {
              ...ej2Json?.Workbook,
              sheets: workbookData.sheets || ej2Json?.Workbook?.sheets
            }
          };
        }
      }
      
      // Method 3: Try to get styles from sheet data
      if (ss.sheets && ss.sheets.length > 0) {
        const sheet = ss.sheets[0];
        if (sheet && sheet.rows) {
          console.log('🎨 Quick Save: Found sheet with rows:', sheet.rows.length);
          console.log('📋 Quick Save: Sheet data:', sheet);
          
          // Enhance the EJ2 JSON with sheet data
          if (ej2Json?.Workbook?.sheets?.[0]) {
            ej2Json.Workbook.sheets[0] = {
              ...ej2Json.Workbook.sheets[0],
              rows: sheet.rows,
              columns: sheet.columns
            };
          }
        }
      }
      
      // Log detailed information about what we captured
      console.log('🎨 Quick Save - Captured EJ2 JSON:', ej2Json);
      if (ej2Json?.Workbook?.sheets?.[0]?.rows) {
        console.log('📊 Number of rows with data:', ej2Json.Workbook.sheets[0].rows.length);
        ej2Json.Workbook.sheets[0].rows.forEach((row, idx) => {
          if (row.cells && row.cells.some(cell => cell.style || cell.format)) {
            console.log(`🎨 Row ${idx} has styled cells:`, row.cells.filter(cell => cell.style || cell.format));
          }
        });
      }
      
      const internalData = convertEJ2ToInternalFormat(ej2Json);
      
      // Create a rich data object that includes BOTH formats
      const richData = {
        ...internalData,  // Keep the simple format for compatibility
        ej2Format: ej2Json,  // Add the full EJ2 format
        source: "QuickSave",
        timestamp: new Date().toISOString()
      };
      
      // Update the field's value with BOTH formats
      if (onChange) {
        console.log('🔄 Canvas: Updating field value with BOTH EJ2 and internal data');
        console.log('📊 EJ2 Format:', ej2Json);
        console.log('📋 Internal Format:', internalData);
        onChange(richData);
      }
      
      // Step 2: Notify user to use main save button
      console.log('✅ Canvas: Spreadsheet data saved to field with full EJ2 format');
      alert('✅ Spreadsheet data saved to field with full EJ2 format! Now click the main "Save Changes" button to save to API.');
      
      // Optional: Try to find and highlight the main save button
      const saveButton = document.querySelector('.save-btn');
      if (saveButton && saveButton.textContent.includes('Save')) {
        saveButton.style.animation = 'pulse 2s infinite';
        saveButton.style.boxShadow = '0 0 10px #dc2626';
        setTimeout(() => {
          saveButton.style.animation = '';
          saveButton.style.boxShadow = '';
        }, 3000);
      }
      
    } catch (error) {
      console.error('❌ Canvas: Error saving spreadsheet data:', error);
      alert('❌ Failed to save spreadsheet data: ' + error.message);
    }
  };

  // Helper function to convert EJ2 to internal format
  const convertEJ2ToInternalFormat = (ej2Json) => {
    try {
      if (!ej2Json?.Workbook?.sheets?.[0]) {
        return { sheets: [{ data: [], rows: 15, cols: 8 }] };
      }
      
      const sheet = ej2Json.Workbook.sheets[0];
      const data = [];
      
      // Initialize empty grid
      for (let r = 0; r < (sheet.rowCount || 100); r++) {
        data[r] = new Array(sheet.colCount || 100).fill('');
      }
      
      // Fill with actual data from EJ2 format
      if (sheet.rows) {
        sheet.rows.forEach((row, rowIndex) => {
          if (row.cells) {
            row.cells.forEach((cell, cellIndex) => {
              if (cell.value !== undefined && data[rowIndex]) {
                data[rowIndex][cellIndex] = String(cell.value);
              }
            });
          }
        });
      }
      
      return {
        sheets: [{
          data: data,
          rows: data.length,
          cols: data[0]?.length || 8
        }]
      };
    } catch (error) {
      console.error('Error converting EJ2 to internal format:', error);
      return { sheets: [{ data: [], rows: 15, cols: 8 }] };
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
              onClick={consoleLogJsonData}
              style={{...btnStyle(), background: "#059669", borderColor: "#059669"}}
              title="Console log all spreadsheet data in JSON format"
            >
              Console JSON
            </button>
            {!readOnly && (
              <>
                <button
                  type="button"
                  onClick={saveToBackend}
                  style={{...btnStyle(), background: "#dc2626", borderColor: "#dc2626"}}
                  title="Save spreadsheet data to field (then use main Save button)"
                >
                  💾 Save to Field
                </button>
                <button
                  type="button"
                  onClick={saveDirectlyToAPI}
                  style={{...btnStyle(), background: "#7c3aed", borderColor: "#7c3aed"}}
                  title="Save spreadsheet data to field and highlight main save button"
                >
                  🚀 Quick Save
                </button>
                <button
                  type="button"
                  onClick={saveAsJson}
                  style={btnStyle()}
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
              </>
            )}
            {readOnly && (
              <div style={{
                padding: "6px 10px",
                fontSize: "12px",
                color: "#6b7280",
                fontStyle: "italic"
              }}>
                Read-only mode
              </div>
            )}
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
