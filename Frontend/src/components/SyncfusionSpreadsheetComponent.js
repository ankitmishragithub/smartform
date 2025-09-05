import { registerLicense } from '@syncfusion/ej2-base';
registerLicense(process.env.REACT_APP_SYNCFUSION_LICENSE_KEY);

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SpreadsheetComponent,
  SheetsDirective,
  SheetDirective,
} from "@syncfusion/ej2-react-spreadsheet";

// Import all Syncfusion styles
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-react-spreadsheet/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-inputs/styles/material.css';
import '@syncfusion/ej2-popups/styles/material.css';
import '@syncfusion/ej2-lists/styles/material.css';
import '@syncfusion/ej2-navigations/styles/material.css';
import '@syncfusion/ej2-dropdowns/styles/material.css';
import '@syncfusion/ej2-calendars/styles/material.css';
import '@syncfusion/ej2-splitbuttons/styles/material.css';
import '@syncfusion/ej2-treegrid/styles/material.css';

import { livePreviewBridge } from '../utils/LivePreviewBridge';
import '../css/SyncfusionSpreadsheet.css';

const DEFAULT_ROWS = 15;
const DEFAULT_COLS = 8;

function numToCol(n0) {
  let n = n0;
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function parseAddress(addr) {
  const last = addr.includes("!") ? addr.split("!").pop() : addr;
  const m = last.match(/^([A-Z]+)(\d+)$/i);
  if (!m) return { row: 0, col: 0 };
  const col = addr.split(/\d/)[0].split('').reduce((r, a) => r * 26 + parseInt(a, 36) - 9, 0) - 1;
  const row = parseInt(m[2], 10) - 1;
  return { row, col };
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
  livePreview = false,
}) => {
  console.log('🔄 SyncfusionSpreadsheetComponent: Rendered', {
    fieldId: field?.id,
    hasValue: !!value,
    valueType: typeof value,
    hasWorkbook: !!(value?.Workbook),
    hasSheets: !!(value?.sheets),
    livePreview: livePreview
  });
  
  // Debug: Log detailed value structure
  if (value && typeof value === 'object') {
    console.log('📊 Value structure details:', {
      keys: Object.keys(value),
      hasWorkbook: !!value.Workbook,
      workbookKeys: value.Workbook ? Object.keys(value.Workbook) : 'N/A',
      hasSheets: !!(value.Workbook?.sheets),
      sheetsCount: value.Workbook?.sheets?.length || 0,
      firstSheetRows: value.Workbook?.sheets?.[0]?.rows?.length || 0,
      firstSheetCols: value.Workbook?.sheets?.[0]?.rows?.[0]?.cells?.length || 0
    });
  }

  const ssRef = useRef(null);
  const changeTimer = useRef(null);
  const isLoadingState = useRef(false);
  const id = field?.id || 'spreadsheet';
  const [isUpdatingFromBridge, setIsUpdatingFromBridge] = useState(false);

  // **CRITICAL: Subscribe to live sync updates**
  useEffect(() => {
    const handlePreviewUpdate = async (fullWorkbookData, source) => {
      if (source === 'preview' && fullWorkbookData && !isLoadingState.current) {
        console.log('📡 Canvas: Received complete Workbook from preview', {
          hasWorkbook: !!(fullWorkbookData?.Workbook),
          livePreview: livePreview,
          id: id
        });
        
        setIsUpdatingFromBridge(true);
        isLoadingState.current = true;
        
        const ss = ssRef.current;
        if (ss && fullWorkbookData.Workbook) {
          try {
            console.log('🎨 Restoring complete Workbook state with styles...');
            
            // **KEY: Use openFromJson to restore COMPLETE state including styles**
            await ss.openFromJson({ file: fullWorkbookData });
            
            console.log('✅ Complete Workbook state restored successfully');
          } catch (error) {
            console.error('❌ Error restoring Workbook state:', error);
          }
        }
        
        
        setTimeout(() => {
          isLoadingState.current = false;
          setIsUpdatingFromBridge(false);
        }, 500);
      }
    };

    livePreviewBridge.subscribe(id, handlePreviewUpdate, 'canvas');

    return () => {
      livePreviewBridge.unsubscribe(id, 'canvas');
    };
  }, [id, livePreview]);


 // or [] to only run once, or adapt according to your data flow

  // **CRITICAL: Handle value changes and ensure data persistence**
  useEffect(() => {
    if (!value || !value.Workbook || isLoadingState.current) return;
    
    const ss = ssRef.current;
    if (!ss) return;
    
    console.log('🔄 Value changed, ensuring data is loaded:', {
      hasWorkbook: !!(value?.Workbook),
      livePreview: livePreview,
      id: id
    });
    
    const loadData = async () => {
      try {
        isLoadingState.current = true;
        console.log('🎨 Loading value data into spreadsheet...');
        
        await ss.openFromJson({ file: value });
        
        console.log('✅ Value data loaded successfully');
      } catch (error) {
        console.error('❌ Error loading value data:', error);
      } finally {
        setTimeout(() => {
          isLoadingState.current = false;
        }, 300);
      }
    };
    
    // Load data immediately if spreadsheet is ready, otherwise wait
    if (ss.openFromJson) {
      loadData();
    } else {
      setTimeout(loadData, 100);
    }
  }, [value, livePreview, id]);

  // **CRITICAL: Ensure data is loaded when component mounts with existing data**
  useEffect(() => {
    if (!value || !value.Workbook) return;
    
    const ss = ssRef.current;
    if (!ss) return;
    
    // Check if data is already loaded by looking at the first cell
    const checkAndLoadData = async () => {
      try {
        const activeSheet = ss.activeSheet || ss.getActiveSheet?.();
        if (activeSheet && activeSheet.rows && activeSheet.rows.length > 0) {
          const firstRow = activeSheet.rows[0];
          const hasData = firstRow && firstRow.cells && firstRow.cells.some(cell => 
            cell && cell.value && cell.value.toString().trim() !== ''
          );
          
          if (!hasData) {
            console.log('🔄 No data found in spreadsheet, loading from value...');
            await ss.openFromJson({ file: value });
            console.log('✅ Data loaded from value successfully');
          } else {
            console.log('✅ Data already present in spreadsheet');
          }
        }
      } catch (error) {
        console.error('❌ Error checking/loading data:', error);
      }
    };
    
    // Wait a bit for the spreadsheet to be fully initialized
    setTimeout(checkAndLoadData, 1000);
  }, [value]);

  // **CRITICAL: Capture complete Workbook state including all styles**
  const captureCompleteWorkbookState = async () => {
    const ss = ssRef.current;
    
    if (!ss || !ss.saveAsJson || isLoadingState.current) {
      console.warn('Cannot capture state: Spreadsheet not ready');
      return null;
    }

    try {
      console.log('📸 Capturing complete Workbook state...');
      
      // **KEY: Use saveAsJson to get COMPLETE Workbook including all formatting**
      const completeWorkbook = await ss.saveAsJson();
      
      console.log('✅ Complete Workbook captured:', {
        hasWorkbook: !!(completeWorkbook?.jsonObject?.Workbook),
        hasStyles: !!(completeWorkbook?.jsonObject?.Workbook?.sheets?.[0]?.rows?.some(row => 
          row?.cells?.some(cell => cell?.style)
        )),
        sheetsCount: completeWorkbook?.jsonObject?.Workbook?.sheets?.length || 0
      });

      // Return the complete Syncfusion format
      return {
        ...completeWorkbook.jsonObject, // This contains the full Workbook with styles
        timestamp: Date.now(),
        source: 'canvas'
      };
      
    } catch (error) {
      console.error('❌ Error capturing Workbook state:', error);
      return null;
    }
  };

  // Returns just plain cell values as a 2D array (no styles/formats)
const extractPlainSheetData = async () => {
  const ss = ssRef.current;
  if (!ss) return [];
  
  try {
    // Get active sheet
    let activeSheet = null;
    
    if (ss.activeSheet) {
      activeSheet = ss.activeSheet;
    } else if (ss.getActiveSheet && typeof ss.getActiveSheet === 'function') {
      activeSheet = ss.getActiveSheet();
    } else if (ss.sheets && ss.activeSheetTab !== undefined) {
      activeSheet = ss.sheets[ss.activeSheetTab];
    } else if (ss.sheets && ss.sheets.length > 0) {
      activeSheet = ss.sheets[0];
    }
    
    if (!activeSheet) return [];

    // Try to get data using different methods
    let result = null;
    
    // Method 1: Try getUsedRange
    if (activeSheet.getUsedRange && typeof activeSheet.getUsedRange === 'function') {
      const usedRange = activeSheet.getUsedRange();
      if (usedRange && activeSheet.getData) {
        result = await activeSheet.getData(usedRange);
      }
    }
    
    // Method 2: Try fixed range if usedRange didn't work
    if (!result && activeSheet.getData) {
      try {
        result = await activeSheet.getData('A1:Z100');
      } catch (e) {
        // Ignore error, try next method
      }
    }
    
    // Method 3: Try direct data access
    if (!result && activeSheet.rows) {
      const rows = activeSheet.rows;
      if (Array.isArray(rows)) {
        result = rows.map(row => {
          if (row && row.cells) {
            return row.cells.map(cell => cell?.value || "");
          }
          return [];
        });
      }
    }
    
    if (!result || !Array.isArray(result)) return [];

    // Filter out empty rows and get only values
    const filteredResult = result.filter(row => 
      Array.isArray(row) && row.some(cell => cell !== undefined && cell !== "")
    );
    
    const finalResult = filteredResult.map(row => {
      if (!Array.isArray(row)) return [];
      return row.map(cell => (cell !== undefined ? cell : ""));
    });
    
    return finalResult;
  } catch (error) {
    console.error('Error extracting plain sheet data:', error);
    return [];
  }
};

  // Function to detect filled cells and make them read-only (for form fill mode)
  const makeFilledCellsReadOnly = async () => {
    const ss = ssRef.current;
    if (!ss || !livePreview) return; // Only apply in form fill mode (livePreview=true)
    
    try {
      console.log('🔒 Making filled cells read-only for form fill mode...');
      
      // Get active sheet
      let activeSheet = null;
      if (ss.activeSheet) {
        activeSheet = ss.activeSheet;
      } else if (ss.getActiveSheet && typeof ss.getActiveSheet === 'function') {
        activeSheet = ss.getActiveSheet();
      }
      
      if (!activeSheet || !activeSheet.rows) return;
      
      // Iterate through all rows and cells to find filled ones
      for (let rowIndex = 0; rowIndex < activeSheet.rows.length; rowIndex++) {
        const row = activeSheet.rows[rowIndex];
        if (!row || !row.cells) continue;
        
        for (let colIndex = 0; colIndex < row.cells.length; colIndex++) {
          const cell = row.cells[colIndex];
          if (cell && cell.value && cell.value.toString().trim() !== '') {
            // Cell has content, make it read-only
            const cellAddress = `${numToCol(colIndex)}${rowIndex + 1}`;
            try {
              ss.setRangeReadOnly(true, cellAddress, 0);
              console.log(`🔒 Made cell ${cellAddress} read-only`);
            } catch (error) {
              console.warn(`Error making cell ${cellAddress} read-only:`, error);
            }
          }
        }
      }
      
      console.log('✅ Filled cells have been made read-only');
    } catch (error) {
      console.error('❌ Error making filled cells read-only:', error);
    }
  };

  // **CRITICAL: Apply initial complete state on creation**
  const handleCreated = async () => {
    console.log('🔄 Syncfusion Spreadsheet created');
    
    // Wait for complete initialization
    setTimeout(async () => {
      const ss = ssRef.current;
      if (!ss) return;

      // If we have a complete Workbook state, restore it
      if (value && value.Workbook) {
        try {
          console.log('🎨 Loading initial complete Workbook state...');
          isLoadingState.current = true;
          
          await ss.openFromJson({ file: value });
          
          console.log('✅ Initial Workbook state loaded successfully');
          
          // After loading data, make filled cells read-only for form fill mode
          setTimeout(() => {
            makeFilledCellsReadOnly();
            isLoadingState.current = false;
          }, 500);
        } catch (error) {
          console.error('❌ Error loading initial Workbook:', error);
          isLoadingState.current = false;
        }
      } 
      // Otherwise, initialize with basic data if available
      else if (value?.sheets?.[0]?.data || value?.data) {
        console.log('🔄 Loading basic data without formatting...');
        const data = value.sheets?.[0]?.data || value.data || [];
        
        for (let r = 0; r < data.length; r++) {
          for (let c = 0; c < (data[r]?.length || 0); c++) {
            const cellValue = data[r][c];
            if (cellValue !== "" && cellValue != null) {
              const addr = `${numToCol(c)}${r + 1}`;
              try {
                ss.updateCell({ value: String(cellValue) }, addr);
              } catch (error) {
                console.warn('Error updating cell:', error);
              }
            }
          }
        }
        
        // After loading data, make filled cells read-only for form fill mode
        setTimeout(() => {
          makeFilledCellsReadOnly();
        }, 500);
      } else if (livePreview) {
        // Even if no initial data, still apply read-only logic after a delay
        setTimeout(() => {
          makeFilledCellsReadOnly();
        }, 1000);
      }
    }, 500); // Increased timeout to ensure spreadsheet is fully ready
  };

  // Handle any spreadsheet changes and sync complete state
  const handleActionComplete = async (args) => {
    if (isUpdatingFromBridge || isLoadingState.current) return;
    
    console.log('📝 Spreadsheet action completed:', {
      action: args?.action,
      livePreview: livePreview,
      id: id
    });
    
    // For form fill mode, make newly filled cells read-only
    if (livePreview && args?.action && ['cellSave', 'edit'].includes(args.action)) {
      // Small delay to ensure cell value is committed
      setTimeout(() => {
        makeFilledCellsReadOnly();
      }, 100);
    }
    
    // Debounce to avoid too frequent captures
    if (changeTimer.current) clearTimeout(changeTimer.current);
    
    changeTimer.current = setTimeout(async () => {
      const completeState = await captureCompleteWorkbookState();
      
      if (completeState && onChange) {
        console.log('🔄 Syncing complete state to parent and bridge...', {
          hasWorkbook: !!(completeState?.Workbook),
          livePreview: livePreview
        });
        
        // Update parent component
        onChange(completeState);
        
        // **CRITICAL: Update bridge with complete Workbook**
        livePreviewBridge.updateFromCanvas(id, completeState);
      }
    }, 500);
  };

  const sheetHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div className={`ej2-spreadsheet-field ${className}`} style={{ position: 'relative' }}>
      {/* Sync Status Indicator - Only show in form builder */}
      {!livePreview && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          fontSize: '10px',
          backgroundColor: isUpdatingFromBridge ? '#f59e0b' : '#10b981',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          zIndex: 1000,
          opacity: 0.8
        }}>
          {isUpdatingFromBridge ? '🔄 SYNCING' : '🎨 LIVE+STYLES'}
        </div>
      )}

      {/* Field Label - Only show in form builder */}
      {!livePreview && (
        <div style={{ marginBottom: "8px" }}>
          <span style={{ fontWeight: "600", color: "#374151" }}>
            📈 {field?.label || 'Syncfusion Spreadsheet'}
          </span>
        </div>
      )}

      <div 
        className={livePreview ? "syncfusion-live-preview" : ""}
        style={{ 
          height: sheetHeight, 
          border: "1px solid #e5e7eb", 
          borderRadius: "8px", 
          overflow: "hidden" 
        }}>
        <SpreadsheetComponent
          ref={ssRef}
          height={sheetHeight}
          width="100%"
          showRibbon={!livePreview}
          showFormulaBar={!livePreview}
          showSheetTabs={!livePreview}
          allowEditing={!readOnly}
          allowOpen={true}
          allowSave={true}
          allowCellFormatting={true}
          allowNumberFormatting={true}
          allowFontFormatting={true}
          created={handleCreated}
          actionComplete={handleActionComplete}
        >
          <SheetsDirective>
            <SheetDirective
              name={field?.label || 'Sheet1'}
              rowCount={rows + 20}
              columnCount={cols + 10}
            />
          </SheetsDirective>         
        </SpreadsheetComponent>
      </div>

      {/* Data extraction button */}
      <div style={{ 
        marginTop: '10px', 
        textAlign: 'center' 
      }}>
        {/* <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const data = await extractPlainSheetData();
            console.log("Plain spreadsheet data:", data);
          }}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
        >
          View data
        </button> */}
      </div>
    </div>
  );
};

export default SyncfusionSpreadsheetComponent;

