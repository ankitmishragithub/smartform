// src/SyncfusionSheet.jsx
import React, { useRef, useEffect } from 'react';
import {
  SpreadsheetComponent,
  SheetsDirective,
  SheetDirective,
  RangesDirective,
  RangeDirective,
  ColumnsDirective,
  ColumnDirective,
  RowsDirective,
  RowDirective
} from '@syncfusion/ej2-react-spreadsheet';
import { enableRipple } from '@syncfusion/ej2-base';
enableRipple(true);

export default function SyncfusionSheet({ node, onUpdateField }) {
  const sheetRef = useRef(null);
  const {
    id,
    rows = 3,
    cols = 5,
    data = [],
    merges = [],
    rowHeights = [],
    colWidths = []
  } = node;

  // Build initial cell data
  const sheetData =
    data.length === rows && data[0]?.length === cols
      ? data
      : Array.from({ length: rows }, () => Array(cols).fill(''));

  // Convert merges to Syncfusion mergeSettings
  const mergeSettings = merges.map(m => ({
    row: m.row,
    col: m.col,
    rowSpan: m.rowspan,
    colSpan: m.colspan
  }));

  // After every edit, grab the address string and then the data
  const dataBound = () => {
    const sj = sheetRef.current;
    const sheet = sj.getActiveSheet();
    const address = sheet.usedRange?.address;              // string like "A1:D5"
    if (!address) return;
    const vals = sj.getData(address);                      // now this works
    onUpdateField(id, { data: vals });
  };

  // On mount, apply widths, heights, and merges
  const created = () => {
    const sj = sheetRef.current;
    const sheet = sj.getActiveSheet();
    sheet.columns = colWidths.map(w => ({ width: w || 100 }));
    sheet.rows = rowHeights.map(h => ({ height: h || 25 }));
    sheet.mergeSettings = mergeSettings;
  };

  return (
    <SpreadsheetComponent
      ref={sheetRef}
      allowResizing={true}
      allowMerge={true}
      created={created}
      dataBound={dataBound}
      height="100%"
      width="100%"
    >
      <SheetsDirective>
        <SheetDirective>
          <RangesDirective>
            <RangeDirective dataSource={sheetData} />
          </RangesDirective>
          <ColumnsDirective>
            {Array.from({ length: cols }).map((_, i) => (
              <ColumnDirective key={i} width={colWidths[i] || 100} />
            ))}
          </ColumnsDirective>
          <RowsDirective>
            {rowHeights.map((h, i) => (
              <RowDirective key={i} height={h || 25} />
            ))}
          </RowsDirective>
        </SheetDirective>
      </SheetsDirective>
    </SpreadsheetComponent>
  );
}
