import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Head from "../layout/head/Head";
import api from "../api/api";
import "../css/ReeditForm.css";
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

// Local spreadsheet editor for 'spreadsheet' type (sheets-based)
function ReeditSpreadsheet({ field, value, onChange }) {
  const [activeSheet, setActiveSheet] = useState(0);
  const [editableCells, setEditableCells] = useState(new Set());

  const sheets = (value && value.sheets) || field?.sheets || [];
  const current = sheets[activeSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };

  const getCellText = (cell) => {
    if (typeof cell === 'object' && cell !== null) return cell.content || '';
    return cell || '';
  };

  const getCellFormatting = (cell) => {
    if (cell && typeof cell === 'object' && cell.formatting) {
      const fmt = cell.formatting;
      const styles = {
        fontFamily: fmt.fontFamily || undefined,
        fontSize: fmt.fontSize || undefined,
        fontWeight: fmt.bold ? '700' : (fmt.fontWeight || undefined),
        fontStyle: fmt.italic ? 'italic' : undefined,
        textDecoration:
          (fmt.underline && fmt.underline !== 'none' ? 'underline ' : '') +
          (fmt.strikethrough ? 'line-through' : ''),
        color: fmt.color || undefined,
        backgroundColor: fmt.backgroundColor || undefined,
        textAlign: fmt.textAlign || undefined,
        verticalAlign: fmt.verticalAlign || undefined,
        whiteSpace: fmt.whiteSpace || undefined,
      };
      // Clean undefined
      Object.keys(styles).forEach((k) => styles[k] === undefined && delete styles[k]);
      return styles;
    }
    return {};
  };

  const handleCellChange = (rowIndex, colIndex, newValue) => {
    const cloneSheets = Array.isArray(sheets) ? sheets.map(s => ({ ...s, data: s.data ? s.data.map(r => [...r]) : [] })) : [];
    const sheet = cloneSheets[activeSheet] || { data: [] };
    if (!sheet.data[rowIndex]) sheet.data[rowIndex] = [];
    const prev = sheet.data[rowIndex][colIndex];
    if (typeof prev === 'object' && prev !== null) {
      sheet.data[rowIndex][colIndex] = { ...prev, content: newValue };
    } else {
      sheet.data[rowIndex][colIndex] = newValue;
    }
    cloneSheets[activeSheet] = sheet;
    onChange && onChange({ ...(value || {}), sheets: cloneSheets });
  };

  const rowsCount = current?.rows || current?.data?.length || 0;
  const colsCount = current?.cols || (current?.data?.[0]?.length || 0);
  const hasCustomHeaders = Array.isArray(current.headers) && current.headers.some(h => {
    if (!h || !String(h).trim()) return false;
    return !/^Column\s+\d+$/i.test(String(h).trim());
  });

  // Determine editable cells (only empty cells)
  useEffect(() => {
    const editable = new Set();
    for (let r = 0; r < rowsCount; r++) {
      for (let c = 0; c < colsCount; c++) {
        const cell = current?.data?.[r]?.[c];
        const text = getCellText(cell);
        if (!text || String(text).trim() === '') {
          editable.add(`${r}-${c}`);
        }
      }
    }
    setEditableCells(editable);
  }, [activeSheet, rowsCount, colsCount]);

  return (
    <div className="reedit-spreadsheet-container">
      {sheets.length > 1 && (
        <div className="reedit-spreadsheet-tabs">
          {sheets.map((s, i) => (
            <button
              className={`reedit-tab-button ${i === activeSheet ? 'active' : ''}`}
              key={i}
              type="button"
              onClick={() => setActiveSheet(i)}
            >
              {s.name || `Sheet ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="reedit-spreadsheet-scroll-container">
        <table className="reedit-spreadsheet-table">
          {hasCustomHeaders && (
            <thead>
              <tr>
                {Array.from({ length: colsCount }).map((_, colIndex) => (
                  <th key={colIndex}>
                    {current.headers?.[colIndex] || ''}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rowsCount }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: colsCount }).map((_, colIndex) => {
                  const cell = current.data?.[rowIndex]?.[colIndex];
                  const text = getCellText(cell);
                  const style = getCellFormatting(cell);
                  const isEditable = editableCells.has(`${rowIndex}-${colIndex}`);
                  return (
                    <td key={colIndex} style={style}>
                      <input
                        className="reedit-spreadsheet-input"
                        type="text"
                        value={text}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        readOnly={!isEditable}
                        style={{
                          // mirror text styles into the input
                          fontFamily: style.fontFamily,
                          fontSize: style.fontSize,
                          fontWeight: style.fontWeight,
                          fontStyle: style.fontStyle,
                          textDecoration: style.textDecoration,
                          color: style.color,
                          textAlign: style.textAlign,
                          verticalAlign: style.verticalAlign,
                          background: 'transparent',
                        }}
                      />
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
      navigate(`/response-details/${responseId}`);
    } catch (e) {
      console.error("Update failed", e);
      alert("Failed to update. Please try again.");
    } finally {
      setSaving(false);
    }
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
          <div className="reedit-spreadsheet">
            <ReeditSpreadsheet
              field={node}
              value={val}
              onChange={(updated) => handleChange(node.id, updated)}
            />
          </div>
        );
      case "jspreadsheet":
        return (
          <div className="reedit-spreadsheet-scroll-container">
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
          <div className="reedit-spreadsheet-scroll-container">
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
        <div className="reedit-container">
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
        <Container className="py-4">
          <Alert color="danger">{error}</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Head title="Edit Submission" />
      <div className="reedit-container">
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
                    {node.label && (
                      <div className="mb-1 fw-semibold" style={{ color: "#495057" }}>
                        {node.label}
                      </div>
                    )}
                    {renderInput(node)}
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