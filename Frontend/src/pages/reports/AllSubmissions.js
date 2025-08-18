import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Container, Row, Col, Card, CardBody, CardTitle,
  Button, Alert, Table, Input, InputGroup, InputGroupText, 
  Spinner, Badge, ButtonGroup, Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
  Modal, ModalHeader, ModalBody, ModalFooter, Nav, NavItem, NavLink, Label
} from 'reactstrap';
import api from '../../api/api';
import './response-reports.css';

// Form Display Component (Read-only version of FormFill)
const FormDisplayComponent = ({ form, response, hideTitles = false }) => {
  // Helper function to check if a cell is merged
  const isCellMerged = (rowIndex, colIndex, mergedCells = []) => {
    if (Array.isArray(mergedCells)) {
      return mergedCells?.some(merge => 
        merge.startRow <= rowIndex && 
        merge.endRow >= rowIndex && 
        merge.startCol <= colIndex && 
        merge.endCol >= colIndex
      ) || false;
    } else if (mergedCells && typeof mergedCells === 'object') {
      // Object-based structure (for jSpreadsheet CE v4)
      const mergeArray = Object.values(mergedCells);
      return mergeArray?.some(merge => 
        merge.startRow <= rowIndex && 
        merge.endRow >= rowIndex && 
        merge.startCol <= colIndex && 
        merge.endCol >= colIndex
      ) || false;
    }
    return false;
  };

  // Helper function to get merge info
  const getMergeInfo = (rowIndex, colIndex, mergedCells = []) => {
    // Handle both array and object-based mergedCells
    let merge = null;
    
    if (Array.isArray(mergedCells)) {
      // Array-based structure (for regular spreadsheets)
      merge = mergedCells.find(merge => 
        merge.startRow <= rowIndex && 
        merge.endRow >= rowIndex && 
        merge.startCol <= colIndex && 
        merge.endCol >= colIndex
      );
    } else if (mergedCells && typeof mergedCells === 'object') {
      // Object-based structure (for jSpreadsheet CE v4)
      // Convert object values to array and find matching merge
      const mergeArray = Object.values(mergedCells);
      merge = mergeArray.find(merge => 
        merge.startRow <= rowIndex && 
        merge.endRow >= rowIndex && 
        merge.startCol <= colIndex && 
        merge.endCol >= colIndex
      );
    }
    
    if (!merge) return { isStartCell: false, isContinuation: false };
    
    const isStartCell = rowIndex === merge.startRow && colIndex === merge.startCol;
    const isContinuation = !isStartCell;
    
    return { 
      isStartCell, 
      isContinuation,
      rowSpan: merge.endRow - merge.startRow + 1,
      colSpan: merge.endCol - merge.startCol + 1
    };
  };

  const renderFormNode = (node) => {
    if (node.type === "heading") {
      if (hideTitles) return null;
      return (
        <h6
          key={node.id}
          style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            fontWeight: "700",
            color: "#2c3e50"
          }}
        >
          {node.label || "Untitled Form"}
        </h6>
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
      return <TabsDisplayComponent key={node.id} node={node} renderFormNode={renderFormNode} />;
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

    // Handle folder name as a header
    if (node.type === "folderName") {
      if (hideTitles) return null;
      return (
        <div key={node.id} style={{
          marginBottom: "1rem",
          padding: "0.5rem 0",
          borderBottom: "2px solid #e9ecef"
        }}>
          <h5 style={{
            color: "#495057",
            margin: "0",
            fontWeight: "600"
          }}>
            <i className="ni ni-folder text-primary me-2"></i>
            {node.label || "Untitled Folder"}
          </h5>
        </div>
      );
    }

    // Skip heading nodes (they're handled separately)
    if (node.type === "heading") {
      return null;
    }

    // Default case: render as form field
    const fid = `field-${node.id}`;
    if (node.type === "checkbox") {
      return (
        <div key={node.id} className="form-group mb-3">
          {renderReadOnlyInput(node, response.answers[node.id])}
        </div>
      );
    }
    if (node.type === "spreadsheet") {
      return (
        <div key={node.id} className="form-group mb-3">
          {renderReadOnlySpreadsheet(node, response.answers[node.id])}
        </div>
      );
    }
    
    if (node.type === "jspreadsheetCE4") {
      return (
        <div key={node.id} className="form-group mb-3">
          {renderReadOnlyJSpreadsheetCE4(node, response.answers[node.id])}
        </div>
      );
    }

    return (
      <div key={node.id} className="form-group mb-3">
        {renderReadOnlyInput(node, response.answers[node.id])}
      </div>
    );
  };

  const renderReadOnlyInput = (field, value) => {
    return (
      <div>
        <Label className="form-label fw-bold text-dark mb-2">
          {field.label}
          {field.required && <span className="text-danger ms-1">*</span>}
        </Label>
        <div className="form-control-plaintext" style={{
          padding: "0.75rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "6px",
          border: "1px solid #e9ecef",
          minHeight: "2.5rem",
          display: "flex",
          alignItems: "center"
        }}>
          {value !== undefined && value !== null && value !== '' ? (
            typeof value === 'boolean' ? (
              <Badge color={value ? 'success' : 'secondary'}>
                {value ? 'Yes' : 'No'}
              </Badge>
            ) : (
              <span style={{ color: "#495057" }}>{String(value)}</span>
            )
          ) : (
            <span style={{ color: "#6c757d", fontStyle: "italic" }}>No response</span>
          )}
        </div>
      </div>
    );
  };

  const renderReadOnlySpreadsheet = (field, value) => {
    if (!value || !value.sheets) {
      return (
        <div>
          <Label className="form-label fw-bold text-dark mb-2">
            {field.label}
          </Label>
          <div className="form-control-plaintext" style={{
            padding: "0.75rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "6px",
            border: "1px solid #e9ecef",
            minHeight: "2.5rem",
            display: "flex",
            alignItems: "center"
          }}>
            <span style={{ color: "#6c757d", fontStyle: "italic" }}>No spreadsheet data</span>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Label className="form-label fw-bold text-dark mb-2">
          {field.label}
        </Label>
        <div style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          overflow: "auto",
          backgroundColor: "white"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                {value.sheets[0]?.headers && value.sheets[0].headers.map((header, colIndex) => (
                  <th key={colIndex} style={{
                    padding: "8px",
                    border: "1px solid #e5e7eb",
                    fontWeight: "600",
                    textAlign: "left",
                    minWidth: "120px"
                  }}>
                   
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.sheets[0]?.data && value.sheets[0].data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row && row.map((cell, colIndex) => {
                    const mergeInfo = getMergeInfo(rowIndex, colIndex, value.sheets[0].mergedCells);
                    
                    // Skip rendering continuation cells in merged ranges
                    if (mergeInfo.isContinuation) {
                      return null;
                    }
                    
                    // Get cell content and formatting like in FormFill
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
                    
                    const { content, styles } = getCellDisplay(cell);
                    const isMerged = isCellMerged(rowIndex, colIndex, value.sheets[0].mergedCells);
                    
                    return (
                      <td 
                        key={colIndex} 
                        rowSpan={mergeInfo.rowSpan || 1}
                        colSpan={mergeInfo.colSpan || 1}
                        style={{
                          padding: "8px",
                          border: "1px solid #e5e7eb",
                          minHeight: "40px",
                          backgroundColor: isMerged ? "rgba(102, 126, 234, 0.1)" : (styles.backgroundColor || "transparent"),
                          ...styles
                        }}>
                        {content || ""}
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
  };

  const renderReadOnlyJSpreadsheetCE4 = (field, value) => {
    if (!value || !value.data) {
      return (
        <div>
          <Label className="form-label fw-bold text-dark mb-2">
            {field.label}
          </Label>
          <div className="form-control-plaintext" style={{
            padding: "0.75rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "6px",
            border: "1px solid #e9ecef",
            minHeight: "2.5rem",
            display: "flex",
            alignItems: "center"
          }}>
            <span style={{ color: "#6c757d", fontStyle: "italic" }}>No spreadsheet data</span>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Label className="form-label fw-bold text-dark mb-2">
          {field.label}
        </Label>
        <div style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          overflow: "auto",
          backgroundColor: "white"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                {value.data[0] && value.data[0].map((cell, colIndex) => (
                  <th key={colIndex} style={{
                    padding: "8px",
                    border: "1px solid #e5e7eb",
                    fontWeight: "600",
                    textAlign: "left",
                    minWidth: "120px"
                  }}>
                    {`Column ${colIndex + 1}`}
                  </th>
                  ))}
                </tr>
            </thead>
            <tbody>
              {value.data && value.data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row && row.map((cell, colIndex) => {
                    const mergeInfo = getMergeInfo(rowIndex, colIndex, value.mergedCells);
                    
                    // Skip rendering continuation cells in merged ranges
                    if (mergeInfo.isContinuation) {
                      return null;
                    }
                    
                    // Get cell content and formatting
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
                    
                    const { content, styles } = getCellDisplay(cell);
                    const isMerged = isCellMerged(rowIndex, colIndex, value.mergedCells);
                    
                    return (
                      <td 
                        key={colIndex} 
                        rowSpan={mergeInfo.rowSpan || 1}
                        colSpan={mergeInfo.colSpan || 1}
                        style={{
                          padding: "8px",
                          border: "1px solid #e5e7eb",
                          minHeight: "40px",
                          backgroundColor: isMerged ? "rgba(102, 126, 234, 0.1)" : (styles.backgroundColor || "transparent"),
                          ...styles
                        }}>
                        {content || ""}
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
  };

  return (
    <div className="form-display-container">
      {form.schemaJson.map(node => renderFormNode(node))}
    </div>
  );
};

// Tabs Display Component (Read-only version)
const TabsDisplayComponent = ({ node, renderFormNode }) => {
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabClick = (index, event) => {
    event.preventDefault();
    setActiveTab(index);
  };

  return (
    <div className="tabs-component">
      <div className="tabs-header" style={{
        display: "flex",
        borderBottom: "2px solid #e9ecef",
        marginBottom: "1rem"
      }}>
        {node.tabs.map((tab, index) => (
          <button
            key={index}
            onClick={(e) => handleTabClick(index, e)}
            style={{
              padding: "10px 20px",
              border: "none",
              backgroundColor: "transparent",
              borderBottom: activeTab === index ? "2px solid #007bff" : "2px solid transparent",
              color: activeTab === index ? "#007bff" : "#6c757d",
              fontWeight: activeTab === index ? "600" : "400",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {tab.name || `Tab ${index + 1}`}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {node.tabs[activeTab]?.children?.map(child => renderFormNode(child))}
      </div>
    </div>
  );
};

export default function AllSubmissions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [forms, setForms] = useState([]);
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForms, setSelectedForms] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState(['Brindavan Bottlers Private Limited, UNNAO']);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal state for spreadsheet viewer
  const [spreadsheetModal, setSpreadsheetModal] = useState(false);
  const [spreadsheetData, setSpreadsheetData] = useState(null);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  // Date filtering - start with current month
  const getCurrentMonthRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: startOfMonth, endDate: now };
  };

  const [startDate, setStartDate] = useState(() => getCurrentMonthRange().startDate);
  const [endDate, setEndDate] = useState(() => getCurrentMonthRange().endDate);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { filterResponses(); }, [responses, searchTerm, selectedForms, selectedFolders, statusFilter, forms, startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [responsesRes, formsRes] = await Promise.all([
        api.get('/responses'),
        api.get('/forms')
      ]);
      setResponses(responsesRes.data || []);
      setForms(formsRes.data || []);
    } catch (error) {
      console.error('Error loading response data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormObject = (formId) => forms.find(f => f._id === formId);

  const getUniqueFolders = () => {
    const folderNames = forms.map(form => {
      const folder = form.schemaJson.find(e => e.type === "folderName")?.label || 'Untitled';
      return folder;
    });
    return [...new Set(folderNames)].sort();
  };

  const getSubmissionStatus = (response) => {
    const form = getFormObject(response.form);
    if (!form || !form.schemaJson) return 'unknown';
    
    const formFields = form.schemaJson.filter(f => f.type !== 'folderName' && f.type !== 'heading');
    
    if (formFields.length === 0) return 'complete';
    
    const answeredFields = formFields.filter(field => {
      const answer = response.answers[field.id];
      return answer && answer.toString().trim() !== '';
    });
    
    const completionRate = answeredFields.length / formFields.length;
    
    if (completionRate === 1) return 'complete';
    if (completionRate >= 0.5) return 'partial';
    return 'incomplete';
  };

  const getFormFields = (formId) => {
    const form = getFormObject(formId);
    if (!form || !form.schemaJson) return [];
    return form.schemaJson.filter(f => f.type !== 'folderName' && f.type !== 'heading');
  };

  const getFieldAnswer = (response, fieldId) => {
    const answer = response.answers[fieldId];
    if (!answer) return 'N/A';
    

    
    // Handle different data types
    if (typeof answer === 'object') {
      // Handle arrays (checkboxes, multi-select, etc.)
      if (Array.isArray(answer)) {
        if (answer.length === 0) return 'None selected';
        return answer.join(', ');
      }
      
      // Handle objects (spreadsheets, tabs, etc.)
      if (answer !== null) {
        // Handle new spreadsheet data structure with sheets property
        if (answer.sheets && Array.isArray(answer.sheets)) {
          const filledData = [];
          answer.sheets.forEach((sheet, sheetIndex) => {
            if (sheet.data && Array.isArray(sheet.data)) {
              const sheetName = sheet.name || `Sheet ${sheetIndex + 1}`;
              const filledRows = [];
              
              sheet.data.forEach((row, rowIndex) => {
                const filledCells = [];
                row.forEach((cell, colIndex) => {
                  let cellContent = '';
                  if (typeof cell === 'object' && cell !== null && cell.content !== undefined) {
                    cellContent = cell.content || '';
                  } else {
                    cellContent = cell || '';
                  }
                  if (cellContent && cellContent.trim() !== '') {
                    filledCells.push(cellContent);
                  }
                });
                if (filledCells.length > 0) {
                  filledRows.push(`Row ${rowIndex + 1}: ${filledCells.join(' | ')}`);
                }
              });
              
              if (filledRows.length > 0) {
                filledData.push(`${sheetName}: ${filledRows.join('; ')}`);
              }
            }
          });
          
          if (filledData.length > 0) {
            return filledData.join('\n');
          } else {
            return 'No data filled';
          }
        }
        
        // Handle legacy spreadsheet data - array of sheets (fallback)
        if (Array.isArray(answer) && answer.length > 0 && answer[0].data) {
          const filledData = [];
          answer.forEach((sheet, sheetIndex) => {
            if (sheet.data && Array.isArray(sheet.data)) {
              const sheetName = sheet.name || `Sheet ${sheetIndex + 1}`;
              const filledRows = [];
              
              sheet.data.forEach((row, rowIndex) => {
                const filledCells = [];
                row.forEach((cell, colIndex) => {
                  let cellContent = '';
                  if (typeof cell === 'object' && cell !== null && cell.content !== undefined) {
                    cellContent = cell.content || '';
                  } else {
                    cellContent = cell || '';
                  }
                  if (cellContent && cellContent.trim() !== '') {
                    filledCells.push(cellContent);
                  }
                });
                if (filledCells.length > 0) {
                  filledRows.push(`Row ${rowIndex + 1}: ${filledCells.join(' | ')}`);
                }
              });
              
              if (filledRows.length > 0) {
                filledData.push(`${sheetName}: ${filledRows.join('; ')}`);
              }
            }
          });
          
          if (filledData.length > 0) {
            return filledData.join('\n');
          } else {
            return 'No data filled';
          }
        }
        
        // Handle tab data - show which tabs were filled
        if (answer.tabs && Array.isArray(answer.tabs)) {
          const filledTabs = [];
          answer.tabs.forEach((tab, index) => {
            if (tab.filled || (tab.children && tab.children.length > 0)) {
              filledTabs.push(tab.name || `Tab ${index + 1}`);
            }
          });
          
          if (filledTabs.length > 0) {
            return `Filled tabs: ${filledTabs.join(', ')}`;
          } else {
            return 'No tabs filled';
          }
        }
        
        // Handle other complex objects - try to extract meaningful data
        const keys = Object.keys(answer);
        if (keys.length === 0) return 'Empty';
        
        // Special handling for spreadsheet-like objects that might be stored differently
        if (answer.data && Array.isArray(answer.data)) {
          // This might be a spreadsheet stored as a single object
          const filledRows = [];
          answer.data.forEach((row, rowIndex) => {
            if (Array.isArray(row)) {
              const filledCells = [];
              row.forEach((cell, colIndex) => {
                let cellContent = '';
                if (typeof cell === 'object' && cell !== null) {
                  cellContent = cell.content || '';
                } else {
                  cellContent = cell || '';
                }
                if (cellContent && cellContent.trim() !== '') {
                  filledCells.push(cellContent);
                }
              });
              if (filledCells.length > 0) {
                filledRows.push(`Row ${rowIndex + 1}: ${filledCells.join(' | ')}`);
              }
            }
          });
          
          if (filledRows.length > 0) {
            return filledRows.join('; ');
          }
        }
        
        // Try to extract meaningful data from other object properties
        const values = [];
        keys.forEach(key => {
          const value = answer[key];
          if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'object') {
              // For complex objects, try to get a meaningful string representation
              if (Array.isArray(value)) {
                if (value.length > 0) {
                  values.push(`${key}: ${value.length} items`);
                }
              } else {
                values.push(`${key}: ${JSON.stringify(value).substring(0, 50)}...`);
              }
            } else {
              values.push(`${key}: ${value}`);
            }
          }
        });
        
        return values.length > 0 ? values.join('; ') : 'No data';
      }
    }
    
    // Handle primitive types
    const stringAnswer = answer.toString().trim();
    return stringAnswer || 'N/A';
  };

  // Helper function to check if a cell is merged
  const isCellMerged = (rowIndex, colIndex, mergedCells = []) => {
    if (Array.isArray(mergedCells)) {
      return mergedCells?.some(merge => 
        merge.startRow <= rowIndex && 
        merge.endRow >= rowIndex && 
        merge.startCol <= colIndex && 
        merge.endCol >= colIndex
      ) || false;
    } else if (mergedCells && typeof mergedCells === 'object') {
      // Object-based structure (for jSpreadsheet CE v4)
      const mergeArray = Object.values(mergedCells);
      return mergeArray?.some(merge => 
        merge.startRow <= rowIndex && 
        merge.endRow >= rowIndex && 
        merge.startCol <= colIndex && 
        merge.endCol >= colIndex
      ) || false;
    }
    return false;
  };

  // Helper function to get merge info
  const getMergeInfo = (rowIndex, colIndex, mergedCells = []) => {
    // Handle both array and object-based mergedCells
    let merge = null;
    
    if (Array.isArray(mergedCells)) {
      // Array-based structure (for regular spreadsheets)
      merge = mergedCells.find(merge => 
        merge.startRow <= rowIndex && 
        merge.endRow >= rowIndex && 
        merge.startCol <= colIndex && 
        merge.endCol >= colIndex
      );
    } else if (mergedCells && typeof mergedCells === 'object') {
      // Object-based structure (for jSpreadsheet CE v4)
      // Convert object values to array and find matching merge
      const mergeArray = Object.values(mergedCells);
      merge = mergeArray.find(merge => 
        merge.startRow <= rowIndex && 
        merge.endRow >= rowIndex && 
        merge.startCol <= colIndex && 
        merge.endCol >= colIndex
      );
    }
    
    if (!merge) return { isStartCell: false, isContinuation: false };
    
    const isStartCell = rowIndex === merge.startRow && colIndex === merge.startCol;
    const isContinuation = !isStartCell;
    
    return { 
      isStartCell, 
      isContinuation,
      rowSpan: merge.endRow - merge.startRow + 1,
      colSpan: merge.endCol - merge.startCol + 1
    };
  };

  const filterResponses = () => {
    let filtered = responses;

    // Always apply date filter for this component
    if (startDate && endDate) {
      const s = new Date(startDate).setHours(0,0,0,0);
      const e = new Date(endDate).setHours(23,59,59,999);
      filtered = filtered.filter(r => {
        const subDate = new Date(r.submittedAt).getTime();
        return subDate >= s && subDate <= e;
      });
    }

    if (selectedForms.length > 0) {
      filtered = filtered.filter(r => selectedForms.includes(r.form));
    }

    if (selectedFolders.length > 0) {
      filtered = filtered.filter(r => {
        const f = getFormObject(r.form);
        const folder = f?.schemaJson?.find(e => e.type === "folderName")?.label || "";
        return selectedFolders.includes(folder);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => getSubmissionStatus(r) === statusFilter);
    }

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(r => {
        const f = getFormObject(r.form);
        const folder = f?.schemaJson?.find(e => e.type === "folderName")?.label || "";
        const heading = f?.schemaJson?.find(e => e.type === "heading")?.label || "";
        return (
          folder.toLowerCase().includes(s) ||
          heading.toLowerCase().includes(s) ||
          (r.submitterName || '').toLowerCase().includes(s) ||
          (r.submitterEmail || '').toLowerCase().includes(s)
        );
      });
    }

    setFilteredResponses(filtered);
  };

  function getFormLabel(formId) {
    const form = getFormObject(formId);
    if (!form) return "Unknown";
    const heading = form.schemaJson.find(e => e.type === "heading")?.label;
    const folder = form.schemaJson.find(e => e.type === "folderName")?.label;
    return heading ? heading : folder ? folder : "Untitled Form";
  }

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const getStatusBadge = (status) => {
    const badges = {
      complete: { color: 'success', text: 'Complete', icon: 'ni-check-circle' },
      partial: { color: 'warning', text: 'Partial', icon: 'ni-time' },
      incomplete: { color: 'danger', text: 'Incomplete', icon: 'ni-fat-remove' },
      unknown: { color: 'secondary', text: 'Unknown', icon: 'ni-help' }
    };
    const badge = badges[status] || badges.unknown;
    return (
      <Badge color={badge.color} className="rr-status-badge">
        <i className={`ni ${badge.icon} me-1`}></i>
        {badge.text}
      </Badge>
    );
  };

  const resetToCurrentMonth = () => {
    const currentMonth = getCurrentMonthRange();
    setStartDate(currentMonth.startDate);
    setEndDate(currentMonth.endDate);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedForms([]);
    setSelectedFolders([]);
    setStatusFilter('all');
    resetToCurrentMonth();
  };

  // Spreadsheet modal functions
  const openSpreadsheetModal = (spreadsheetAnswer) => {
    setSpreadsheetData(spreadsheetAnswer);
    setActiveSheetIndex(0);
    setSpreadsheetModal(true);
  };

  const closeSpreadsheetModal = () => {
    setSpreadsheetModal(false);
    setSpreadsheetData(null);
    setActiveSheetIndex(0);
  };

  const handleSheetClick = (sheetIndex) => {
    setActiveSheetIndex(sheetIndex);
  };

  if (loading) return (
    <div className="rr-header">
      <Container fluid className="px-4 py-3">
        <div className="rr-loading">
          <Spinner color="primary" className="me-2" />
          <span>Loading All Submissions...</span>
        </div>
      </Container>
    </div>
  );

  return (
    <>
      <div className="rr-header">
        <Container fluid className="px-4 py-3">
          <div className="rr-header-content">
            <h4 className="rr-title">
              <i className="ni ni-list-ul rr-icon"></i>
              All Submissions Dashboard
            </h4>
            <p className="rr-subtitle">View and filter all form submissions by date range</p>
          </div>
        </Container>
      </div>

      <Container className="rr-container">
        {/* Date Filter Section - Always Visible */}
        <Card className="rr-filter-card rr-date-filter-section mb-4">
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="rr-filter-title mb-0">
                <i className="ni ni-calendar-alt me-2"></i>
                Date Range Filter
              </h6>
              <div className="d-flex gap-2">
                <Button
                  color="outline-secondary"
                  size="sm"
                  onClick={resetToCurrentMonth}
                  className="rr-reset-dates"
                >
                  <i className="ni ni-refresh me-1"></i>
                  Current Month
                </Button>
                {(searchTerm || selectedForms.length > 0 || selectedFolders.length > 0 || statusFilter !== 'all') && (
                  <Button
                    color="outline-secondary"
                    size="sm"
                    onClick={clearAllFilters}
                    className="rr-clear-filters"
                  >
                    <i className="ni ni-fat-remove me-1"></i>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
            
            <Row>
              <Col lg={4} md={6} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={date => setStartDate(date)}
                    maxDate={endDate || new Date()}
                    placeholderText="Select Start Date"
                    dateFormat="dd MMM yyyy"
                    className="form-control rr-date-input"
                    showMonthDropdown
                    showYearDropdown
                    isClearable
                  />
                </div>
              </Col>
              
              <Col lg={4} md={6} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">End Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={date => setEndDate(date)}
                    minDate={startDate || undefined}
                    maxDate={new Date()}
                    placeholderText="Select End Date"
                    dateFormat="dd MMM yyyy"
                    className="form-control rr-date-input"
                    showMonthDropdown
                    showYearDropdown
                    isClearable
                  />
                </div>
              </Col>
              
              <Col lg={4} md={12} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">Quick Date Ranges</label>
                  <div className="rr-quick-date-buttons">
                    <Button
                      color="outline-primary"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(today.getDate() - 1);
                        setStartDate(yesterday);
                        setEndDate(today);
                      }}
                    >
                      Yesterday
                    </Button>
                    <Button
                      color="outline-primary"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const weekAgo = new Date();
                        weekAgo.setDate(today.getDate() - 7);
                        setStartDate(weekAgo);
                        setEndDate(today);
                      }}
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      color="outline-primary"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const monthAgo = new Date();
                        monthAgo.setMonth(today.getMonth() - 1);
                        setStartDate(monthAgo);
                        setEndDate(today);
                      }}
                    >
                      Last 30 Days
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Enhanced Summary Cards */}
        <Row className="rr-stats-row">
          <Col lg={3} md={6} className="mb-4">
            <Card className="rr-stat-card rr-stat-total">
              <CardBody>
                <div className="rr-stat-content">
                  <div className="rr-stat-icon-wrapper">
                    <i className="ni ni-check-circle rr-stat-icon"></i>
                  </div>
                  <div className="rr-stat-details">
                    <h2 className="rr-stat-number">{filteredResponses.length}</h2>
                    <p className="rr-stat-label">Filtered Responses</p>
                    <div className="rr-stat-trend">
                      <i className="ni ni-trend-up text-success me-1"></i>
                      <small className="text-success">Date range: {startDate ? startDate.toLocaleDateString() : 'N/A'} - {endDate ? endDate.toLocaleDateString() : 'N/A'}</small>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="rr-stat-card rr-stat-complete">
              <CardBody>
                <div className="rr-stat-content">
                  <div className="rr-stat-icon-wrapper">
                    <i className="ni ni-satisfied rr-stat-icon"></i>
                  </div>
                  <div className="rr-stat-details">
                    <h2 className="rr-stat-number">{filteredResponses.filter(r => getSubmissionStatus(r) === 'complete').length}</h2>
                    <p className="rr-stat-label">Complete</p>
                    <div className="rr-stat-trend">
                      <small className="text-success">
                        {filteredResponses.length ? Math.round((filteredResponses.filter(r => getSubmissionStatus(r) === 'complete').length / filteredResponses.length) * 100) : 0}% completion rate
                      </small>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="rr-stat-card rr-stat-partial">
              <CardBody>
                <div className="rr-stat-content">
                  <div className="rr-stat-icon-wrapper">
                    <i className="ni ni-time rr-stat-icon"></i>
                  </div>
                  <div className="rr-stat-details">
                    <h2 className="rr-stat-number">{filteredResponses.filter(r => getSubmissionStatus(r) === 'partial').length}</h2>
                    <p className="rr-stat-label">Partial</p>
                    <div className="rr-stat-trend">
                      <small className="text-warning">Need follow-up</small>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="rr-stat-card rr-stat-users">
              <CardBody>
                <div className="rr-stat-content">
                  <div className="rr-stat-icon-wrapper">
                    <i className="ni ni-users rr-stat-icon"></i>
                  </div>
                  <div className="rr-stat-details">
                    <h2 className="rr-stat-number">{new Set(filteredResponses.map(r => r.submitterEmail)).size}</h2>
                    <p className="rr-stat-label">Unique Users</p>
                    <div className="rr-stat-trend">
                      <small className="text-info">In date range</small>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Additional Filters */}
        <Card className="rr-filter-card mb-4">
          <CardBody>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="rr-filter-title mb-0">
                <i className="ni ni-settings me-2"></i>
                Additional Filters
              </h6>
            </div>
            
            <Row className="rr-filter-row">
              <Col lg={3} md={6} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">Search</label>
                  <InputGroup className="rr-search-group">
                    <InputGroupText><i className="ni ni-search"></i></InputGroupText>
                    <Input
                      placeholder="Search responses..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="rr-search-input"
                    />
                  </InputGroup>
                </div>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">Folder</label>
                  <div className="rr-multi-select-container">
                    <Input
                      type="select"
                      value=""
                      onChange={e => {
                        const folderName = e.target.value;
                        if (folderName && !selectedFolders.includes(folderName)) {
                          setSelectedFolders([...selectedFolders, folderName]);
                        }
                        e.target.value = ""; // Reset to empty
                      }}
                      className="rr-select-input"
                    >
                      <option value="">Select Folders...</option>
                      {getUniqueFolders().map(folderName => (
                        <option key={folderName} value={folderName}>
                          📁 {folderName}
                        </option>
                      ))}
                    </Input>
                    
                    {/* Selected Folders Display */}
                    {selectedFolders.length > 0 && (
                      <div className="rr-selected-forms">
                        <div className="rr-selected-header">
                          <small className="text-muted">Selected Folders ({selectedFolders.length})</small>
                          <Button 
                            color="link" 
                            size="sm" 
                            className="rr-clear-all"
                            onClick={() => setSelectedFolders([])}
                            title="Clear all"
                          >
                            <i className="ni ni-fat-remove"></i>
                          </Button>
                        </div>
                        <div className="rr-selected-tags">
                          {selectedFolders.map(folderName => (
                            <span key={folderName} className="rr-selected-tag">
                              <span className="rr-tag-text">📁 {folderName}</span>
                              <Button 
                                color="link" 
                                size="sm" 
                                className="rr-remove-tag"
                                onClick={() => setSelectedFolders(selectedFolders.filter(f => f !== folderName))}
                                title="Remove"
                              >
                                <i className="ni ni-fat-remove"></i>
                              </Button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">Form</label>
                  <div className="rr-multi-select-container">
                    <Input
                      type="select"
                      value=""
                      onChange={e => {
                        const formId = e.target.value;
                        if (formId && !selectedForms.includes(formId)) {
                          setSelectedForms([...selectedForms, formId]);
                        }
                        e.target.value = ""; // Reset to empty
                      }}
                      className="rr-select-input"
                    >
                      <option value="">Select Forms...</option>
                      {(() => {
                        // Group forms by folder and create unique options
                        const folderGroups = {};
                        forms.forEach(form => {
                          const folder = form.schemaJson.find(e => e.type === "folderName")?.label || 'Untitled';
                          const heading = form.schemaJson.find(e => e.type === "heading")?.label || 'Untitled Form';
                          
                          if (!folderGroups[folder]) {
                            folderGroups[folder] = [];
                          }
                          folderGroups[folder].push({ id: form._id, heading });
                        });

                        return Object.entries(folderGroups).map(([folderName, formsInFolder]) => {
                          if (formsInFolder.length === 1) {
                            // Single form in folder - show folder name
                            return (
                              <option key={formsInFolder[0].id} value={formsInFolder[0].id}>
                                📁 {folderName}
                              </option>
                            );
                          } else {
                            // Multiple forms in folder - show folder as optgroup
                            return (
                              <optgroup key={folderName} label={`📁 ${folderName}`}>
                                {formsInFolder.map(form => (
                                  <option key={form.id} value={form.id}>
                                    └─ {form.heading}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          }
                        });
                      })()}
                    </Input>
                    
                    {/* Selected Forms Display */}
                    {selectedForms.length > 0 && (
                      <div className="rr-selected-forms">
                        <div className="rr-selected-header">
                          <small className="text-muted">Selected Forms ({selectedForms.length})</small>
                          <Button 
                            color="link" 
                            size="sm" 
                            className="rr-clear-all"
                            onClick={() => setSelectedForms([])}
                            title="Clear all"
                          >
                            <i className="ni ni-fat-remove"></i>
                          </Button>
                        </div>
                        <div className="rr-selected-tags">
                          {selectedForms.map(formId => {
                            const form = getFormObject(formId);
                            const folder = form?.schemaJson?.find(e => e.type === "folderName")?.label || 'Untitled';
                            const heading = form?.schemaJson?.find(e => e.type === "heading")?.label || 'Untitled Form';
                            const displayName = folder === heading ? folder : `${folder} - ${heading}`;
                            
                            return (
                              <span key={formId} className="rr-selected-tag">
                                <span className="rr-tag-text">{displayName}</span>
                                <Button 
                                  color="link" 
                                  size="sm" 
                                  className="rr-remove-tag"
                                  onClick={() => setSelectedForms(selectedForms.filter(id => id !== formId))}
                                  title="Remove"
                                >
                                  <i className="ni ni-fat-remove"></i>
                                </Button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <div className="rr-filter-group">
                  <label className="rr-filter-label">Status</label>
                  <Input
                    type="select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="rr-select-input"
                  >
                    <option value="all">All Status</option>
                    <option value="complete">Complete</option>
                    <option value="partial">Partial</option>
                    <option value="incomplete">Incomplete</option>
                  </Input>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

                 {/* Enhanced Results Cards */}
         <Card className="rr-results-card">
           <CardBody>
             <div className="rr-results-header">
               <div className="d-flex align-items-center">
                 <h6 className="rr-results-title mb-0">
                   <i className="ni ni-list me-2"></i>
                   Submissions in Date Range
                 </h6>
                 <Badge color="primary" pill className="rr-results-count ms-2">
                   {filteredResponses.length} results
                 </Badge>
                 {(searchTerm || selectedForms.length > 0 || selectedFolders.length > 0 || statusFilter !== 'all') && (
                   <Badge color="info" pill className="ms-2">
                     <i className="ni ni-filter me-1"></i>
                     Additional Filters Applied
                   </Badge>
                 )}
               </div>
             </div>

             {filteredResponses.length > 0 ? (
               <div className="rr-forms-container">
                 {filteredResponses.map((response, index) => {
                   const form = getFormObject(response.form);
                   const hideTitles = selectedFolders.length > 0;
                   
                   return (
                     <div key={response._id} className="rr-form-submission mb-5">
                       {/* Submission Header */}
                       <Card className="rr-submission-header">
                         <CardBody>
                           <div className="d-flex justify-content-between align-items-start">
                             <div className="rr-submission-info">
                               <div>
                                 <h6>
                                   <i className="ni ni-file-docs text-primary"></i>
                                   {getFormLabel(response.form)}
                                 </h6>
                                 {/* <div className="rr-submission-meta">
                                   <div className="d-flex flex-wrap gap-3">
                                     <div className="rr-submitter-info">
                                       <i className="ni ni-user text-muted me-1"></i>
                                       <strong>Submitter:</strong> {response.submitterName || 'Anonymous'}
                                     </div>
                                     <div className="rr-email-info">
                                       <i className="ni ni-email text-muted me-1"></i>
                                       <strong>Email:</strong> {response.submitterEmail || 'N/A'}
                                     </div>
                                     <div className="rr-date-info">
                                       <i className="ni ni-calendar text-muted me-1"></i>
                                       <strong>Submitted:</strong> {formatDate(response.submittedAt)}
                                     </div>
                                     <div className="rr-status-info">
                                       {getStatusBadge(getSubmissionStatus(response))}
                                     </div>
                                   </div>
                                 </div> */}
                               </div>
                             </div>
                           </div>
                         </CardBody> 
                       </Card>

                       {/* Form Display */}
                       {form && (
                         <Card className="rr-form-display">
                           <CardBody>
                             <FormDisplayComponent form={form} response={response} hideTitles={hideTitles} />
                           </CardBody>
                         </Card>
                       )}
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="rr-no-results">
                 <i className="ni ni-inbox"></i>
                 <h5>No submissions found</h5>
                 <p className="text-muted">
                   {responses.length === 0 ? 'No responses have been submitted yet.' : 
                    'No responses match your current date range and filters. Try adjusting your criteria.'}
                 </p>
                 {responses.length > 0 && (
                   <Button 
                     color="outline-primary" 
                     size="sm" 
                     onClick={clearAllFilters}
                     className="mt-2"
                   >
                     <i className="ni ni-refresh me-1"></i>
                     Reset to Current Month
                   </Button>
                 )}
               </div>
             )}
           </CardBody>
                   </Card>
       </Container>

       {/* Spreadsheet Modal */}
       <Modal isOpen={spreadsheetModal} toggle={closeSpreadsheetModal} size="xl">
         <ModalHeader toggle={closeSpreadsheetModal}>
           <i className="ni ni-grid-3x3-gap me-2"></i>
           Spreadsheet Data
         </ModalHeader>
         <ModalBody>
           {spreadsheetData && (
             <div>
               {/* Sheet Navigation */}
               {spreadsheetData.length > 1 && (
                 <div style={{
                   display: "flex",
                   backgroundColor: "#f8f9fa",
                   padding: "8px",
                   borderRadius: "8px",
                   marginBottom: "12px",
                   gap: "4px",
                   overflowX: "auto"
                 }}>
                   {spreadsheetData.map((sheet, index) => (
                     <button
                       key={index}
                       type="button"
                       onClick={() => handleSheetClick(index)}
                       style={{
                         padding: "6px 12px",
                         backgroundColor: index === activeSheetIndex ? "#3b82f6" : "#e5e7eb",
                         color: index === activeSheetIndex ? "white" : "#374151",
                         borderRadius: "6px",
                         fontSize: "12px",
                         fontWeight: "500",
                         whiteSpace: "nowrap",
                         border: "none",
                         cursor: "pointer",
                         transition: "all 0.2s ease"
                       }}
                       onMouseEnter={(e) => {
                         if (index !== activeSheetIndex) {
                           e.target.style.backgroundColor = "#d1d5db";
                         }
                       }}
                       onMouseLeave={(e) => {
                         if (index !== activeSheetIndex) {
                           e.target.style.backgroundColor = "#e5e7eb";
                         }
                       }}
                     >
                       {sheet.name || `Sheet ${index + 1}`}
                     </button>
                   ))}
                 </div>
               )}

               {/* Spreadsheet Table */}
               {spreadsheetData[activeSheetIndex] && (
                 <div style={{
                   border: "1px solid #e5e7eb",
                   borderRadius: "8px",
                   overflow: "auto",
                   backgroundColor: "white"
                 }}>
                   <table style={{
                     width: "100%",
                     borderCollapse: "collapse",
                     fontSize: "14px"
                   }}>
                     <thead>
                       <tr style={{ backgroundColor: "#f8f9fa" }}>
                         {/* <th style={{ padding: "8px", border: "1px solid #e5e7eb", fontWeight: "600", minWidth: "40px" }}></th> */}
                         {/* {spreadsheetData[activeSheetIndex].headers && spreadsheetData[activeSheetIndex].headers.map((header, colIndex) => (
                           <th key={colIndex} style={{
                             padding: "8px",
                             border: "1px solid #e5e7eb",
                             fontWeight: "600",
                             textAlign: "left",
                             minWidth: "120px"
                           }}>
                             {header || `Column ${colIndex + 1}`}
                           </th>
                         ))} */}
                       </tr>
                     </thead>
                     <tbody>
                       {spreadsheetData[activeSheetIndex].data && spreadsheetData[activeSheetIndex].data.map((row, rowIndex) => (
                         <tr key={rowIndex}>
                           {/* <td style={{
                             padding: "8px",
                             border: "1px solid #e5e7eb",
                             backgroundColor: "#f8f9fa",
                             fontWeight: "500",
                             textAlign: "center"
                           }}>
                             {rowIndex + 1}
                           </td> */}
                           {row && row.map((cell, colIndex) => {
                             const mergeInfo = getMergeInfo(rowIndex, colIndex, spreadsheetData[activeSheetIndex].mergedCells);
                             
                             // Skip rendering continuation cells in merged ranges
                             if (mergeInfo.isContinuation) {
                               return null;
                             }
                             
                             // Handle both old string format and new object format with formatting
                             let cellContent = "";
                             let cellStyle = {
                               padding: "8px",
                               border: "1px solid #e5e7eb",
                               minHeight: "40px"
                             };
                             
                             if (typeof cell === 'string') {
                               cellContent = cell;
                             } else if (cell && typeof cell === 'object' && cell.content !== undefined) {
                               cellContent = cell.content;
                               
                               // Apply formatting if available
                               if (cell.formatting) {
                                 const fmt = cell.formatting;
                                 cellStyle = {
                                   ...cellStyle,
                                   fontFamily: fmt.fontFamily || 'Arial, sans-serif',
                                   fontSize: fmt.fontSize || '14px',
                                   fontWeight: fmt.bold ? 'bold' : (fmt.fontWeight || 'normal'),
                                   fontStyle: fmt.italic ? 'italic' : 'normal',
                                   textDecoration: fmt.underline !== 'none' ? fmt.underline : (fmt.strikethrough ? 'line-through' : 'none'),
                                   color: fmt.color || '#000000',
                                   backgroundColor: fmt.backgroundColor || '#ffffff',
                                   textAlign: fmt.textAlign || 'left',
                                   verticalAlign: fmt.verticalAlign || 'middle',
                                   whiteSpace: fmt.whiteSpace || 'nowrap'
                                 };
                               }
                             }
                             
                             const isMerged = isCellMerged(rowIndex, colIndex, spreadsheetData[activeSheetIndex].mergedCells);
                             
                             return (
                               <td 
                                 key={colIndex} 
                                 rowSpan={mergeInfo.rowSpan || 1}
                                 colSpan={mergeInfo.colSpan || 1}
                                 style={{
                                   ...cellStyle,
                                   backgroundColor: isMerged ? "rgba(102, 126, 234, 0.1)" : cellStyle.backgroundColor
                                 }}>
                                 {cellContent || ""}
                               </td>
                             );
                           })}
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
           )}
         </ModalBody>
         <ModalFooter>
           <Button color="secondary" onClick={closeSpreadsheetModal}>
             Close
           </Button>
         </ModalFooter>
       </Modal>
     </>
   );
} 