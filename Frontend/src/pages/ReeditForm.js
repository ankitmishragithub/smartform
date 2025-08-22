import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Head from "../layout/head/Head";
import api from "../api/api";
import "../css/ReeditForm.css";
import "../css/FormFill.css";
import "../css/Livepreview.css";
import {
  Container,
  Spinner,
  Button,
  FormGroup,
  Label,
  Input,
  Card,
  CardBody,
  Alert,
} from "reactstrap";
import JSpreadsheetComponent from "../components/JSpreadsheetComponent";
import JSpreadsheetCE4Component from "../components/JSpreadsheetCE4Component";

// Local spreadsheet editor for 'spreadsheet' type (sheets-based) - Using FormFill-style UI
function ReeditSpreadsheet({ field, value, onChange }) {
  const [activeSheet, setActiveSheet] = useState(0);
  const [editableData, setEditableData] = useState({});
  const [editableCells, setEditableCells] = useState(new Set());

  const sheets = (value && value.sheets) || field?.sheets || [];
  const currentSheet = sheets[activeSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };

  // Initialize editable data when component mounts or field changes
  useEffect(() => {
    const newEditableData = {};
    const editableCells = new Set();
    
    if (currentSheet.data) {
      currentSheet.data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const cellKey = `${rowIndex}-${colIndex}`;
          let content = '';
          if (typeof cell === 'object' && cell !== null) {
            content = cell.content || '';
          } else {
            content = cell || '';
          }
          
          // Only empty cells are editable
          if (!content || content.trim() === '') {
            newEditableData[cellKey] = '';
            editableCells.add(cellKey);
          }
        });
      });
    }
    setEditableData(newEditableData);
    setEditableCells(editableCells);
  }, [field, activeSheet]);
  

  

  const handleCellChange = (rowIndex, colIndex, newValue) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    
    // Update local state immediately for responsive UI
    setEditableData(prev => ({
      ...prev,
      [cellKey]: newValue
    }));
    
    // Update the parent form value
    const updatedSheets = [...sheets];
    const currentSheetIndex = activeSheet;
    const currentSheet = updatedSheets[currentSheetIndex];
    
    if (currentSheet && currentSheet.data) {
      const updatedData = [...currentSheet.data];
      
      if (updatedData[rowIndex]) {
        updatedData[rowIndex] = [...updatedData[rowIndex]];
        // Update cell content, preserving formatting if it exists
        if (typeof updatedData[rowIndex][colIndex] === 'object' && updatedData[rowIndex][colIndex] !== null) {
          updatedData[rowIndex][colIndex] = {
            ...updatedData[rowIndex][colIndex],
            content: newValue
          };
        } else {
          updatedData[rowIndex][colIndex] = newValue;
        }
      }
      
      currentSheet.data = updatedData;
      updatedSheets[currentSheetIndex] = currentSheet;
      
      // Update the field data
      const updatedField = {
        ...value,
        sheets: updatedSheets
      };
      
      onChange(updatedField);
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
          borderBottom: "2px solid #d1d5db", 
          marginBottom: "0",
          backgroundColor: "white",
          borderRadius: "8px 8px 0 0",
          padding: "0 10px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
        }}>
          {sheets.map((sheet, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveSheet(index)}
              style={{
                padding: "10px 20px",
                border: "2px solid #d1d5db",
                borderBottom: "none",
                background: activeSheet === index ? "#667eea" : "#f9fafb",
                color: activeSheet === index ? "white" : "#374151",
                cursor: "pointer",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                fontSize: "14px",
                fontWeight: activeSheet === index ? "600" : "500",
                transition: "all 0.2s ease",
                marginRight: "2px",
                position: "relative",
                top: "2px"
              }}
              onMouseEnter={(e) => {
                if (activeSheet !== index) {
                  e.target.style.background = "#e5e7eb";
                  e.target.style.color = "#1f2937";
                }
              }}
              onMouseLeave={(e) => {
                if (activeSheet !== index) {
                  e.target.style.background = "#f9fafb";
                  e.target.style.color = "#374151";
                }
              }}
            >
              {sheet.name || `Sheet ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Spreadsheet Title */}
      <div style={{
        marginBottom: "10px",
        padding: "8px 0",
        borderBottom: "1px solid #e5e7eb"
      }}>
        
      </div>

      {/* Spreadsheet Table */}
      <div className="form-fill-spreadsheet-scroll-container" style={{
        overflow: "auto",
        border: "2px solid #d1d5db",
        borderRadius: "8px",
        backgroundColor: "white",
        maxHeight: "500px",
        width: "100%",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        marginTop: "10px"
      }}>
        <table className="form-fill-spreadsheet-table" style={{
          minWidth: "max-content",
          borderCollapse: "collapse",
          fontSize: "14px",
          tableLayout: "fixed",
          width: "max-content",
          border: "2px solid #d1d5db"
        }}>
          
          {/* Data Rows */}
          <tbody>
            {(currentSheet.data || []).map((row, rowIndex) => (
              <tr key={rowIndex}>
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
                  
                  return (
                    <td 
                      key={colIndex} 
                      rowSpan={mergeInfo.rowSpan || 1}
                      colSpan={mergeInfo.colSpan || 1}
                                              style={{
                          backgroundColor: isMerged ? "rgba(0, 0, 0, 0.05)" : styles.backgroundColor || "transparent",
                          width: "150px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          padding: "8px",
                          border: "1px solid #d1d5db",
                          verticalAlign: "middle",
                          position: "relative",
                          height: "40px",
                          ...styles
                        }}
                    >
                      {isEditable ? (
                        <input
                          type="text"
                          value={displayValue}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
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
                            boxSizing: "border-box",
                            transition: "all 0.2s ease"
                          }}
                          className="form-fill-spreadsheet-input"
                          onFocus={(e) => {
                            e.target.style.background = "rgba(0, 0, 0, 0.05)";
                            e.target.style.border = "none";
                            e.target.style.boxShadow = "none";
                          }}
                          onBlur={(e) => {
                            e.target.style.background = "transparent";
                            e.target.style.border = "none";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      ) : (
                        <span style={{ 
                          ...styles,
                          display: "block",
                          padding: "8px",
                          minHeight: "20px",
                          lineHeight: "1.4",
                          color: "#6b7280",
                          fontStyle: "italic"
                        }}>
                          {content}
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

export default function ReeditForm() {
  const { formId, responseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [response, setResponse] = useState(null);
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Load form and response like view-submitted
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [formRes, respRes] = await Promise.all([
          api.get(`/forms/${formId}`),
          api.get(`/responses/${responseId}`),
        ]);
        if (!mounted) return;
        const f = formRes.data;
        const r = respRes.data;
        setForm(f);
        setResponse(r);
        setFields(Array.isArray(f?.schemaJson) ? f.schemaJson : []);
        setSubmitterName(r?.submitterName || "");
        setSubmitterEmail(r?.submitterEmail || "");

        // Initialize values with prior answers; default sane values per type
        const init = {};
        (Array.isArray(f?.schemaJson) ? f.schemaJson : []).forEach((node) => {
          if (!node || !node.id) return;
          const prev = r?.answers ? r.answers[node.id] : undefined;
          if (prev !== undefined) {
            init[node.id] = prev;
          } else {
            switch (node.type) {
              case "checkbox":
                init[node.id] = false;
                break;
              case "spreadsheet":
              case "jspreadsheet":
              case "jspreadsheetCE4":
                init[node.id] = node; // component handles defaults
                break;
              default:
                init[node.id] = "";
            }
          }
        });
        setValues(init);
      } catch (e) {
        console.error("Failed to load reedit data", e);
        setError("Failed to load submission data. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [formId, responseId]);

  const handleChange = (fieldId, val) => {
    setValues((v) => ({ ...v, [fieldId]: val }));
  };

  const getFormLabel = useMemo(() => {
    if (!form) return () => "Untitled Form";
    return () => {
      const heading = form.schemaJson?.find((e) => e.type === "heading")?.label;
      const folder = form.schemaJson?.find((e) => e.type === "folderName")?.label;
      return heading || folder || "Untitled Form";
    };
  }, [form]);

  const handleUpdate = async () => {
    try {
      // Submitter fields are not editable on resubmit; no need to validate here

      setSaving(true);
      // Do not send submitterName/email so backend keeps existing values
      await api.put(`/responses/${responseId}`, {
        answers: values,
      });
      alert("Submission updated successfully");
      navigate("/");
    } catch (e) {
      console.error("Update failed", e);
      alert("Failed to update. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Render form node with proper column layout handling (like FormFill)
  const renderFormNode = (node) => {
    if (!node || !node.id) return null;
    
    // Handle column layout

    
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
    // Handle table layout (for shift information)
    if (node.type === "table") {
      return (
        <div
          key={node.id}
          className="form-fill-table"
          style={{ 
            display: "grid",
            gridTemplateColumns: `repeat(${node.cols || 2}, 1fr)`,
            gap: "10px",
            marginBottom: "1rem"
          }}
        >
          {node.children?.map((rowArr, r) =>
            rowArr.map((cellArr, c) => (
              <div
                key={`${node.id}-r${r}c${c}`}
                className="form-fill-table-cell"
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "10px",
                  backgroundColor: "#f9fafb"
                }}
              >
                {cellArr.map((child) => (
                  <div key={child.id} className="reedit-group" style={{ marginBottom: "10px" }}>
                    {child.label && !["content", "spreadsheet", "jspreadsheet", "jspreadsheetCE4", "htmlelement"].includes(child.type) && (
                      <div className="mb-1 fw-semibold" style={{ color: "#495057", fontSize: "13px" }}>
                        {child.label}
                      </div>
                    )}
                    {renderInput(child)}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      );
    }
    
    // Handle other container types
    if (["container", "datagrid", "editgrid", "datamap"].includes(node.type)) {
      return (
        <div key={node.id} style={{ marginBottom: "1rem" }}>
          {node.label && (
            <h6 style={{ marginBottom: "10px", color: "#495057", fontSize: "14px" }}>
              {node.label}
            </h6>
          )}
          {node.children?.map(child => renderFormNode(child))}
        </div>
      );
    }
    
    // For regular form fields, ensure label is displayed (but hide for certain types)
    const shouldHideLabel = ["content", "spreadsheet", "jspreadsheet", "jspreadsheetCE4", "htmlelement"].includes(node.type);
    
    return (
      <div key={node.id} className="reedit-group" style={{ marginBottom: "15px" }}>
        {node.label && !shouldHideLabel && (
          <div className="mb-1 fw-semibold" style={{ color: "#495057", fontSize: "14px" }}>
            {node.label}
          </div>
        )}
        {renderInput(node)}
      </div>
    );
  };

  const renderInput = (node) => {
    const val = node.type === "checkbox" ? Boolean(values[node.id]) : values[node.id] ?? "";
    switch (node.type) {
      case "text":
      case "email":
      case "number":
      case "url":
      case "phone":
        return (
          <Input
            className="reedit-input"
            type={node.type === "number" ? "number" : "text"}
            value={val}
            onChange={(e) => handleChange(node.id, e.target.value)}
          />
        );
      case "textarea":
        return (
          <Input
            className="reedit-textarea"
            type="textarea"
            value={val}
            onChange={(e) => handleChange(node.id, e.target.value)}
          />
        );
      case "checkbox":
        return (
          <Input
            type="checkbox"
            checked={!!val}
            onChange={(e) => handleChange(node.id, e.target.checked)}
          />
        );
      case "select":
        return (
          <Input
            className="reedit-select"
            type="select"
            value={val || ""}
            onChange={(e) => handleChange(node.id, e.target.value)}
          >
            <option value="">Select...</option>
            {(node.options || []).map((opt, i) => (
              <option key={i} value={opt.value || opt}>
                {opt.label || opt}
              </option>
            ))}
          </Input>
        );
      case "spreadsheet":
        return (
          <div className="form-fill-spreadsheet">
            <ReeditSpreadsheet
              field={node}
              value={val}
              onChange={(updated) => handleChange(node.id, updated)}
            />
          </div>
        );
      case "jspreadsheet":
        return (
          <div className="form-fill-spreadsheet-scroll-container">
            <JSpreadsheetComponent
              field={node}
              value={val}
              onChange={(updated) => handleChange(node.id, updated)}
              isFormFill={true}
            />
          </div>
        );
      case "jspreadsheetCE4":
        return (
          <div className="form-fill-spreadsheet-scroll-container">
            <JSpreadsheetCE4Component
              field={node}
              value={val}
              onChange={(updated) => handleChange(node.id, updated)}
              isFormFill={true}
            />
          </div>
        );
      case "content":
        return (
          <div
            dangerouslySetInnerHTML={{ __html: node.richText || node.richtext || "<p>Content block</p>" }}
          />
        );

      case "htmlelement":
        return (
          <div
            dangerouslySetInnerHTML={{ __html: node.rawHTML || node.rawhtml || "<div>Custom HTML Content</div>" }}
          />
        );
      default:
        return (
          <Input
            className="reedit-input"
            type="text"
            value={val}
            onChange={(e) => handleChange(node.id, e.target.value)}
          />
        );
    }
  };

  if (loading) {
    return (
      <>
        <Head title="Edit Submission" />
        <div className="form-fill-container">
          <div className="reedit-card reedit-loading text-center">
            <Spinner color="primary" />
            <div className="mt-2">Loading submission...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head title="Edit Submission" />
        <div className="form-fill-container">
          <Container className="py-4">
            <Alert color="danger">{error}</Alert>
          </Container>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title="Edit Submission" />
      <div className="form-fill-container">
        <div className="reedit-card">
          <div className="reedit-card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                Edit Submission — {getFormLabel()}
              </h5>
            </div>

            {/* Personal Information */}
            <div className="reedit-group">
              <Label className="fw-bold">Submitter Name</Label>
              <Input className="reedit-input" value={submitterName} readOnly disabled />
            </div>
            <div className="reedit-group">
              <Label className="fw-bold">Submitter Email</Label>
              <Input className="reedit-input" type="email" value={submitterEmail} readOnly disabled />
            </div>

            {/* Form Fields */}
            {Array.isArray(fields) && fields.length > 0 ? (
              fields.map((node) => {
                if (!node || ["folderName", "heading"].includes(node.type)) return null;
                return (
                  <div key={node.id} className="reedit-group">
                    {renderFormNode(node)}
                  </div>
                );
              })
            ) : (
              <div className="text-muted">No fields to display.</div>
            )}

            <div className="reedit-actions">
              <button className="reedit-submit-btn" onClick={handleUpdate} disabled={saving}>
                {saving ? "Saving..." : "Update Submission"}
              </button>
              <button className="reedit-cancel-btn" onClick={() => navigate(-1)} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}