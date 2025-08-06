import React, { useEffect, useState, useRef, useCallback } from 'react';

// Dropdown Options Modal Component
const DropdownModal = ({ data, onSave, onCancel }) => {
  const [options, setOptions] = useState(data?.existingOptions || ['']);
  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = () => {
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length > 0) {
      onSave(validOptions);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        minWidth: '400px',
        maxWidth: '500px',
        maxHeight: '70vh',
        overflowY: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
          📋 Configure Dropdown Options
        </h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            Dropdown Options:
          </label>
          
          {options.map((option, index) => (
            <div key={index} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder={`Option ${index + 1}`}
              />
              <button
                onClick={() => removeOption(index)}
                style={{
                  marginLeft: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex' }}>
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addOption()}
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              placeholder="Add new option..."
            />
            <button
              onClick={addOption}
              style={{
                marginLeft: '8px',
                padding: '8px 15px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ➕ Add
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💾 Save Dropdown
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced jSpreadsheet Component based on StackBlitz React patterns
const JSpreadsheetComponent = ({ field, value, onChange, isFormFill = false }) => {
  const [data, setData] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [cellStyles, setCellStyles] = useState({});
  const [mergedCells, setMergedCells] = useState({});
  const [cellTypes, setCellTypes] = useState({}); // New: track cell types (text, dropdown, etc.)
  const [cellDropdowns, setCellDropdowns] = useState({}); // New: dropdown options for cells
  const [dragStart, setDragStart] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [fillHandle, setFillHandle] = useState(null); // Fill handle state
  const [isFillDragging, setIsFillDragging] = useState(false);
  const [showDropdownModal, setShowDropdownModal] = useState(false);
  const [dropdownModalData, setDropdownModalData] = useState(null);
  const [copiedRange, setCopiedRange] = useState(null); // Track copied cells for visual feedback
  const [copiedCell, setCopiedCell] = useState(null); // Track copied single cell
  const [columnWidths, setColumnWidths] = useState({}); // Track custom column widths
  const [rowHeights, setRowHeights] = useState({}); // Track custom row heights
  const tableRef = useRef(null);
  const spreadsheetRef = useRef(null);

  // Initialize data based on field configuration
  useEffect(() => {
    const rows = field?.defaultRows || 3;
    const cols = field?.defaultCols || 4;
    
    // In form fill mode, use the value prop for data, otherwise use field data
    let initialData;
    if (isFormFill && value) {
      initialData = value.data || value || [];
    } else if (field?.data && field.data.length > 0) {
      initialData = field.data;
    } else {
      // Create initial data array if not provided
      initialData = [];
      for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
          row.push('');
        }
        initialData.push(row);
      }
    }
    
    setData(initialData);
    // Initialize history
    setHistory([initialData]);
    setHistoryStep(0);

    // Initialize styles, merged cells, cell types, dropdowns, and dimensions if provided
    if (field?.cellStyles) setCellStyles(field.cellStyles);
    if (field?.mergedCells) setMergedCells(field.mergedCells);
    if (field?.cellTypes) setCellTypes(field.cellTypes);
    if (field?.cellDropdowns) setCellDropdowns(field.cellDropdowns);
    if (field?.columnWidths) setColumnWidths(field.columnWidths);
    if (field?.rowHeights) setRowHeights(field.rowHeights);
    if (field?.readOnly) setIsReadOnly(field.readOnly);
  }, [field, value, isFormFill]);

  // Add to history for undo/redo
  const addToHistory = useCallback((newData) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newData);
    if (newHistory.length > 50) { // Limit history to 50 steps
      newHistory.shift();
    } else {
      setHistoryStep(historyStep + 1);
    }
    setHistory(newHistory);
  }, [history, historyStep]);

  // Undo function
  const undo = useCallback(() => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setData(history[newStep]);
      updateField({ data: history[newStep] });
    }
  }, [historyStep, history]);

  // Redo function
  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setData(history[newStep]);
      updateField({ data: history[newStep] });
    }
  }, [historyStep, history]);

  // Enhanced keyboard shortcuts and mouse events
  useEffect(() => {
    const handleKeyDown = (e) => {
              // Don't interfere with typing in input fields, textareas, or when dropdown modal is open
        const isInputField = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        
        // Handle Ctrl key combinations (but be careful with input fields)
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case 'z':
              if (!isInputField) {
                e.preventDefault();
                if (e.shiftKey) {
                  redo();
                } else {
                  undo();
                }
              }
              break;
            case 'y':
              if (!isInputField) {
                e.preventDefault();
                redo();
              }
              break;
            case 'c':
              if (!isInputField) {
                e.preventDefault();
                copyData();
              }
              break;
            case 'v':
              if (!isInputField) {
                e.preventDefault();
                pasteData();
              }
              break;
            case 's':
              if (!isInputField) {
                e.preventDefault();
                exportToCSV();
              }
              break;
            case 'a':
              if (!isInputField) {
                e.preventDefault();
                selectAll();
              }
              break;
            case 'x':
              if (!isInputField) {
                e.preventDefault();
                // Cut: copy then clear
                copyData().then(() => {
                  clearSelectedCells();
                  console.log('✂️ Cut completed');
                });
              }
              break;
          }
        } else {
          // Handle other keys (only when NOT in input fields)
          if (!isInputField) {
            switch (e.key) {
              case 'Delete':
              case 'Backspace':
                e.preventDefault();
                clearSelectedCells();
                break;
              case 'Escape':
                setSelectedRange(null);
                setSelectedCell(null);
                setShowToolbar(false);
                setShowDropdownModal(false);
                setCopiedRange(null); // Clear copy highlighting
                setCopiedCell(null);
                break;
            }
          } else {
            // Allow Escape to close dropdown modal even when in input field
            if (e.key === 'Escape' && showDropdownModal) {
              setShowDropdownModal(false);
            }
          }
        }
    };

    const handleGlobalMouseUp = () => {
      if (isFillDragging && selectedRange && fillHandle) {
        // Calculate the fill range
        let targetRange = null;
        if (fillHandle.row > selectedRange.endRow) {
          // Filling down
          targetRange = {
            startRow: selectedRange.endRow + 1,
            endRow: fillHandle.row,
            startCol: selectedRange.startCol,
            endCol: selectedRange.endCol
          };
        } else if (fillHandle.row < selectedRange.startRow) {
          // Filling up
          targetRange = {
            startRow: fillHandle.row,
            endRow: selectedRange.startRow - 1,
            startCol: selectedRange.startCol,
            endCol: selectedRange.endCol
          };
        } else if (fillHandle.col > selectedRange.endCol) {
          // Filling right
          targetRange = {
            startRow: selectedRange.startRow,
            endRow: selectedRange.endRow,
            startCol: selectedRange.endCol + 1,
            endCol: fillHandle.col
          };
        } else if (fillHandle.col < selectedRange.startCol) {
          // Filling left
          targetRange = {
            startRow: selectedRange.startRow,
            endRow: selectedRange.endRow,
            startCol: fillHandle.col,
            endCol: selectedRange.startCol - 1
          };
        }
        
        if (targetRange) {
          handleFillDrag(selectedRange, targetRange);
        }
      }
      
      setIsFillDragging(false);
      setFillHandle(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [selectedRange, selectedCell, isFillDragging, fillHandle]);

  // Formula evaluation (basic)
  const evaluateFormula = useCallback((formula, rowIndex, colIndex) => {
    // Handle non-string values (like booleans from checkboxes)
    if (typeof formula !== 'string' || !formula.startsWith('=')) return formula;
    
    try {
      let expression = formula.substring(1);
      
      // Replace cell references (A1, B2, etc.) with actual values
      expression = expression.replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
        const colIdx = col.charCodeAt(0) - 65;
        const rowIdx = parseInt(row) - 1;
        const value = data[rowIdx]?.[colIdx] || '0';
        return isNaN(parseFloat(value)) ? '0' : value;
      });

      // Basic operations
      expression = expression.replace(/SUM\(([^)]+)\)/g, (match, range) => {
        // Simple SUM implementation
        const values = range.split(':');
        if (values.length === 2) {
          const [start, end] = values;
          // For now, just return a placeholder
          return '0';
        }
        return '0';
      });

      // Evaluate simple math expressions
      const result = Function('"use strict"; return (' + expression + ')')();
      return isNaN(result) ? formula : result.toString();
    } catch (error) {
      return '#ERROR';
    }
  }, [data]);

  // Handle cell value changes with formula support
  const handleCellChange = (rowIndex, colIndex, value) => {
    if (isReadOnly) return;
    
    const newData = [...data];
    if (!newData[rowIndex]) {
      newData[rowIndex] = [];
    }
    
    // Evaluate formula if it starts with =
    const evaluatedValue = evaluateFormula(value, rowIndex, colIndex);
    newData[rowIndex][colIndex] = evaluatedValue;
    
    setData(newData);
    addToHistory(newData);
    updateField({ data: newData });
  };

  // Update field with all current state
  const updateField = (updates = {}) => {
    if (onChange) {
      if (isFormFill) {
        // In form fill mode, only pass the data values
        onChange(data);
      } else {
        // In form builder mode, pass the complete field structure
        const updatedField = {
          ...field,
          data: data,
          cellStyles: cellStyles,
          mergedCells: mergedCells,
          cellTypes: cellTypes,
          cellDropdowns: cellDropdowns,
          columnWidths: columnWidths,
          rowHeights: rowHeights,
          ...updates
        };
        onChange(updatedField);
      }
    }
  };

  // Generate column headers (A, B, C, etc.)
  const getColumnHeader = (index) => {
    if (index < 26) return String.fromCharCode(65 + index);
    return String.fromCharCode(65 + Math.floor(index / 26) - 1) + String.fromCharCode(65 + (index % 26));
  };

  // Get column width (with default fallback)
  const getColumnWidth = (colIndex) => {
    return columnWidths[colIndex] || 65; // Default 65px
  };

  // Get row height (with default fallback)
  const getRowHeight = (rowIndex) => {
    return rowHeights[rowIndex] || 20; // Default 20px
  };

  // Handle column resize
  const handleColumnResize = (colIndex, newWidth) => {
    const newColumnWidths = { ...columnWidths };
    newColumnWidths[colIndex] = Math.max(30, newWidth); // Minimum 30px
    setColumnWidths(newColumnWidths);
    updateField({ columnWidths: newColumnWidths });
  };

  // Handle row resize
  const handleRowResize = (rowIndex, newHeight) => {
    const newRowHeights = { ...rowHeights };
    newRowHeights[rowIndex] = Math.max(15, newHeight); // Minimum 15px
    setRowHeights(newRowHeights);
    updateField({ rowHeights: newRowHeights });
  };

  // Start column resize
  const startColumnResize = (colIndex, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = getColumnWidth(colIndex);
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const newWidth = startWidth + deltaX;
      handleColumnResize(colIndex, newWidth);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Start row resize
  const startRowResize = (rowIndex, e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = getRowHeight(rowIndex);
    
    const handleMouseMove = (e) => {
      const deltaY = e.clientY - startY;
      const newHeight = startHeight + deltaY;
      handleRowResize(rowIndex, newHeight);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Cell styling functions
  const applyCellStyle = (rowIndex, colIndex, styleProperty, value) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const newStyles = {
      ...cellStyles,
      [cellKey]: {
        ...cellStyles[cellKey],
        [styleProperty]: value
      }
    };
    setCellStyles(newStyles);
    updateField({ cellStyles: newStyles });
  };

  // Apply style to selected range
  const applyRangeStyle = (styleProperty, value) => {
    if (!selectedRange && selectedCell) {
      const [row, col] = selectedCell.split('-').map(Number);
      applyCellStyle(row, col, styleProperty, value);
    } else if (selectedRange) {
      const newStyles = { ...cellStyles };
      const { startRow, endRow, startCol, endCol } = selectedRange;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cellKey = `${r}-${c}`;
          newStyles[cellKey] = {
            ...newStyles[cellKey],
            [styleProperty]: value
          };
        }
      }
      setCellStyles(newStyles);
      updateField({ cellStyles: newStyles });
    }
  };

  // Merge cells
  const mergeCells = () => {
    if (!selectedRange) return;
    const { startRow, endRow, startCol, endCol } = selectedRange;
    const mergeKey = `${startRow}-${startCol}`;
    const newMergedCells = {
      ...mergedCells,
      [mergeKey]: {
        rowSpan: endRow - startRow + 1,
        colSpan: endCol - startCol + 1
      }
    };
    setMergedCells(newMergedCells);
    updateField({ mergedCells: newMergedCells });
  };

  // Set cell type (text, dropdown, checkbox)
  const setCellType = (rowIndex, colIndex, type) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const newCellTypes = { ...cellTypes };
    newCellTypes[cellKey] = type;
    setCellTypes(newCellTypes);
    
    // For checkbox type, initialize with false if no value exists
    if (type === 'checkbox' && !data[rowIndex]?.[colIndex]) {
      const newData = [...data];
      if (!newData[rowIndex]) newData[rowIndex] = [];
      newData[rowIndex][colIndex] = false;
      setData(newData);
      updateField({ cellTypes: newCellTypes, data: newData });
    } else {
      updateField({ cellTypes: newCellTypes });
    }
  };

  // Set dropdown options for a cell
  const setCellDropdownOptions = (rowIndex, colIndex, options) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const newCellDropdowns = { ...cellDropdowns };
    newCellDropdowns[cellKey] = options;
    setCellDropdowns(newCellDropdowns);
    updateField({ cellDropdowns: newCellDropdowns });
  };

  // Add dropdown to selected cells with modal
  const addDropdownToSelected = () => {
    if (selectedRange) {
      setDropdownModalData({
        type: 'range',
        range: selectedRange,
        existingOptions: []
      });
    } else if (selectedCell) {
      const [row, col] = selectedCell.split('-').map(Number);
      const cellKey = `${row}-${col}`;
      setDropdownModalData({
        type: 'cell',
        row,
        col,
        cellKey,
        existingOptions: cellDropdowns[cellKey] || []
      });
    }
    setShowDropdownModal(true);
  };

  // Add checkbox to selected cells
  const addCheckboxToSelected = () => {
    if (selectedRange) {
      const { startRow, endRow, startCol, endCol } = selectedRange;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          setCellType(r, c, 'checkbox');
        }
      }
      console.log('✅ Added checkboxes to selected range');
    } else if (selectedCell) {
      const [row, col] = selectedCell.split('-').map(Number);
      setCellType(row, col, 'checkbox');
      console.log('✅ Added checkbox to selected cell');
    }
    closeContextMenu();
  };

  // Remove dropdown from selected cells
  const removeDropdownFromSelected = () => {
    const newCellTypes = { ...cellTypes };
    const newCellDropdowns = { ...cellDropdowns };
    
    if (selectedRange) {
      const { startRow, endRow, startCol, endCol } = selectedRange;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cellKey = `${r}-${c}`;
          delete newCellTypes[cellKey];
          delete newCellDropdowns[cellKey];
        }
      }
    } else if (selectedCell) {
      delete newCellTypes[selectedCell];
      delete newCellDropdowns[selectedCell];
    }
    
    setCellTypes(newCellTypes);
    setCellDropdowns(newCellDropdowns);
    updateField({ cellTypes: newCellTypes, cellDropdowns: newCellDropdowns });
  };

  // Handle dropdown modal save
  const handleDropdownModalSave = (options) => {
    if (!dropdownModalData || !options.length) return;
    
    const optionsList = options.filter(opt => opt.trim());
    const newCellTypes = { ...cellTypes };
    const newCellDropdowns = { ...cellDropdowns };
    
    if (dropdownModalData.type === 'range') {
      const { startRow, endRow, startCol, endCol } = dropdownModalData.range;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cellKey = `${r}-${c}`;
          newCellTypes[cellKey] = 'dropdown';
          newCellDropdowns[cellKey] = optionsList;
        }
      }
    } else if (dropdownModalData.type === 'cell') {
      newCellTypes[dropdownModalData.cellKey] = 'dropdown';
      newCellDropdowns[dropdownModalData.cellKey] = optionsList;
    }
    
    setCellTypes(newCellTypes);
    setCellDropdowns(newCellDropdowns);
    updateField({ cellTypes: newCellTypes, cellDropdowns: newCellDropdowns });
    setShowDropdownModal(false);
    setDropdownModalData(null);
  };

  // Auto-fill series detection and generation
  const detectSeries = (values) => {
    if (values.length < 2) return null;
    
    // Check for number series
    const numbers = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
    if (numbers.length === values.length && numbers.length >= 2) {
      const diff = numbers[1] - numbers[0];
      // Check if it's a consistent arithmetic series
      for (let i = 2; i < numbers.length; i++) {
        if (Math.abs((numbers[i] - numbers[i-1]) - diff) > 0.001) {
          return null; // Not a consistent series
        }
      }
      return { type: 'number', step: diff, start: numbers[numbers.length - 1] };
    }
    
    // Check for date series (basic)
    if (values.length >= 1) {
      const lastValue = values[values.length - 1];
      const date = new Date(lastValue);
      if (!isNaN(date.getTime()) && lastValue.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/)) {
        return { type: 'date', start: date };
      }
    }
    
    // Check for text with numbers (e.g., "Item 1", "Item 2")
    const textPattern = values[values.length - 1];
    const match = textPattern && textPattern.match(/^(.+?)(\d+)$/);
    if (match && values.length >= 2) {
      const prefix = match[1];
      const num = parseInt(match[2]);
      // Check if previous value follows the same pattern
      const prevMatch = values[values.length - 2].match(/^(.+?)(\d+)$/);
      if (prevMatch && prevMatch[1] === prefix) {
        const prevNum = parseInt(prevMatch[2]);
        return { type: 'text', prefix, step: num - prevNum, start: num };
      }
    }
    
    return null;
  };

  // Generate next value in series
  const generateNextValue = (series, index) => {
    switch (series.type) {
      case 'number':
        return (series.start + (series.step * (index + 1))).toString();
      case 'date':
        const nextDate = new Date(series.start);
        nextDate.setDate(nextDate.getDate() + (index + 1));
        return nextDate.toLocaleDateString();
      case 'text':
        return series.prefix + (series.start + (series.step * (index + 1)));
      default:
        return '';
    }
  };

  // Fill handle functionality
  const handleFillDrag = (fromRange, toRange) => {
    if (!fromRange || !toRange) return;
    
    const newData = [...data];
    const sourceValues = [];
    
    // Collect source values
    for (let r = fromRange.startRow; r <= fromRange.endRow; r++) {
      for (let c = fromRange.startCol; c <= fromRange.endCol; c++) {
        sourceValues.push(newData[r]?.[c] || '');
      }
    }
    
    // Detect series pattern
    const series = detectSeries(sourceValues.filter(v => v !== ''));
    
    let fillIndex = 0;
    for (let r = toRange.startRow; r <= toRange.endRow; r++) {
      for (let c = toRange.startCol; c <= toRange.endCol; c++) {
        // Ensure data structure exists
        while (newData.length <= r) {
          newData.push(new Array(Math.max(cols, c + 1)).fill(''));
        }
        while (newData[r].length <= c) {
          newData[r].push('');
        }
        
        if (series) {
          // Use series pattern
          newData[r][c] = generateNextValue(series, fillIndex);
        } else {
          // Simple copy pattern
          const sourceIndex = fillIndex % sourceValues.length;
          newData[r][c] = sourceValues[sourceIndex] || '';
        }
        fillIndex++;
      }
    }
    
    setData(newData);
    addToHistory(newData);
    updateField({ data: newData });
  };

  // Cell selection handlers
  const handleCellMouseDown = (rowIndex, colIndex, e) => {
    setDragStart({ row: rowIndex, col: colIndex });
    setIsSelecting(true);
    setSelectedCell(`${rowIndex}-${colIndex}`);
    setSelectedRange(null);
    setShowToolbar(true);
  };

  const handleCellMouseEnter = (rowIndex, colIndex) => {
    if (isFillDragging) {
      setFillHandle({ row: rowIndex, col: colIndex });
    } else if (isSelecting && dragStart) {
      const startRow = Math.min(dragStart.row, rowIndex);
      const endRow = Math.max(dragStart.row, rowIndex);
      const startCol = Math.min(dragStart.col, colIndex);
      const endCol = Math.max(dragStart.col, colIndex);
      setSelectedRange({ startRow, endRow, startCol, endCol });
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setDragStart(null);
  };

  // Row header click - select entire row
  const handleRowHeaderClick = (rowIndex, e) => {
    e.preventDefault();
    const maxCols = Math.max(data[0]?.length || 0, field?.defaultCols || 4);
    setSelectedRange({
      startRow: rowIndex,
      endRow: rowIndex,
      startCol: 0,
      endCol: maxCols - 1
    });
    setSelectedCell(null);
    setShowToolbar(true);
  };

  // Column header click - select entire column
  const handleColumnHeaderClick = (colIndex, e) => {
    e.preventDefault();
    const maxRows = Math.max(data.length, field?.defaultRows || 3);
    setSelectedRange({
      startRow: 0,
      endRow: maxRows - 1,
      startCol: colIndex,
      endCol: colIndex
    });
    setSelectedCell(null);
    setShowToolbar(true);
  };

  // Check if cell is in selected range
  const isCellInRange = (rowIndex, colIndex) => {
    if (!selectedRange) return false;
    const { startRow, endRow, startCol, endCol } = selectedRange;
    return rowIndex >= startRow && rowIndex <= endRow && 
           colIndex >= startCol && colIndex <= endCol;
  };

  // Check if cell is merged
  const getCellMergeInfo = (rowIndex, colIndex) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    if (mergedCells[cellKey]) {
      return mergedCells[cellKey];
    }
    
    // Check if this cell is part of a merged range
    for (const [mergeKey, mergeInfo] of Object.entries(mergedCells)) {
      const [mergeRow, mergeCol] = mergeKey.split('-').map(Number);
      if (rowIndex >= mergeRow && rowIndex < mergeRow + mergeInfo.rowSpan &&
          colIndex >= mergeCol && colIndex < mergeCol + mergeInfo.colSpan &&
          (rowIndex !== mergeRow || colIndex !== mergeCol)) {
        return { hidden: true };
      }
    }
    return null;
  };

  // Add row
  const addRow = () => {
    if (isReadOnly) return;
    
    let insertPosition = data.length; // Default: add at end
    
    // If a cell is selected, insert above that row
    if (selectedCell) {
      const [rowIndex] = selectedCell.split('-').map(Number);
      insertPosition = rowIndex;
    } else if (selectedRange) {
      insertPosition = selectedRange.startRow;
    }
    
    const currentCols = Math.max(data[0]?.length || 0, field?.defaultCols || 4);
    const newRow = new Array(currentCols).fill('');
    
    const newData = [...data];
    newData.splice(insertPosition, 0, newRow);
    
    setData(newData);
    addToHistory(newData);
    updateField({ 
      data: newData, 
      defaultRows: newData.length
    });
  };

  // Add column
  const addColumn = () => {
    if (isReadOnly) return;
    
    let insertPosition = data[0]?.length || 0; // Default: add at end
    
    // If a cell is selected, insert before that column
    if (selectedCell) {
      const [, colIndex] = selectedCell.split('-').map(Number);
      insertPosition = colIndex;
    } else if (selectedRange) {
      insertPosition = selectedRange.startCol;
    }
    
    const newData = data.map(row => {
      const newRow = [...row];
      newRow.splice(insertPosition, 0, '');
      return newRow;
    });
    
    // If no rows exist, create first row
    if (newData.length === 0) {
      newData.push(new Array(1).fill(''));
    }
    
    setData(newData);
    addToHistory(newData);
    updateField({ 
      data: newData, 
      defaultCols: newData[0]?.length || 1
    });
  };

  // Delete selected rows
  const deleteRow = () => {
    if (isReadOnly) return;
    
    const rowsToDelete = new Set();
    
    if (selectedRange) {
      // Delete all rows in the selected range
      for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
        rowsToDelete.add(r);
      }
    } else if (selectedCell) {
      // Delete the row containing the selected cell
      const [rowIndex] = selectedCell.split('-').map(Number);
      rowsToDelete.add(rowIndex);
    }
    
    if (rowsToDelete.size === 0) return;
    
    // Keep at least one row
    if (rowsToDelete.size >= data.length) {
      const cols = Math.max(data[0]?.length || 0, field?.defaultCols || 4);
      const newData = [new Array(cols).fill('')];
      setData(newData);
      addToHistory(newData);
      updateField({ data: newData });
      setSelectedCell(null);
      setSelectedRange(null);
      return;
    }
    
    const newData = data.filter((_, index) => !rowsToDelete.has(index));
    setData(newData);
    addToHistory(newData);
    updateField({ data: newData, defaultRows: newData.length });
    setSelectedCell(null);
    setSelectedRange(null);
  };

  // Delete selected columns
  const deleteColumn = () => {
    if (isReadOnly) return;
    
    const colsToDelete = new Set();
    
    if (selectedRange) {
      // Delete all columns in the selected range
      for (let c = selectedRange.startCol; c <= selectedRange.endCol; c++) {
        colsToDelete.add(c);
      }
    } else if (selectedCell) {
      // Delete the column containing the selected cell
      const [, colIndex] = selectedCell.split('-').map(Number);
      colsToDelete.add(colIndex);
    }
    
    if (colsToDelete.size === 0) return;
    
    const currentCols = data[0]?.length || 0;
    
    // Keep at least one column
    if (colsToDelete.size >= currentCols) {
      const newData = data.map(() => ['']);
      if (newData.length === 0) {
        newData.push(['']);
      }
      setData(newData);
      addToHistory(newData);
      updateField({ data: newData });
      setSelectedCell(null);
      setSelectedRange(null);
      return;
    }
    
    const newData = data.map(row => 
      row.filter((_, index) => !colsToDelete.has(index))
    );
    
    setData(newData);
    addToHistory(newData);
    updateField({ data: newData, defaultCols: newData[0]?.length || 1 });
    setSelectedCell(null);
    setSelectedRange(null);
  };

  // Context menu handlers
  const handleContextMenu = (e, rowIndex, colIndex) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      rowIndex,
      colIndex
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Clear cell content
  const clearCell = (rowIndex, colIndex) => {
    handleCellChange(rowIndex, colIndex, '');
    closeContextMenu();
  };

  // Enhanced copy functionality with visual feedback
  const copyData = async () => {
    try {
      let copyText = '';
      
      if (selectedRange) {
        const { startRow, endRow, startCol, endCol } = selectedRange;
        // Set copied range for visual feedback
        setCopiedRange({ ...selectedRange });
        setCopiedCell(null);
        
        for (let r = startRow; r <= endRow; r++) {
          const rowData = [];
          for (let c = startCol; c <= endCol; c++) {
            const cellKey = `${r}-${c}`;
            const cellValue = data[r]?.[c] || '';
            // For checkboxes, convert boolean to string representation
            if (cellTypes[cellKey] === 'checkbox') {
              rowData.push(cellValue === true ? 'TRUE' : 'FALSE');
            } else {
              rowData.push(cellValue);
            }
          }
          copyText += rowData.join('\t') + '\n';
        }
        
        await navigator.clipboard.writeText(copyText.trim());
        console.log('📋 Copied range:', `${getColumnHeader(startCol)}${startRow + 1}:${getColumnHeader(endCol)}${endRow + 1}`);
        
      } else if (selectedCell) {
        const [row, col] = selectedCell.split('-').map(Number);
        // Set copied cell for visual feedback
        setCopiedCell(selectedCell);
        setCopiedRange(null);
        
        copyText = data[row]?.[col] || '';
        await navigator.clipboard.writeText(copyText);
        console.log('📋 Copied cell:', `${getColumnHeader(col)}${row + 1}`, '=', copyText);
      }
      
      // Show temporary feedback
      if (copyText) {
        console.log('✅ Copy successful! Press Ctrl+V to paste.');
      }
      
    } catch (error) {
      console.error('❌ Copy failed:', error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        if (selectedRange) {
          const { startRow, endRow, startCol, endCol } = selectedRange;
          let fallbackText = '';
          for (let r = startRow; r <= endRow; r++) {
            const rowData = [];
            for (let c = startCol; c <= endCol; c++) {
              rowData.push(data[r]?.[c] || '');
            }
            fallbackText += rowData.join('\t') + '\n';
          }
          textArea.value = fallbackText.trim();
        } else if (selectedCell) {
          const [row, col] = selectedCell.split('-').map(Number);
          textArea.value = data[row]?.[col] || '';
        }
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('✅ Copy successful (fallback method)!');
      } catch (fallbackError) {
        console.error('❌ Copy failed completely:', fallbackError);
      }
    }
    
    closeContextMenu();
  };

  // Enhanced paste functionality for multiple cells with better feedback
  const pasteData = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        console.log('📋 Clipboard is empty');
        return;
      }

      console.log('📋 Pasting:', clipboardText);
      const newData = [...data];
      const pasteRows = clipboardText.trim().split('\n');
      const pasteCells = pasteRows.map(row => row.split('\t'));

      let pasteTarget = null;
      let pasteCount = 0;

      if (selectedRange) {
        // Paste to selected range
        const { startRow, endRow, startCol, endCol } = selectedRange;
        pasteTarget = `${getColumnHeader(startCol)}${startRow + 1}:${getColumnHeader(endCol)}${endRow + 1}`;
        
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            // Calculate position in paste data using modulo for repeating pattern
            const pasteRowIdx = (r - startRow) % pasteCells.length;
            const pasteCellIdx = (c - startCol) % pasteCells[pasteRowIdx].length;
            let pasteValue = pasteCells[pasteRowIdx][pasteCellIdx] || '';
            
            // Ensure the data array is large enough
            while (newData.length <= r) {
              newData.push(new Array(Math.max(cols, c + 1)).fill(''));
            }
            while (newData[r].length <= c) {
              newData[r].push('');
            }
            
            // Handle checkbox values specially
            const cellKey = `${r}-${c}`;
            if (cellTypes[cellKey] === 'checkbox') {
              // Convert text values to boolean
              if (pasteValue === 'TRUE' || pasteValue === 'true' || pasteValue === '1') {
                pasteValue = true;
              } else if (pasteValue === 'FALSE' || pasteValue === 'false' || pasteValue === '0') {
                pasteValue = false;
              } else {
                pasteValue = Boolean(pasteValue); // Convert other values to boolean
              }
            }
            
            newData[r][c] = pasteValue;
            pasteCount++;
          }
        }
      } else if (selectedCell) {
        // Paste from selected cell position
        const [startRow, startCol] = selectedCell.split('-').map(Number);
        pasteTarget = `${getColumnHeader(startCol)}${startRow + 1}`;
        
        pasteCells.forEach((rowCells, rowOffset) => {
          rowCells.forEach((cell, colOffset) => {
            const targetRow = startRow + rowOffset;
            const targetCol = startCol + colOffset;
            
            // Ensure the data array is large enough
            while (newData.length <= targetRow) {
              newData.push(new Array(Math.max(cols, targetCol + 1)).fill(''));
            }
            while (newData[targetRow].length <= targetCol) {
              newData[targetRow].push('');
            }
            
            // Handle checkbox values for single cell paste
            const cellKey = `${targetRow}-${targetCol}`;
            let cellValue = cell;
            if (cellTypes[cellKey] === 'checkbox') {
              // Convert text values to boolean
              if (cellValue === 'TRUE' || cellValue === 'true' || cellValue === '1') {
                cellValue = true;
              } else if (cellValue === 'FALSE' || cellValue === 'false' || cellValue === '0') {
                cellValue = false;
              } else {
                cellValue = Boolean(cellValue); // Convert other values to boolean
              }
            }
            
            newData[targetRow][targetCol] = cellValue;
            pasteCount++;
          });
        });
      } else {
        console.log('❌ No cell or range selected for pasting');
        return;
      }

      // Clear copy highlighting after paste
      setCopiedRange(null);
      setCopiedCell(null);

      setData(newData);
      addToHistory(newData);
      updateField({ data: newData });
      
      console.log(`✅ Pasted ${pasteCount} cells to ${pasteTarget}`);
      
    } catch (error) {
      console.error('❌ Paste failed:', error);
    }
  };

  // Select all cells
  const selectAll = () => {
    const maxRows = Math.max(data.length, 1);
    const maxCols = Math.max(data[0]?.length || 0, 1);
    setSelectedRange({
      startRow: 0,
      endRow: maxRows - 1,
      startCol: 0,
      endCol: maxCols - 1
    });
    setSelectedCell(null);
    setShowToolbar(true);
  };

  // Clear selected cells (Delete/Backspace functionality)
  const clearSelectedCells = () => {
    if (isReadOnly) return;
    
    const newData = [...data];
    let changed = false;

    if (selectedRange) {
      // Clear range
      const { startRow, endRow, startCol, endCol } = selectedRange;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (newData[r] && newData[r][c] !== '') {
            newData[r][c] = '';
            changed = true;
          }
        }
      }
    } else if (selectedCell) {
      // Clear single cell
      const [row, col] = selectedCell.split('-').map(Number);
      if (newData[row] && newData[row][col] !== '') {
        newData[row][col] = '';
        changed = true;
      }
    }

    if (changed) {
      setData(newData);
      addToHistory(newData);
      updateField({ data: newData });
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = data.map(row => 
      row.map(cell => `"${cell || ''}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spreadsheet_${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import from CSV
  const importFromCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const rows = csv.split('\n').map(row => 
        row.split(',').map(cell => cell.replace(/^"|"$/g, ''))
      );
      setData(rows);
      addToHistory(rows);
      updateField({ data: rows });
    };
    reader.readAsText(file);
  };

  const rows = Math.max(data.length, field?.defaultRows || 3);
  const cols = Math.max(data[0]?.length || 0, field?.defaultCols || 4);

  // Style constants
  const buttonStyle = {
    marginRight: '5px',
    padding: '4px 8px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '10px',
    cursor: 'pointer'
  };

  const toolbarButtonStyle = {
    padding: '4px 8px',
    margin: '0 2px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '11px',
    cursor: 'pointer',
    minWidth: '25px'
  };

  const contextMenuItemStyle = {
    width: '100%',
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '12px',
    '&:hover': {
      backgroundColor: '#f5f5f5'
    }
  };

  return (
    <div className="jspreadsheet-container" style={{ 
      width: '100%', 
      height: isFormFill ? '500px' : '400px',
      border: '2px solid #4caf50',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#fff'
    }} onMouseUp={handleMouseUp} onClick={closeContextMenu}>
      
      {/* Dropdown Options Modal */}
      {showDropdownModal && (
        <DropdownModal
          data={dropdownModalData}
          onSave={handleDropdownModalSave}
          onCancel={() => {
            setShowDropdownModal(false);
            setDropdownModalData(null);
          }}
        />
      )}
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            minWidth: '150px'
          }}
        >
          <div style={{ padding: '4px 0' }}>
            <button
              onClick={copyData}
              style={contextMenuItemStyle}
            >
              📋 Copy (Ctrl+C)
            </button>
            <button
              onClick={pasteData}
              style={contextMenuItemStyle}
            >
              📋 Paste (Ctrl+V)
            </button>
            <button
              onClick={() => {
                copyData();
                clearSelectedCells();
                closeContextMenu();
              }}
              style={contextMenuItemStyle}
            >
              ✂️ Cut (Ctrl+X)
            </button>
            <button
              onClick={() => clearCell(contextMenu.rowIndex, contextMenu.colIndex)}
              style={contextMenuItemStyle}
            >
              🗑️ Clear Contents
            </button>
            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #eee' }} />
            <button
              onClick={() => {
                applyCellStyle(contextMenu.rowIndex, contextMenu.colIndex, 'fontWeight', 'bold');
                closeContextMenu();
              }}
              style={contextMenuItemStyle}
            >
              <b>B</b> Make Bold
            </button>
            <button
              onClick={() => {
                applyCellStyle(contextMenu.rowIndex, contextMenu.colIndex, 'fontStyle', 'italic');
                closeContextMenu();
              }}
              style={contextMenuItemStyle}
            >
              <i>I</i> Make Italic
            </button>
            <button
              onClick={() => {
                setDropdownModalData({
                  type: 'cell',
                  row: contextMenu.rowIndex,
                  col: contextMenu.colIndex,
                  cellKey: `${contextMenu.rowIndex}-${contextMenu.colIndex}`,
                  existingOptions: cellDropdowns[`${contextMenu.rowIndex}-${contextMenu.colIndex}`] || []
                });
                setShowDropdownModal(true);
                closeContextMenu();
              }}
              style={contextMenuItemStyle}
              disabled={isReadOnly}
            >
              📋⬇️ Add Dropdown
            </button>
            <button
              onClick={() => {
                const cellKey = `${contextMenu.rowIndex}-${contextMenu.colIndex}`;
                const newCellTypes = { ...cellTypes };
                const newCellDropdowns = { ...cellDropdowns };
                delete newCellTypes[cellKey];
                delete newCellDropdowns[cellKey];
                setCellTypes(newCellTypes);
                setCellDropdowns(newCellDropdowns);
                updateField({ cellTypes: newCellTypes, cellDropdowns: newCellDropdowns });
                closeContextMenu();
              }}
              style={contextMenuItemStyle}
              disabled={isReadOnly}
            >
              🗑️ Remove Dropdown
            </button>
            <button
              onClick={() => {
                setCellType(contextMenu.rowIndex, contextMenu.colIndex, 'checkbox');
                closeContextMenu();
              }}
              style={contextMenuItemStyle}
              disabled={isReadOnly}
            >
              ☑️ Add Checkbox
            </button>
            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #eee' }} />
            <button
              onClick={() => {
                const width = prompt('Enter column width (px):', getColumnWidth(contextMenu.colIndex).toString());
                if (width && !isNaN(width)) {
                  handleColumnResize(contextMenu.colIndex, parseInt(width));
                }
                closeContextMenu();
              }}
              style={contextMenuItemStyle}
              disabled={isReadOnly}
            >
              ↔️ Set Column Width
            </button>
            <button
              onClick={() => {
                const height = prompt('Enter row height (px):', getRowHeight(contextMenu.rowIndex).toString());
                if (height && !isNaN(height)) {
                  handleRowResize(contextMenu.rowIndex, parseInt(height));
                }
                closeContextMenu();
              }}
              style={contextMenuItemStyle}
              disabled={isReadOnly}
            >
              ↕️ Set Row Height
            </button>
            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #eee' }} />
            <button
              onClick={() => {
                addRow();
                closeContextMenu();
              }}
              style={contextMenuItemStyle}
              disabled={isReadOnly}
            >
              ➕ Insert Row Above
            </button>
            <button
              onClick={() => {
                addColumn();
                closeContextMenu();
              }}
              style={contextMenuItemStyle}
              disabled={isReadOnly}
            >
              ➕ Insert Column Left
            </button>
            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #eee' }} />
            <button
              onClick={() => {
                deleteRow();
                closeContextMenu();
              }}
              style={{...contextMenuItemStyle, color: '#f44336'}}
              disabled={isReadOnly}
            >
              ❌ Delete Row
            </button>
            <button
              onClick={() => {
                deleteColumn();
                closeContextMenu();
              }}
              style={{...contextMenuItemStyle, color: '#f44336'}}
              disabled={isReadOnly}
            >
              ❌ Delete Column
            </button>
          </div>
        </div>
      )}

      {/* Header - Hide in form fill mode */}
      {!isFormFill && (
        <div style={{
          padding: '8px',
          backgroundColor: '#e8f5e8',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2e7d32',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        {/* <span>📊 jSpreadsheet CE - {rows} rows × {cols} columns {isReadOnly && '(Read Only)'}</span> */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <button 
            onClick={undo} 
            disabled={historyStep <= 0}
            style={{...buttonStyle, backgroundColor: historyStep <= 0 ? '#ccc' : '#2196f3'}}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button 
            onClick={redo} 
            disabled={historyStep >= history.length - 1}
            style={{...buttonStyle, backgroundColor: historyStep >= history.length - 1 ? '#ccc' : '#2196f3'}}
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>
          <button onClick={exportToCSV} style={{...buttonStyle, backgroundColor: '#ff9800'}} title="Export CSV (Ctrl+S)">💾</button>
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => e.target.files[0] && importFromCSV(e.target.files[0])}
            style={{ display: 'none' }}
            id="csv-import"
          />
          <button 
            onClick={() => document.getElementById('csv-import').click()}
            style={{...buttonStyle, backgroundColor: '#ff9800'}}
            title="Import CSV"
          >
            📁
          </button>
          <button 
            onClick={() => setIsReadOnly(!isReadOnly)}
            style={{...buttonStyle, backgroundColor: isReadOnly ? '#f44336' : '#4caf50'}}
            title="Toggle Read Only"
          >
            {isReadOnly ? '🔒' : '🔓'}
          </button>
          <div style={{ borderLeft: '1px solid #ddd', height: '20px', margin: '0 5px' }} />
          <button onClick={addRow} style={buttonStyle} disabled={isReadOnly}>+ Row</button>
          <button onClick={addColumn} style={buttonStyle} disabled={isReadOnly}>+ Col</button>
          <button onClick={deleteRow} style={{...buttonStyle, backgroundColor: '#f44336'}} disabled={isReadOnly}>- Row</button>
          <button onClick={deleteColumn} style={{...buttonStyle, backgroundColor: '#f44336'}} disabled={isReadOnly}>- Col</button>
        </div>
      </div>
      )}

      {/* Formula Bar - Hide in form fill mode */}
      {!isFormFill && selectedCell && (
        <div style={{
          padding: '8px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px'
        }}>
          <span style={{ fontWeight: 'bold', minWidth: '40px' }}>
            {getColumnHeader(parseInt(selectedCell.split('-')[1]))}{parseInt(selectedCell.split('-')[0]) + 1}:
          </span>
          <input
            type="text"
            value={data[parseInt(selectedCell.split('-')[0])]?.[parseInt(selectedCell.split('-')[1])] || ''}
            onChange={(e) => {
              const [row, col] = selectedCell.split('-').map(Number);
              handleCellChange(row, col, e.target.value);
            }}
            disabled={isReadOnly}
            style={{
              flex: 1,
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}
            placeholder="Enter formula (=A1+B1) or value..."
          />
        </div>
      )}

      {/* Enhanced Toolbar - Hide in form fill mode */}
      {!isFormFill && showToolbar && !isReadOnly && (
        <div style={{
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          gap: '5px',
          alignItems: 'center',
          fontSize: '12px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Format:</span>
          
          {/* Font Family */}
          <select 
            onChange={(e) => applyRangeStyle('fontFamily', e.target.value)}
            style={{ padding: '2px', fontSize: '11px', marginRight: '5px' }}
          >
            <option value="">Font</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Times New Roman, serif">Times</option>
            <option value="Courier New, monospace">Courier</option>
            <option value="Verdana, sans-serif">Verdana</option>
            <option value="Georgia, serif">Georgia</option>
          </select>

          {/* Font Size */}
          <select 
            onChange={(e) => applyRangeStyle('fontSize', e.target.value)}
            style={{ padding: '2px', fontSize: '11px', marginRight: '5px' }}
          >
            <option value="">Size</option>
            <option value="8px">8px</option>
            <option value="10px">10px</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="28px">28px</option>
            <option value="32px">32px</option>
          </select>

          <div style={{ borderLeft: '1px solid #ccc', height: '20px', margin: '0 5px' }} />

          {/* Text Formatting */}
          <button 
            onClick={() => applyRangeStyle('fontWeight', 'bold')}
            style={toolbarButtonStyle}
            title="Bold"
          >
            <b>B</b>
          </button>
          <button 
            onClick={() => applyRangeStyle('fontStyle', 'italic')}
            style={toolbarButtonStyle}
            title="Italic"
          >
            <i>I</i>
          </button>
          <button 
            onClick={() => applyRangeStyle('textDecoration', 'underline')}
            style={toolbarButtonStyle}
            title="Underline"
          >
            <u>U</u>
          </button>

          <div style={{ borderLeft: '1px solid #ccc', height: '20px', margin: '0 5px' }} />

          {/* Colors */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '8px', marginBottom: '2px' }}>Text</span>
            <input
              type="color"
              onChange={(e) => applyRangeStyle('color', e.target.value)}
              style={{ width: '25px', height: '20px', padding: '0', border: 'none' }}
              title="Text Color"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '8px', marginBottom: '2px' }}>Fill</span>
            <input
              type="color"
              onChange={(e) => applyRangeStyle('backgroundColor', e.target.value)}
              style={{ width: '25px', height: '20px', padding: '0', border: 'none' }}
              title="Background Color"
            />
          </div>

          <div style={{ borderLeft: '1px solid #ccc', height: '20px', margin: '0 5px' }} />

          {/* Alignment */}
          <button onClick={() => applyRangeStyle('textAlign', 'left')} style={toolbarButtonStyle} title="Align Left">⬅</button>
          <button onClick={() => applyRangeStyle('textAlign', 'center')} style={toolbarButtonStyle} title="Align Center">⬌</button>
          <button onClick={() => applyRangeStyle('textAlign', 'right')} style={toolbarButtonStyle} title="Align Right">➡</button>

          <div style={{ borderLeft: '1px solid #ccc', height: '20px', margin: '0 5px' }} />

          {/* Advanced Functions */}
          <button 
            onClick={mergeCells}
            style={{...toolbarButtonStyle, backgroundColor: selectedRange ? '#2196f3' : '#ccc', color: 'white'}}
            disabled={!selectedRange}
            title="Merge Cells"
          >
            Merge
          </button>
          
          <button 
            onClick={addDropdownToSelected}
            style={{...toolbarButtonStyle, backgroundColor: selectedRange || selectedCell ? '#4caf50' : '#ccc', color: 'white'}}
            disabled={!selectedRange && !selectedCell}
            title="Add Dropdown"
          >
            📋⬇️
          </button>
          
          <button 
            onClick={removeDropdownFromSelected}
            style={{...toolbarButtonStyle, backgroundColor: selectedRange || selectedCell ? '#f44336' : '#ccc', color: 'white'}}
            disabled={!selectedRange && !selectedCell}
            title="Remove Dropdown"
          >
            🗑️📋
          </button>
          
          <button 
            onClick={addCheckboxToSelected}
            style={{...toolbarButtonStyle, backgroundColor: selectedRange || selectedCell ? '#2196f3' : '#ccc', color: 'white'}}
            disabled={!selectedRange && !selectedCell}
            title="Add Checkbox"
          >
            ☑️
          </button>
          
          <div style={{ borderLeft: '1px solid #ddd', height: '20px', margin: '0 5px' }} />
          
          <button 
            onClick={() => {
              const width = prompt('Enter column width (px):', '65');
              if (width && !isNaN(width) && selectedCell) {
                const [, col] = selectedCell.split('-').map(Number);
                handleColumnResize(col, parseInt(width));
              }
            }}
            style={{...toolbarButtonStyle, backgroundColor: selectedCell ? '#ff9800' : '#ccc', color: 'white'}}
            disabled={!selectedCell}
            title="Set Column Width"
          >
            ↔️
          </button>
          
          <button 
            onClick={() => {
              const height = prompt('Enter row height (px):', '20');
              if (height && !isNaN(height) && selectedCell) {
                const [row] = selectedCell.split('-').map(Number);
                handleRowResize(row, parseInt(height));
              }
            }}
            style={{...toolbarButtonStyle, backgroundColor: selectedCell ? '#ff9800' : '#ccc', color: 'white'}}
            disabled={!selectedCell}
            title="Set Row Height"
          >
            ↕️
          </button>
          
          <button 
            onClick={copyData}
            style={toolbarButtonStyle}
            title="Copy (Ctrl+C)"
          >
            📋
          </button>
          
          <button 
            onClick={pasteData}
            style={toolbarButtonStyle}
            title="Paste (Ctrl+V)"
          >
            📋📋
          </button>
          
          <button 
            onClick={() => {
              copyData();
              clearSelectedCells();
            }}
            style={toolbarButtonStyle}
            title="Cut (Ctrl+X)"
          >
            ✂️
          </button>
        </div>
      )}

      {/* Enhanced Spreadsheet Table */}
      <div style={{ 
        overflowX: 'auto',
        overflowY: 'auto',
        maxHeight: isFormFill ? '380px' : '280px',
        border: '1px solid #ddd'
      }}>
        <table ref={tableRef} style={{ 
          width: '100%', 
          borderCollapse: 'separate',
          borderSpacing: '0',
          fontSize: '11px',
          fontFamily: '"Calibri", "Segoe UI", Arial, sans-serif',
          userSelect: 'none',
          backgroundColor: '#ffffff',
          border: '1px solid #9c9c9c',
          tableLayout: 'fixed'
        }}>
          {!isFormFill && (
            <thead>
              <tr>
              <th style={{
                width: '30px',
                height: '21px',
                backgroundColor: '#f2f2f2',
                border: '1px solid #d4d4d4',
                borderTop: '1px solid #9c9c9c',
                borderLeft: '1px solid #9c9c9c',
                borderBottom: '2px solid #8a8a8a',
                borderRight: '1px solid #d4d4d4',
                fontSize: '11px',
                fontWeight: 'normal',
                color: '#262626',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                cursor: isFormFill ? 'default' : 'pointer',
                textAlign: 'center',
                padding: '2px 1px',
                backgroundImage: 'linear-gradient(to bottom, #ffffff 0%, #f0f0f0 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)'
              }}
              onClick={!isFormFill ? selectAll : undefined}
              title={isFormFill ? "jSpreadsheet" : "Select All (Ctrl+A)"}
              >
                ⊞
              </th>
              {Array.from({ length: cols }, (_, colIndex) => (
                <th 
                  key={colIndex} 
                  style={{
                    minWidth: `${getColumnWidth(colIndex)}px`,
                    width: `${getColumnWidth(colIndex)}px`,
                    height: '21px',
                    backgroundColor: selectedRange && 
                      selectedRange.startCol <= colIndex && 
                      selectedRange.endCol >= colIndex ? '#d4e6f8' : '#f2f2f2',
                    backgroundImage: selectedRange && 
                      selectedRange.startCol <= colIndex && 
                      selectedRange.endCol >= colIndex 
                        ? 'linear-gradient(to bottom, #e8f1fd 0%, #c4daf8 100%)' 
                        : 'linear-gradient(to bottom, #ffffff 0%, #f0f0f0 100%)',
                    border: '1px solid #d4d4d4',
                    borderTop: '1px solid #9c9c9c',
                    borderBottom: '2px solid #8a8a8a',
                    borderLeft: '1px solid #d4d4d4',
                    borderRight: '1px solid #d4d4d4',
                    padding: '2px 4px',
                    fontWeight: 'normal',
                    fontSize: '11px',
                    color: '#262626',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    cursor: 'pointer',
                    userSelect: 'none',
                    textAlign: 'center',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    position: 'relative' // For resize handle positioning
                  }}
                  onClick={(e) => !isFormFill && handleColumnHeaderClick(colIndex, e)}
                  title={isFormFill ? `Column ${getColumnHeader(colIndex)}` : `Select Column ${getColumnHeader(colIndex)}`}
                >
                  {getColumnHeader(colIndex)}
                  {/* Column resize handle */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '4px',
                      height: '100%',
                      cursor: 'col-resize',
                      backgroundColor: 'transparent',
                      zIndex: 11
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startColumnResize(colIndex, e);
                    }}
                    title="Resize column"
                  />
                </th>
              ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex}>
                {!isFormFill && (
                  <td style={{
                    width: '30px',
                    height: `${getRowHeight(rowIndex)}px`,
                  backgroundColor: selectedRange && 
                    selectedRange.startRow <= rowIndex && 
                    selectedRange.endRow >= rowIndex ? '#d4e6f8' : '#f2f2f2',
                  backgroundImage: selectedRange && 
                    selectedRange.startRow <= rowIndex && 
                    selectedRange.endRow >= rowIndex 
                      ? 'linear-gradient(to bottom, #e8f1fd 0%, #c4daf8 100%)' 
                      : 'linear-gradient(to bottom, #ffffff 0%, #f0f0f0 100%)',
                  border: '1px solid #d4d4d4',
                  borderLeft: '1px solid #9c9c9c',
                  borderRight: '2px solid #8a8a8a',
                  borderTop: '1px solid #d4d4d4',
                  borderBottom: '1px solid #d4d4d4',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 'normal',
                  color: '#262626',
                  position: 'sticky',
                  left: 0,
                  zIndex: 5,
                  cursor: 'pointer',
                  userSelect: 'none',
                  padding: '1px 2px',
                  boxShadow: 'inset 0 0 1px rgba(255,255,255,0.8)',
                  lineHeight: '18px',
                  position: 'relative' // For resize handle positioning
                }}
                onClick={(e) => handleRowHeaderClick(rowIndex, e)}
                title={`Select Row ${rowIndex + 1}`}
                >
                  {rowIndex + 1}
                  {/* Row resize handle */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: '4px',
                      cursor: 'row-resize',
                      backgroundColor: 'transparent',
                      zIndex: 11
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      startRowResize(rowIndex, e);
                    }}
                    title="Resize row"
                  />
                </td>
                )}
                {Array.from({ length: cols }, (_, colIndex) => {
                  const cellKey = `${rowIndex}-${colIndex}`;
                  const cellStyle = cellStyles[cellKey] || {};
                  const mergeInfo = getCellMergeInfo(rowIndex, colIndex);
                  const isSelected = selectedCell === cellKey;
                  const isInRange = isCellInRange(rowIndex, colIndex);
                  
                  // Check if cell is in copied range/cell for visual feedback
                  const isCopied = (copiedCell === cellKey) || 
                    (copiedRange && rowIndex >= copiedRange.startRow && rowIndex <= copiedRange.endRow && 
                     colIndex >= copiedRange.startCol && colIndex <= copiedRange.endCol);

                  if (mergeInfo?.hidden) return null;

                  return (
                    <td 
                      key={colIndex} 
                      rowSpan={mergeInfo?.rowSpan || 1}
                      colSpan={mergeInfo?.colSpan || 1}
                      style={{
                        width: `${getColumnWidth(colIndex)}px`,
                        minWidth: `${getColumnWidth(colIndex)}px`,
                        height: `${getRowHeight(rowIndex)}px`,
                        border: isSelected ? '2px solid #217346' : 
                               isInRange ? '1px solid #70ad47' : 
                               isCopied ? '2px dashed #0066cc' : // Excel-like dotted border for copied cells
                               '1px solid #d4d4d4',
                        padding: '0',
                        backgroundColor: isInRange ? '#e2efda' : 
                                        isSelected ? '#ffffff' : 
                                        cellStyle.backgroundColor || '#ffffff',
                        position: 'relative',
                        verticalAlign: 'top',
                        boxSizing: 'border-box'
                      }}
                      onMouseDown={(e) => !isFormFill && handleCellMouseDown(rowIndex, colIndex, e)}
                      onMouseEnter={() => !isFormFill && handleCellMouseEnter(rowIndex, colIndex)}
                      onContextMenu={(e) => !isFormFill && handleContextMenu(e, rowIndex, colIndex)}
                    >
                      {cellTypes[cellKey] === 'dropdown' ? (
                        <select
                          value={data[rowIndex]?.[colIndex] || ''}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          onFocus={() => {
                            if (!isFormFill) {
                              setSelectedCell(cellKey);
                              setShowToolbar(true);
                            }
                          }}
                          data-cell={cellKey}
                          style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            outline: 'none',
                            padding: '1px 3px',
                            backgroundColor: 'transparent',
                            fontSize: '11px',
                            fontFamily: '"Calibri", "Segoe UI", Arial, sans-serif',
                            cursor: 'pointer',
                            lineHeight: '18px',
                            ...cellStyle
                          }}
                        >
                          <option value="">Select...</option>
                          {(cellDropdowns[cellKey] || []).map((option, idx) => (
                            <option key={idx} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : cellTypes[cellKey] === 'checkbox' ? (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          padding: '2px'
                        }}>
                          <input
                            type="checkbox"
                            checked={data[rowIndex]?.[colIndex] === true || data[rowIndex]?.[colIndex] === 'true'}
                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.checked)}
                            onFocus={() => {
                              if (!isFormFill) {
                                setSelectedCell(cellKey);
                                setShowToolbar(true);
                              }
                            }}
                            data-cell={cellKey}
                            style={{
                              width: '14px',
                              height: '14px',
                              cursor: 'pointer',
                              accentColor: '#217346', // Excel-like green color
                              ...cellStyle
                            }}
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={data[rowIndex]?.[colIndex] || ''}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          onFocus={() => {
                            if (!isFormFill) {
                              setSelectedCell(cellKey);
                              setShowToolbar(true);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const nextRow = rowIndex + 1;
                              if (nextRow < rows) {
                                const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                if (nextInput) nextInput.focus();
                              }
                            } else if (e.key === 'Tab') {
                              e.preventDefault();
                              const nextCol = colIndex + 1;
                              if (nextCol < cols) {
                                const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                if (nextInput) nextInput.focus();
                              }
                            }
                          }}
                          data-cell={cellKey}
                          style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            outline: 'none',
                            padding: '1px 3px',
                            backgroundColor: 'transparent',
                            fontSize: '11px',
                            fontFamily: '"Calibri", "Segoe UI", Arial, sans-serif',
                            lineHeight: '18px',
                            ...cellStyle
                          }}
                          placeholder={`${getColumnHeader(colIndex)}${rowIndex + 1}`}
                        />
                      )}
                      
                      {/* Fill Handle - Excel-style small square - Hide in form fill mode */}
                      {!isFormFill && (isSelected || (selectedRange && 
                        rowIndex === selectedRange.endRow && 
                        colIndex === selectedRange.endCol)) && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '6px',
                            height: '6px',
                            backgroundColor: '#217346',
                            border: '1px solid #ffffff',
                            cursor: 'crosshair',
                            zIndex: 15,
                            borderRadius: '0px'
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsFillDragging(true);
                            setFillHandle({ row: rowIndex, col: colIndex });
                          }}
                          onMouseEnter={() => {
                            if (isFillDragging) {
                              setFillHandle({ row: rowIndex, col: colIndex });
                            }
                          }}
                          title="Drag to fill"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
              <div style={{
          padding: '8px',
          fontSize: '10px',
          color: '#666',
          textAlign: 'center',
          fontStyle: 'italic',
          backgroundColor: '#f9f9f9',
          borderTop: '1px solid #ddd',
          lineHeight: '1.4'
        }}>
          {isFormFill ? (
            <>
              💡 <strong>Fill out the spreadsheet:</strong> Click any cell to enter data • Use dropdowns and checkboxes where available • Press Tab or Enter to navigate
            </>
          ) : (
            <>
              💡 <strong>Enhanced jSpreadsheet CE:</strong><br/>
              • <strong>Select:</strong> Click cell, drag range, click row/col headers, Ctrl+A for all<br/>
              • <strong>Edit:</strong> Type in cells, formulas (=A1+B1), Delete/Backspace to clear<br/>
              • <strong>Copy/Paste:</strong> Ctrl+C/V (shows dotted border), Cut (Ctrl+X), Drag fill handle (auto-increment: 1,2,3...)<br/>
              • <strong>Rows/Cols:</strong> Add/Delete via buttons or right-click menu<br/>
              • <strong>Format:</strong> Use toolbar (Bold, Colors, Fonts) • Merge cells • Dropdowns • Checkboxes • Resize rows/columns • Undo/Redo (Ctrl+Z/Y)<br/>
              • <strong>File:</strong> Export CSV (Ctrl+S), Import CSV • Right-click for context menu
            </>
          )}
        </div>
    </div>
  );
};

export default JSpreadsheetComponent;