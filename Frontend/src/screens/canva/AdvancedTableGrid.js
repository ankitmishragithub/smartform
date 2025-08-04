// src/screens/canva/AdvancedTableGrid.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';

export default function AdvancedTableGrid({ node, updateNode }) {
  // node.data is your 2D array: e.g. [[ 'A1','B1'], ['A2','B2']]
  // internally AG Grid wants rowData as array of objects:
  const [rowData, setRowData] = useState([]);
  
  // build column definitions once
  const colDefs = useMemo(
    () =>
      Array.from({ length: node.cols }, (_, i) => ({
        headerName: node.colLabels?.[i] || `Col ${i + 1}`,
        field: `c${i}`,
        editable: true
      })),
    [node.cols, node.colLabels]
  );

  // whenever node.data changes, sync into rowData
  useEffect(() => {
    const data = (node.data || []).map(rowArr =>
      rowArr.reduce((obj, val, c) => {
        obj[`c${c}`] = val ?? '';
        return obj;
      }, {})
    );
    setRowData(data);
  }, [node.data]);

  // on cell edit, push changes back into node.data
  const onCellValueChanged = params => {
    const newRowData = params.api
      .getRenderedNodes()
      .map(n =>
        colDefs.map(cd => n.data[cd.field] ?? '')
      );
    updateNode(node.id, { data: newRowData });
  };

  return (
    <div className="ag-theme-alpine" style={{ height: 300, width: '100%' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={{ resizable: true }}
        onCellValueChanged={onCellValueChanged}
      />
    </div>
  );
}
