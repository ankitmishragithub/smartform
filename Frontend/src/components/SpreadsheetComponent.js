import React, { useState } from 'react';
import { Button, Input, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup } from 'reactstrap';
import { useDrop } from 'react-dnd';
import '../css/SpreadsheetStyles.css';

// Individual cell component with drop functionality
function SpreadsheetDropCell({ 
  rowIndex, 
  colIndex, 
  cell, 
  mergeInfo, 
  isSelected, 
  editingCell, 
  onCellClick, 
  onCellDoubleClick, 
  onCellChange, 
  onFormFieldDrop,
  onEditFormField,
  onDeleteFormField,
  getCellData,
  getCellStyle,
  formatCellValue,
  getColumnWidth
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: ['FIELD'],
    drop: (item) => {
      if (item.type && item.label) {
        onFormFieldDrop(rowIndex, colIndex, item);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isMerged = mergeInfo !== null;
  const isStart = mergeInfo ? (mergeInfo.startRow === rowIndex && mergeInfo.startCol === colIndex) : true;
  
  if (isMerged && !isStart) return null;
  
  const rowSpan = mergeInfo ? mergeInfo.endRow - mergeInfo.startRow + 1 : 1;
  const colSpan = mergeInfo ? mergeInfo.endCol - mergeInfo.startCol + 1 : 1;
  const cellData = getCellData(cell);
  

  
  // Check if this cell contains a form field
  const isFormField = cell && typeof cell === 'object' && cell.type && cell.id;
  
  return (
    <td 
      ref={dropRef}
      className={`data-cell ${isMerged ? 'merged' : ''} ${isSelected ? 'selected' : ''} ${canDrop && isOver ? 'drop-target' : ''}`}
      rowSpan={rowSpan}
      colSpan={colSpan}
      onClick={() => onCellClick(rowIndex, colIndex)}
      onDoubleClick={() => onCellDoubleClick(rowIndex, colIndex)}
      style={{ 
        ...getCellStyle(cell), 
        width: getColumnWidth(colIndex),
        backgroundColor: canDrop && isOver ? '#e3f2fd' : getCellStyle(cell).backgroundColor,
        border: canDrop && isOver ? '2px dashed #2196f3' : getCellStyle(cell).border
      }}
      title={canDrop ? 'Drop form field here' : ''}
    >
      {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
        <Input
          value={cellData.content}
          onChange={(e) => {
            onCellChange(rowIndex, colIndex, e.target.value);
          }}
          onBlur={() => onCellDoubleClick(null)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onCellDoubleClick(null);
            }
          }}
          autoFocus
          style={{ 
            background: 'transparent', 
            border: 'none', 
            outline: 'none',
            color: cellData.formatting.color,
            fontSize: cellData.formatting.fontSize,
            fontWeight: cellData.formatting.fontWeight,
            fontStyle: cellData.formatting.italic ? 'italic' : 'normal'
          }}
        />
      ) : isFormField ? (
        // Render form field indicator with edit/delete options
        <div className="spreadsheet-form-field-container">
          <div className="spreadsheet-form-field" title={`${cell.type} field: ${cell.label || 'Untitled'}`}>
            {cell.type.toUpperCase()}: {cell.label || 'Field'}
          </div>
          <div className="spreadsheet-form-field-actions">
            <button
              className="spreadsheet-field-edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEditFormField(rowIndex, colIndex);
              }}
              title="Edit field"
            >
              ✏️
            </button>
            <button
              className="spreadsheet-field-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFormField(rowIndex, colIndex);
              }}
              title="Delete field"
            >
              🗑️
            </button>
          </div>
        </div>
      ) : (
        <span className="cell-content">
          {formatCellValue(cellData.content, cellData.formatting)}
        </span>
      )}
    </td>
  );
}

export default function SpreadsheetComponent({ field, onChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSelection, setMergeSelection] = useState({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 });
  const [selectedCell, setSelectedCell] = useState(null);
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const [activeFormattingTab, setActiveFormattingTab] = useState('font');
  const [columnWidths, setColumnWidths] = useState({});
  const [resizingColumn, setResizingColumn] = useState(null);

  const [fieldEditModal, setFieldEditModal] = useState(null); // For editing form fields in cells

  const { sheets = [], activeSheet = 0 } = field;
  const currentSheet = sheets[activeSheet] || { data: [], headers: [], rows: 0, cols: 0 };
  


  // Helper function to get cell data (support both old string format and new object format)
  const getCellData = (cell) => {
    if (typeof cell === 'string') {
      return { content: cell, formatting: getDefaultFormatting() };
    }
    return { content: cell.content || '', formatting: { ...getDefaultFormatting(), ...cell.formatting } };
  };

  // Default formatting for cells
  const getDefaultFormatting = () => ({
    // Font Group
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    bold: false,
    italic: false,
    underline: 'none', // 'none', 'single', 'double'
    strikethrough: false,
    textTransform: 'none', // 'none', 'subscript', 'superscript'
    fontWeight: 'normal',
    color: '#000000',
    backgroundColor: '#ffffff',
    
    // Alignment Group
    textAlign: 'left', // 'left', 'center', 'right', 'justify'
    verticalAlign: 'middle', // 'top', 'middle', 'bottom'
    whiteSpace: 'nowrap', // 'nowrap', 'pre-wrap' for text wrapping
    textOrientation: 0, // rotation angle in degrees
    paddingLeft: 0, // for indentation
    
    // Number Group
    numberFormat: 'general', // 'general', 'number', 'currency', 'percentage', etc.
    decimalPlaces: 2,
    currencySymbol: '$',
    
    // Styles Group
    conditionalFormatting: null
  });

  const handleCellChange = (rowIndex, colIndex, value, isFormField = false) => {
    const newSheets = [...sheets];
    const currentCellData = getCellData(newSheets[activeSheet].data[rowIndex][colIndex]);
    
    newSheets[activeSheet] = {
      ...newSheets[activeSheet],
      data: newSheets[activeSheet].data.map((row, rIndex) =>
        rIndex === rowIndex
          ? row.map((cell, cIndex) => {
              if (cIndex === colIndex) {
                if (isFormField) {
                  // Store the entire form field object
                  return {
                    ...value, // Form field object with id, type, label, options, etc.
                    content: value.content || '',
                    formatting: currentCellData.formatting
                  };
                } else {
                return {
                  content: value,
                  formatting: currentCellData.formatting
                };
                }
              }
              return cell;
            })
          : row
      )
    };
    onChange({ ...field, sheets: newSheets });
  };

  // Handle dropping form fields into cells
  const handleFormFieldDrop = (rowIndex, colIndex, formField) => {
    // Generate a unique ID for the form field if it doesn't have one
    const fieldWithId = {
      ...formField,
      id: formField.id || `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: '', // Initialize empty content
      formatting: getCellData(sheets[activeSheet].data[rowIndex][colIndex]).formatting
    };
    
    handleCellChange(rowIndex, colIndex, fieldWithId, true);
  };

  // Handle editing form fields in cells
  const handleEditFormField = (rowIndex, colIndex) => {
    const cell = sheets[activeSheet].data[rowIndex][colIndex];
    if (cell && typeof cell === 'object' && cell.type && cell.id) {
      setFieldEditModal({
        rowIndex,
        colIndex,
        field: { ...cell }
      });
    }
  };

  // Handle dropping form field onto entire column
  const handleColumnFormFieldDrop = (colIndex, formField) => {
    try {
      if (!sheets || !sheets[activeSheet] || !formField) {
        console.error('Invalid drop parameters');
        return;
      }

      const fieldWithId = {
        ...formField,
        id: formField.id || `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: '', // Initialize empty content
      };
      
      const newSheets = [...sheets];
      const currentSheetData = newSheets[activeSheet];
      
      if (!currentSheetData || !currentSheetData.data) {
        console.error('Invalid sheet data');
        return;
      }
      
      // Apply the form field to all rows in this column
      currentSheetData.data.forEach((row, rowIndex) => {
        // Ensure the row has enough columns
        while (row.length <= colIndex) {
          row.push('');
        }
        
        // Get existing formatting or use defaults
        const existingCell = row[colIndex];
        const formatting = (existingCell && typeof existingCell === 'object' && existingCell.formatting) 
          ? existingCell.formatting 
          : {};
        
        // Create a unique field instance for each cell
        const cellFieldWithId = {
          ...fieldWithId,
          id: `${fieldWithId.id}-row-${rowIndex}`,
          content: '',
          formatting: formatting
        };
        
        row[colIndex] = cellFieldWithId;
      });
      
      // Create updated field object with new sheets data
      const updatedField = {
        ...field,
        sheets: newSheets
      };
      
      onChange(updatedField);
    } catch (error) {
      console.error('Error in handleColumnFormFieldDrop:', error);
    }
  };



  // Check if a column has form fields
  const columnHasFormFields = (colIndex) => {
    try {
      if (!sheets || !sheets[activeSheet] || !sheets[activeSheet].data) {
        return false;
      }
      
      return sheets[activeSheet].data.some(row => {
        if (!row || colIndex >= row.length) {
          return false;
        }
        const cell = row[colIndex];
        return cell && typeof cell === 'object' && cell.type && cell.id;
      });
    } catch (error) {
      console.error('Error in columnHasFormFields:', error);
      return false;
    }
  };

  // Handle deleting form fields from cells
  const handleDeleteFormField = (rowIndex, colIndex) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this form field?');
    if (confirmDelete) {
      // Replace with empty cell
      handleCellChange(rowIndex, colIndex, '', false);
    }
  };

  // Handle saving edited form field
  const handleSaveFormField = (updatedField) => {
    if (fieldEditModal) {
      const { rowIndex, colIndex } = fieldEditModal;
      handleCellChange(rowIndex, colIndex, updatedField, true);
      setFieldEditModal(null);
    }
  };

  const handleCellFormatting = (rowIndex, colIndex, formatting) => {
    const newSheets = [...sheets];
    const currentCellData = getCellData(newSheets[activeSheet].data[rowIndex][colIndex]);
    
    newSheets[activeSheet] = {
      ...newSheets[activeSheet],
      data: newSheets[activeSheet].data.map((row, rIndex) =>
        rIndex === rowIndex
          ? row.map((cell, cIndex) => {
              if (cIndex === colIndex) {
                return {
                  content: currentCellData.content,
                  formatting: { ...currentCellData.formatting, ...formatting }
                };
              }
              return cell;
            })
          : row
      )
    };
    onChange({ ...field, sheets: newSheets });
  };

  const handleHeaderChange = (colIndex, value) => {
    const newSheets = [...sheets];
    newSheets[activeSheet] = {
      ...newSheets[activeSheet],
      headers: newSheets[activeSheet].headers.map((header, index) =>
        index === colIndex ? value : header
      )
    };
    onChange({ ...field, sheets: newSheets });
  };

  const addSheet = () => {
    const newSheet = {
      name: `Sheet ${sheets.length + 1}`,
      rows: 5,
      cols: 5,
      headers: Array.from({ length: 5 }, (_, i) => `Column ${i + 1}`),
      data: Array.from({ length: 5 }, () => 
        Array.from({ length: 5 }, () => ({ content: '', formatting: getDefaultFormatting() }))
      ),
      mergedCells: []
    };
    onChange({ ...field, sheets: [...sheets, newSheet] });
  };

  const deleteSheet = (sheetIndex) => {
    const newSheets = sheets.filter((_, index) => index !== sheetIndex);
    const newActiveSheet = newSheets.length > 0 ? Math.min(activeSheet, newSheets.length - 1) : 0;
    onChange({ ...field, sheets: newSheets, activeSheet: newActiveSheet });
  };

  const addRow = () => {
    const newSheets = [...sheets];
    const currentData = newSheets[activeSheet].data;
    const newRow = Array.from({ length: currentData[0]?.length || 5 }, () => ({ 
      content: '', 
      formatting: getDefaultFormatting() 
    }));
    newSheets[activeSheet] = {
      ...newSheets[activeSheet],
      data: [...currentData, newRow],
      rows: currentData.length + 1
    };
    onChange({ ...field, sheets: newSheets });
  };

  const addColumn = () => {
    const newSheets = [...sheets];
    const currentData = newSheets[activeSheet].data;
    const currentHeaders = newSheets[activeSheet].headers;
    const newColIndex = currentHeaders.length;
    
    newSheets[activeSheet] = {
      ...newSheets[activeSheet],
      data: currentData.map(row => [...row, { content: '', formatting: getDefaultFormatting() }]),
      headers: [...currentHeaders, `Column ${newColIndex + 1}`],
      cols: newColIndex + 1
    };
    onChange({ ...field, sheets: newSheets });
  };

  const deleteRow = (rowIndex) => {
    const newSheets = [...sheets];
    newSheets[activeSheet] = {
      ...newSheets[activeSheet],
      data: newSheets[activeSheet].data.filter((_, index) => index !== rowIndex),
      rows: newSheets[activeSheet].data.length - 1
    };
    onChange({ ...field, sheets: newSheets });
  };

  const deleteColumn = (colIndex) => {
    const newSheets = [...sheets];
    newSheets[activeSheet] = {
      ...newSheets[activeSheet],
      data: newSheets[activeSheet].data.map(row => row.filter((_, index) => index !== colIndex)),
      headers: newSheets[activeSheet].headers.filter((_, index) => index !== colIndex),
      cols: newSheets[activeSheet].headers.length - 1
    };
    onChange({ ...field, sheets: newSheets });
  };

  const handleMergeCells = () => {
    const newSheets = [...sheets];
    const { startRow, startCol, endRow, endCol } = mergeSelection;
    const mergedCell = {
      startRow: Math.min(startRow, endRow),
      startCol: Math.min(startCol, endCol),
      endRow: Math.max(startRow, endRow),
      endCol: Math.max(startCol, endCol)
    };
    
    newSheets[activeSheet] = {
      ...newSheets[activeSheet],
      mergedCells: [...(newSheets[activeSheet].mergedCells || []), mergedCell]
    };
    onChange({ ...field, sheets: newSheets });
    setMergeModalOpen(false);
  };

  const isCellMerged = (rowIndex, colIndex) => {
    return (currentSheet.mergedCells || []).some(merge => 
      rowIndex >= merge.startRow && rowIndex <= merge.endRow &&
      colIndex >= merge.startCol && colIndex <= merge.endCol
    );
  };

  const getMergedCellInfo = (rowIndex, colIndex) => {
    return (currentSheet.mergedCells || []).find(merge => 
      rowIndex >= merge.startRow && rowIndex <= merge.endRow &&
      colIndex >= merge.startCol && colIndex <= merge.endCol
    );
  };

  const isMergeStart = (rowIndex, colIndex) => {
    const merge = getMergedCellInfo(rowIndex, colIndex);
    return merge && rowIndex === merge.startRow && colIndex === merge.startCol;
  };

  const handleCellClick = (rowIndex, colIndex) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
    setShowFormattingToolbar(true);
  };

  const getCurrentCellFormatting = () => {
    if (!selectedCell) return getDefaultFormatting();
    const cell = currentSheet.data[selectedCell.row]?.[selectedCell.col];
    return getCellData(cell).formatting;
  };

  const applyFormatting = (formatting) => {
    if (!selectedCell) return;
    handleCellFormatting(selectedCell.row, selectedCell.col, formatting);
  };

  const toggleBold = () => {
    const current = getCurrentCellFormatting();
    applyFormatting({ bold: !current.bold, fontWeight: !current.bold ? 'bold' : 'normal' });
  };

  const toggleItalic = () => {
    const current = getCurrentCellFormatting();
    applyFormatting({ italic: !current.italic });
  };

  const changeFontSize = (size) => {
    applyFormatting({ fontSize: size });
  };

  const changeFontWeight = (weight) => {
    applyFormatting({ fontWeight: weight, bold: weight === 'bold' });
  };

  // Font Group Functions
  const changeFontFamily = (family) => {
    applyFormatting({ fontFamily: family });
  };

  const toggleUnderline = () => {
    const current = getCurrentCellFormatting();
    const nextUnderline = current.underline === 'none' ? 'single' : 
                         current.underline === 'single' ? 'double' : 'none';
    applyFormatting({ underline: nextUnderline });
  };

  const toggleStrikethrough = () => {
    const current = getCurrentCellFormatting();
    applyFormatting({ strikethrough: !current.strikethrough });
  };

  const setTextTransform = (transform) => {
    applyFormatting({ textTransform: transform });
  };

  const clearFormatting = () => {
    if (!selectedCell) return;
    const cellData = getCellData(currentSheet.data[selectedCell.row][selectedCell.col]);
    handleCellFormatting(selectedCell.row, selectedCell.col, { 
      ...getDefaultFormatting(),
      content: cellData.content // preserve content
    });
  };

  // Alignment Group Functions
  const setTextAlign = (align) => {
    applyFormatting({ textAlign: align });
  };

  const setVerticalAlign = (align) => {
    applyFormatting({ verticalAlign: align });
  };

  const toggleTextWrap = () => {
    const current = getCurrentCellFormatting();
    applyFormatting({ whiteSpace: current.whiteSpace === 'nowrap' ? 'pre-wrap' : 'nowrap' });
  };

  const changeIndent = (direction) => {
    const current = getCurrentCellFormatting();
    const newIndent = Math.max(0, current.paddingLeft + (direction === 'increase' ? 20 : -20));
    applyFormatting({ paddingLeft: newIndent });
  };

  const setTextOrientation = (angle) => {
    applyFormatting({ textOrientation: angle });
  };

  // Number Group Functions
  const setNumberFormat = (format) => {
    applyFormatting({ numberFormat: format });
  };

  const changeDecimalPlaces = (direction) => {
    const current = getCurrentCellFormatting();
    const newDecimal = Math.max(0, Math.min(10, current.decimalPlaces + (direction === 'increase' ? 1 : -1)));
    applyFormatting({ decimalPlaces: newDecimal });
  };

  const formatCellValue = (value, formatting) => {
    if (!value || formatting.numberFormat === 'general') return value;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    
    switch (formatting.numberFormat) {
      case 'number':
        return numValue.toFixed(formatting.decimalPlaces);
      case 'currency':
        return `${formatting.currencySymbol}${numValue.toFixed(formatting.decimalPlaces)}`;
      case 'percentage':
        return `${(numValue * 100).toFixed(formatting.decimalPlaces)}%`;
      case 'scientific':
        return numValue.toExponential(formatting.decimalPlaces);
      default:
        return value;
    }
  };

  const getCellStyle = (cell) => {
    const cellData = getCellData(cell);
    const { formatting } = cellData;
    
    let textDecoration = [];
    if (formatting.underline === 'single') textDecoration.push('underline');
    if (formatting.underline === 'double') textDecoration.push('underline');
    if (formatting.strikethrough) textDecoration.push('line-through');
    
    return {
      fontFamily: formatting.fontFamily,
      fontWeight: formatting.fontWeight,
      fontStyle: formatting.italic ? 'italic' : 'normal',
      fontSize: formatting.fontSize,
      color: formatting.color,
      backgroundColor: formatting.backgroundColor,
      textAlign: formatting.textAlign,
      verticalAlign: formatting.verticalAlign,
      whiteSpace: formatting.whiteSpace,
      textDecoration: textDecoration.join(' ') || 'none',
      transform: formatting.textTransform === 'subscript' ? 'translateY(25%) scale(0.8)' :
                 formatting.textTransform === 'superscript' ? 'translateY(-25%) scale(0.8)' :
                 formatting.textOrientation !== 0 ? `rotate(${formatting.textOrientation}deg)` : 'none',
      paddingLeft: `${formatting.paddingLeft}px`,
      borderBottom: formatting.underline === 'double' ? '3px double' : 'none'
    };
  };

  // Column resizing functions
  const startColumnResize = (colIndex, e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Starting column resize for column:', colIndex);
    setResizingColumn(colIndex);
    document.addEventListener('mousemove', handleColumnResize);
    document.addEventListener('mouseup', stopColumnResize);
  };

  const handleColumnResize = (e) => {
    if (resizingColumn !== null) {
      const table = document.querySelector('.spreadsheet-table');
      if (table) {
        const tableRect = table.getBoundingClientRect();
        const newWidth = e.clientX - tableRect.left;
        console.log('Resizing column:', resizingColumn, 'to width:', newWidth);
        setColumnWidths(prev => ({
          ...prev,
          [resizingColumn]: Math.max(80, newWidth)
        }));
      }
    }
  };

  const stopColumnResize = () => {
    setResizingColumn(null);
    document.removeEventListener('mousemove', handleColumnResize);
    document.removeEventListener('mouseup', stopColumnResize);
  };



  const getColumnWidth = (colIndex) => {
    return columnWidths[colIndex] || 120;
  };

  return (
    <div className="spreadsheet-component">
      {/* Sheet Navigation */}
      <div className="spreadsheet-tabs">
        {sheets.map((sheet, index) => (
          <button
            key={index}
            className={`sheet-tab ${index === activeSheet ? 'active' : ''}`}
            onClick={() => onChange({ ...field, activeSheet: index })}
          >
            {sheet.name}
            <span 
              className="delete-sheet" 
              onClick={(e) => { e.stopPropagation(); deleteSheet(index); }}
            >
              ×
            </span>
          </button>
        ))}
        <button className="add-sheet-btn" onClick={addSheet}>
          +
        </button>
      </div>

      {/* Toolbar */}
      <div className="spreadsheet-toolbar">
        <Button size="sm" color="primary" onClick={addRow}>
          Add Row
        </Button>
        <Button size="sm" color="primary" onClick={addColumn}>
          Add Column
        </Button>
        <Button size="sm" color="warning" onClick={() => setMergeModalOpen(true)}>
          Merge Cells
        </Button>
        <Button size="sm" color="info" onClick={() => setIsModalOpen(true)}>
          Settings
        </Button>
        <Button 
          size="sm" 
          color={showFormattingToolbar ? "success" : "secondary"} 
          onClick={() => setShowFormattingToolbar(!showFormattingToolbar)}
        >
          Format
        </Button>
      </div>

      {/* Comprehensive Formatting Toolbar */}
      {showFormattingToolbar && selectedCell && (
        <div className="formatting-toolbar">
          {/* Formatting Tabs */}
          <div className="formatting-tabs">
            <Button
              size="sm"
              color={activeFormattingTab === 'font' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveFormattingTab('font')}
              className="tab-button"
            >
              Font
            </Button>
            <Button
              size="sm"
              color={activeFormattingTab === 'alignment' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveFormattingTab('alignment')}
              className="tab-button"
            >
              Alignment
            </Button>
            <Button
              size="sm"
              color={activeFormattingTab === 'number' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveFormattingTab('number')}
              className="tab-button"
            >
              Number
            </Button>
            <Button
              size="sm"
              color="secondary"
              onClick={() => setSelectedCell(null)}
              title="Close Formatting"
              className="close-button"
            >
              ✕
            </Button>
          </div>

          {/* Font Group */}
          {activeFormattingTab === 'font' && (
            <div className="formatting-content">
              <div className="formatting-row">
                <div className="formatting-section">
                  <label className="formatting-label">Font Family:</label>
                  <Input
                    type="select"
                    value={getCurrentCellFormatting().fontFamily}
                    onChange={(e) => changeFontFamily(e.target.value)}
                    className="formatting-select"
                  >
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="Calibri, sans-serif">Calibri</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                  </Input>
                </div>

                <div className="formatting-section">
                  <label className="formatting-label">Size:</label>
                  <Input
                    type="select"
                    value={getCurrentCellFormatting().fontSize}
                    onChange={(e) => changeFontSize(e.target.value)}
                    className="formatting-select-small"
                  >
                    <option value="8px">8</option>
                    <option value="9px">9</option>
                    <option value="10px">10</option>
                    <option value="11px">11</option>
                    <option value="12px">12</option>
                    <option value="14px">14</option>
                    <option value="16px">16</option>
                    <option value="18px">18</option>
                    <option value="20px">20</option>
                    <option value="24px">24</option>
                    <option value="28px">28</option>
                    <option value="32px">32</option>
                  </Input>
                </div>
              </div>

              <div className="formatting-row">
                <div className="formatting-section">
                  <ButtonGroup>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().bold ? "primary" : "outline-primary"}
                      onClick={toggleBold}
                      title="Bold"
                    >
                      <strong>B</strong>
                    </Button>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().italic ? "primary" : "outline-primary"}
                      onClick={toggleItalic}
                      title="Italic"
                    >
                      <em>I</em>
                    </Button>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().underline !== 'none' ? "primary" : "outline-primary"}
                      onClick={toggleUnderline}
                      title="Underline"
                    >
                      <u>U</u>
                    </Button>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().strikethrough ? "primary" : "outline-primary"}
                      onClick={toggleStrikethrough}
                      title="Strikethrough"
                    >
                      <s>S</s>
                    </Button>
                  </ButtonGroup>
                </div>

                <div className="formatting-section">
                  <ButtonGroup>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().textTransform === 'subscript' ? "primary" : "outline-primary"}
                      onClick={() => setTextTransform(getCurrentCellFormatting().textTransform === 'subscript' ? 'none' : 'subscript')}
                      title="Subscript"
                    >
                      X<sub>2</sub>
                    </Button>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().textTransform === 'superscript' ? "primary" : "outline-primary"}
                      onClick={() => setTextTransform(getCurrentCellFormatting().textTransform === 'superscript' ? 'none' : 'superscript')}
                      title="Superscript"
                    >
                      X<sup>2</sup>
                    </Button>
                  </ButtonGroup>
                </div>
              </div>

              <div className="formatting-row">
                <div className="formatting-section">
                  <label className="formatting-label">Text Color:</label>
                  <Input
                    type="color"
                    value={getCurrentCellFormatting().color}
                    onChange={(e) => applyFormatting({ color: e.target.value })}
                    className="color-picker"
                    title="Text Color"
                  />
                </div>

                <div className="formatting-section">
                  <label className="formatting-label">Fill Color:</label>
                  <Input
                    type="color"
                    value={getCurrentCellFormatting().backgroundColor}
                    onChange={(e) => applyFormatting({ backgroundColor: e.target.value })}
                    className="color-picker"
                    title="Background Color"
                  />
                </div>

                <div className="formatting-section">
                  <Button
                    size="sm"
                    color="warning"
                    onClick={clearFormatting}
                    title="Clear Formatting"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Alignment Group */}
          {activeFormattingTab === 'alignment' && (
            <div className="formatting-content">
              <div className="formatting-row">
                <div className="formatting-section">
                  <label className="formatting-label">Horizontal:</label>
                  <ButtonGroup>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().textAlign === 'left' ? "primary" : "outline-primary"}
                      onClick={() => setTextAlign('left')}
                      title="Align Left"
                    >
                      ⬅
                    </Button>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().textAlign === 'center' ? "primary" : "outline-primary"}
                      onClick={() => setTextAlign('center')}
                      title="Center"
                    >
                      ⬅➡
                    </Button>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().textAlign === 'right' ? "primary" : "outline-primary"}
                      onClick={() => setTextAlign('right')}
                      title="Align Right"
                    >
                      ➡
                    </Button>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().textAlign === 'justify' ? "primary" : "outline-primary"}
                      onClick={() => setTextAlign('justify')}
                      title="Justify"
                    >
                      ≡
                    </Button>
                  </ButtonGroup>
                </div>
              </div>

              <div className="formatting-row">
                <div className="formatting-section">
                  <label className="formatting-label">Vertical:</label>
                  <ButtonGroup>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().verticalAlign === 'top' ? "primary" : "outline-primary"}
                      onClick={() => setVerticalAlign('top')}
                      title="Top"
                    >
                      ⬆
                    </Button>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().verticalAlign === 'middle' ? "primary" : "outline-primary"}
                      onClick={() => setVerticalAlign('middle')}
                      title="Middle"
                    >
                      ⬆⬇
                    </Button>
                    <Button
                      size="sm"
                      color={getCurrentCellFormatting().verticalAlign === 'bottom' ? "primary" : "outline-primary"}
                      onClick={() => setVerticalAlign('bottom')}
                      title="Bottom"
                    >
                      ⬇
                    </Button>
                  </ButtonGroup>
                </div>

                <div className="formatting-section">
                  <Button
                    size="sm"
                    color={getCurrentCellFormatting().whiteSpace === 'pre-wrap' ? "primary" : "outline-primary"}
                    onClick={toggleTextWrap}
                    title="Wrap Text"
                  >
                    ↩ Wrap
                  </Button>
                </div>
              </div>

              <div className="formatting-row">
                <div className="formatting-section">
                  <label className="formatting-label">Indent:</label>
                  <ButtonGroup>
                    <Button
                      size="sm"
                      color="outline-primary"
                      onClick={() => changeIndent('decrease')}
                      title="Decrease Indent"
                    >
                      ⬅
                    </Button>
                    <Button
                      size="sm"
                      color="outline-primary"
                      onClick={() => changeIndent('increase')}
                      title="Increase Indent"
                    >
                      ➡
                    </Button>
                  </ButtonGroup>
                </div>

                <div className="formatting-section">
                  <label className="formatting-label">Rotation:</label>
                  <Input
                    type="range"
                    min="-90"
                    max="90"
                    step="15"
                    value={getCurrentCellFormatting().textOrientation}
                    onChange={(e) => setTextOrientation(parseInt(e.target.value))}
                    className="rotation-slider"
                  />
                  <span className="rotation-value">{getCurrentCellFormatting().textOrientation}°</span>
                </div>
              </div>
            </div>
          )}

          {/* Number Group */}
          {activeFormattingTab === 'number' && (
            <div className="formatting-content">
              <div className="formatting-row">
                <div className="formatting-section">
                  <label className="formatting-label">Format:</label>
                  <Input
                    type="select"
                    value={getCurrentCellFormatting().numberFormat}
                    onChange={(e) => setNumberFormat(e.target.value)}
                    className="formatting-select"
                  >
                    <option value="general">General</option>
                    <option value="number">Number</option>
                    <option value="currency">Currency</option>
                    <option value="percentage">Percentage</option>
                    <option value="scientific">Scientific</option>
                  </Input>
                </div>

                <div className="formatting-section">
                  <label className="formatting-label">Decimals:</label>
                  <ButtonGroup>
                    <Button
                      size="sm"
                      color="outline-primary"
                      onClick={() => changeDecimalPlaces('decrease')}
                      title="Decrease Decimal Places"
                    >
                      .0-
                    </Button>
                    <span className="decimal-display">{getCurrentCellFormatting().decimalPlaces}</span>
                    <Button
                      size="sm"
                      color="outline-primary"
                      onClick={() => changeDecimalPlaces('increase')}
                      title="Increase Decimal Places"
                    >
                      .0+
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spreadsheet Grid */}
      {sheets.length === 0 ? (
        <div className="spreadsheet-empty-state">
          <div className="empty-state-content">
            <i className="ni ni-grid-3x3-gap" style={{ fontSize: '3rem', color: '#6b7280', marginBottom: '1rem' }}></i>
            <h5>Spreadsheet Component</h5>
            <p>All sheets have been deleted. This component will be removed automatically.</p>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '1rem' }}>
              <i className="ni ni-info me-1"></i>
              Drag this component to move it around the canvas
            </div>
          </div>
        </div>
      ) : (
        <div className="spreadsheet-grid">
          <table className="spreadsheet-table">
            <thead>
              <tr>
                <th className="corner-cell"></th>
                {(currentSheet.headers || []).map((header, colIndex) => (
                  <SpreadsheetColumnHeader
                    key={colIndex}
                    colIndex={colIndex}
                    header={header || `Column ${colIndex + 1}`}
                    onHeaderChange={handleHeaderChange}
                    onDeleteColumn={deleteColumn}
                    onColumnFormFieldDrop={handleColumnFormFieldDrop}

                    onStartColumnResize={startColumnResize}
                    getColumnWidth={getColumnWidth}
                    hasFormFields={columnHasFormFields(colIndex)}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {currentSheet.data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="row-header">
                    {rowIndex + 1}
                    <button 
                      className="delete-row-btn"
                      onClick={() => deleteRow(rowIndex)}
                    >
                      ×
                    </button>
                  </td>
                  {row.map((cell, colIndex) => {
                    const mergeInfo = getMergedCellInfo(rowIndex, colIndex);
                    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                    
                    const cellData = getCellData(cell);
                    
                    return (
                      <SpreadsheetDropCell
                        key={colIndex}
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                        cell={cell}
                        mergeInfo={mergeInfo}
                        isSelected={isSelected}

                        editingCell={editingCell}
                        onCellClick={handleCellClick}
                        onCellDoubleClick={(row, col) => setEditingCell(row !== null ? { row, col } : null)}
                        onCellChange={handleCellChange}
                        onFormFieldDrop={handleFormFieldDrop}
                        onEditFormField={handleEditFormField}
                        onDeleteFormField={handleDeleteFormField}
                        getCellData={getCellData}
                        getCellStyle={getCellStyle}
                        formatCellValue={formatCellValue}
                        getColumnWidth={getColumnWidth}

                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Merge Cells Modal */}
      <Modal isOpen={mergeModalOpen} toggle={() => setMergeModalOpen(false)}>
        <ModalHeader toggle={() => setMergeModalOpen(false)}>
          Merge Cells
        </ModalHeader>
        <ModalBody>
          <div className="merge-selection">
            <div className="merge-input">
              <label>Start Row:</label>
              <Input
                type="number"
                min="0"
                max={currentSheet.rows - 1}
                value={mergeSelection.startRow}
                onChange={(e) => setMergeSelection(prev => ({ ...prev, startRow: parseInt(e.target.value) }))}
              />
            </div>
            <div className="merge-input">
              <label>Start Column:</label>
              <Input
                type="number"
                min="0"
                max={currentSheet.cols - 1}
                value={mergeSelection.startCol}
                onChange={(e) => setMergeSelection(prev => ({ ...prev, startCol: parseInt(e.target.value) }))}
              />
            </div>
            <div className="merge-input">
              <label>End Row:</label>
              <Input
                type="number"
                min="0"
                max={currentSheet.rows - 1}
                value={mergeSelection.endRow}
                onChange={(e) => setMergeSelection(prev => ({ ...prev, endRow: parseInt(e.target.value) }))}
              />
            </div>
            <div className="merge-input">
              <label>End Column:</label>
              <Input
                type="number"
                min="0"
                max={currentSheet.cols - 1}
                value={mergeSelection.endCol}
                onChange={(e) => setMergeSelection(prev => ({ ...prev, endCol: parseInt(e.target.value) }))}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleMergeCells}>
            Merge Cells
          </Button>
          <Button color="secondary" onClick={() => setMergeModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(false)}>
        <ModalHeader toggle={() => setIsModalOpen(false)}>
          Spreadsheet Settings
        </ModalHeader>
        <ModalBody>
          <div className="sheet-settings">
            <div className="setting-group">
              <label>Sheet Name:</label>
              <Input
                value={currentSheet.name}
                onChange={(e) => {
                  const newSheets = [...sheets];
                  newSheets[activeSheet] = { ...newSheets[activeSheet], name: e.target.value };
                  onChange({ ...field, sheets: newSheets });
                }}
              />
            </div>
            <div className="setting-group">
              <label>Rows: {currentSheet.rows}</label>
            </div>
            <div className="setting-group">
              <label>Columns: {currentSheet.cols}</label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Form Field Edit Modal */}
      <Modal isOpen={!!fieldEditModal} toggle={() => setFieldEditModal(null)} size="lg">
        <ModalHeader toggle={() => setFieldEditModal(null)}>
          Edit Form Field
        </ModalHeader>
        <ModalBody>
          {fieldEditModal && (
            <FormFieldEditor
              field={fieldEditModal.field}
              onSave={handleSaveFormField}
              onCancel={() => setFieldEditModal(null)}
            />
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}

// Simple form field editor component
function FormFieldEditor({ field, onSave, onCancel }) {
  const [editedField, setEditedField] = useState({ ...field });

  const handleFieldChange = (property, value) => {
    setEditedField(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const handleOptionChange = (index, property, value) => {
    const newOptions = [...(editedField.options || [])];
    newOptions[index] = { ...newOptions[index], [property]: value };
    setEditedField(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    const newOptions = [...(editedField.options || [])];
    newOptions.push({ value: '', label: '' });
    setEditedField(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const removeOption = (index) => {
    const newOptions = [...(editedField.options || [])];
    newOptions.splice(index, 1);
    setEditedField(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  return (
    <div className="form-field-editor">
      <div className="field-editor-section">
        <h5>Basic Properties</h5>
        
        <div className="form-group">
          <label>Field Type:</label>
          <Input
            type="select"
            value={editedField.type}
            onChange={(e) => handleFieldChange('type', e.target.value)}
          >
            <optgroup label="📝 Basics">
              <option value="text">📝 Single Line Text</option>
              <option value="textarea">📄 Multi-line Text</option>
              <option value="number">🔢 Number Input</option>
              <option value="password">🔒 Password Field</option>
              <option value="checkbox">☑️ Single Checkbox</option>
              <option value="select">📋 Dropdown Menu</option>
              <option value="selectboxes">☑️ Multiple Choice</option>
              <option value="radio">⭕ Radio Buttons</option>
            </optgroup>
            <optgroup label="🚀 Advanced">
              <option value="email">📧 Email Address</option>
              <option value="url">🌐 Website URL</option>
              <option value="phone">📱 Phone Number</option>
              <option value="tags">🏷️ Tags Input</option>
              <option value="address">📍 Address Field</option>
              <option value="datetime">📅 Date</option>
              <option value="day">📆 Day Picker</option>
              <option value="time">⏰ Time Picker</option>
              <option value="currency">💰 Money Amount</option>
              <option value="signature">✍️ Digital Signature</option>
              <option value="file">📎 File Upload</option>
            </optgroup>
            <optgroup label="🎨 Layout">
              <option value="htmlelement">🔧 Custom HTML</option>
              <option value="content">📝 Content Box</option>
            </optgroup>
          </Input>
        </div>

        <div className="form-group">
          <label>Label:</label>
          <Input
            type="text"
            value={editedField.label || ''}
            onChange={(e) => handleFieldChange('label', e.target.value)}
            placeholder="Field label"
          />
        </div>

        <div className="form-group">
          <label>Placeholder:</label>
          <Input
            type="text"
            value={editedField.placeholder || ''}
            onChange={(e) => handleFieldChange('placeholder', e.target.value)}
            placeholder="Placeholder text"
          />
        </div>

        <div className="form-group">
          <label>
            <Input
              type="checkbox"
              checked={editedField.required || false}
              onChange={(e) => handleFieldChange('required', e.target.checked)}
            />
            {' '}Required
          </label>
        </div>
      </div>

      {/* Options for Select and Radio fields */}
      {(editedField.type === 'select' || editedField.type === 'radio' || editedField.type === 'selectboxes') && (
        <div className="field-editor-section">
          <h5>{editedField.type === 'selectboxes' ? 'Multiple Choice Options' : 'Options'}</h5>
          {(editedField.options || []).map((option, index) => (
            <div key={index} className="option-editor">
              <Input
                type="text"
                placeholder="Option value"
                value={option.value || ''}
                onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                style={{ marginRight: '10px', width: '40%' }}
              />
              <Input
                type="text"
                placeholder="Option label"
                value={option.label || ''}
                onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                style={{ marginRight: '10px', width: '40%' }}
              />
              <Button color="danger" size="sm" onClick={() => removeOption(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button color="primary" size="sm" onClick={addOption} style={{ marginTop: '10px' }}>
            Add Option
          </Button>
        </div>
      )}

      {/* Text Area specific options */}
      {editedField.type === 'textarea' && (
        <div className="field-editor-section">
          <h5>Text Area Settings</h5>
          <div className="form-group">
            <label>Rows:</label>
            <Input
              type="number"
              min="1"
              max="20"
              value={editedField.rows || 3}
              onChange={(e) => handleFieldChange('rows', parseInt(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Max Length:</label>
            <Input
              type="number"
              min="0"
              value={editedField.maxLength || ''}
              onChange={(e) => handleFieldChange('maxLength', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Leave empty for no limit"
            />
          </div>
        </div>
      )}

      {/* Number field specific options */}
      {(editedField.type === 'number' || editedField.type === 'currency') && (
        <div className="field-editor-section">
          <h5>{editedField.type === 'currency' ? 'Currency Settings' : 'Number Settings'}</h5>
          <div className="form-group">
            <label>Minimum Value:</label>
            <Input
              type="number"
              value={editedField.min || ''}
              onChange={(e) => handleFieldChange('min', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="No minimum"
            />
          </div>
          <div className="form-group">
            <label>Maximum Value:</label>
            <Input
              type="number"
              value={editedField.max || ''}
              onChange={(e) => handleFieldChange('max', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="No maximum"
            />
          </div>
          <div className="form-group">
            <label>Step:</label>
            <Input
              type="number"
              step="0.01"
              value={editedField.step || 1}
              onChange={(e) => handleFieldChange('step', parseFloat(e.target.value))}
            />
          </div>
          {editedField.type === 'currency' && (
            <div className="form-group">
              <label>Currency Symbol:</label>
              <Input
                type="select"
                value={editedField.currency || 'USD'}
                onChange={(e) => handleFieldChange('currency', e.target.value)}
              >
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
                <option value="JPY">¥ JPY</option>
                <option value="INR">₹ INR</option>
              </Input>
            </div>
          )}
        </div>
      )}

      {/* File upload specific options */}
      {editedField.type === 'file' && (
        <div className="field-editor-section">
          <h5>File Upload Settings</h5>
          <div className="form-group">
            <label>Accepted File Types:</label>
            <Input
              type="text"
              value={editedField.accept || ''}
              onChange={(e) => handleFieldChange('accept', e.target.value)}
              placeholder="e.g., .pdf,.doc,.jpg,.png"
            />
          </div>
          <div className="form-group">
            <label>Max File Size (MB):</label>
            <Input
              type="number"
              min="0"
              value={editedField.maxSize || 10}
              onChange={(e) => handleFieldChange('maxSize', parseInt(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>
              <Input
                type="checkbox"
                checked={editedField.multiple || false}
                onChange={(e) => handleFieldChange('multiple', e.target.checked)}
              />
              {' '}Allow Multiple Files
            </label>
          </div>
        </div>
      )}

      {/* Date/Time specific options */}
      {(editedField.type === 'datetime' || editedField.type === 'day' || editedField.type === 'time') && (
        <div className="field-editor-section">
          <h5>Date/Time Settings</h5>
          <div className="form-group">
            <label>Date Format:</label>
            <Input
              type="select"
              value={editedField.format || 'yyyy-MM-dd'}
              onChange={(e) => handleFieldChange('format', e.target.value)}
            >
              <option value="yyyy-MM-dd">YYYY-MM-DD</option>
              <option value="MM/dd/yyyy">MM/DD/YYYY</option>
              <option value="dd/MM/yyyy">DD/MM/YYYY</option>
              <option value="dd-MM-yyyy">DD-MM-YYYY</option>
            </Input>
          </div>
          {editedField.type === 'datetime' && (
            <div className="form-group">
              <label>
                <Input
                  type="checkbox"
                  checked={editedField.enableTime || false}
                  onChange={(e) => handleFieldChange('enableTime', e.target.checked)}
                />
                {' '}Enable Time Selection
              </label>
            </div>
          )}
        </div>
      )}

      {/* HTML Element specific options */}
      {editedField.type === 'htmlelement' && (
        <div className="field-editor-section">
          <h5>HTML Content</h5>
          <div className="form-group">
            <label>HTML Content:</label>
            <Input
              type="textarea"
              rows="6"
              value={editedField.content || ''}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              placeholder="Enter HTML content..."
            />
          </div>
        </div>
      )}

      {/* Content Box specific options */}
      {editedField.type === 'content' && (
        <div className="field-editor-section">
          <h5>Content Settings</h5>
          <div className="form-group">
            <label>Content:</label>
            <Input
              type="textarea"
              rows="4"
              value={editedField.content || ''}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              placeholder="Enter content text..."
            />
          </div>
        </div>
      )}

      {/* Phone specific options */}
      {editedField.type === 'phone' && (
        <div className="field-editor-section">
          <h5>Phone Settings</h5>
          <div className="form-group">
            <label>Phone Format:</label>
            <Input
              type="select"
              value={editedField.phoneFormat || 'US'}
              onChange={(e) => handleFieldChange('phoneFormat', e.target.value)}
            >
              <option value="US">US: (555) 123-4567</option>
              <option value="International">International: +1 555 123 4567</option>
              <option value="Simple">Simple: 5551234567</option>
            </Input>
          </div>
        </div>
      )}

      {/* Tags specific options */}
      {editedField.type === 'tags' && (
        <div className="field-editor-section">
          <h5>Tags Settings</h5>
          <div className="form-group">
            <label>Maximum Tags:</label>
            <Input
              type="number"
              min="1"
              value={editedField.maxTags || ''}
              onChange={(e) => handleFieldChange('maxTags', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="No limit"
            />
          </div>
          <div className="form-group">
            <label>Tag Separator:</label>
            <Input
              type="select"
              value={editedField.separator || ','}
              onChange={(e) => handleFieldChange('separator', e.target.value)}
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value=" ">Space</option>
              <option value="|">Pipe (|)</option>
            </Input>
          </div>
        </div>
      )}

      <div className="field-editor-actions" style={{ marginTop: '20px', textAlign: 'right' }}>
        <Button color="secondary" onClick={onCancel} style={{ marginRight: '10px' }}>
          Cancel
        </Button>
        <Button color="primary" onClick={() => onSave(editedField)}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// Column header component with drop functionality for applying fields to entire columns
function SpreadsheetColumnHeader({ 
  colIndex, 
  header, 
  onHeaderChange, 
  onDeleteColumn, 
  onColumnFormFieldDrop,
  onStartColumnResize,
  getColumnWidth,
  hasFormFields
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: ['FIELD'],
    drop: (item, monitor) => {
      try {
        // Only process drop if it's not over a control element
        const targetElement = monitor.getDropResult()?.element || document.elementFromPoint(monitor.getClientOffset().x, monitor.getClientOffset().y);
        
        // Check if drop is over controls area
        if (targetElement && (
          targetElement.closest('.header-controls') ||
          targetElement.closest('.delete-col-btn') ||
          targetElement.classList.contains('header-controls') ||
          targetElement.classList.contains('delete-col-btn')
        )) {
          return; // Don't process drop over control elements
        }
        
        if (item.type && item.label) {
          onColumnFormFieldDrop(colIndex, item);
        }
      } catch (error) {
        console.error('Error in column drop:', error);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <th 
      ref={dropRef}
      key={colIndex} 
      className={`header-cell ${canDrop && isOver ? 'column-drop-target' : ''} ${hasFormFields ? 'has-form-fields' : ''}`}
      style={{ 
        width: getColumnWidth(colIndex),
        backgroundColor: canDrop && isOver ? '#e3f2fd' : hasFormFields ? '#f0f9ff' : undefined,
        border: canDrop && isOver ? '2px dashed #2196f3' : hasFormFields ? '2px solid #0288d1' : undefined,
        position: 'relative'
      }}
      title={canDrop ? 'Drop form field here to apply to entire column' : hasFormFields ? 'Column contains form fields' : ''}
    >
      {canDrop && isOver && (
        <div className="column-drop-indicator">
          Drop field for entire column
        </div>
      )}
      {hasFormFields && (
        <div className="column-field-indicator" title="This column has form fields">
          📋
        </div>
      )}
      <div className="header-content">
        <Input
          value={header}
          onChange={(e) => onHeaderChange(colIndex, e.target.value)}
          className="header-input"
        />
      </div>
      <div 
        className="header-controls"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >


        <button 
          className="delete-col-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteColumn(colIndex);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          ×
        </button>
      </div>
      <div 
        className="column-resize-handle"
        onMouseDown={(e) => onStartColumnResize(colIndex, e)}
      ></div>
    </th>
  );
} 