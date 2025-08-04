// src/components/AgGridSheet.jsx
import React, { useMemo, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export default function AgGridSheet({ node, onUpdateField }) {
  const gridRef = useRef();

  const {
    id,
    data = [[]],
    merges = [],
    rowHeights = [],
    colWidths = []
  } = node;

  const rowCount = data.length;
  const colCount = data[0]?.length || 0;

  // Build column definitions:
  // - field = colIndex  
  // - editable  
  // - resizable via defaultColDef  
  // - colSpan for merges
  const columnDefs = useMemo(() => {
    return Array.from({ length: colCount }).map((_, colIndex) => ({
      field: `${colIndex}`,
      editable: true,
      // column resizing is enabled globally via defaultColDef
      width: colWidths[colIndex] || 100,
      colSpan: params => {
        // find a merge that starts at this row/col
        const m = merges.find(
          m => m.row === params.node.rowIndex && m.col === colIndex
        );
        return m ? m.colspan : 1;
      }
    }));
  }, [colCount, merges, colWidths]);

  // Prepare row data as objects keyed by column index strings
  const rowData = useMemo(() => {
    return data.map((rowArr, rowIndex) => {
      const obj = {};
      rowArr.forEach((val, colIndex) => {
        // hide cells covered by a colspan from a merge to the left
        const hidden = merges.some(
          m =>
            m.row === rowIndex &&
            colIndex > m.col &&
            colIndex < m.col + m.colspan
        );
        if (!hidden) obj[`${colIndex}`] = val;
      });
      return obj;
    });
  }, [data, merges]);

  // When any cell edits finish → serialize full grid back to 2D array
  const onCellValueChanged = () => {
    const api = gridRef.current.api;
    const updated = [];
    api.forEachNode(node => {
      // rebuild each row as array of strings
      const rowObj = node.data || {};
      const rowArr = Array(colCount).fill('');
      for (let c = 0; c < colCount; c++) {
        rowArr[c] = rowObj[c] ?? '';
      }
      updated.push(rowArr);
    });
    onUpdateField(id, { data: updated });
  };

  // Optionally control row heights
  const getRowHeight = params => rowHeights[params.node.rowIndex] || 25;

  return (
    <div className="ag-theme-alpine" style={{ width: '100%', height: '100%' }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        rowData={rowData}
        defaultColDef={{
          resizable: true,    // enable column resize
          sortable: false,
          filter: false,
        }}
        getRowHeight={getRowHeight}   // enable row resize via custom heights
        enableCellTextSelection={true}
        onCellValueChanged={onCellValueChanged}
        localeText={{}}              // your locale if any
      />
    </div>
  );
}
