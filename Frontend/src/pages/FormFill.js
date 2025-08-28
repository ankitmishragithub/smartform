import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../css/FormFill.css"; //
import "../css/Livepreview.css";
import JSpreadsheetComponent from "../components/JSpreadsheetComponent";
import JSpreadsheetCE4Component from "../components/JSpreadsheetCE4Component";
import { useAuth } from "../contexts/AuthContext";
  
// Spreadsheet component for form fill
function SpreadsheetFormFillComponent({ field, value, onChange }) {
  const [editableData, setEditableData] = useState({});
  const { user } = useAuth();
  const [editableCells, setEditableCells] = useState(new Set());
  const [currentActiveSheet, setCurrentActiveSheet] = useState(0);
  const [addedRows, setAddedRows] = useState(new Set());
  const [addedColumns, setAddedColumns] = useState(new Set());
  // Track which columns (per sheet) have been stamped once
  const stampedColumnsRef = useRef(new Set()); // keys like `${sheetIndex}:${colIndex}`
  // Track a single audit row per sheet; reuse it for all stamps
  const auditRowIndexRef = useRef(new Map()); // sheetIndex -> rowIndex
  
  // Initialize editable data when component mounts or field changes
  useEffect(() => {
    const sheets = field.sheets || [];
    console.log("sheets: ",sheets)
    const currentSheet = sheets[currentActiveSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };
    
    const newEditableData = {};
    const editableCells = new Set(); // Track which cells are editable
    
    // First, identify time columns
    const timeColumns = new Set();
    
    if (currentSheet.data && currentSheet.data[0]) {
      for (let colIndex = 0; colIndex < currentSheet.data[0].length; colIndex++) {
        let headerContent = '';
        // Check all rows for time detection
        for (let checkRow = 0; checkRow < currentSheet.data.length; checkRow++) {
          const checkCell = currentSheet.data[checkRow] && currentSheet.data[checkRow][colIndex];
          if (checkCell) {
            const cellContent = typeof checkCell === 'object' ? (checkCell.content || '') : checkCell;
            if (cellContent && cellContent.trim() !== '') {
              headerContent = cellContent;
              break;
            }
          }
        }
        
        const hasTime = headerContent.toLowerCase().includes('time');
        const hasTimedot = headerContent.toLowerCase().includes('time.');
        const isTimeColumn = hasTime || hasTimedot;
        
        if (isTimeColumn) {
          timeColumns.add(colIndex);
        }
      }
    }
    
    if (currentSheet.data) {
      currentSheet.data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const cellKey = `${rowIndex}-${colIndex}`;
          // Get cell content, handling both string and object formats
          let content = '';
          if (typeof cell === 'object' && cell !== null) {
            content = cell.content || '';
          } else {
            content = cell || '';
          }
          
          // For time columns: make first data row (row 1) non-editable, others editable if empty
          const isTimeColumn = timeColumns.has(colIndex);
          const isFirstDataRow = rowIndex === 1;
          
          if (isTimeColumn && isFirstDataRow) {
            // First row below time header - not editable, reserved for time display
            newEditableData[cellKey] = content || '';
            // Don't add to editableCells - this makes it non-editable
          } else {
            // Normal logic: Only empty cells are editable
            if (!content || content.trim() === '') {
              newEditableData[cellKey] = '';
              editableCells.add(cellKey);
            }
          }
        });
      });
    }
    setEditableData(newEditableData);
    // Store editable cells info for quick lookup
    setEditableCells(editableCells);
  }, [field, currentActiveSheet]);

  const handleCellChange = (rowIndex, colIndex, newValue) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    
    const sheets = field.sheets || [];
    const currentSheet = sheets[currentActiveSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };
    
    // Check if current column is a time column and auto-capture time in first row
    let headerContent = '';
    const maxRowsToCheck = Math.min(3, currentSheet.data?.length || 0);
    
    for (let checkRow = 0; checkRow < maxRowsToCheck; checkRow++) {
      const checkCell = currentSheet.data && currentSheet.data[checkRow] && currentSheet.data[checkRow][colIndex];
      if (checkCell) {
        const cellContent = typeof checkCell === 'object' ? (checkCell.content || '') : checkCell;
        if (cellContent && cellContent.trim() !== '') {
          headerContent = cellContent;
          break;
        }
      }
    }
    
    const hasTime = headerContent.toLowerCase().includes('time');
    const hasTimedot = headerContent.toLowerCase().includes('time.');
    const isTimeColumn = hasTime || hasTimedot;
    const isFirstDataRow = rowIndex === 1;
    
    // Prepare updates
    const updates = { [cellKey]: newValue };
    
    // If user entered data in a time column (but not in first row), auto-capture current time in first row
    if (isTimeColumn && !isFirstDataRow && newValue && newValue.trim() !== '') {
      const firstRowTimeKey = `1-${colIndex}`;
      const currentTimeValue = editableData[firstRowTimeKey] || '';
      
      // Only auto-timestamp if first row of time column is empty
      if (!currentTimeValue || currentTimeValue.trim() === '') {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { 
          hour12: false, // 24-hour format
          hour: '2-digit', 
          minute: '2-digit' 
        });
        updates[firstRowTimeKey] = currentTime;
      }
    }
    
    // Update local state immediately for responsive UI
    setEditableData(prev => ({
      ...prev,
      ...updates
    }));
    
    // Update the parent form value
    const updatedSheets = [...sheets];
    const activeSheet = updatedSheets[currentActiveSheet];
    
    if (activeSheet && activeSheet.data) {
      const updatedData = [...activeSheet.data];
      
      // Apply all updates (original cell + auto-timestamp if applicable)
      Object.entries(updates).forEach(([key, value]) => {
        const [updateRowIndex, updateColIndex] = key.split('-').map(Number);
        
        if (updatedData[updateRowIndex]) {
          updatedData[updateRowIndex] = [...updatedData[updateRowIndex]];
          // Update cell content, preserving formatting if it exists
          if (typeof updatedData[updateRowIndex][updateColIndex] === 'object' && updatedData[updateRowIndex][updateColIndex] !== null) {
            updatedData[updateRowIndex][updateColIndex] = {
              ...updatedData[updateRowIndex][updateColIndex],
              content: value
            };
          } else {
            updatedData[updateRowIndex][updateColIndex] = value;
          }
        }
      });
      
      activeSheet.data = updatedData;
      
      // Auto-audit logic: add audit column/row with user and timestamp when thresholds met
      try {
        const hasContent = (cell) => {
          if (typeof cell === 'object' && cell !== null) {
            const c = (cell.content || '').toString().trim();
            return c !== '';
          }
          const s = (cell ?? '').toString().trim();
          return s !== '';
        };

        const getCellString = (cell) => {
          if (typeof cell === 'object' && cell !== null) return (cell.content || '').toString();
          return (cell ?? '').toString();
        };

        const currentUserId = user?.id || user?.username || 'unknown';
        const stamp = `${currentUserId} - ${new Date().toLocaleString()}`;

        // Ensure headers array exists if present
        const headers = Array.isArray(activeSheet.headers) ? activeSheet.headers : null;

        // Helper to find or create an "Audit" column; returns its index
        const ensureAuditColumn = () => {
          let auditIndex = -1;
          if (headers) {
            auditIndex = headers.findIndex((h) => (h || '').toString().trim().toLowerCase() === 'audit');
          }
          const currentCols = updatedData[0]?.length || 0;
          if (auditIndex === -1) {
            // Create new audit column at the end
            auditIndex = currentCols;
            for (let r = 0; r < updatedData.length; r++) {
              const row = updatedData[r] || [];
              // Pad row to currentCols if needed
              while (row.length < currentCols) row.push('');
              row.push('');
              updatedData[r] = row;
            }
            if (headers) headers.push('Audit');
            activeSheet.cols = (updatedData[0]?.length || currentCols + 1);
          }
          return auditIndex;
        };

        // Helper to find a usable bottom row or create one; returns its index
        const ensureBottomRowForColumn = (targetCol) => {
          const colsLen = updatedData[0]?.length || 0;
          let lastIndex = updatedData.length - 1;
          if (lastIndex < 0) {
            // Create header row placeholder if sheet was empty
            updatedData.push(new Array(colsLen).fill(''));
            lastIndex = 0;
          }
          // Try to use last row if the target cell is empty (and not header row)
          if (lastIndex >= 1 && !hasContent(updatedData[lastIndex]?.[targetCol])) {
            return lastIndex;
          }
          // Otherwise append a new bottom row
          const newRow = new Array(colsLen).fill('');
          updatedData.push(newRow);
          activeSheet.rows = updatedData.length;
          return updatedData.length - 1;
        };

        // Helper: ensure a single audit row exists for this sheet and return its index
        const ensureAuditRow = () => {
          const colsLen = updatedData[0]?.length || (colIndex + 1);
          const existing = auditRowIndexRef.current.get(currentActiveSheet);
          if (typeof existing === 'number' && existing >= 0 && existing < updatedData.length) {
            return existing;
          }
          const newRow = new Array(colsLen).fill('');
          updatedData.push(newRow);
          const idx = updatedData.length - 1;
          auditRowIndexRef.current.set(currentActiveSheet, idx);
          activeSheet.rows = updatedData.length;
          return idx;
        };

        // 1) Row rule: when a data row reaches exactly 2 filled cells, stamp the same row in a single audit column (right side)
        if (rowIndex >= 1) {
          const rowCells = updatedData[rowIndex] || [];
          let filledInRow = 0;
          for (let c = 0; c < rowCells.length; c++) {
            if (hasContent(rowCells[c])) filledInRow++;
          }
          if (filledInRow === 2) {
            const auditColIdx = ensureAuditColumn();
            updatedData[rowIndex][auditColIdx] = stamp;
          }
        }

        // 2) Column rule: when a column reaches 3 or more filled cells (in data rows), append ONE new bottom row
        // and stamp that new row's cell in this column with admin + timestamp (only once per column)
        {
          let filledInColumn = 0;
          const totalRows = updatedData.length;
          for (let r = 1; r < totalRows; r++) {
            if (hasContent(updatedData[r]?.[colIndex])) filledInColumn++;
          }
          const stampKey = `${currentActiveSheet}:${colIndex}`;
          if (filledInColumn >= 3 && !stampedColumnsRef.current.has(stampKey)) {
            const auditRowIdx = ensureAuditRow();
            const currentCell = updatedData[auditRowIdx][colIndex];
            if (!hasContent(currentCell)) {
              if (typeof currentCell === 'object' && currentCell !== null) {
                updatedData[auditRowIdx][colIndex] = { ...currentCell, content: stamp };
              } else {
                updatedData[auditRowIdx][colIndex] = stamp;
              }
            }
            stampedColumnsRef.current.add(stampKey);
          }
        }
      } catch (e) {
        // Fail-safe: do not block user input on audit logic errors
        // console.warn('Audit logic error:', e);
      }

      // Assign possibly-augmented data back to sheet
      activeSheet.data = updatedData;
      updatedSheets[currentActiveSheet] = activeSheet;
      
      // Update the field data
      const updatedField = {
        ...field,
        sheets: updatedSheets
      };
      
      onChange(updatedField);
    }
  };

  // Function to autofill current time (only for Time columns)
  const handleAutofillTime = (rowIndex, colIndex, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, // 24-hour format
      hour: '2-digit', 
      minute: '2-digit',
      second :'2-digit'
    });
    
    handleCellChange(rowIndex, colIndex, currentTime);
  };

  const handleCellKeyDown = (e, rowIndex, colIndex) => {
    const sheets = field.sheets || [];
    const currentSheet = sheets[currentActiveSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };
    
    // Check if this is a Time column for Ctrl+T shortcut (check multiple rows for headers)
    let headerContent = '';
    const maxRowsToCheck = Math.min(3, currentSheet.data?.length || 0); // Check first 3 rows
    
    for (let checkRow = 0; checkRow < maxRowsToCheck; checkRow++) {
      const checkCell = currentSheet.data && currentSheet.data[checkRow] && currentSheet.data[checkRow][colIndex];
      if (checkCell) {
        const cellContent = typeof checkCell === 'object' ? (checkCell.content || '') : checkCell;
        if (cellContent && cellContent.trim() !== '') {
          headerContent = cellContent;
          break; // Found non-empty content, use it as header
        }
      }
    }
    const hasTime = headerContent.toLowerCase().includes('time');
    const isTimeColumn = hasTime;
    const isFirstDataRow = rowIndex === 1; // Only show for row immediately below header
    
    // For "time" only columns: restrict to first data row
    // For "start"/"end" columns: allow entire column
    const shouldShowTimeButton = isTimeColumn && ( isFirstDataRow);
    
    // Ctrl+T to autofill current time
    if (shouldShowTimeButton && e.ctrlKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      handleAutofillTime(rowIndex, colIndex, e);
      return;
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextCol = colIndex + 1;
      const nextRow = rowIndex + 1;
      
      if (nextCol < (currentSheet.headers?.length || 0)) {
        const nextCellKey = `${rowIndex}-${nextCol}`;
        const nextInput = document.querySelector(`input[data-cell="${nextCellKey}"]`);
        if (nextInput) {
          nextInput.focus();
        }
      } else if (nextRow < (currentSheet.data?.length || 0)) {
        const nextCellKey = `${nextRow}-0`;
        const nextInput = document.querySelector(`input[data-cell="${nextCellKey}"]`);
        if (nextInput) {
          nextInput.focus();
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const nextCol = colIndex + 1;
      if (nextCol < (currentSheet.headers?.length || 0)) {
        const nextCellKey = `${rowIndex}-${nextCol}`;
        const nextInput = document.querySelector(`input[data-cell="${nextCellKey}"]`);
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  };

  const handleCellClick = (e) => {
    // Don't select all text on click, just focus
    e.target.focus();
  };

  const addRow = () => {
    const sheets = field.sheets || [];
    const updatedSheets = [...sheets];
    const currentSheet = updatedSheets[currentActiveSheet];
    
    if (currentSheet && currentSheet.data) {
      const newRowIndex = currentSheet.data.length;
      const newRow = Array.from({ length: currentSheet.cols }, () => '');
      currentSheet.data.push(newRow);
      currentSheet.rows = currentSheet.data.length;
      
      // Track the newly added row
      setAddedRows(prev => new Set([...prev, newRowIndex]));
      
      // Update the field data
      const updatedField = {
        ...field,
        sheets: updatedSheets
      };
      
      onChange(updatedField);
      
      // Re-initialize editable data for the new row
      setTimeout(() => {
        const newEditableData = { ...editableData };
        const editableCells = new Set();
        
        currentSheet.data.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            let content = '';
            if (typeof cell === 'object' && cell !== null) {
              content = cell.content || '';
            } else {
              content = cell || '';
            }
            if (!content || content.trim() === '') {
              newEditableData[cellKey] = '';
              editableCells.add(cellKey);
            }
          });
        });
        setEditableData(newEditableData);
        setEditableCells(editableCells);
      }, 100);
    }
  };

  const addColumn = () => {
    const sheets = field.sheets || [];
    const updatedSheets = [...sheets];
    const currentSheet = updatedSheets[currentActiveSheet];
    
    if (currentSheet && currentSheet.data) {
      const newColumnIndex = currentSheet.data[0].length;
      
      // Add new column to each row
      currentSheet.data.forEach(row => {
        row.push('');
      });
      
      // Add new header
      if (currentSheet.headers) {
        currentSheet.headers.push(`Column ${currentSheet.headers.length + 1}`);
      }
      
      currentSheet.cols = currentSheet.data[0].length;
      
      // Track the newly added column
      setAddedColumns(prev => new Set([...prev, newColumnIndex]));
      
      // Update the field data
      const updatedField = {
        ...field,
        sheets: updatedSheets
      };
      
      onChange(updatedField);
      
      // Re-initialize editable data for the new column
      setTimeout(() => {
        const newEditableData = { ...editableData };
        const editableCells = new Set();
        
        currentSheet.data.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            let content = '';
            if (typeof cell === 'object' && cell !== null) {
              content = cell.content || '';
            } else {
              content = cell || '';
            }
            if (!content || content.trim() === '') {
              newEditableData[cellKey] = '';
              editableCells.add(cellKey);
            }
          });
        });
        setEditableData(newEditableData);
        setEditableCells(editableCells);
      }, 100);
    }
  };

  const deleteRow = (rowIndex) => {
    const sheets = field.sheets || [];
    const updatedSheets = [...sheets];
    const currentSheet = updatedSheets[currentActiveSheet];
    
    // Only allow deletion of newly added rows
    if (currentSheet && currentSheet.data && addedRows.has(rowIndex)) {
      // Remove the row
      currentSheet.data.splice(rowIndex, 1);
      currentSheet.rows = currentSheet.data.length;
      
      // Remove from added rows tracking
      setAddedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(rowIndex);
        // Adjust indices for rows after the deleted one
        const adjustedSet = new Set();
        newSet.forEach(index => {
          if (index > rowIndex) {
            adjustedSet.add(index - 1);
          } else {
            adjustedSet.add(index);
          }
        });
        return adjustedSet;
      });
      
      // Update the field data
      const updatedField = {
        ...field,
        sheets: updatedSheets
      };
      
      onChange(updatedField);
      
      // Re-initialize editable data
      setTimeout(() => {
        const newEditableData = {};
        const editableCells = new Set();
        
        currentSheet.data.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            let content = '';
            if (typeof cell === 'object' && cell !== null) {
              content = cell.content || '';
            } else {
              content = cell || '';
            }
            if (!content || content.trim() === '') {
              newEditableData[cellKey] = '';
              editableCells.add(cellKey);
            }
          });
        });
        setEditableData(newEditableData);
        setEditableCells(editableCells);
      }, 100);
    }
  };

  const deleteColumn = (colIndex) => {
    const sheets = field.sheets || [];
    const updatedSheets = [...sheets];
    const currentSheet = updatedSheets[currentActiveSheet];
    
    // Only allow deletion of newly added columns
    if (currentSheet && currentSheet.data && addedColumns.has(colIndex)) {
      // Remove the column from each row
      currentSheet.data.forEach(row => {
        row.splice(colIndex, 1);
      });
      
      // Remove the header
      if (currentSheet.headers) {
        currentSheet.headers.splice(colIndex, 1);
      }
      
      currentSheet.cols = currentSheet.data[0].length;
      
      // Remove from added columns tracking
      setAddedColumns(prev => {
        const newSet = new Set(prev);
        newSet.delete(colIndex);
        // Adjust indices for columns after the deleted one
        const adjustedSet = new Set();
        newSet.forEach(index => {
          if (index > colIndex) {
            adjustedSet.add(index - 1);
          } else {
            adjustedSet.add(index);
          }
        });
        return adjustedSet;
      });
      
      // Update the field data
      const updatedField = {
        ...field,
        sheets: updatedSheets
      };
      
      onChange(updatedField);
      
      // Re-initialize editable data
      setTimeout(() => {
        const newEditableData = {};
        const editableCells = new Set();
        
        currentSheet.data.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            let content = '';
            if (typeof cell === 'object' && cell !== null) {
              content = cell.content || '';
            } else {
              content = cell || '';
            }
            if (!content || content.trim() === '') {
              newEditableData[cellKey] = '';
              editableCells.add(cellKey);
            }
          });
        });
        setEditableData(newEditableData);
        setEditableCells(editableCells);
      }, 100);
    }
  };

  // Helper function to get cell display content and styles
  const getCellDisplay = (cell) => {
    if (typeof cell === 'object' && cell !== null) {
      return {
        content: cell.content || '',
        styles: cell.formatting || {}
      };
    }
    return {
      content: cell || '',
      styles: {}
    };
  };

  // Helper function to check if cell is merged
  const isCellMerged = (rowIndex, colIndex, mergedCells) => {
    return mergedCells?.some(merge => 
      merge.startRow <= rowIndex && 
      merge.endRow >= rowIndex && 
      merge.startCol <= colIndex && 
      merge.endCol >= colIndex
    ) || false;
  };

  // Helper function to get merge info
  const getMergeInfo = (rowIndex, colIndex, mergedCells) => {
    const merge = mergedCells?.find(merge => 
      merge.startRow <= rowIndex && 
      merge.endRow >= rowIndex && 
      merge.startCol <= colIndex && 
      merge.endCol >= colIndex
    );
    
    if (!merge) {
      return { isContinuation: false, rowSpan: 1, colSpan: 1 };
    }
    
    const isContinuation = rowIndex > merge.startRow || colIndex > merge.startCol;
    const rowSpan = merge.endRow - merge.startRow + 1;
    const colSpan = merge.endCol - merge.startCol + 1;
    
    return { isContinuation, rowSpan, colSpan };
  };

  const sheets = field.sheets || [];
  const currentSheet = sheets[currentActiveSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };

  if (sheets.length === 0) {
    return (
      <div style={{ 
        padding: "20px", 
        border: "1px solid #ddd", 
        borderRadius: "8px", 
        backgroundColor: "#f8f9fa",
        textAlign: "center",
        color: "#6c757d"
      }}>
        <p>No spreadsheet data available</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "1rem" }}>
      {/* Sheet Tabs */}
      {sheets.length > 1 && (
        <div style={{ 
          display: "flex", 
          borderBottom: "1px solid #e5e7eb", 
          marginBottom: "10px" 
        }}>
          {sheets.map((sheet, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentActiveSheet(index)}
              style={{
                padding: "8px 16px",
                border: "none",
                background: currentActiveSheet === index ? "#667eea" : "transparent",
                color: currentActiveSheet === index ? "white" : "#374151",
                cursor: "pointer",
                borderTopLeftRadius: "6px",
                borderTopRightRadius: "6px",
                fontSize: "14px",
                fontWeight: currentActiveSheet === index ? "600" : "400"
              }}
            >
              {sheet.name || `Sheet ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Add Row/Column Buttons - COMMENTED OUT FOR FORM FILL */}
      {/* 
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        marginBottom: "10px",
        justifyContent: "flex-end"
      }}>
        <button
          type="button"
          onClick={addRow}
          className="form-fill-spreadsheet-btn"
          style={{
            padding: "6px 12px",
            border: "1px solid #667eea",
            background: "#667eea",
            color: "white",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <span style={{ fontSize: "14px" }}>+</span>
          Add Row
        </button>
        <button
          type="button"
          onClick={addColumn}
          className="form-fill-spreadsheet-btn"
          style={{
            padding: "6px 12px",
            border: "1px solid #667eea",
            background: "#667eea",
            color: "white",
            borderRadius: "4px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <span style={{ fontSize: "14px" }}>+</span>
          Add Column
        </button>
      </div>
      */}

      {/* Spreadsheet Table */}
      <div className="form-fill-spreadsheet-scroll-container">
        <table className="form-fill-spreadsheet-table">
          {/* Headers - HIDDEN FOR FORM FILL */}
          {/* 
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th>
                #
              </th>
              {(currentSheet.headers || []).map((header, index) => (
                <th key={index}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{header || `Column ${index + 1}`}</span>
                      {addedColumns.has(index) && (
                        <button
                          type="button"
                          onClick={() => deleteColumn(index)}
                          className="form-fill-spreadsheet-delete-btn"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: "2px 4px",
                            borderRadius: "2px",
                            marginLeft: "4px"
                          }}
                          title="Delete Column"
                        >
                          ×
                        </button>
                      )}
                    </div>
                </th>
              ))}
            </tr>
          </thead>
          */}
          
          {/* Data Rows */}
          <tbody>
            {(currentSheet.data || []).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {/* Row Number - HIDDEN FOR FORM FILL */}
                {/* 
                <td>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{rowIndex + 1}</span>
                      {addedRows.has(rowIndex) && (
                        <button
                          type="button"
                          onClick={() => deleteRow(rowIndex)}
                          className="form-fill-spreadsheet-delete-btn"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "12px",
                            padding: "2px 4px",
                            borderRadius: "2px",
                            marginLeft: "4px"
                          }}
                          title="Delete Row"
                        >
                          ×
                        </button>
                      )}
                    </div>
                </td>
                */}
                {(row || []).map((cell, colIndex) => {
                  const mergeInfo = getMergeInfo(rowIndex, colIndex, currentSheet.mergedCells);
                  
                  // Skip rendering continuation cells in merged ranges
                  if (mergeInfo.isContinuation) {
                    return null;
                  }
                  
                  const { content, styles } = getCellDisplay(cell);
                  const isMerged = isCellMerged(rowIndex, colIndex, currentSheet.mergedCells);
                  const cellKey = `${rowIndex}-${colIndex}`;
                  const isEditable = editableCells.has(cellKey);

                  const displayValue = isEditable ? (editableData[cellKey] || '') : content;
                  
                  // Check if this column contains "Time" in the header (check multiple rows for headers)
                  const sheets = field.sheets || [];
                  const activeSheet = sheets[currentActiveSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };
                  
                  let headerContent = '';
                  const maxRowsToCheck = Math.min(3, activeSheet.data?.length || 0); // Check first 3 rows
                  
                  for (let checkRow = 0; checkRow < maxRowsToCheck; checkRow++) {
                    const checkCell = activeSheet.data && activeSheet.data[checkRow] && activeSheet.data[checkRow][colIndex];
                    if (checkCell) {
                      const cellContent = typeof checkCell === 'object' ? (checkCell.content || '') : checkCell;
                      if (cellContent && cellContent.trim() !== '') {
                        headerContent = cellContent;
                        break; // Found non-empty content, use it as header
                      }
                    }
                  }
                  const hasTime = headerContent.toLowerCase().includes('time');
                  const hasTimedot = headerContent.toLowerCase().includes('time.');

                  // const hasStart = headerContent.toLowerCase().includes('start');
                  // const hasEnd = headerContent.toLowerCase().includes('end');
                  const isTimeColumn = hasTime ||hasTimedot;
                  const isFirstDataRow = rowIndex === 1; // Only show for row immediately below header
                  
                  // For "time" only columns: restrict to first data row
                  // For "start"/"end" columns: allow entire column
                  const shouldShowTimeButton = isTimeColumn && ( isFirstDataRow || hasTimedot);
                  
                  return (
                    <td 
                      key={colIndex} 
                      rowSpan={mergeInfo.rowSpan || 1}
                      colSpan={mergeInfo.colSpan || 1}
                      style={{
                        backgroundColor: isMerged ? "rgba(102, 126, 234, 0.1)" : styles.backgroundColor || "transparent",
                        ...styles
                      }}
                    >
                      {isEditable ? (
                        shouldShowTimeButton ? (
                          <div style={{ position: "relative", width: "100%", height: "100%" }}>
                            <input
                              type="text"
                              value={displayValue}
                              onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
                              onClick={handleCellClick}
                              data-cell={`${rowIndex}-${colIndex}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                border: "none",
                                background: "transparent",
                                outline: "none",
                                fontSize: styles.fontSize || "14px",
                                fontFamily: styles.fontFamily || "inherit",
                                fontWeight: styles.fontWeight || "normal",
                                fontStyle: styles.fontStyle || "normal",
                                color: styles.color || "inherit",
                                textAlign: styles.textAlign || "left",
                                padding: "8px 28px 8px 8px",
                                margin: "0",
                                position: "absolute",
                                top: "0",
                                left: "0",
                                right: "0",
                                bottom: "0",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                zIndex: 10,
                                boxSizing: "border-box"
                              }}
                              className="form-fill-spreadsheet-input"
                            />
                            <button
                              type="button"
                              onClick={(e) => handleAutofillTime(rowIndex, colIndex, e)}
                              title="Insert current time"
                              style={{
                                position: "absolute",
                                right: "2px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "20px",
                                height: "20px",
                                border: "none",
                                background: "#6366f1",
                                color: "white",
                                borderRadius: "3px",
                                cursor: "pointer",
                                fontSize: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 20,
                                opacity: "0.8",
                                transition: "opacity 0.2s"
                              }}
                              onMouseEnter={(e) => e.target.style.opacity = "1"}
                              onMouseLeave={(e) => e.target.style.opacity = "0.8"}
                            >
                              🕐
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={displayValue}
                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
                            onClick={handleCellClick}
                            data-cell={`${rowIndex}-${colIndex}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              border: "none",
                              background: "transparent",
                              outline: "none",
                              fontSize: styles.fontSize || "14px",
                              fontFamily: styles.fontFamily || "inherit",
                              fontWeight: styles.fontWeight || "normal",
                              fontStyle: styles.fontStyle || "normal",
                              color: styles.color || "inherit",
                              textAlign: styles.textAlign || "left",
                              padding: "8px",
                              margin: "0",
                              position: "absolute",
                              top: "0",
                              left: "0",
                              right: "0",
                              bottom: "0",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              zIndex: 10,
                              boxSizing: "border-box"
                            }}
                            className="form-fill-spreadsheet-input"
                          />
                        )
                      ) : (
                        <span style={{ 
                          ...styles,
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {displayValue}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Separate component to handle tabs to avoid hooks issues and prevent page refresh
function TabsFormFillPageComponent({ node, renderFormNode }) {
  // Safety check for node structure
  if (!node || !node.tabs || !Array.isArray(node.tabs)) {
    console.error('TabsFormFillPageComponent: Invalid node structure', node);
    return <div>Error: Invalid tabs structure</div>;
  }

  const [activeTab, setActiveTab] = useState(() => {
    const initialTab = node.activeTab || 0;
    return Math.min(initialTab, node.tabs.length - 1);
  });
  
  const handleTabClick = (index, event) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveTab(index);
  };
  
  return (
    <div className="form-fill-tabs-container">
      {/* Modern Tab Headers */}
      <div className="form-fill-tabs-header">
        {node.tabs.map((tab, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => handleTabClick(index, e)}
            className={`form-fill-tab-button ${activeTab === index ? 'active' : ''}`}
          >
            {tab.name}
          </button>
        ))}
      </div>
      
      {/* Modern Tab Content */}
      <div className="form-fill-tab-content">
        {node.tabs[activeTab] && Array.isArray(node.tabs[activeTab].children) && node.tabs[activeTab].children.length > 0 ? (
          node.tabs[activeTab].children.map(child => renderFormNode(child))
        ) : (
          <div className="form-fill-tab-empty">
            <div className="form-fill-tab-empty-icon">📝</div>
            <p style={{ margin: 0, fontStyle: "italic" }}>
              This tab is empty
            </p>
            <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>
              No form fields available in this tab
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
import {
  Container,
  Spinner,
  Button,
  FormGroup,
  Label,
  Input,
  Card,
  CardBody
} from "reactstrap";

export default function FormFillPage(props) {
  // Accept id as a prop (for Tabs view)
  const params = useParams();
  const id = props.id || params.id;
  const navigate = useNavigate(); 
  const [responseId, setResponseId] = useState(props.responseId || null);

  // Defensive check for invalid id
  if (!id || id === 'undefined') {
    console.error('FormFillPage: Invalid form ID:', id);
    return <div style={{color: 'red', padding: 20}}>Invalid form ID</div>;
  }
  console.log('FormFillPage rendering for id:', id);

  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [formName, setFormName] = useState('');
  const [baseInit, setBaseInit] = useState(null);
  const [formLoaded, setFormLoaded] = useState(false);
    const { user } = useAuth();

     console.log("user:",user.username)
     console.log("emIL",user.email)


  useEffect(() => {
    // Parse responseId from query string if not passed via props
    let rid = props.responseId || responseId;
    if (!rid) {
      const qs = new URLSearchParams(window.location.search);
      rid = qs.get('responseId');
      if (rid) setResponseId(rid);
    }

    console.log("Form ID from URL:", id);
    api.get(`/forms/${id}`)
      .then((res) => {
        console.log("Full response:", res);
        const schema = res.data.schemaJson || [];
        console.log("Parsed schema:", schema);
        
        // Extract folder name from schema
        const getFolderNameFromSchema = (schemaJson) => {
          if (!Array.isArray(schemaJson)) return 'Default';
          const folderField = schemaJson.find(field => field.type === 'folderName');
          return folderField?.label || 'Default';
        };
        
        setFormName(getFolderNameFromSchema(schema));
        
        // Debug: Log field types to see what we're working with
        schema.forEach((field, index) => {
          console.log(`Field ${index}:`, {
            id: field.id,
            type: field.type,
            label: field.label,
            hasOptions: !!field.options,
            optionsCount: field.options?.length || 0
          });
        });
        
        setFields(schema);

        const init = {};
        schema.forEach((f) => {
          if (f.type === "checkbox") {
            init[f.id] = false;
          } else if (f.type === "spreadsheet") {
            init[f.id] = f; // original structure as default
          } else {
            init[f.id] = "";
          }
        });
        setBaseInit(init);
        setValues(init);
        setFormLoaded(true);
      })
      .catch((err) => console.error("API error:", err))
      .finally(() => setLoading(false));
  }, [id, props.responseId]);

  // Prefill with existing response answers once form is loaded and responseId is available
  useEffect(() => {
    const rid = props.responseId || responseId;
    if (!rid || !formLoaded || !baseInit) return;
    api.get(`/responses/${rid}`)
      .then((r) => {
        const resp = r.data || {};
        setSubmitterName(resp.submitterName || "");
        setSubmitterEmail(resp.submitterEmail || "");
        const merged = { ...baseInit };
        Object.keys(resp.answers || {}).forEach((key) => {
          merged[key] = resp.answers[key];
        });
        setValues(merged);
      })
      .catch((err) => {
        console.error('Failed to load existing response for edit:', err);
      });
  }, [props.responseId, responseId, formLoaded, baseInit]);

  const handleChange = (fid, val) => {
    setValues((v) => ({ ...v, [fid]: val }));
  };

  const handleSubmit = async () => {
    try {
      // Validate mandatory fields
      if (!user.username) {
        alert("Please enter your name");
        return;
      }
     
      if (!user.email) {
        alert("Please enter your email");
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // if (!emailRegex.test(submitterEmail)) {
      //   alert("Please enter a valid email address");
      //   return;
      // }

      // Validate required form fields
      const missingFields = fields
        .filter(f => f.required && f.type !== 'folderName')
        .filter(f => {
          const val = values[f.id];
          if (f.type === 'checkbox') return !val;
          if (f.type === 'spreadsheet') {
            // For spreadsheet, check if any editable cells have been filled
            if (!val || !val.sheets) return true;
            const hasContent = val.sheets.some(sheet => 
              sheet.data && sheet.data.some(row => 
                row && row.some(cell => {
                  if (typeof cell === 'object' && cell !== null) {
                    return cell.content && cell.content.trim() !== '';
                  }
                  return cell && cell.toString().trim() !== '';
                })
              )
            );
            return !hasContent;
          }
          return val === undefined || val === null || val === '';
        });
      if (missingFields.length > 0) {
        alert(
          'Please fill all required fields: ' +
          missingFields.map(f => f.label || f.id).join(', ')
        );
        return;
      }

      // Field-type-specific validation
      const invalidFields = fields.filter(f => {
        if (!f.required || f.type === 'folderName') return false;
        const val = values[f.id];
        if (f.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return !emailRegex.test(val);
        }
        if (f.type === 'url') {
          try {
            new URL(val);
            return false;
          } catch {
            return true;
          }
        }
        if (f.type === 'number') {
          return isNaN(val) || val === '';
        }
        if (f.type === 'phone' || f.type === 'phone Number') {
          // Simple phone validation: at least 7 digits
          return !/^\d{7,}$/.test(val.replace(/\D/g, ''));
        }
        return false;
      });
      if (invalidFields.length > 0) {
        alert(
          'Please enter valid values for: ' +
          invalidFields.map(f => f.label || f.id).join(', ')
        );
        return;
      }
      
      console.log(responseId ? 'Updating submission:' : 'Submitting form:', { form: id, submitterName, submitterEmail });

      let resp;
      if (responseId) {
        // Update existing response
        resp = await api.put(`/responses/${responseId}`, {
          submitterName: user.username,
          submitterEmail: user.email,
          answers: values,
        });
      } else {
        // New submission
        resp = await api.post("/responses", { 
          form: id, 
          submitterName: user.username,
          submitterEmail: user.email,
          answers: values 
        });
        console.log(resp);
      }
      
      console.log('Submit response:', resp);
      
      alert(responseId ? "Form updated successfully!" : "Form submitted successfully!");
      
      // Navigate back to forms list after successful submission
      navigate(`${process.env.PUBLIC_URL}/forms/folders`);
    } catch (error) {
      console.error("Submit error:", error);
      alert("Submit failed. Please try again.");
    }
  };

  const renderInput = (f) => {
    const val = f.type === "checkbox" ? Boolean(values[f.id]) : values[f.id] || "";

    // Helper function to get option label
    const getOptionLabel = (option) => {
      return typeof option === "object" && option !== null ? option.question : option;
    };

    switch (f.type) {
      case "text":
      case "email":
      case "url":
      case "password":
        // soft limit: allow exceeding but warn
        const isTooLong = f.maxLength && (val || '').length > f.maxLength;

        return (
          <div style={{ position: 'relative' }}>
            <input
              id={`field-${f.id}`}
              type={f.type}
              className="form-control form-control-sm"
              placeholder={f.placeholder}
              required={f.required}
              value={val}
              onChange={e => handleChange(f.id, e.target.value)}
              aria-invalid={isTooLong}
              aria-describedby={isTooLong ? `${f.id}-warn` : undefined}
              style={{
                borderColor: isTooLong ? '#dc3545' : undefined,
                backgroundColor: isTooLong ? '#fff5f5' : undefined
              }}
            />
            {f.maxLength && (
              <div style={{ fontSize: '0.65em', marginTop: 4 }}>
                {(val || '').length}/{f.maxLength}
                {isTooLong && <span style={{ color: '#dc3545' }}> — exceeds limit</span>}
              </div>
            )}
          </div>
        );
      case "number":
        return (
          <input
            id={`field-${f.id}`}
            type="number"
            className="form-control form-control-sm"
            placeholder={f.placeholder}
            min={f.min}
            max={f.max}
            step={f.step}
            required={f.required}
            value={val}
            onKeyPress={e => {
              // Prevent non-numeric input
              const allowedChars = /[0-9\-\.]/;
              if (!allowedChars.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={e => {
              const newValue = e.target.value;
              const numValue = parseFloat(newValue);
              
              // Always allow the change, but show warning if outside range
              handleChange(f.id, newValue);
            }}
            style={{
              borderColor: (() => {
                if (val === '') return undefined;
                const numValue = parseFloat(val);
                if (isNaN(numValue)) return undefined;
                if (f.min !== undefined && numValue < f.min) return '#dc3545';
                if (f.max !== undefined && numValue > f.max) return '#dc3545';
                return undefined;
              })(),
              backgroundColor: (() => {
                if (val === '') return undefined;
                const numValue = parseFloat(val);
                if (isNaN(numValue)) return undefined;
                if (f.min !== undefined && numValue < f.min) return '#fff5f5';
                if (f.max !== undefined && numValue > f.max) return '#fff5f5';
                return undefined;
              })()
            }}
          />
        );



      case "password":
        return (
          <Input
            className="form-fill-input"
            type="password"
            placeholder={f.placeholder}
            pattern={f.pattern}
            minLength={f.minLength}
            value={val}
            onChange={(e) => handleChange(f.id, e.target.value)}
            required={f.required}
          />
        );
      case "textarea":
        // soft limit: allow exceeding but warn
        const isTextareaTooLong = f.maxLength && (val || '').length > f.maxLength;

        return (
          <div style={{ position: 'relative' }}>
            <Input
              className="form-fill-textarea"
              type="textarea"
              rows={f.rows || "3"}
              placeholder={f.placeholder}
              value={val}
              onChange={(e) => handleChange(f.id, e.target.value)}
              aria-invalid={isTextareaTooLong}
              aria-describedby={isTextareaTooLong ? `${id}-warn` : undefined}
              style={{
                borderColor: isTextareaTooLong ? '#dc3545' : undefined,
                backgroundColor: isTextareaTooLong ? '#fff5f5' : undefined
              }}
              required={f.required}
            />
            {f.maxLength && (
              <div style={{ fontSize: '0.65em', marginTop: 4 }}>
                {(val || '').length}/{f.maxLength}
                {isTextareaTooLong && <span style={{ color: '#dc3545' }}> — exceeds limit</span>}
              </div>
            )}

          </div>
        );
      case "select":
        return (
          <Input
            className="form-fill-select"
            type="select"
            value={val}
            onChange={(e) => handleChange(f.id, e.target.value)}
            required={f.required}
          >
            <option value="" disabled>
              Choose…
            </option>
            {(f.options || []).map((o, i) => {
              const label = getOptionLabel(o);
              return (
                <option key={i} value={label}>
                  {label}
                </option>
              );
            })}
          </Input>
        );
      case "checkbox":
        return (
          <FormGroup className="form-fill-check" check>
            <Label check>
              <Input
                type="checkbox"
                checked={val}
                onChange={(e) => handleChange(f.id, e.target.checked)}
              />{" "}
              {f.label}
            </Label>
          </FormGroup>
        );
      case "radio":
        return (
          <div>
            {(f.options || []).map((o, i) => {
              const label = getOptionLabel(o);
              return (
                <FormGroup className="form-fill-check" check key={i}>
                  <Label check>
                    <Input
                      type="radio"
                      name={f.id}
                      value={label}
                      checked={val === label}
                      onChange={(e) => handleChange(f.id, e.target.value)}
                    />{" "}
                    {label}
                  </Label>
                </FormGroup>
              );
            })}
          </div>
        );
      case "selectboxes": {
        const selectedValues = Array.isArray(val) ? val : [];
        return (
          <div>
            {(f.options || []).map((o, i) => {
              const label = getOptionLabel(o);
              return (
                <FormGroup className="form-fill-check" check key={i}>
                  <Label check>
                    <Input
                      type="checkbox"
                      checked={selectedValues.includes(label)}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...selectedValues, label]
                          : selectedValues.filter(v => v !== label);
                        handleChange(f.id, newValues);
                      }}
                    />{" "}
                    {label}
                  </Label>
                </FormGroup>
              );
            })}
          </div>
        );
      }
      case "phone":
      case "phone Number":
        return (
          <Input
            className="form-fill-input"
            type="tel"
            placeholder={f.placeholder || "Enter phone number"}
            maxLength={f.maxLength}
            value={val}
            onChange={(e) => {
              // Only allow numbers, spaces, dashes, parentheses, and plus sign
              let phoneValue = e.target.value.replace(/[^0-9\s\-\(\)\+]/g, '');
              
              // Always allow the change, but show warning if exceeding maxLength
              handleChange(f.id, phoneValue);
            }}
            style={{
              borderColor: f.maxLength && (val || "").length > f.maxLength ? '#dc3545' : undefined,
              backgroundColor: f.maxLength && (val || "").length > f.maxLength ? '#fff5f5' : undefined
            }}
            onKeyPress={(e) => {
              // Prevent non-numeric characters (except allowed symbols)
              const allowedChars = /[0-9\s\-\(\)\+]/;
              if (!allowedChars.test(e.key)) {
                e.preventDefault();
                return;
              }
              
              // Prevent exceeding maxLength
              if (f.maxLength && (val || "").length >= f.maxLength) {
                const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                }
              }
            }}
            required={f.required}
          />
        );
      case "tags":
        return (
          <Input
            className="form-fill-input"
            type="text"
            placeholder={f.placeholder || "tag1, tag2, ..."}
            value={val}
            onChange={(e) => handleChange(f.id, e.target.value)}
            required={f.required}
          />
        );
      case "address":
        return (
          <Input
            className="form-fill-textarea"
            type="textarea"
            rows="3"
            placeholder={f.placeholder || "Enter address"}
            value={val}
            onChange={(e) => handleChange(f.id, e.target.value)}
            required={f.required}
          />
        );
      case "datetime":
        return (
          <Input
            className="form-fill-input"
            type="date"
            value={val || f.value || (() => {
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })()}
            onChange={(e) => handleChange(f.id, e.target.value)}
            required={f.required}
          />
        );
      case "day": {
        const weekdays = [
          "Sunday", "Monday", "Tuesday", "Wednesday", 
          "Thursday", "Friday", "Saturday"
        ];
        const currentDay = weekdays[new Date().getDay()];
        return (
          <Input
            className="form-fill-select"
            type="select"
            value={val || f.value || currentDay}
            onChange={(e) => handleChange(f.id, e.target.value)}
            required={f.required}
          >
            <option value="" disabled>Choose a day…</option>
            {weekdays.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Input>
        );
      }
      case "time":
        return (
          <Input
            className="form-fill-input"
            type="time"
            value={val || f.value || new Date().toTimeString().slice(0, 5)}
            onChange={(e) => handleChange(f.id, e.target.value)}
            required={f.required}
          />
        );
      case "currency":
        return (
          <div className="form-fill-currency-wrapper">
            <span className="form-fill-currency-symbol">
              $
            </span>
            <Input
              className="form-fill-input form-fill-currency-input"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={val}
              onChange={(e) => handleChange(f.id, e.target.value)}
              required={f.required}
            />
          </div>
        );
      case "file":
        return (
          <Input
            className="form-fill-input"
            type="file"
            onChange={(e) => handleChange(f.id, e.target.files[0])}
            required={f.required}
          />
        );
      case "signature":
        return (
          <Input
            className="form-fill-input"
            type="text"
            placeholder="Type your signature here..."
            value={val}
            onChange={(e) => handleChange(f.id, e.target.value)}
            required={f.required}
            style={{
              fontFamily: 'cursive, serif',
              fontSize: '16px',
              borderBottom: '2px solid #000',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderRadius: '0',
              padding: '10px 0',
              backgroundColor: 'transparent'
            }}
          />
        );
      case "well":
        return (
          <div
            className="form-fill-well"
            style={{
              padding: "1rem",
              border: "1px solid #ddd",
              borderRadius: "8px",
              marginBottom: "1rem",
              backgroundColor: "#f8f9fa"
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              {f.label || "Content Box"}
            </div>
            <div style={{ color: "#6c757d", fontStyle: "italic" }}>
              Content area - drag fields here
            </div>
          </div>
        );
      case "content":
        return (
          <div
            className="form-fill-content"
            style={{
              padding: "1rem",
              border: "1px solid #e9ecef",
              borderRadius: "4px",
              backgroundColor: "#fff",
              minHeight: "100px"
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem", color: "#495057" }}>
              {f.label || "Content Box"}
            </div>
            <div 
              dangerouslySetInnerHTML={{ 
                __html: f.richText || '<p>Enter your formatted content here...</p>' 
              }}
              style={{ 
                color: "#495057",
                lineHeight: "1.6"
              }}
            />
          </div>
        );
      case "htmlelement":
        return (
          <div
            className="form-fill-html-element"
            dangerouslySetInnerHTML={{ __html: f.rawHTML || f.rawhtml || '<div>Custom HTML Content</div>' }}
          />
        );
      case "content":
        return (
          <div
            className="form-fill-content"
            dangerouslySetInnerHTML={{ __html: f.richText || f.richtext || '<p>Content block</p>' }}
          />
        );

      case "spreadsheet":
        return <SpreadsheetFormFillComponent field={f} value={val} onChange={(val) => handleChange(f.id, val)} />;
      case "jspreadsheet":
        return (
          <JSpreadsheetComponent 
            field={f} 
            value={val}
            onChange={(updatedField) => handleChange(f.id, updatedField)}
            isFormFill={true}
          />
        );
      case "jspreadsheetCE4":
      case "jspreadsheetce4":
        return (
          <JSpreadsheetCE4Component 
            field={f} 
            value={val}
            onChange={(updatedField) => handleChange(f.id, updatedField)}
            isFormFill={true}
          />
        );
      case "hidden":
        return (
          <Input
            type="hidden"
            value={val}
            onChange={(e) => handleChange(f.id, e.target.value)}
          />
        );
      default:
        return (
          <Input
            className="form-fill-input"
            type="text"
            placeholder={`${f.type} field - not fully supported`}
            value={val}
            onChange={(e) => handleChange(f.id, e.target.value)}
            style={{
              backgroundColor: '#f8f9fa',
              color: '#6c757d'
            }}
          />
        );
    }
  };

  const renderFormNode = (node) => {
    if (node.type === "heading") {
      return (
        <h2
          key={node.id}
          style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            fontWeight: "700",
            color: "#2c3e50"
          }}
        >
          {node.label || "Untitled Form"}
        </h2>
      );
    }
    
    if (node.type === "htmlelement") {
      return (
        <div
          key={node.id}
          dangerouslySetInnerHTML={{ __html: node.rawHTML || node.rawhtml || '<div>Custom HTML Content</div>' }}
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            marginBottom: '1rem'
          }}
        />
      );
    }

    if (node.type === "content") {
      return (
        <div
          key={node.id}
          data-type="content"
          dangerouslySetInnerHTML={{ __html: node.richText || node.richtext || '<p>Content block</p>' }}
          style={{
            padding: '10px',
            marginBottom: '0.5rem'
          }}
        />
      );
    }

    if (node.type === "well") {
      const styleObj = (node.style || "")
        .split(";")
        .filter(Boolean)
        .reduce((acc, decl) => {
          const [prop, val] = decl.split(":");
          if (!prop || !val) return acc;
          const key = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          acc[key] = val.trim();
          return acc;
        }, {});

      return (
        <div
          key={node.id}
          style={{
            padding: "1rem",
            border: "1px solid #ddd",
            borderRadius: "8px",
            marginBottom: "1rem",
            backgroundColor: "#f8f9fa",
            ...styleObj
          }}
        >
          {node.children?.map(child => renderFormNode(child))}
        </div>
      );
    }

    if (node.type === "panel") {
      return (
        <div key={node.id} className="form-fill-panel">
          {node.label && (
            <div className="form-fill-panel-header">
              {node.label}
            </div>
          )}
          <div className="form-fill-panel-body">
            {node.children?.map(child => renderFormNode(child))}
          </div>
        </div>
      );
    }

    if (node.type === "fieldset") {
      return (
        <fieldset key={node.id} className="form-fill-fieldset">
          {node.label && (
            <legend>
              {node.label}
            </legend>
          )}
          {node.children?.map(child => renderFormNode(child))}
        </fieldset>
      );
    }

    if (node.type === "columns") {
      return (
        <div key={node.id} className="form-fill-columns">
          {node.children.map((colChildren, ci) => (
            <div key={ci} className="form-fill-column">
              {colChildren.map((child) => renderFormNode(child))}
            </div>
          ))}
        </div>
      );
    }
    
    if (node.type === "table") {
      return (
        <div
          key={node.id}
          className="form-fill-table"
          style={{ gridTemplateColumns: `repeat(${node.cols}, 1fr)` }}
        >
          {node.children.map((rowArr, r) =>
            rowArr.map((cellArr, c) => (
              <div
                key={`${node.id}-r${r}c${c}`}
                className="form-fill-table-cell"
              >
                {cellArr.map((child) => renderFormNode(child))}
              </div>
            ))
          )}
        </div>
      );
    }

    if (node.type === "tabs") {
      return <TabsFormFillPageComponent key={node.id} node={node} renderFormNode={renderFormNode} />;
    }

    // For container types that don't need special rendering
    if (["container", "datagrid", "editgrid", "datamap"].includes(node.type)) {
      return (
        <div key={node.id} style={{ marginBottom: "1rem" }}>
          {node.label && (
            <h6 style={{ marginBottom: "10px", color: "#495057" }}>
              {node.label}
            </h6>
          )}
          {node.children?.map(child => renderFormNode(child))}
        </div>
      );
    }

    // For nested form types
    if (["file"].includes(node.type)) {
      return (
        <div key={node.id} style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          marginBottom: "1rem",
          textAlign: "center"
        }}>
          <p style={{ color: "#6c757d", margin: "0" }}>
            {node.label || `${node.type} component`}
          </p>
        </div>
      );
    }



    // Default case: render as form field
    const fid = `field-${node.id}`;
    if (node.type === "checkbox") {
      return (
        <div key={node.id} className="form-group mb-3">
          {renderInput(node)}
        </div>
      );
    }
    if (node.type === "spreadsheet") {
      return (
        <div key={node.id} className="form-group mb-3">
          {renderInput(node)}

        </div>
      );
    }
    return (
      <div key={node.id} className="form-group mb-3">
        <label htmlFor={fid} className="form-label">
          {node.label}
          {node.required && <span className="text-danger"> *</span>}
        </label>
        {renderInput(node)}
      </div>
    );
  };

  return (
    <div className="preview-container">
      {loading ? (
        <div className="form-fill-loading">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="modal-content">
          <h5>{formName}</h5>
          <form>
            {/* Form Fields */}
            <div style={{ marginBottom: "20px" }}>
              {fields.filter(node => node.type !== 'folderName').map((node) => renderFormNode(node))}
            </div>

            {/* Action Buttons and Submitter Info */}
            <div className="form-fill-submitter-section">
              {/* <h6>Personal Information</h6>
              <FormGroup className="form-group mb-3">
                <Label>Name *</Label>
                <Input
                  className="form-control form-control-sm"
                  type="text"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </FormGroup>
              <FormGroup className="form-group mb-3">
                <Label>Email Address *</Label>
                <Input
                  className="form-control form-control-sm"
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </FormGroup> */}
              <div className="button-group"> 
                <button className="save-btn" onClick={handleSubmit} disabled={loading}>
                  Submit Form
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

