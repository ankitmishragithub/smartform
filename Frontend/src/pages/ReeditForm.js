import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../css/FormFill.css";
import "../css/Livepreview.css";
import JSpreadsheetComponent from "../components/JSpreadsheetComponent";
import JSpreadsheetCE4Component from "../components/JSpreadsheetCE4Component";
import SyncfusionSpreadsheetComponent from "../components/SyncfusionSpreadsheetComponent";
import { useAuth } from "../contexts/AuthContext";

  
// Spreadsheet component for form fill
function SpreadsheetFormFillComponent({ field, value, onChange }) {
  const { user } = useAuth();

  const [editableData, setEditableData] = useState({});
  const [editableCells, setEditableCells] = useState(new Set());
  const [currentActiveSheet, setCurrentActiveSheet] = useState(0);

  // Audit trackers / mode
  const stampedColumnsRef = useRef(new Set()); // `${sheetIdx}:${colIdx}` (col-mode only)
  const auditRowIndexRef  = useRef(new Map()); // sheetIdx -> rowIdx
  const auditColIndexRef  = useRef(new Map()); // sheetIdx -> colIdx
  const auditModeRef      = useRef(new Map()); // sheetIdx -> 'row' | 'col'

  // Keep currently focused cell editable
  const activeEditRef     = useRef(null);            // `${row}-${col}` or null
  // Persist editability for cells the USER filled in this session
  const userEditedCellsRef = useRef(new Set());      // keys `${r}-${c}`

  const debouncedOnChange = useRef(null);

  // ---------- utils ----------
  const getCellDisplay = (cell) =>
    typeof cell === "object" && cell !== null
      ? { content: cell.content || "", styles: cell.formatting || {} }
      : { content: cell || "", styles: {} };

  const isCellMerged = (r, c, merged) =>
    merged?.some(m => m.startRow <= r && r <= m.endRow && m.startCol <= c && c <= m.endCol) || false;

  const getMergeInfo = (r, c, merged) => {
    const m = merged?.find(m => m.startRow <= r && r <= m.endRow && m.startCol <= c && c <= m.endCol);
    if (!m) return { isContinuation: false, rowSpan: 1, colSpan: 1 };
    return {
      isContinuation: r > m.startRow || c > m.startCol,
      rowSpan: m.endRow - m.startRow + 1,
      colSpan: m.endCol - m.startCol + 1
    };
  };

  const seedAuditFromSheet = (sheetIdx, sheet) => {
    const headers = Array.isArray(sheet.headers) ? sheet.headers : null;
    if (headers) {
      const idx = headers.findIndex(h => (h || "").toString().trim().toLowerCase() === "audit");
      if (idx >= 0) {
        auditColIndexRef.current.set(sheetIdx, idx);
        sheet._auditColIndex = idx;
      }
    }
    if (typeof sheet._auditRowIndex === "number") {
      auditRowIndexRef.current.set(sheetIdx, sheet._auditRowIndex);
    }
  };

  const isAuditCol = (sheetIdx, colIdx, sheet) =>
    (auditColIndexRef.current.get(sheetIdx) ?? sheet?._auditColIndex ?? -1) === colIdx;

  const isAuditRow = (sheetIdx, rowIdx, sheet) =>
    (auditRowIndexRef.current.get(sheetIdx) ?? sheet?._auditRowIndex ?? -1) === rowIdx;

  // ---------- build editable map ----------
  // Rule: Only empty cells (at load) are editable. Cells the user fills remain editable afterwards.
  // Pre-filled cells from the sheet remain read-only forever.
  useEffect(() => {
    const src = value?.sheets?.length ? value : field;
    if (!src?.sheets?.length) {
      setEditableData({});
      setEditableCells(new Set());
      return;
    }
    
    const sheets = src.sheets;
    const sheet = sheets[currentActiveSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };

    seedAuditFromSheet(currentActiveSheet, sheet);

    // DETECT EXISTING AUDIT MODE from pre-filled data (for re-editing)
    if (!auditModeRef.current.has(currentActiveSheet) && sheet.data) {
      const auditColIdx = auditColIndexRef.current.get(currentActiveSheet) ?? sheet._auditColIndex ?? -1;
      const auditRowIdx = auditRowIndexRef.current.get(currentActiveSheet) ?? sheet._auditRowIndex ?? -1;
      
      let hasExistingAuditColumns = false;
      let hasExistingAuditRows = false;
      
      // Check for existing audit column content
      if (auditColIdx >= 0) {
        for (let r = 1; r < sheet.data.length; r++) {
          const cell = sheet.data[r]?.[auditColIdx];
          const content = typeof cell === "object" ? (cell.content || "") : String(cell || "");
          if (content.includes(" - ") && (content.includes(" AM") || content.includes(" PM"))) {
            hasExistingAuditColumns = true;
              break;
            }
          }
        }
        
      // Check for existing audit row content
      if (auditRowIdx >= 0 && sheet.data[auditRowIdx]) {
        for (let c = 0; c < (sheet.data[0]?.length || 0); c++) {
          const cell = sheet.data[auditRowIdx][c];
          const content = typeof cell === "object" ? (cell.content || "") : String(cell || "");
          if (content.includes(" - ") && (content.includes(" AM") || content.includes(" PM"))) {
            hasExistingAuditRows = true;
            break;
          }
        }
      }
      
            // Set mode based on existing audit data
      // IMPORTANT: audit COLUMNS exist → user was filling ROWS → mode="row" 
      //           audit ROWS exist → user was filling COLUMNS → mode="col"
      if (hasExistingAuditColumns && !hasExistingAuditRows) {
        auditModeRef.current.set(currentActiveSheet, "row");
        console.log(`🔍 [ReeditForm] Detected existing audit COLUMNS → User was filling ROWS → Setting mode to ROW for sheet ${currentActiveSheet}`);
      } else if (hasExistingAuditRows && !hasExistingAuditColumns) {
        auditModeRef.current.set(currentActiveSheet, "col");
        console.log(`🔍 [ReeditForm] Detected existing audit ROWS → User was filling COLUMNS → Setting mode to COL for sheet ${currentActiveSheet}`);
      } else if (hasExistingAuditColumns && hasExistingAuditRows) {
        // Both exist - choose based on which has more entries
        let auditColCount = 0, auditRowCount = 0;
        
        if (auditColIdx >= 0) {
          for (let r = 1; r < sheet.data.length; r++) {
            const cell = sheet.data[r]?.[auditColIdx];
            const content = typeof cell === "object" ? (cell.content || "") : String(cell || "");
            if (content.includes(" - ")) auditColCount++;
          }
        }
        
        if (auditRowIdx >= 0 && sheet.data[auditRowIdx]) {
          for (let c = 0; c < (sheet.data[0]?.length || 0); c++) {
            const cell = sheet.data[auditRowIdx][c];
            const content = typeof cell === "object" ? (cell.content || "") : String(cell || "");
            if (content.includes(" - ")) auditRowCount++;
          }
        }
        
        if (auditColCount >= auditRowCount) {
          auditModeRef.current.set(currentActiveSheet, "row");
          console.log(`🔍 [ReeditForm] Both audit types exist, audit columns have more entries (${auditColCount} vs ${auditRowCount}) → Setting mode to ROW (user was filling ROWS)`);
          } else {
          auditModeRef.current.set(currentActiveSheet, "col");
          console.log(`🔍 [ReeditForm] Both audit types exist, audit rows have more entries (${auditRowCount} vs ${auditColCount}) → Setting mode to COL (user was filling COLUMNS)`);
        }
      }
    }

    const newEditableData = {};
    const newEditableCells = new Set();

    // detect time columns
    const timeCols = new Set();
    if (sheet.data?.[0]) {
      for (let c = 0; c < sheet.data[0].length; c++) {
        let header = "";
        for (let r = 0; r < sheet.data.length; r++) {
          const cell = sheet.data[r]?.[c];
          if (cell) {
            const t = typeof cell === "object" ? (cell.content || "") : String(cell || "");
            if (t.trim()) { header = t; break; }
          }
        }
        const lc = header.toLowerCase();
        if (lc.includes("time") || lc.includes("time.")) timeCols.add(c);
      }
    }

    // Step 1: make EMPTY, non-reserved cells editable
    sheet.data?.forEach((row, r) => {
      row?.forEach((cell, c) => {
        const key = `${r}-${c}`;
        const { content } = getCellDisplay(cell);

        const isReserved =
          (timeCols.has(c) && r === 1) ||
          isAuditCol(currentActiveSheet, c, sheet) ||
          isAuditRow(currentActiveSheet, r, sheet);

        if (isReserved) return;

        if (!String(content ?? "").trim()) {
          // empty -> editable
          newEditableCells.add(key);
          newEditableData[key] = "";
          }
        });
      });

    // Step 2: keep USER-filled cells editable (even if now non-empty)
    userEditedCellsRef.current.forEach(key => {
      const [r, c] = key.split("-").map(Number);
      if (!Number.isFinite(r) || !Number.isFinite(c)) return;

      const isReserved =
        (timeCols.has(c) && r === 1) ||
        isAuditCol(currentActiveSheet, c, sheet) ||
        isAuditRow(currentActiveSheet, r, sheet);

      if (isReserved) return;

      newEditableCells.add(key);
      // preserve buffer if any, otherwise seed with current content
      if (!(key in newEditableData)) {
        const cell = sheet.data?.[r]?.[c];
        const fromSheet = getCellDisplay(cell).content ?? "";
        newEditableData[key] = editableData[key] ?? fromSheet ?? "";
      }
    });

    // Step 3: keep the currently focused cell editable (typing pauses)
    if (activeEditRef.current) {
      newEditableCells.add(activeEditRef.current);
      if (!(activeEditRef.current in newEditableData)) {
        newEditableData[activeEditRef.current] = editableData[activeEditRef.current] ?? "";
      }
    }

    setEditableData(newEditableData);
    setEditableCells(newEditableCells);
  }, [field, value, currentActiveSheet]); // rebuild on every value change

  // cleanup debounce
  useEffect(() => () => debouncedOnChange.current && clearTimeout(debouncedOnChange.current), []);

  const handleCellChange = (rowIndex, colIndex, newValue) => {
    const key = `${rowIndex}-${colIndex}`;
    if (!editableCells.has(key)) return;

    const sheets = value?.sheets || field.sheets || [];
    const sheet  = sheets[currentActiveSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };

    if (isAuditCol(currentActiveSheet, colIndex, sheet) || isAuditRow(currentActiveSheet, rowIndex, sheet)) return;

    // As soon as the user edits this cell, mark it as user-owned editable
    userEditedCellsRef.current.add(key);

    // detect time column
    let header = "";
    const maxCheck = Math.min(3, sheet.data?.length || 0);
    for (let r = 0; r < maxCheck; r++) {
      const cell = sheet.data?.[r]?.[colIndex];
      if (cell) {
        const t = typeof cell === "object" ? (cell.content || "") : String(cell || "");
        if (t.trim()) { header = t; break; }
      }
    }
    const lc = header.toLowerCase();
    const isTimeColumn = lc.includes("time") || lc.includes("time.");
    const isFirstDataRow = rowIndex === 1;
    
    const updates = { [key]: newValue };

    if (isTimeColumn && !isFirstDataRow && String(newValue).trim()) {
      const timeKey = `1-${colIndex}`;
      const now = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
      updates[timeKey] = now;
    }

    // instant echo
    setEditableData(prev => ({ ...prev, ...updates }));

    // write into sheet copy
    const updatedSheets = [...sheets];
    const data = [...(sheet.data || [])];

    Object.entries(updates).forEach(([k, v]) => {
      const [r, c] = k.split("-").map(Number);
      if (!data[r]) return;
      data[r] = [...data[r]];
      if (typeof data[r][c] === "object" && data[r][c] !== null) {
        data[r][c] = { ...data[r][c], content: v };
        } else {
        data[r][c] = v;
      }
    });

    // ---- single-mode audit logic ----
    try {
      const hasContent = (cell) =>
        typeof cell === "object" && cell !== null
          ? (cell.content || "").toString().trim() !== ""
          : (cell ?? "").toString().trim() !== "";

      const headers = Array.isArray(sheet.headers) ? sheet.headers : null;
      const userId  = user?.id || user?.username || "admin";
      const stamp   = `${userId} - ${new Date().toLocaleString()}`;

        const ensureAuditColumn = () => {
        let idx = -1;
        if (headers) idx = headers.findIndex(h => (h || "").toString().trim().toLowerCase() === "audit");
        const cols = data[0]?.length || 0;
        if (idx === -1) {
          idx = cols;
          for (let r = 0; r < data.length; r++) {
            const row = data[r] || [];
            while (row.length < cols) row.push("");
            row.push("");
            data[r] = row;
          }
          headers && headers.push("Audit");
          sheet.cols = (data[0]?.length || cols + 1);
        }
        auditColIndexRef.current.set(currentActiveSheet, idx);
        sheet._auditColIndex = idx;
        return idx;
      };

        const ensureAuditRow = () => {
        const cols = data[0]?.length || (colIndex + 1);
          const existing = auditRowIndexRef.current.get(currentActiveSheet);
        if (typeof existing === "number" && existing >= 0 && existing < data.length) return existing;
        const row = new Array(cols).fill("");
        data.push(row);
        const idx = data.length - 1;
        sheet.rows = data.length;
          auditRowIndexRef.current.set(currentActiveSheet, idx);
        sheet._auditRowIndex = idx;
          return idx;
        };

      const countFilledInRow = (rIdx) => {
        let cnt = 0;
        for (let c = 0; c < (data[rIdx]?.length || 0); c++) {
          if (isAuditCol(currentActiveSheet, c, sheet)) continue;
          if (hasContent(data[rIdx][c])) cnt++;
        }
        return cnt;
      };

      const countFilledInCol = (cIdx) => {
        let cnt = 0;
        // Detect if this is a time column
        let header = "";
        for (let r = 0; r < Math.min(3, data.length); r++) {
          const cell = data[r]?.[cIdx];
          if (cell) {
            const t = typeof cell === "object" ? (cell.content || "") : String(cell || "");
            if (t.trim()) { header = t; break; }
          }
        }
        const isTimeCol = header.toLowerCase().includes("time") || header.toLowerCase().includes("time.");
        
        // For time columns, start counting from row 2 (since row 1 is reserved for auto-timestamp)
        // For regular columns, start from row 1
        const startRow = isTimeCol ? 2 : 1;
        
        for (let r = startRow; r < data.length; r++) {
          if (isAuditRow(currentActiveSheet, r, sheet)) continue;
          if (hasContent(data[r]?.[cIdx])) cnt++;
        }
        console.log(`[ReeditForm] Column ${cIdx} ${isTimeCol ? '(TIME COLUMN)' : '(REGULAR)'} has ${cnt} filled cells (starting from row ${startRow})`);
        return cnt;
      };

      // PRIORITY AUDIT LOGIC: Once mode is chosen, stick to it for entire form
      let mode = auditModeRef.current.get(currentActiveSheet);
      const rowFilled = rowIndex >= 1 ? countFilledInRow(rowIndex) : 0;
      const colFilled = countFilledInCol(colIndex);

      console.log(`[ReeditForm] Row ${rowIndex} has ${rowFilled} filled cells, Column ${colIndex} has ${colFilled} filled cells`);
      console.log(`[ReeditForm] Current audit mode for sheet ${currentActiveSheet}: ${mode || 'undefined'}`);

      // If no mode set yet, determine it based on which threshold is reached first
      // IMPORTANT: When you fill COLUMNS → Add audit ROWS (mode="col")
      //           When you fill ROWS → Add audit COLUMNS (mode="row") 
      if (!mode) {
        if (colFilled === 2) {
          mode = "col";
          auditModeRef.current.set(currentActiveSheet, "col");
          console.log(`🎯 [ReeditForm] COLUMN FILLED → Setting mode to COL (will add audit ROWS below) for sheet ${currentActiveSheet}`);
        } else if (rowIndex >= 1 && rowFilled === 2) {
          mode = "row";
          auditModeRef.current.set(currentActiveSheet, "row");
          console.log(`🎯 [ReeditForm] ROW FILLED → Setting mode to ROW (will add audit COLUMNS to right) for sheet ${currentActiveSheet}`);
        }
      }

      // Apply audit logic based on the established mode
      if (mode === "col") {
        // COLUMN FILLING MODE: Add audit rows below when columns are filled
        const stKey = `${currentActiveSheet}:${colIndex}`;
        if (colFilled === 2 && !stampedColumnsRef.current.has(stKey)) {
          console.log(`✅ [ReeditForm][COLUMN MODE] Adding audit ROW below for column ${colIndex} (2 cells in column)`);
          const aRow = ensureAuditRow();
          if (!hasContent(data[aRow][colIndex])) data[aRow][colIndex] = stamp;
          stampedColumnsRef.current.add(stKey);
        }
        // Skip row audit logic entirely in column mode
        console.log(`⏭️ [ReeditForm][COLUMN MODE] Skipping row audit logic`);
        
      } else if (mode === "row") {
        // ROW FILLING MODE: Add audit columns to the right when rows are filled
        if (rowIndex >= 1 && rowFilled === 2) {
          console.log(`✅ [ReeditForm][ROW MODE] Adding audit COLUMN to right for row ${rowIndex} (2 cells in row)`);
          const aCol = ensureAuditColumn();
          data[rowIndex][aCol] = stamp;
        }
        // Skip column audit logic entirely in row mode
        console.log(`⏭️ [ReeditForm][ROW MODE] Skipping column audit logic`);
      }
    } catch { /* ignore audit errors */ }

    // commit + debounce
    sheet.data = data;
    updatedSheets[currentActiveSheet] = sheet;
    const updatedField = { ...field, sheets: updatedSheets };

    if (debouncedOnChange.current) clearTimeout(debouncedOnChange.current);
    debouncedOnChange.current = setTimeout(() => {
      onChange(updatedField);
      // ensure keys exist for audit cells in editableData (do NOT add to editableCells)
      setEditableData(prev => {
        const next = { ...prev };
        const aCol = auditColIndexRef.current.get(currentActiveSheet) ?? sheet._auditColIndex ?? -1;
        const aRow = auditRowIndexRef.current.get(currentActiveSheet) ?? sheet._auditRowIndex ?? -1;

        if (aCol >= 0 && sheet.data?.[0]) {
          for (let r = 0; r < sheet.data.length; r++) {
            const k = `${r}-${aCol}`;
            if (!(k in next)) next[k] = getCellDisplay(sheet.data[r][aCol]).content || "";
          }
        }
        if (aRow >= 0 && sheet.data?.[aRow]) {
          for (let c = 0; c < (sheet.data[0]?.length || 0); c++) {
            const k = `${aRow}-${c}`;
            if (!(k in next)) next[k] = getCellDisplay(sheet.data[aRow][c]).content || "";
          }
        }
        return next;
      });
    }, 450);
  };

  const handleAutofillTime = (r, c, e) => {
    e.preventDefault(); e.stopPropagation();
    const now = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
    handleCellChange(r, c, now);
  };

  const handleCellKeyDown = (e, r, c) => {
    const sheets = field.sheets || [];
    const sheet  = sheets[currentActiveSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };

    // detect time column for shortcut
    let header = "";
    const maxCheck = Math.min(3, sheet.data?.length || 0);
    for (let i = 0; i < maxCheck; i++) {
      const cell = sheet.data?.[i]?.[c];
      if (cell) {
        const t = typeof cell === "object" ? (cell.content || "") : String(cell || "");
        if (t.trim()) { header = t; break; }
      }
    }
    const isTimeCol = header.toLowerCase().includes("time");
    if (isTimeCol && r === 1 && e.ctrlKey && e.key.toLowerCase() === "t") {
      e.preventDefault();
      handleAutofillTime(r, c, e);
    }
  };

  // ---------- render ----------
  const sheets = value?.sheets || field.sheets || [];
  const sheet  = sheets[currentActiveSheet] || { data: [], headers: [], rows: 0, cols: 0, mergedCells: [] };

  if (!sheets.length) {
    return (
      <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 8, background: "#f8f9fa", color: "#6c757d", textAlign: "center" }}>
        <p>No spreadsheet data available</p>
      </div>
    );
  }

  const attachFocusBlur = (r, c) => ({
    onFocus: () => {
      const key = `${r}-${c}`;
      activeEditRef.current = key;
      setEditableCells(prev => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    },
    onBlur: () => {
      // Don't lock on blur; newly filled cells stay editable because we add them to userEditedCellsRef on change.
      activeEditRef.current = null;
    }
  });

  return (
    <div style={{ marginBottom: "1rem" }}>
      {sheets.length > 1 && (
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 10 }}>
          {sheets.map((s, i) => (
            <button key={i} type="button" onClick={() => setCurrentActiveSheet(i)}
              style={{
                padding: "8px 16px", border: "none",
                background: currentActiveSheet === i ? "#667eea" : "transparent",
                color: currentActiveSheet === i ? "white" : "#374151",
                cursor: "pointer", borderTopLeftRadius: 6, borderTopRightRadius: 6,
                fontSize: 14, fontWeight: currentActiveSheet === i ? 600 : 400
              }}>
              {s.name || `Sheet ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="form-fill-spreadsheet-scroll-container">
        <table className="form-fill-spreadsheet-table">
          <tbody>
            {(sheet.data || []).map((row, r) => (
              <tr key={r}>
                {(row || []).map((cell, c) => {
                  const m = getMergeInfo(r, c, sheet.mergedCells);
                  if (m.isContinuation) return null;
                  
                  const { content, styles } = getCellDisplay(cell);
                  const merged = isCellMerged(r, c, sheet.mergedCells);

                  // header sampling (for time button)
                  let header = "";
                  const maxCheck = Math.min(3, sheet.data?.length || 0);
                  for (let i = 0; i < maxCheck; i++) {
                    const hcell = sheet.data?.[i]?.[c];
                    if (hcell) {
                      const t = typeof hcell === "object" ? (hcell.content || "") : String(hcell || "");
                      if (t.trim()) { header = t; break; }
                    }
                  }
                  const lc = header.toLowerCase();
                  const isTimeCol = lc.includes("time") || lc.includes("time.");
                  const isFirstDataRow = r === 1;

                  const auditC = isAuditCol(currentActiveSheet, c, sheet);
                  const auditR = isAuditRow(currentActiveSheet, r, sheet);

                  const key = `${r}-${c}`;
                  const editable = editableCells.has(key) && !auditC && !auditR;

                  // For read-only cells, show sheet content; for editable, show live buffer
                  const displayValue = editable
                    ? (editableData[key] ?? content ?? "")
                    : (content ?? editableData[key] ?? "");

                  const showTimeButton = editable && isTimeCol && (isFirstDataRow || lc.includes("time."));
                  
                  return (
                    <td key={c} rowSpan={m.rowSpan} colSpan={m.colSpan}
                        style={{ backgroundColor: merged ? "rgba(102,126,234,0.1)" : styles.backgroundColor || "transparent", ...styles }}>
                      {editable ? (
                        showTimeButton ? (
                          <div style={{ position: "relative", width: "100%", height: "100%" }}>
                        <input
                          type="text"
                          value={displayValue}
                              onChange={(e) => handleCellChange(r, c, e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, r, c)}
                              data-cell={`${r}-${c}`}
                              {...attachFocusBlur(r, c)}
                          style={{
                                width: "100%", height: "100%", border: "none", background: "transparent", outline: "none",
                                fontSize: styles.fontSize || 14, fontFamily: styles.fontFamily || "inherit",
                                padding: "8px 28px 8px 8px", margin: 0, position: "absolute", inset: 0, zIndex: 10, boxSizing: "border-box"
                          }}
                          className="form-fill-spreadsheet-input"
                            />
                            <button type="button" title="Insert current time"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAutofillTime(r, c, e); }}
                              style={{
                                position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)",
                                width: 20, height: 20, border: "none", background: "#6366f1", color: "white",
                                borderRadius: 3, cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20
                              }}>
                              🕐
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={displayValue}
                            onChange={(e) => handleCellChange(r, c, e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, r, c)}
                            data-cell={`${r}-${c}`}
                            {...attachFocusBlur(r, c)}
                            style={{
                              width: "100%", height: "100%", border: "none", background: "transparent", outline: "none",
                              fontSize: styles.fontSize || 14, fontFamily: styles.fontFamily || "inherit",
                              padding: "8px", margin: 0, position: "absolute", inset: 0, zIndex: 10, boxSizing: "border-box"
                            }}
                            className="form-fill-spreadsheet-input"
                          />
                        )
                      ) : (
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...styles }}>
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

export default function ReeditForm(props) {
  // Accept id as a prop (for Tabs view)
  const params = useParams();
  const id = params.formId || props.id;
  const navigate = useNavigate();
  const [responseId, setResponseId] = useState(params.responseId || props.responseId || null);

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
  const [formTitle, setFormTitle] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [baseInit, setBaseInit] = useState(null);
  const [formLoaded, setFormLoaded] = useState(false);
  const {user}=useAuth();

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
        const title = (schema.find((e) => e.type === 'heading')?.label) || '';
        setFormTitle(title);
        
        // Debug: Log field types to see what we're working with
        schema.forEach((field, index) => {
          console.log(`Field ${index}:`, {
            id: field.id,
            type: field.type,
            label: field.label,
            hasOptions: !!field.options,
            optionsCount: field.options?.length || 0,
            hasValue: !!field.value,
            valueType: typeof field.value
          });
        });
        
        setFields(schema);

        const init = {};
        schema.forEach((f) => {
          if (f.type === "checkbox") {
            init[f.id] = false;
          } else if (f.type === "spreadsheet" || f.type === "syncfusion-spreadsheet") {
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
    const rid = params.responseId || props.responseId || responseId;
    if (!rid || !formLoaded || !baseInit) return;
    api.get(`/responses/${rid}`)
      .then((r) => {
        const resp = r.data || {};
        setSubmitterName(resp.submitterName || "");
        setSubmitterEmail(resp.submitterEmail || "");
        setBatchNo(resp.batchNo || '');
        const merged = { ...baseInit };
        Object.keys(resp.answers || {}).forEach((key) => {
          const answer = resp.answers[key];
          console.log(`📥 Loading answer for field ${key}:`, {
            type: typeof answer,
            hasWorkbook: !!(answer?.Workbook),
            hasSheets: !!(answer?.sheets),
            isObject: typeof answer === 'object',
            keys: typeof answer === 'object' ? Object.keys(answer) : 'N/A'
          });
          
          // If it's a Syncfusion spreadsheet, log more details
          if (answer && typeof answer === 'object' && answer.Workbook) {
            console.log(`    🔍 Syncfusion data details for ${key}:`, {
              hasWorkbook: !!answer.Workbook,
              hasSheets: !!(answer.Workbook?.sheets),
              sheetsCount: answer.Workbook?.sheets?.length || 0,
              firstSheetRows: answer.Workbook?.sheets?.[0]?.rows?.length || 0,
              firstSheetCols: answer.Workbook?.sheets?.[0]?.rows?.[0]?.cells?.length || 0,
              sampleData: answer.Workbook?.sheets?.[0]?.rows?.[0]?.cells?.slice(0, 3) || []
            });
          }
          
          merged[key] = answer;
        });
        console.log('📥 Final merged values:', merged);
        setValues(merged);
      })
      .catch((err) => {
        console.error('Failed to load existing response for edit:', err);
      });
  }, [params.responseId, props.responseId, responseId, formLoaded, baseInit]);

  const handleChange = (fid, val) => {
    setValues((v) => ({ ...v, [fid]: val }));
  };

  const handleSubmit = async () => {
    try {
      // Validate mandatory fields
      if (!submitterName.trim()) {
        alert("Please enter your name");
        return;
      }
      
      if (!submitterEmail.trim()) {
        alert("Please enter your email");
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(submitterEmail)) {
        alert("Please enter a valid email address");
        return;
      }

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
          if (f.type === 'syncfusion-spreadsheet') {
            // For Syncfusion spreadsheet, check if any editable cells have been filled
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

      // Sync all spreadsheet data before submission to ensure stamps are included
      Object.values(values).forEach(value => {
        if (value && typeof value === 'object' && value.sheets) {
          // This is a spreadsheet field, sync its data
          if (value.onChange && typeof value.onChange.syncDataImmediately === 'function') {
            value.onChange.syncDataImmediately();
          }
        }
      });

      let resp;
      if (responseId) {
        // Update existing response
        resp = await api.put(`/responses/${responseId}`, { 
          submitterName: submitterName.trim(),
          submitterEmail: submitterEmail.trim(),
          batchNo: String(batchNo).trim(),
          answers: values 
        });
      } else {
        // New submission
        resp = await api.post("/responses", { 
          form: id, 
          submitterName: submitterName.trim(),
          submitterEmail: submitterEmail.trim(),
          batchNo: String(batchNo).trim(),
          answers: values 
        });
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
      case "syncfusion-spreadsheet":
        console.log('📊 Rendering Syncfusion field:', {
          fieldId: f.id,
          hasValue: !!val,
          valueType: typeof val,
          hasWorkbook: !!(val?.Workbook),
          hasSheets: !!(val?.sheets)
        });
        return (
          <SyncfusionSpreadsheetComponent 
            field={f} 
            value={val}
            onChange={(updatedField) => {
              console.log('📝 Syncfusion renderInput onChange:', {
                fieldId: f.id,
                hasWorkbook: !!(updatedField?.Workbook),
                hasSheets: !!(updatedField?.sheets),
                valueType: typeof updatedField
              });
              handleChange(f.id, updatedField);
            }}
            readOnly={false}
            rows={f.defaultRows || 15}
            cols={f.defaultCols || 8}
            livePreview={true}
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
            color: "#2c3e50",
            display: "none"
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
    // Syncfusion spreadsheet is handled in renderInput function
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
          {/* Compact header: folder, form title, batch no */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent:"center", gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}></div>
            <div style={{ fontSize: 13, fontWeight: 600, marginRight: 16 }}>{formName || 'Untitled'}</div>
            {formTitle ? (
              <>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Form:</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginRight: 16 }}>{formTitle}</div>
              </>
            ) : null}
            <div style={{ fontSize: 12, color: '#6b7280' }}>Batch No:</div>
            <Input
              id="batch-no"
              type="text"
              bsSize="sm"
              style={{ maxWidth: 180, paddingTop: 4, paddingBottom: 4 }}
              placeholder="Batch no"
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              required
            />
          </div>
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
                  Update Form
              </button>
            </div>
          </div>
          </form>
        </div>
      )}
      </div>
  );
}

