import React, { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "../../css/Livepreview.css";
import api from "../../api/api";


// Helper function to get cell display content and styles
function getCellDisplay(cell) {
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
}

// Helper function to check if cell is merged
function isCellMerged(rowIndex, colIndex, mergedCells = []) {
  return mergedCells?.some(merge => 
    merge.startRow <= rowIndex && 
    merge.endRow >= rowIndex && 
    merge.startCol <= colIndex && 
    merge.endCol >= colIndex
  ) || false;
}

// Helper function to get merge info
function getMergeInfo(rowIndex, colIndex, mergedCells = []) {
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
}

// Spreadsheet component for edit preview
function SpreadsheetEditPreviewComponent({ node }) {
  const { sheets = [], activeSheet = 0 } = node;
  const [currentActiveSheet, setCurrentActiveSheet] = useState(activeSheet);
  const currentSheet = sheets[currentActiveSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };
  
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
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: index === currentActiveSheet ? "600" : "400",
                whiteSpace: "nowrap"
              }}
            >
              {sheet.name || `Sheet ${index + 1}`}
            </button>
          ))}
        </div>

        {/* Spreadsheet Table */}
        <div style={{ 
          border: "1px solid #e5e7eb", 
          borderRadius: "6px", 
          overflow: "hidden",
          backgroundColor: "white"
        }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            fontSize: "14px"
          }}>
            {/* Headers */}
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <th style={{ 
                  padding: "8px", 
                  border: "1px solid #e5e7eb", 
                  fontWeight: "600",
                  textAlign: "left",
                  minWidth: "60px"
                }}>
                  #
                </th>
                {(currentSheet.headers || []).map((header, index) => (
                  <th key={index} style={{ 
                    padding: "8px", 
                    border: "1px solid #e5e7eb", 
                    fontWeight: "600",
                    textAlign: "left"
                  }}>
                    {header || `Column ${index + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Data Rows */}
            <tbody>
              {(currentSheet.data || []).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td style={{ 
                    padding: "8px", 
                    border: "1px solid #e5e7eb", 
                    backgroundColor: "#f9fafb",
                    fontWeight: "600",
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
                    
                    const { content, styles } = getCellDisplay(cell);
                    const isMerged = isCellMerged(rowIndex, colIndex, currentSheet.mergedCells);
                    
                    return (
                      <td 
                        key={colIndex} 
                        rowSpan={mergeInfo.rowSpan || 1}
                        colSpan={mergeInfo.colSpan || 1}
                        style={{
                          padding: "8px",
                          border: "1px solid #e5e7eb",
                          minHeight: "40px",
                          backgroundColor: isMerged ? "rgba(102, 126, 234, 0.1)" : styles.backgroundColor || "transparent",
                          ...styles
                        }}
                      >
                        <span style={{ ...styles }}>
                          {content}
                        </span>
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

// Separate component to handle tabs to avoid hooks issues
function TabsEditPreviewComponent({ node, renderFormNode }) {
  const [activeTab, setActiveTab] = useState(node.activeTab || 0);
  
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
        {node.tabs[activeTab] && node.tabs[activeTab].children && node.tabs[activeTab].children.length > 0 ? (
          node.tabs[activeTab].children.map(child => renderFormNode(child))
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            color: "#9ca3af",
            fontSize: "16px"
          }}>
            <div style={{ 
              fontSize: "48px", 
              marginBottom: "16px",
              opacity: 0.3
            }}>📋</div>
            <p style={{ margin: 0, fontStyle: "italic" }}>
              This tab is empty
            </p>
            <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>
              Drag fields here to add content
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditPreview({ formId, fields, values, onChange, folderName }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen((open) => !open);
  const handlePreviewChange = (id, val) => onChange(id, val);

  const saveForm = async (e) => {
    e.preventDefault();
    if (!fields || fields.length === 0) {
      alert("No fields to save");
      return;
    }

    if (!folderName || !folderName.trim()) {
      alert("Please enter a folder name before saving");
      return;
    }

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
    
    console.log("📤 UPDATING FORM:", formId, {
      schemaJson: payload.schemaJson,
      fieldsLength: schemaWithFolder.length,
      folderName: folderName.trim()
    });
    
    try {
      if (formId) {
        const { data } = await api.put(`/forms/${formId}`, payload);
        console.log("✅ Form updated:", data);
          toast.success("Form updated successfully!");
      } 
    //   else {
    //     const { data } = await api.post("/forms", payload);
    //     alert(` New form created: ${data._id}`);
    //   }
    } catch (err) {
      console.error("❌ Update error:", err);
      console.error("❌ Error response:", err.response?.data);
      alert("❌ Save failed: " + (err.response?.data?.error || err.message));
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
        return (
          <input
            id={id}
            type="tel"
            className="form-control form-control-sm"
            placeholder={f.placeholder}
            maxLength={f.maxLength}
            required={f.required}
            value={val}
            onChange={e => {
              // Only allow numbers, spaces, dashes, parentheses, and plus sign
              let phoneValue = e.target.value.replace(/[^0-9\s\-\(\)\+]/g, '');
              
              // Always allow the change, but show warning if exceeding maxLength
              handlePreviewChange(f.id, phoneValue);
            }}
            style={{
              borderColor: f.maxLength && (val || "").length > f.maxLength ? '#dc3545' : undefined,
              backgroundColor: f.maxLength && (val || "").length > f.maxLength ? '#fff5f5' : undefined
            }}
            onKeyPress={e => {
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
          />
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
            onChange={e => {
              const newValue = e.target.value;
              const numValue = parseFloat(newValue);
              
              if (f.min !== undefined && numValue < f.min) {
                return; // Prevent going below min
              }
              if (f.max !== undefined && numValue > f.max) {
                return; // Prevent going above max
              }
              handlePreviewChange(f.id, newValue);
            }}
          />
        );

      case "password":
        return (
          <input
            id={id}
            type="password"
            className="form-control form-control-sm"
            placeholder={f.placeholder}
            pattern={f.pattern}
            minLength={f.minLength}
            required={f.required}
            value={val}
            onChange={e => handlePreviewChange(f.id, e.target.value)}
          />
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
            {f.maxLength && (
              <div style={{ fontSize: '0.65em', marginTop: 4 }}>
                {(val || '').length}/{f.maxLength}
                {isTextareaTooLong && <span style={{ color: '#dc3545' }}> — exceeds limit</span>}
              </div>
            )}

          </div>
        );

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

  // simplified render function (keep your existing `renderDashliteInput` + `renderFormNode`)
  const renderFormNode = (node) => {
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
    return <TabsEditPreviewComponent key={node.id} node={node} renderFormNode={renderFormNode} />;
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
      <SpreadsheetEditPreviewComponent key={node.id} node={node} />
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
    // leaf field
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
      <div className="card card-preview mb-4">
        <div className="card-inner">
          <div className="card-title-group">
            <div className="card-title">
              <h6 className="title">Edited Preview</h6>
            </div>
            <div className="card-tools">
              <Button onClick={toggleModal}>
                {isModalOpen ? "Close Preview" : "Edited Preview"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={toggleModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{formId ? "Edit Form Preview" : "New Form Preview"}</h3>
            <form>{fields.map((f) => renderFormNode(f))}</form>
            <div className="button-group">
              <button className="save-btn" onClick={saveForm}>
                {formId ? "Save Changes" : "Save New Form"}
              </button>
              <button className="close-btn" onClick={toggleModal}>
                Close
              </button>
            </div>
          </div>
          <ToastContainer position="bottom-center"  />
        </div>
      )}
    </>
  );
}

EditPreview.propTypes = {
  formId: PropTypes.string,
  fields: PropTypes.array.isRequired,
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  folderName: PropTypes.string.isRequired,
};
