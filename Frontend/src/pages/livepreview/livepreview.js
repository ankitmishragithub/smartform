// src/components/LivePreview.js
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {Button} from "reactstrap"
import "../../css/Livepreview.css";
import api from '../../api/api';
import JSpreadsheetComponent from "../../components/JSpreadsheetComponent";
import JSpreadsheetCE4Component from "../../components/JSpreadsheetCE4Component";


// Separate component to handle tabs to avoid hooks issues
function TabsLivePreviewComponent({ node, renderFormNode }) {
  // Safety check for node structure
  if (!node || !node.tabs || !Array.isArray(node.tabs)) {
    console.error('TabsLivePreviewComponent: Invalid node structure', node);
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
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Modern Tab Headers */}
      <div style={{
        display: "flex",
        backgroundColor: "#f8f9ff",
        padding: "8px",
        borderRadius: "12px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        gap: "4px"
      }}>
        {node.tabs.map((tab, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => handleTabClick(index, e)}
            style={{
              flex: 1,
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              background: activeTab === index 
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "transparent",
              color: activeTab === index ? "#ffffff" : "#6b7280",
              boxShadow: activeTab === index 
                ? "0 4px 15px rgba(102, 126, 234, 0.4)" 
                : "none",
              transform: activeTab === index ? "translateY(-1px)" : "none"
            }}
            onMouseEnter={(e) => {
              if (activeTab !== index) {
                e.target.style.backgroundColor = "#e5e7eb";
                e.target.style.color = "#374151";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== index) {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#6b7280";
              }
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>
      
      {/* Modern Tab Content */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
        minHeight: "200px"
      }}>
        {node.tabs[activeTab] && Array.isArray(node.tabs[activeTab].children) && node.tabs[activeTab].children.length > 0 ? (
          node.tabs[activeTab].children.map(child => renderFormNode(child))
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            color: "#9ca3af",
            fontStyle: "italic"
          }}>
            Drop fields here for {node.tabs[activeTab]?.name}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get cell content and styles for live preview
function getCellDisplay(cell) {
  try {
    // Handle form field objects (like select dropdowns) inside cells
    if (typeof cell === 'object' && cell !== null && cell.type && cell.id) {
      // This is a form field object, return special indicator
      return { 
        content: `[${cell.type.toUpperCase()} FIELD: ${cell.label || 'Untitled'}]`, 
        styles: {
          backgroundColor: '#e0f2fe',
          color: '#01579b',
          fontWeight: 'bold',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #0288d1'
        },
        isFormField: true,
        formField: cell
      };
    }

    // Handle new format: {content, formatting}
    if (typeof cell === 'object' && cell !== null && 'content' in cell) {
      const { content, formatting = {} } = cell;
      
      // Check if content is actually a form field object
      if (typeof content === 'object' && content !== null && content.type && content.id) {
        return { 
          content: `[${content.type.toUpperCase()} FIELD: ${content.label || 'Untitled'}]`, 
          styles: {
            backgroundColor: '#e0f2fe',
            color: '#01579b',
            fontWeight: 'bold',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #0288d1'
          },
          isFormField: true,
          formField: content
        };
      }
      
      // Apply basic formatting styles
      const styles = {
        fontFamily: formatting.fontFamily || 'inherit',
        fontSize: formatting.fontSize || 'inherit',
        fontWeight: formatting.bold ? 'bold' : 'normal',
        fontStyle: formatting.italic ? 'italic' : 'normal',
        textDecoration: (() => {
          const decorations = [];
          if (formatting.underline && formatting.underline !== 'none') {
            decorations.push('underline');
          }
          if (formatting.strikethrough) {
            decorations.push('line-through');
          }
          return decorations.length > 0 ? decorations.join(' ') : 'none';
        })(),
        color: formatting.color || 'inherit',
        backgroundColor: formatting.backgroundColor || 'transparent',
        textAlign: formatting.textAlign || 'left',
        verticalAlign: formatting.verticalAlign || 'top',
        whiteSpace: formatting.whiteSpace || 'normal'
      };
      
      // Handle number formatting
      let displayContent = content || '';
      if (formatting.numberFormat && displayContent && !isNaN(displayContent)) {
        const num = parseFloat(displayContent);
        const decimals = formatting.decimalPlaces || 2;
        
        switch (formatting.numberFormat) {
          case 'currency':
            displayContent = `$${num.toFixed(decimals)}`;
            break;
          case 'percentage':
            displayContent = `${(num * 100).toFixed(decimals)}%`;
            break;
          case 'scientific':
            displayContent = num.toExponential(decimals);
            break;
          case 'number':
            displayContent = num.toFixed(decimals);
            break;
          default:
            displayContent = content || '';
        }
      }
      
      return { content: displayContent, styles };
    }
    
    // Handle old format: simple strings
    return { content: cell || '', styles: {} };
  } catch (error) {
    console.warn('Error processing cell data in live preview:', error);
    return { content: String(cell || ''), styles: {} };
  }
}

// Helper function to check if a cell is merged
function isCellMerged(rowIndex, colIndex, mergedCells = []) {
  return mergedCells.some(merge => 
    rowIndex >= merge.startRow && rowIndex <= merge.endRow &&
    colIndex >= merge.startCol && colIndex <= merge.endCol
  );
}

// Helper function to get merge info for a cell
function getMergeInfo(rowIndex, colIndex, mergedCells = []) {
  const merge = mergedCells.find(merge => 
    rowIndex === merge.startRow && colIndex === merge.startCol
  );
  
  if (merge) {
    return {
      rowSpan: merge.endRow - merge.startRow + 1,
      colSpan: merge.endCol - merge.startCol + 1,
      isStartCell: true
    };
  }
  
  // Check if this is a continuation cell (should be hidden)
  const isContinuation = mergedCells.some(merge => 
    rowIndex >= merge.startRow && rowIndex <= merge.endRow &&
    colIndex >= merge.startCol && colIndex <= merge.endCol &&
    !(rowIndex === merge.startRow && colIndex === merge.startCol)
  );
  
  return { isStartCell: false, isContinuation };
}

// Separate component to handle spreadsheet preview with interactive sheet switching
function SpreadsheetPreviewComponent({ node, values, handlePreviewChange }) {
  const { sheets = [], activeSheet = 0 } = node;
  const [currentActiveSheet, setCurrentActiveSheet] = useState(activeSheet);
  const [editableData, setEditableData] = useState({});
  const currentSheet = sheets[currentActiveSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };

  // Initialize editable data when sheet changes
  useEffect(() => {
    const newEditableData = {};
    if (currentSheet.data) {
      currentSheet.data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const cellKey = `${rowIndex}-${colIndex}`;
          const { content } = getCellDisplay(cell);
          // Only initialize empty cells for editing
          if (!content || content.trim() === '') {
            newEditableData[cellKey] = '';
          }
        });
      });
    }
    setEditableData(newEditableData);
  }, [currentActiveSheet, currentSheet.data]);

  const handleCellChange = (rowIndex, colIndex, value) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    setEditableData(prev => ({
      ...prev,
      [cellKey]: value
    }));
  };

  const handleCellKeyDown = (e, rowIndex, colIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move to next editable cell or row
      const nextCol = colIndex + 1;
      const nextRow = rowIndex + 1;
      
      if (nextCol < (currentSheet.headers?.length || 0)) {
        // Move to next column
        const nextCellKey = `${rowIndex}-${nextCol}`;
        const nextInput = document.querySelector(`input[data-cell="${nextCellKey}"]`);
        if (nextInput) {
          nextInput.focus();
        }
      } else if (nextRow < (currentSheet.data?.length || 0)) {
        // Move to first column of next row
        const nextCellKey = `${nextRow}-0`;
        const nextInput = document.querySelector(`input[data-cell="${nextCellKey}"]`);
        if (nextInput) {
          nextInput.focus();
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Move to next editable cell
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

  const handleCellClick = (e, rowIndex, colIndex) => {
    // Just focus, don't select all text
    e.target.focus();
  };
  
  if (sheets.length === 0) {
    return (
      <div style={{ 
        padding: "2rem", 
        textAlign: "center", 
        backgroundColor: "#f8f9fa", 
        border: "2px dashed #dee2e6",
        borderRadius: "8px",
        marginBottom: "1rem"
      }}>
        <i className="ni ni-grid-3x3-gap" style={{ fontSize: "2rem", color: "#6b7280", marginBottom: "0.5rem" }}></i>
        <div style={{ color: "#6b7280" }}>
          <strong>Spreadsheet Component</strong>
          <br />
          <small>No sheets available</small>
        </div>
      </div>
    );
  }



  try {
    return (
      <div style={{ marginBottom: "1rem" }}>
        {/* Interactive Sheet Navigation */}
        <div style={{
          display: "flex",
          backgroundColor: "#f8f9fa",
          padding: "8px",
          borderRadius: "8px",
          marginBottom: "12px",
          gap: "4px",
          overflowX: "auto"
        }}>
          {sheets.map((sheet, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentActiveSheet(index)}
              style={{
                padding: "6px 12px",
                backgroundColor: index === currentActiveSheet ? "#3b82f6" : "#e5e7eb",
                color: index === currentActiveSheet ? "white" : "#374151",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "500",
                whiteSpace: "nowrap",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (index !== currentActiveSheet) {
                  e.target.style.backgroundColor = "#d1d5db";
                }
              }}
              onMouseLeave={(e) => {
                if (index !== currentActiveSheet) {
                  e.target.style.backgroundColor = "#e5e7eb";
                }
              }}
            >
              {sheet.name}
            </button>
          ))}
        </div>

        {/* Spreadsheet Grid */}
        <div style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          overflow: "auto",
          backgroundColor: "white"
        }}>
                  <table 
          className="spreadsheet-preview-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px"
          }}
        >
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{ padding: "8px", border: "1px solid #e5e7eb", fontWeight: "600", minWidth: "40px" }}></th>
                {(currentSheet.headers || []).map((header, colIndex) => (
                  <th key={colIndex} style={{
                    padding: "8px",
                    border: "1px solid #e5e7eb",
                    fontWeight: "600",
                    textAlign: "left",
                    minWidth: "120px"
                  }}>
                    {header || `Column ${colIndex + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(currentSheet.data || []).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td style={{
                    padding: "8px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f8f9fa",
                    fontWeight: "500",
                    textAlign: "center"
                  }}>
                    {rowIndex + 1}
                  </td>
                                  {(row || []).map((cell, colIndex) => {
                  const mergeInfo = getMergeInfo(rowIndex, colIndex, currentSheet.mergedCells);
                  
                  // Skip rendering continuation cells in merged ranges
                  if (mergeInfo.isContinuation) {
                    return null;
                  }
                  
                  const { content, styles, isFormField, formField } = getCellDisplay(cell);
                  const isMerged = isCellMerged(rowIndex, colIndex, currentSheet.mergedCells);
                  const cellKey = `${rowIndex}-${colIndex}`;
                  const isEditable = !isFormField && (!content || content.trim() === '');
                  const displayValue = isEditable ? (editableData[cellKey] || '') : content;
                  
                  return (
                    <td 
                      key={colIndex} 
                      rowSpan={mergeInfo.rowSpan || 1}
                      colSpan={mergeInfo.colSpan || 1}
                      style={{
                        padding: isFormField ? "4px" : "8px",
                        border: "1px solid #e5e7eb",
                        minHeight: "40px",
                        backgroundColor: isMerged ? "rgba(102, 126, 234, 0.1)" : styles.backgroundColor || "transparent",
                        ...styles,
                        position: "relative"
                      }}
                    >
                      {isFormField ? (
                        // Render form field inside cell
                        <div style={{ 
                          width: "100%", 
                          minHeight: "32px",
                          display: "flex",
                          alignItems: "center",
                          fontSize: "12px"
                        }}>
                          {(() => {
                            const fieldStyle = {
                              width: "100%",
                              padding: "4px 8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "12px",
                              backgroundColor: "white"
                            };

                            switch (formField.type) {
                              case 'select':
                                return formField.options ? (
                                  <select 
                                    style={fieldStyle} 
                                    value={values[formField.id] || ""}
                                    onChange={(e) => handlePreviewChange(formField.id, e.target.value)}
                                  >
                                    <option value="">{formField.placeholder || `Select ${formField.label || 'Option'}`}</option>
                                    {formField.options.map((opt, idx) => (
                                      <option key={idx} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <div style={{...fieldStyle, backgroundColor: "#f0f0f0", textAlign: "center"}}>
                                    {formField.label || 'Select Field'}
                                  </div>
                                );

                              case 'radio':
                                return formField.options ? (
                                  <div style={{ 
                                    display: "flex", 
                                    flexDirection: "column", 
                                    gap: "3px",
                                    width: "100%",
                                    maxHeight: "120px",
                                    overflowY: "auto"
                                  }}>
                                    {formField.options.map((opt, idx) => (
                                      <label key={idx} style={{ 
                                        display: "flex", 
                                        alignItems: "center", 
                                        fontSize: "11px",
                                        cursor: "pointer",
                                        padding: "2px 0",
                                        whiteSpace: "nowrap"
                                      }}>
                                        <input 
                                          type="radio" 
                                          name={`radio-${formField.id}`} 
                                          value={opt.value}
                                          style={{ 
                                            marginRight: "6px", 
                                            scale: "0.9",
                                            cursor: "pointer"
                                          }}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              handlePreviewChange(formField.id, opt.value);
                                            }
                                          }}
                                          checked={values[formField.id] === opt.value}
                                        />
                                        <span style={{ fontSize: "10px", lineHeight: "1.2" }}>
                                          {opt.label}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{...fieldStyle, backgroundColor: "#f0f0f0", textAlign: "center"}}>
                                    {formField.label || 'Radio Field'}
                                  </div>
                                );

                              case 'selectboxes':
                                return formField.options ? (
                                  <div style={{ 
                                    display: "flex", 
                                    flexDirection: "column", 
                                    gap: "3px",
                                    width: "100%",
                                    maxHeight: "120px",
                                    overflowY: "auto"
                                  }}>
                                    {formField.options.map((opt, idx) => (
                                      <label key={idx} style={{ 
                                        display: "flex", 
                                        alignItems: "center", 
                                        fontSize: "11px",
                                        cursor: "pointer",
                                        padding: "2px 0",
                                        whiteSpace: "nowrap"
                                      }}>
                                        <input 
                                          type="checkbox" 
                                          value={opt.value}
                                          style={{ 
                                            marginRight: "6px", 
                                            scale: "0.9",
                                            cursor: "pointer"
                                          }}
                                          onChange={(e) => {
                                            // Handle multiple choice selection
                                            const currentValues = values[formField.id] || [];
                                            if (e.target.checked) {
                                              if (!currentValues.includes(opt.value)) {
                                                handlePreviewChange(formField.id, [...currentValues, opt.value]);
                                              }
                                            } else {
                                              handlePreviewChange(formField.id, currentValues.filter(v => v !== opt.value));
                                            }
                                          }}
                                          checked={(values[formField.id] || []).includes(opt.value)}
                                        />
                                        <span style={{ fontSize: "10px", lineHeight: "1.2" }}>
                                          {opt.label}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{...fieldStyle, backgroundColor: "#f0f0f0", textAlign: "center"}}>
                                    {formField.label || 'Multiple Choice'}
                                  </div>
                                );

                              case 'text':
                              case 'email':
                              case 'url':
                              case 'password':
                                return (
                                  <input
                                    type={formField.type}
                                    placeholder={formField.placeholder || formField.label}
                                    style={fieldStyle}
                                    value={values[formField.id] || ""}
                                    onChange={(e) => handlePreviewChange(formField.id, e.target.value)}
                                    required={formField.required}
                                  />
                                );

                              case 'textarea':
                                return (
                                  <textarea
                                    placeholder={formField.placeholder || formField.label}
                                    rows={Math.min(formField.rows || 2, 3)}
                                    style={{...fieldStyle, resize: "none"}}
                                    value={values[formField.id] || ""}
                                    onChange={(e) => handlePreviewChange(formField.id, e.target.value)}
                                    required={formField.required}
                                  />
                                );

                              case 'number':
                              case 'currency':
                                return (
                                  <input
                                    type="number"
                                    placeholder={formField.placeholder || formField.label}
                                    min={formField.min}
                                    max={formField.max}
                                    step={formField.step}
                                    style={fieldStyle}
                                    value={values[formField.id] || ""}
                                    onChange={(e) => handlePreviewChange(formField.id, e.target.value)}
                                    required={formField.required}
                                  />
                                );

                              case 'phone':
                                return (
                                  <input
                                    type="tel"
                                    placeholder={formField.placeholder || "Phone number"}
                                    style={fieldStyle}
                                    value={values[formField.id] || ""}
                                    onChange={(e) => handlePreviewChange(formField.id, e.target.value)}
                                    required={formField.required}
                                  />
                                );

                              case 'datetime':
                              case 'day':
                                return (
                                  <input
                                    type="date"
                                    placeholder={formField.placeholder || formField.label}
                                    style={fieldStyle}
                                    value={values[formField.id] || ""}
                                    onChange={(e) => handlePreviewChange(formField.id, e.target.value)}
                                    required={formField.required}
                                  />
                                );

                              case 'time':
                                return (
                                  <input
                                    type="time"
                                    placeholder={formField.placeholder || formField.label}
                                    style={fieldStyle}
                                    value={values[formField.id] || ""}
                                    onChange={(e) => handlePreviewChange(formField.id, e.target.value)}
                                    required={formField.required}
                                  />
                                );

                              case 'checkbox':
                                return (
                                  <label style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    fontSize: "12px",
                                    cursor: "pointer"
                                  }}>
                                    <input 
                                      type="checkbox" 
                                      style={{ marginRight: "6px", cursor: "pointer" }}
                                      checked={Boolean(values[formField.id])}
                                      onChange={(e) => handlePreviewChange(formField.id, e.target.checked)}
                                      required={formField.required}
                                    />
                                    {formField.label || 'Checkbox'}
                                  </label>
                                );

                              case 'file':
                                return (
                                  <div style={{
                                    ...fieldStyle,
                                    backgroundColor: "#f8f9fa",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    borderStyle: "dashed"
                                  }}>
                                    📎 {formField.label || 'File Upload'}
                                  </div>
                                );

                              case 'signature':
                                return (
                                  <div style={{
                                    ...fieldStyle,
                                    backgroundColor: "#f8f9fa",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    borderStyle: "dashed",
                                    minHeight: "40px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}>
                                    ✍️ {formField.label || 'Signature'}
                                  </div>
                                );

                              case 'tags':
                                return (
                                  <div style={{
                                    ...fieldStyle,
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "2px",
                                    alignItems: "center"
                                  }}>
                                    <span style={{
                                      backgroundColor: "#e0f2fe",
                                      color: "#01579b",
                                      padding: "1px 4px",
                                      borderRadius: "2px",
                                      fontSize: "9px"
                                    }}>
                                      Tag 1
                                    </span>
                                    <span style={{
                                      backgroundColor: "#e0f2fe",
                                      color: "#01579b",
                                      padding: "1px 4px",
                                      borderRadius: "2px",
                                      fontSize: "9px"
                                    }}>
                                      Tag 2
                                    </span>
                                  </div>
                                );

                              case 'address':
                                return (
                                  <div style={{ fontSize: "10px", lineHeight: "1.2" }}>
                                    <div>📍 {formField.label || 'Address'}</div>
                                    <div style={{ color: "#666" }}>Street, City, State ZIP</div>
                                  </div>
                                );

                              case 'htmlelement':
                                return (
                                  <div style={{
                                    ...fieldStyle,
                                    backgroundColor: "#fff8e1",
                                    color: "#e65100",
                                    textAlign: "center",
                                    fontSize: "10px"
                                  }}>
                                    🔧 HTML: {formField.label || 'Custom HTML'}
                                  </div>
                                );

                              case 'content':
                                return (
                                  <div style={{
                                    padding: "4px",
                                    fontSize: "10px",
                                    color: "#333",
                                    backgroundColor: "#f9f9f9",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "3px"
                                  }}>
                                    📝 {formField.content || formField.label || 'Content Box'}
                                  </div>
                                );

                              default:
                                // For unsupported field types, show a styled indicator
                                return (
                                  <div style={{
                                    backgroundColor: "#e0f2fe",
                                    color: "#01579b",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    border: "1px solid #0288d1",
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    width: "100%"
                                  }}>
                                    {formField.type.toUpperCase()}: {formField.label || 'Field'}
                                  </div>
                                );
                            }
                          })()}
                        </div>
                      ) : isEditable ? (
                        <input
                          type="text"
                          value={displayValue}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
                          onClick={(e) => handleCellClick(e, rowIndex, colIndex)}
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
                            padding: "0",
                            margin: "0",
                            position: "absolute",
                            top: "0",
                            left: "0",
                            right: "0",
                            bottom: "0"
                          }}
                          className="preview-cell-input"
                        />
                      ) : (
                        <span style={{ ...styles }}>
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
  } catch (error) {
    console.error('Error rendering spreadsheet preview:', error);
    return (
      <div style={{ 
        padding: "1rem", 
        backgroundColor: "#fee2e2", 
        border: "1px solid #fecaca",
        borderRadius: "8px",
        marginBottom: "1rem"
      }}>
        <div style={{ color: "#dc2626", fontWeight: "600" }}>
          ⚠️ Error displaying spreadsheet
        </div>
        <div style={{ color: "#7f1d1d", fontSize: "12px", marginTop: "4px" }}>
          Please check the spreadsheet data format
        </div>
      </div>
    );
  }
}

export default function LivePreview({ fields, values, onChange, folderName }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen((open) => !open);
  const handlePreviewChange = (id, val) => onChange(id, val);

  const SaveForm = async () => {
    if(!fields || fields.length === 0) {
      alert("No fields to save");
      return;
    }
    if(!folderName || !folderName.trim()) {
      alert("Please enter a folder name before saving");
      return;
    }
    try {
      // Add folderName to schema just like heading
      const schemaWithFolder = [
        {
          id: "form-folder",
          type: "folderName",
          label: folderName.trim()
        },
        ...fields
      ];
      
      const payload = {
        schemaJson: schemaWithFolder
      };
      
      console.log("📤 SENDING TO API:", {
        schemaJson: payload.schemaJson,
        fieldsLength: schemaWithFolder.length,
        folderName: folderName.trim()
      });
      
      const { data } = await api.post('/forms', payload);
      console.log("✅ Form saved:", data);
      alert(`Saved! New form ID is ${data._id}`);
      //history.push('/admin/forms');
    } catch (err) {
      console.error("❌ Save error:", err);
      console.error("❌ Error response:", err.response?.data);
      alert('Save failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // DashLite-styled form controls
  function renderDashliteInput(f, id) {
    const val = f.type === "checkbox"
      ? Boolean(values[f.id])
      : values[f.id] ?? "";
      


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
              id={id}
              type={f.type}
              className="form-control form-control-sm"
              placeholder={f.placeholder}
              required={f.required}
              value={val}
              onChange={e => handlePreviewChange(f.id, e.target.value)}
              aria-invalid={isTooLong}
              aria-describedby={isTooLong ? `${id}-warn` : undefined}
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
            id={id}
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
              handlePreviewChange(f.id, newValue);
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
      case "phone":
        // soft limit: allow exceeding but warn
        const isPhoneTooLong = f.maxLength && (val || '').length > f.maxLength;

        return (
          <div style={{ position: 'relative' }}>
            <input
              id={id}
              type="tel"
              className="form-control form-control-sm"
              placeholder={f.placeholder}
              required={f.required}
              value={val}
              onChange={e => {
                // Only allow numbers, spaces, dashes, parentheses, and plus sign
                let phoneValue = e.target.value.replace(/[^0-9\s\-\(\)\+]/g, '');
                handlePreviewChange(f.id, phoneValue);
              }}
              aria-invalid={isPhoneTooLong}
              aria-describedby={isPhoneTooLong ? `${id}-warn` : undefined}
              style={{
                borderColor: isPhoneTooLong ? '#dc3545' : undefined,
                backgroundColor: isPhoneTooLong ? '#fff5f5' : undefined
              }}
              onKeyPress={e => {
                // Prevent non-numeric characters (except allowed symbols)
                const allowedChars = /[0-9\s\-\(\)\+]/;
                if (!allowedChars.test(e.key)) {
                  e.preventDefault();
                  return;
                }
              }}
            />
            {f.maxLength && (
              <div style={{ fontSize: '0.65em', marginTop: 4 }}>
                {(val || '').length}/{f.maxLength}
                {isPhoneTooLong && <span style={{ color: '#dc3545' }}> — exceeds limit</span>}
              </div>
            )}

          </div>
        );
      case "datetime":
        return (
          <input
            id={id}
            type="date"
            className="form-control form-control-sm"
            required={f.required}
            value={val || f.value || (() => {
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })()}
            onChange={e => handlePreviewChange(f.id, e.target.value)}
          />
        );
      case "day": {
        const weekdays = [
          "Sunday", "Monday", "Tuesday", "Wednesday", 
          "Thursday", "Friday", "Saturday"
        ];
        const currentDay = weekdays[new Date().getDay()];
        return (
          <select
            id={id}
            className="form-control form-control-sm"
            required={f.required}
            value={val || f.value || currentDay}
            onChange={e => handlePreviewChange(f.id, e.target.value)}
          >
            <option value="" disabled>Choose a day…</option>
            {weekdays.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        );
      }
      case "time":
        return (
          <input
            id={id}
            type="time"
            className="form-control form-control-sm"
            required={f.required}
            value={val || f.value || new Date().toTimeString().slice(0, 5)}
            onChange={e => handlePreviewChange(f.id, e.target.value)}
          />
        );
      case "signature":
        return (
          <input
            id={id}
            type="text"
            className="form-control form-control-sm"
            placeholder="Type your signature here..."
            required={f.required}
            value={val}
            onChange={e => handlePreviewChange(f.id, e.target.value)}
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



      case "textarea":
        // soft limit: allow exceeding but warn
        const isTextareaTooLong = f.maxLength && (val || '').length > f.maxLength;
        const lineCount = (val || '').split('\n').length;
        const isTooManyLines = f.rows && lineCount > f.rows;

        return (
          <div style={{ position: 'relative' }}>
            <textarea
              id={id}
              className="form-control"
              rows={f.rows || "3"}
              placeholder={f.placeholder}
              required={f.required}
              value={val}
              onChange={e => handlePreviewChange(f.id, e.target.value)}
              aria-invalid={isTextareaTooLong || isTooManyLines}
              aria-describedby={(isTextareaTooLong || isTooManyLines) ? `${id}-warn` : undefined}
              style={{
                borderColor: (isTextareaTooLong || isTooManyLines) ? '#dc3545' : undefined,
                backgroundColor: (isTextareaTooLong || isTooManyLines) ? '#fff5f5' : undefined
              }}
            />
            {(f.maxLength || f.rows) && (
              <div style={{ fontSize: '0.65em', marginTop: 4 }}>
                {f.maxLength && `${(val || '').length}/${f.maxLength}`}
                {f.maxLength && f.rows && ' | '}
                {f.rows && `${lineCount}/${f.rows} lines`}
                {(isTextareaTooLong || isTooManyLines) && <span style={{ color: '#dc3545' }}> — exceeds limit</span>}
              </div>
            )}

          </div>
        );

      case "select": {
  const listId = `list-${id}`;           // unique id for this datalist
  const opts = (f.options || []).map((o) => {
    const text =
      typeof o === "object"
        ? o.value ?? o.question ?? o.label ?? JSON.stringify(o)
        : o;
    return text;
  });

  return (
    <>
      <input
        id={id}
        list={listId}
        className="form-control form-control-sm"
        placeholder="Type to search or choose…"
        required={f.required}
        value={val}
        onChange={e => handlePreviewChange(f.id, e.target.value)}
      />
      <datalist id={listId}>
        {opts.map((opt, i) => (
          <option key={i} value={opt} />
        ))}
      </datalist>
    </>
  );
}

      case "file":
        return (
          <input
            id={id}
            type="file"
            className="form-control form-control-sm"
            onChange={e => handlePreviewChange(f.id, e.target.files[0])}
          />
        );

      case "checkbox":
        return (
          <div className="form-check">
            <input
              id={id}
              className="form-check-input"
              type="checkbox"
              checked={val}
              onChange={e => handlePreviewChange(f.id, e.target.checked)}
            />
            <label htmlFor={id} className="form-check-label">
              {f.label}
            </label>
          </div>
        );

      case "radio":
  return (
    <div className="form-check-group">
      {(f.options || []).map((o, i) => {
        const opt = typeof o === "object"
          ? (o.value ?? o.question ?? o.label ?? JSON.stringify(o))
          : o;
        return (
          <div key={i} className="form-check form-check-inline">
            <input
              id={`${id}-${i}`}
              className="form-check-input"
              type="radio"
              name={f.id}
              value={opt}
              checked={val === opt}
              onChange={e => handlePreviewChange(f.id, e.target.value)}
            />
            <label htmlFor={`${id}-${i}`} className="form-check-label">
              {opt}
            </label>
          </div>
        );
      })}
    </div>
  );

      case "phone Number":
      return (
        <input
          type="tel"
          placeholder={f.placeholder || "Enter phone number"}
          required={f.required}
          value={val}
          onChange={e => handlePreviewChange(f.id, e.target.value)}
          className="input-field"
        />
      );

    case "tags":
      return (
        <input
          type="text"
          placeholder={f.placeholder || "tag1, tag2, ..."}
          required={f.required}
          value={val}
          onChange={e => handlePreviewChange(f.id, e.target.value)}
          className="input-field"
        />
      );

    case "address":
      return (
        <textarea
          placeholder={f.placeholder || "Enter address"}
          required={f.required}
          value={val}
          onChange={e => handlePreviewChange(f.id, e.target.value)}
          className="textarea-field"
        />
      );

    case "datetime":
      return (
        <input
          type="datetime-local"
          required={f.required}
          value={val}
          onChange={e => handlePreviewChange(f.id, e.target.value)}
          className="input-field"
        />
      );

    case "day": {
      const weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ];
      return (
        <select
          required={f.required}
          value={val}
          onChange={e => handlePreviewChange(f.id, e.target.value)}
          className="input-field"
        >
          <option value="" disabled>Choose a day…</option>
          {weekdays.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      );}

          case "currency":
        return (
          <div className="currency-input">
            <span>$</span>
            <input
              type="number"
              step="0.01"
              required={f.required}
              value={val}
              onChange={e => handlePreviewChange(f.id, e.target.value)}
              className="input-field"
            />
          </div>
        );





      default:
        // fallback
        return <input id={id} type="text" className="form-control form-control-sm" disabled />;
    }
  }

  // Recursively render columns / tables / leaf fields
  function renderFormNode(node) {
    // ✅ Heading node
    if (node.type === "heading") {
      return (
        <h2
          key={node.id}
          style={{
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: "1rem",
            fontSize: "1.8rem",
          }}
        >
          {node.label || "Untitled Form"}
        </h2>
      );
    }

    if (node.type === "htmlelement") {
  return (
    <iframe
      key={node.id}
      className="preview-iframe"
      srcDoc={node.rawhtml || ""}
      sandbox="allow-scripts"
      style={{
        width: "100%",
        border: "1px solid #ccc",
        marginBottom: "1rem",
      }}
    />
  );
}

  // Content block: render rich text from node.richtext
  if (node.type === "content") {
    return (
      <div
        key={node.id}
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: node.richtext || "" }}
      />
    );
  }

  // Columns layout
  if (node.type === "columns") {
    return (
      <div
        key={node.id}
        style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
      >
        {node.children.map((colChildren, ci) => (
          <div
            key={ci}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {colChildren.map(child => renderFormNode(child))}
          </div>
        ))}
      </div>
    );
  }

  // Table layout
  if (node.type === "table") {
    return (
      <div
        key={node.id}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${node.cols}, 1fr)`,
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {node.children.map((rowArr, r) =>
          rowArr.map((cellArr, c) => (
            <div
              key={`${node.id}-r${r}c${c}`}
              style={{ border: "1px solid #ccc", padding: "8px" }}
            >
              {cellArr.map(child => renderFormNode(child))}
            </div>
          ))
        )}
      </div>
    );
  }

  // Tabs layout
  if (node.type === "tabs") {
    return <TabsLivePreviewComponent key={node.id} node={node} renderFormNode={renderFormNode} />;
  }

  // Spreadsheet layout
  if (node.type === "spreadsheet") {
    const { sheets = [], activeSheet = 0 } = node;
    const currentSheet = sheets[activeSheet] || { data: [], headers: [], rows: 0, cols: 0 };
    
    if (sheets.length === 0) {
      return (
        <div key={node.id} style={{ 
          padding: "2rem", 
          textAlign: "center", 
          backgroundColor: "#f8f9fa", 
          border: "2px dashed #dee2e6",
          borderRadius: "8px",
          marginBottom: "1rem"
        }}>
          <i className="ni ni-grid-3x3-gap" style={{ fontSize: "2rem", color: "#6b7280", marginBottom: "0.5rem" }}></i>
          <div style={{ color: "#6b7280" }}>
            <strong>Spreadsheet Component</strong>
            <br />
            <small>No sheets available</small>
          </div>
        </div>
      );
    }

    return (
      <SpreadsheetPreviewComponent key={node.id} node={node} values={values} handlePreviewChange={handlePreviewChange} />
    );
  }

  // jSpreadsheet layout
  if (node.type === "jspreadsheet") {
    return (
      <div key={node.id} style={{ marginBottom: "1rem" }}>
        <JSpreadsheetComponent 
          field={node} 
          value={values[node.id]}
          onChange={(updatedField) => {
            handlePreviewChange(node.id, updatedField);
          }}
          isFormFill={true}
        />
      </div>
    );
  }

  // jSpreadsheet CE v4 layout
  if (node.type === "jspreadsheetCE4") {
    return (
      <div key={node.id} style={{ marginBottom: "1rem" }}>
        <JSpreadsheetCE4Component 
          field={node} 
          value={values[node.id]}
          onChange={(updatedField) => {
            handlePreviewChange(node.id, updatedField);
          }}
          isFormFill={true}
        />
      </div>
    );
  }

  // Well / highlighted container
  if (node.type === "well") {
  // parse node.style (e.g. "background: red; padding:10px;") into { background: 'red', padding: '10px' }
  const styleObj = (node.style || "")
    .split(";")
    .filter(Boolean)
    .reduce((acc, decl) => {
      const [prop, val] = decl.split(":");
      if (!prop || !val) return acc;
      // kebab-case to camelCase
      const key = prop
        .trim()
        .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      acc[key] = val.trim();
      return acc;
    }, {});

  return (
    <div
      key={node.id}
      className="preview-well"
      style={{
        padding: "1rem",
        border: "1px solid #ccc",
        marginBottom: "1rem",
        ...styleObj
      }}
    >
      {node.children?.map(child => renderFormNode(child))}
    </div>
  );
}

    const fid = `field-${node.id}`;
    if (node.type==="checkbox") {
      return (
        <div key={node.id} className="form-group mb-3">
          {renderDashliteInput(node, fid)}
        </div>
      );
    }
    return (
      <div key={node.id} className="form-group mb-3">
        <label htmlFor={fid} className="form-label">
          {node.label}
          {node.required && <span className="text-danger"> *</span>}
        </label>
        {renderDashliteInput(node, fid)}
      </div>
    );
  }

  return (
    <>
      {/* Card header + Show Modal button */}
      <div className="card card-preview mb-4">
        <div className="card-inner">
          <div className="card-title-group">
            <div className="card-title"><h6 className="title">Live Preview</h6></div>
            <div className="card-tools">
              {/* <Button size="xl" color="primary">Primary</Button> */}
              <Button
               size="xl"
                className="modal-btn"
                onClick={toggleModal}
              >
                {isModalOpen ? "Close Preview" : "Show Preview"}
              </Button>
            </div>
          </div>
          {/* <form>{fields.map(f=>renderFormNode(f))}</form> */}
        </div>
      </div>

      {/* CUSTOM modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={toggleModal}>
        <div className="modal-content" onClick={e=>e.stopPropagation()}>
   
            <h3>Form Preview</h3>
            <form>{fields.map(f=>renderFormNode(f))}</form>
            <div className="button-group"> 
              <button className="save-btn" onClick={SaveForm}>Save Form</button>
              <button className="close-btn" onClick={toggleModal}>Close</button>
            </div>

            {/* <button className="save-btn"  onClick={SaveForm}>Save Form</button>
            <button className="close-btn" onClick={toggleModal}>
              Close
            </button> */}
          </div>
      
        </div>
      )}
    </>
  );
}

LivePreview.propTypes = {
  fields: PropTypes.array.isRequired,
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  folderName: PropTypes.string.isRequired,
};
