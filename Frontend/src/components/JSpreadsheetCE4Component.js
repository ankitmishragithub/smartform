import React, { useEffect, useState, useRef, useCallback } from 'react';
import '../css/jspreadsheet-ce4.css';

// Column Type Configuration Modal Component
const ColumnTypeModal = ({ columnIndex, currentType, currentOptions, onSave, onCancel }) => {
  const [type, setType] = useState(currentType || 'text');
  const [options, setOptions] = useState(currentOptions || []);
  const [newOption, setNewOption] = useState('');
  const [colorValue, setColorValue] = useState('#000000');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [timeFormat, setTimeFormat] = useState('HH:mm');
  const [numberFormat, setNumberFormat] = useState('decimal');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [rowRange, setRowRange] = useState({ start: 0, end: 0 });

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const config = { type, rowRange };
    
    switch (type) {
      case 'dropdown':
      case 'autocomplete':
        config.dropdownOptions = options;
        config.autocompleteOptions = options;
        break;
      case 'color':
        config.defaultColor = colorValue;
        break;
      case 'date':
        config.dateFormat = dateFormat;
        break;
      case 'time':
        config.timeFormat = timeFormat;
        break;
      case 'numeric':
        config.numberFormat = numberFormat;
        config.minValue = minValue;
        config.maxValue = maxValue;
        break;
      default:
        break;
    }
    
    onSave(columnIndex, type, config);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        minWidth: '500px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
          🔧 Configure Column {String.fromCharCode(65 + columnIndex)} Type
        </h3>
        
        {/* Column Type Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Column Type:
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            <option value="text">📝 Text</option>
            <option value="numeric">🔢 Numeric</option>
            <option value="date">📅 Date</option>
            <option value="time">⏰ Time</option>
            <option value="checkbox">☑️ Checkbox</option>
            <option value="dropdown">📋 Dropdown</option>
            <option value="autocomplete">🔍 Autocomplete</option>
            <option value="color">🎨 Color</option>
            <option value="image">🖼️ Image URL</option>
            <option value="richtext">📄 Rich Text</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Row Range (Apply to rows):
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                From Row:
              </label>
              <input
                type="number"
                value={rowRange.start}
                onChange={(e) => setRowRange(prev => ({ ...prev, start: parseInt(e.target.value) || 0 }))}
                min="0"
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                placeholder="0"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                To Row:
              </label>
              <input
                type="number"
                value={rowRange.end}
                onChange={(e) => setRowRange(prev => ({ ...prev, end: parseInt(e.target.value) || 0 }))}
                min="0"
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                placeholder="0"
              />
            </div>
          </div>
          <div style={{ marginTop: '5px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
            Leave both as 0 to apply to all rows in the column
          </div>
        </div>

        {/* Type-specific options */}
        {(type === 'dropdown' || type === 'autocomplete') && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              {type === 'dropdown' ? 'Dropdown' : 'Autocomplete'} Options:
            </label>
            
            {options.map((option, index) => (
              <div key={index} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = e.target.value;
                    setOptions(newOptions);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  onClick={() => removeOption(index)}
                  style={{
                    marginLeft: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
            
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addOption()}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Add new option..."
              />
              <button
                onClick={addOption}
                style={{
                  marginLeft: '8px',
                  padding: '8px 15px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ➕ Add
              </button>
            </div>
          </div>
        )}

        {type === 'color' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Default Color:
            </label>
            <input
              type="color"
              value={colorValue}
              onChange={(e) => setColorValue(e.target.value)}
              style={{
                width: '100px',
                height: '40px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
        )}

        {type === 'date' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Date Format:
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM-DD-YYYY">MM-DD-YYYY</option>
            </select>
          </div>
        )}

        {type === 'time' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Time Format:
            </label>
            <select
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="HH:mm">24-hour (HH:mm)</option>
              <option value="HH:mm:ss">24-hour with seconds (HH:mm:ss)</option>
              <option value="hh:mm A">12-hour (hh:mm AM/PM)</option>
              <option value="hh:mm:ss A">12-hour with seconds (hh:mm:ss AM/PM)</option>
            </select>
          </div>
        )}

        {type === 'numeric' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Number Format:
            </label>
            <select
              value={numberFormat}
              onChange={(e) => setNumberFormat(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="decimal">Decimal</option>
              <option value="integer">Integer</option>
              <option value="currency">Currency</option>
              <option value="percentage">Percentage</option>
            </select>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                  Min Value:
                </label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                  placeholder="No limit"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                  Max Value:
                </label>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                  placeholder="No limit"
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💾 Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

// Row Type Configuration Modal Component
const RowTypeModal = ({ rowIndex, currentType, currentOptions, onSave, onCancel }) => {
  const [type, setType] = useState(currentType || 'text');
  const [options, setOptions] = useState(currentOptions || []);
  const [newOption, setNewOption] = useState('');
  const [colorValue, setColorValue] = useState('#000000');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [timeFormat, setTimeFormat] = useState('HH:mm');
  const [numberFormat, setNumberFormat] = useState('decimal');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [colRange, setColRange] = useState({ start: 0, end: 0 });

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const config = { type, colRange };
    switch (type) {
      case 'dropdown':
      case 'autocomplete':
        config.dropdownOptions = options;
        config.autocompleteOptions = options;
        break;
      case 'color':
        config.defaultColor = colorValue;
        break;
      case 'date':
        config.dateFormat = dateFormat;
        break;
      case 'time':
        config.timeFormat = timeFormat;
        break;
      case 'numeric':
        config.numberFormat = numberFormat;
        config.minValue = minValue;
        config.maxValue = maxValue;
        break;
      default:
        break;
    }
    onSave(rowIndex, type, config);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        minWidth: '500px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
          🔧 Configure Row {rowIndex + 1} Type
        </h3>
        
        {/* Row Type Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Row Type:
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
          >
            <option value="text">📝 Text</option>
            <option value="numeric">🔢 Numeric</option>
            <option value="date">📅 Date</option>
            <option value="time">⏰ Time</option>
            <option value="checkbox">☑️ Checkbox</option>
            <option value="dropdown">📋 Dropdown</option>
            <option value="autocomplete">🔍 Autocomplete</option>
            <option value="color">🎨 Color</option>
            <option value="image">🖼️ Image URL</option>
            <option value="richtext">📄 Rich Text</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Column Range (Apply to columns):
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                From Column:
              </label>
              <input
                type="number"
                value={colRange.start}
                onChange={(e) => setColRange(prev => ({ ...prev, start: parseInt(e.target.value) || 0 }))}
                min="0"
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                placeholder="0"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                To Column:
              </label>
              <input
                type="number"
                value={colRange.end}
                onChange={(e) => setColRange(prev => ({ ...prev, end: parseInt(e.target.value) || 0 }))}
                min="0"
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                placeholder="0"
              />
            </div>
          </div>
          <div style={{ marginTop: '5px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
            Leave both as 0 to apply to all columns in the row
          </div>
        </div>

        {/* Type-specific options */}
        {(type === 'dropdown' || type === 'autocomplete') && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              {type === 'dropdown' ? 'Dropdown' : 'Autocomplete'} Options:
            </label>
            
            {options.map((option, index) => (
              <div key={index} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = e.target.value;
                    setOptions(newOptions);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  onClick={() => removeOption(index)}
                  style={{
                    marginLeft: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
            
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addOption()}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Add new option..."
              />
              <button
                onClick={addOption}
                style={{
                  marginLeft: '8px',
                  padding: '8px 15px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ➕ Add
              </button>
            </div>
          </div>
        )}

        {type === 'color' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Default Color:
            </label>
            <input
              type="color"
              value={colorValue}
              onChange={(e) => setColorValue(e.target.value)}
              style={{
                width: '100px',
                height: '40px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
        )}

        {type === 'date' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Date Format:
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM-DD-YYYY">MM-DD-YYYY</option>
            </select>
          </div>
        )}

        {type === 'time' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Time Format:
            </label>
            <select
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="HH:mm">24-hour (HH:mm)</option>
              <option value="HH:mm:ss">24-hour with seconds (HH:mm:ss)</option>
              <option value="hh:mm A">12-hour (hh:mm AM/PM)</option>
              <option value="hh:mm:ss A">12-hour with seconds (hh:mm:ss AM/PM)</option>
            </select>
          </div>
        )}

        {type === 'numeric' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
              Number Format:
            </label>
            <select
              value={numberFormat}
              onChange={(e) => setNumberFormat(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="decimal">Decimal</option>
              <option value="integer">Integer</option>
              <option value="currency">Currency</option>
              <option value="percentage">Percentage</option>
            </select>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                  Min Value:
                </label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                  placeholder="No limit"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                  Max Value:
                </label>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                  placeholder="No limit"
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💾 Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced jSpreadsheet CE v4 Component based on existing JSpreadsheetComponent pattern
const JSpreadsheetCE4Component = ({ field, value, onChange, isFormFill = false }) => {
  const [data, setData] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [cellStyles, setCellStyles] = useState({});
  const [mergedCells, setMergedCells] = useState({});
  const [cellTypes, setCellTypes] = useState({}); // Track cell types (text, dropdown, etc.)
  const [cellDropdowns, setCellDropdowns] = useState({}); // Dropdown options for cells
  const [rowTypes, setRowTypes] = useState({}); // Track row types
  const [rowDropdowns, setRowDropdowns] = useState({}); // Dropdown options for rows
  const [dragStart, setDragStart] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [columnWidths, setColumnWidths] = useState({});
  const [rowHeights, setRowHeights] = useState({});
  const [showToolbar, setShowToolbar] = useState(false);
  const [showColumnTypeModal, setShowColumnTypeModal] = useState(false);
  const [columnTypeModalData, setColumnTypeModalData] = useState(null);
  const [showRowTypeModal, setShowRowTypeModal] = useState(false);
  const [rowTypeModalData, setRowTypeModalData] = useState(null);
  const tableRef = useRef(null);

  // Initialize data based on field configuration
  useEffect(() => {
    const rows = field?.rows || field?.defaultRows || 5;
    const cols = field?.cols || field?.defaultCols || 5;
    
    let initialData;
    if (isFormFill && value) {
      initialData = value.data || value || [];
    } else if (field?.data && field.data.length > 0) {
      initialData = field.data;
    } else {
      initialData = [];
      for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
          row.push('');
        }
        initialData.push(row);
      }
    }
    
    setData(initialData);
    setHistory([initialData]);
    setHistoryStep(0);

    if (field?.cellStyles) setCellStyles(field.cellStyles);
    if (field?.mergedCells) setMergedCells(field.mergedCells);
    if (field?.cellTypes) setCellTypes(field.cellTypes);
    if (field?.cellDropdowns) setCellDropdowns(field.cellDropdowns);
    if (field?.rowTypes) setRowTypes(field.rowTypes);
    if (field?.rowDropdowns) setRowDropdowns(field.rowDropdowns);
    if (field?.columnWidths) setColumnWidths(field.columnWidths);
    if (field?.rowHeights) setRowHeights(field.rowHeights);
    if (field?.readOnly) setIsReadOnly(field.readOnly);
  }, [field, value, isFormFill]);

  // Update field with all current state
  const updateField = (updates = {}) => {
    if (onChange) {
      if (isFormFill) {
        onChange(data);
      } else {
        const updatedField = {
          ...field,
          data: data,
          cellStyles: cellStyles,
          mergedCells: mergedCells,
          cellTypes: cellTypes,
          cellDropdowns: cellDropdowns,
          rowTypes: rowTypes,
          rowDropdowns: rowDropdowns,
          columnWidths: columnWidths,
          rowHeights: rowHeights,
          ...updates
        };
        onChange(updatedField);
      }
    }
  };

  // Add to history for undo/redo
  const addToHistory = useCallback((newData) => {
    const currentState = {
      data: newData,
      cellStyles: cellStyles,
      mergedCells: mergedCells,
      cellTypes: cellTypes,
      cellDropdowns: cellDropdowns,
      rowTypes: rowTypes,
      rowDropdowns: rowDropdowns,
      columnWidths: columnWidths,
      rowHeights: rowHeights
    };
    
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(currentState);
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryStep(historyStep + 1);
    }
    setHistory(newHistory);
  }, [history, historyStep, cellStyles, mergedCells, cellTypes, cellDropdowns, rowTypes, rowDropdowns, columnWidths, rowHeights]);

  // Undo function
  const undo = useCallback(() => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      const previousState = history[newStep];
      setData(previousState.data);
      setCellStyles(previousState.cellStyles || {});
      setMergedCells(previousState.mergedCells || {});
      setCellTypes(previousState.cellTypes || {});
      setCellDropdowns(previousState.cellDropdowns || {});
      setRowTypes(previousState.rowTypes || {});
      setRowDropdowns(previousState.rowDropdowns || {});
      setColumnWidths(previousState.columnWidths || {});
      setRowHeights(previousState.rowHeights || {});
      updateField({ 
        data: previousState.data,
        cellStyles: previousState.cellStyles,
        mergedCells: previousState.mergedCells,
        cellTypes: previousState.cellTypes,
        cellDropdowns: previousState.cellDropdowns,
        rowTypes: previousState.rowTypes,
        rowDropdowns: previousState.rowDropdowns,
        columnWidths: previousState.columnWidths,
        rowHeights: previousState.rowHeights
      });
    }
  }, [historyStep, history, updateField]);

  // Redo function
  const redo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      const nextState = history[newStep];
      setData(nextState.data);
      setCellStyles(nextState.cellStyles || {});
      setMergedCells(nextState.mergedCells || {});
      setCellTypes(nextState.cellTypes || {});
      setCellDropdowns(nextState.cellDropdowns || {});
      setRowTypes(nextState.rowTypes || {});
      setRowDropdowns(nextState.rowDropdowns || {});
      setColumnWidths(nextState.columnWidths || {});
      setRowHeights(nextState.rowHeights || {});
      updateField({ 
        data: nextState.data,
        cellStyles: nextState.cellStyles,
        mergedCells: nextState.mergedCells,
        cellTypes: nextState.cellTypes,
        cellDropdowns: nextState.cellDropdowns,
        rowTypes: nextState.rowTypes,
        rowDropdowns: nextState.rowDropdowns,
        columnWidths: nextState.columnWidths,
        rowHeights: nextState.rowHeights
      });
    }
  }, [historyStep, history, updateField]);

  // Generate column headers (A, B, C, etc.)
  const getColumnHeader = (index) => {
    if (index < 26) return String.fromCharCode(65 + index);
    return String.fromCharCode(65 + Math.floor(index / 26) - 1) + String.fromCharCode(65 + (index % 26));
  };

  // Get column width (with default fallback)
  const getColumnWidth = (colIndex) => {
    return columnWidths[colIndex] || 120; // Default 120px for CE v4
  };

  // Get row height (with default fallback)
  const getRowHeight = (rowIndex) => {
    return rowHeights[rowIndex] || 40; // Default 40px for CE v4
  };

  // Handle cell value changes
  const handleCellChange = (rowIndex, colIndex, value) => {
    if (isReadOnly) return;
    
    // Save current state to history before making changes
    addToHistory(data);
    
    const newData = [...data];
    if (!newData[rowIndex]) {
      newData[rowIndex] = [];
    }
    
    newData[rowIndex][colIndex] = value;
    setData(newData);
    updateField({ data: newData });
  };

  // Add row
  const addRow = () => {
    if (isReadOnly) return;
    
    // Save current state to history before making changes
    addToHistory(data);
    
    let insertPosition = data.length;
    if (selectedCell) {
      const [rowIndex] = selectedCell.split('-').map(Number);
      insertPosition = rowIndex;
    } else if (selectedRange) {
      insertPosition = selectedRange.startRow;
    }
    
    const currentCols = Math.max(data[0]?.length || 0, field?.cols || field?.defaultCols || 5);
    const newRow = new Array(currentCols).fill('');
    
    const newData = [...data];
    newData.splice(insertPosition, 0, newRow);
    
    setData(newData);
    updateField({ 
      data: newData, 
      rows: newData.length
    });
  };

  // Add column
  const addColumn = () => {
    if (isReadOnly) return;
    
    // Save current state to history before making changes
    addToHistory(data);
    
    let insertPosition = data[0]?.length || 0;
    if (selectedCell) {
      const [, colIndex] = selectedCell.split('-').map(Number);
      insertPosition = colIndex;
    } else if (selectedRange) {
      insertPosition = selectedRange.startCol;
    }
    
    const newData = data.map(row => {
      const newRow = [...row];
      newRow.splice(insertPosition, 0, '');
      return newRow;
    });
    
    if (newData.length === 0) {
      newData.push(new Array(1).fill(''));
    }
    
    setData(newData);
    updateField({ 
      data: newData, 
      cols: newData[0]?.length || 1
    });
  };

  // Delete selected rows
  const deleteRow = () => {
    if (isReadOnly) return;
    
    // Save current state to history before making changes
    addToHistory(data);
    
    const rowsToDelete = new Set();
    
    if (selectedRange) {
      for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
        rowsToDelete.add(r);
      }
    } else if (selectedCell) {
      const [rowIndex] = selectedCell.split('-').map(Number);
      rowsToDelete.add(rowIndex);
    }
    
    if (rowsToDelete.size === 0) return;
    
    if (rowsToDelete.size >= data.length) {
      setData([new Array(Math.max(data[0]?.length || 0, 1)).fill('')]);
      updateField({ 
        data: [new Array(Math.max(data[0]?.length || 0, 1)).fill('')], 
        rows: 1
      });
      return;
    }
    
    const newData = data.filter((_, index) => !rowsToDelete.has(index));
    setData(newData);
    updateField({ 
      data: newData, 
      rows: newData.length
    });
  };

  // Delete selected columns
  const deleteColumn = () => {
    if (isReadOnly) return;
    
    // Save current state to history before making changes
    addToHistory(data);
    
    const colsToDelete = new Set();
    
    if (selectedRange) {
      for (let c = selectedRange.startCol; c <= selectedRange.endCol; c++) {
        colsToDelete.add(c);
      }
    } else if (selectedCell) {
      const [, colIndex] = selectedCell.split('-').map(Number);
      colsToDelete.add(colIndex);
    }
    
    if (colsToDelete.size === 0) return;
    
    if (colsToDelete.size >= (data[0]?.length || 1)) {
      const newData = data.map(() => ['']);
      setData(newData);
      updateField({ 
        data: newData, 
        cols: 1
      });
      return;
    }
    
    const newData = data.map(row => 
      row.filter((_, index) => !colsToDelete.has(index))
    );
    
    setData(newData);
    updateField({ 
      data: newData, 
      cols: newData[0]?.length || 1
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = data.map(row => 
      row.map(cell => `"${cell || ''}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jspreadsheet-ce4_${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import from CSV
  const importFromCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const rows = csv.split('\n').map(row => 
        row.split(',').map(cell => cell.replace(/^"|"$/g, ''))
      );
      setData(rows);
      addToHistory(rows);
      updateField({ data: rows });
    };
    reader.readAsText(file);
  };

  // Copy data to clipboard
  const copyData = async () => {
    try {
      let copyText = '';
      
      if (selectedRange) {
        const { startRow, endRow, startCol, endCol } = selectedRange;
        for (let r = startRow; r <= endRow; r++) {
          const rowData = [];
          for (let c = startCol; c <= endCol; c++) {
            rowData.push(data[r]?.[c] || '');
          }
          copyText += rowData.join('\t') + '\n';
        }
        
        await navigator.clipboard.writeText(copyText.trim());
        console.log('📋 Copied range to clipboard');
        
      } else if (selectedCell) {
        const [row, col] = selectedCell.split('-').map(Number);
        copyText = data[row]?.[col] || '';
        await navigator.clipboard.writeText(copyText);
        console.log('📋 Copied cell to clipboard');
      }
      
    } catch (error) {
      console.error('❌ Copy failed:', error);
    }
  };

  // Paste data from clipboard
  const pasteData = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        console.log('📋 Clipboard is empty');
        return;
      }

      const newData = [...data];
      const pasteRows = clipboardText.trim().split('\n');
      const pasteCells = pasteRows.map(row => row.split('\t'));

      if (selectedRange) {
        const { startRow, endRow, startCol, endCol } = selectedRange;
        
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            const pasteRowIdx = (r - startRow) % pasteCells.length;
            const pasteCellIdx = (c - startCol) % pasteCells[pasteRowIdx].length;
            let pasteValue = pasteCells[pasteRowIdx][pasteCellIdx] || '';
            
            while (newData.length <= r) {
              newData.push(new Array(Math.max(cols, c + 1)).fill(''));
            }
            while (newData[r].length <= c) {
              newData[r].push('');
            }
            
            newData[r][c] = pasteValue;
          }
        }
      } else if (selectedCell) {
        const [startRow, startCol] = selectedCell.split('-').map(Number);
        
        pasteCells.forEach((rowCells, rowOffset) => {
          rowCells.forEach((cell, colOffset) => {
            const targetRow = startRow + rowOffset;
            const targetCol = startCol + colOffset;
            
            while (newData.length <= targetRow) {
              newData.push(new Array(Math.max(cols, targetCol + 1)).fill(''));
            }
            while (newData[targetRow].length <= targetCol) {
              newData[targetRow].push('');
            }
            
            newData[targetRow][targetCol] = cell;
          });
        });
      }

      setData(newData);
      addToHistory(newData);
      updateField({ data: newData });
      
    } catch (error) {
      console.error('❌ Paste failed:', error);
    }
  };

  // Cell selection handlers
  const handleCellMouseDown = (rowIndex, colIndex, e) => {
    // Check if shift key is pressed for range selection
    if (e.shiftKey && selectedCell) {
      // Create a range from the previously selected cell to the current cell
      const [prevRow, prevCol] = selectedCell.split('-').map(Number);
      const startRow = Math.min(prevRow, rowIndex);
      const endRow = Math.max(prevRow, rowIndex);
      const startCol = Math.min(prevCol, colIndex);
      const endCol = Math.max(prevCol, colIndex);
      
      setSelectedRange({ startRow, endRow, startCol, endCol });
      setSelectedCell(`${rowIndex}-${colIndex}`);
    } else {
      // Single cell selection
      setDragStart({ row: rowIndex, col: colIndex });
      setIsSelecting(true);
      setSelectedCell(`${rowIndex}-${colIndex}`);
      setSelectedRange(null);
    }
    setShowToolbar(true);
  };

  const handleCellMouseEnter = (rowIndex, colIndex) => {
    if (isSelecting && dragStart) {
      const startRow = Math.min(dragStart.row, rowIndex);
      const endRow = Math.max(dragStart.row, rowIndex);
      const startCol = Math.min(dragStart.col, colIndex);
      const endCol = Math.max(dragStart.col, colIndex);
      setSelectedRange({ startRow, endRow, startCol, endCol });
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && dragStart && selectedRange) {
      // Auto-fill feature: copy data from start cell to all cells in range
      const startCellValue = data[dragStart.row]?.[dragStart.col] || '';
      if (startCellValue !== '') {
        const newData = [...data];
        for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
          for (let c = selectedRange.startCol; c <= selectedRange.endCol; c++) {
            if (r === dragStart.row && c === dragStart.col) continue; // Skip the source cell
            if (!newData[r]) newData[r] = [];
            newData[r][c] = startCellValue;
          }
        }
        setData(newData);
        addToHistory(newData);
        updateField({ data: newData });
      }
    }
    
    setIsSelecting(false);
    setDragStart(null);
  };

  // Row header click - select entire row
  const handleRowHeaderClick = (rowIndex, e) => {
    e.preventDefault();
    const maxCols = Math.max(data[0]?.length || 0, field?.cols || field?.defaultCols || 5);
    setSelectedRange({
      startRow: rowIndex,
      endRow: rowIndex,
      startCol: 0,
      endCol: maxCols - 1
    });
    setSelectedCell(null);
    setShowToolbar(true);
  };

  // Column header click - select entire column
  const handleColumnHeaderClick = (colIndex, e) => {
    e.preventDefault();
    const maxRows = Math.max(data.length, field?.rows || field?.defaultRows || 5);
    setSelectedRange({
      startRow: 0,
      endRow: maxRows - 1,
      startCol: colIndex,
      endCol: colIndex
    });
    setSelectedCell(null);
    setShowToolbar(true);
  };

  // Check if cell is in selected range
  const isCellInRange = (rowIndex, colIndex) => {
    if (!selectedRange) return false;
    const { startRow, endRow, startCol, endCol } = selectedRange;
    return rowIndex >= startRow && rowIndex <= endRow && 
           colIndex >= startCol && colIndex <= endCol;
  };

  // Column Type Management Functions
  const setColumnType = (colIndex, type, options = {}) => {
    addToHistory(data);
    const newCellTypes = { ...cellTypes };
    const newCellDropdowns = { ...cellDropdowns };
    
    // Determine row range to apply the type to
    const rowRange = options.rowRange || { start: 0, end: 0 };
    const startRow = rowRange.start || 0;
    const endRow = rowRange.end || 0;
    
    // If both start and end are 0, apply to all rows
    const applyToAllRows = startRow === 0 && endRow === 0;
    
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      // Skip rows outside the specified range
      if (!applyToAllRows && (rowIndex < startRow || rowIndex > endRow)) {
        continue;
      }
      
      const cellKey = `${rowIndex}-${colIndex}`;
      newCellTypes[cellKey] = type;
      
      if (type === 'checkbox' && !data[rowIndex]?.[colIndex]) {
        const newData = [...data];
        if (!newData[rowIndex]) newData[rowIndex] = [];
        newData[rowIndex][colIndex] = false;
        setData(newData);
      }
      
      if (type === 'dropdown' && options.dropdownOptions) {
        newCellDropdowns[cellKey] = options.dropdownOptions;
      }
      
      if (type === 'autocomplete' && options.autocompleteOptions) {
        newCellDropdowns[cellKey] = options.autocompleteOptions;
      }
    }
    
    setCellTypes(newCellTypes);
    setCellDropdowns(newCellDropdowns);
    updateField({ cellTypes: newCellTypes, cellDropdowns: newCellDropdowns });
  };

  const removeColumnType = (colIndex) => {
    // Save current state to history before making changes
    addToHistory(data);
    
    const newCellTypes = { ...cellTypes };
    const newCellDropdowns = { ...cellDropdowns };
    
    // Remove type for all cells in the column
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const cellKey = `${rowIndex}-${colIndex}`;
      delete newCellTypes[cellKey];
      delete newCellDropdowns[cellKey];
    }
    
    setCellTypes(newCellTypes);
    setCellDropdowns(newCellDropdowns);
    updateField({ cellTypes: newCellTypes, cellDropdowns: newCellDropdowns });
  };

  const getColumnType = (colIndex) => {
    // Get type from first cell in column
    const cellKey = `0-${colIndex}`;
    return cellTypes[cellKey] || 'text';
  };

  const getColumnOptions = (colIndex) => {
    // Get options from first cell in column
    const cellKey = `0-${colIndex}`;
    return cellDropdowns[cellKey] || [];
  };

  // Row Type Management Functions
  const setRowType = (rowIndex, type, options = {}) => {
    addToHistory(data);
    const newRowTypes = { ...rowTypes };
    const newRowDropdowns = { ...rowDropdowns };
    
    // Determine column range to apply the type to
    const colRange = options.colRange || { start: 0, end: 0 };
    const startCol = colRange.start || 0;
    const endCol = colRange.end || 0;
    
    // If both start and end are 0, apply to all columns
    const applyToAllCols = startCol === 0 && endCol === 0;
    
    for (let colIndex = 0; colIndex < cols; colIndex++) {
      // Skip columns outside the specified range
      if (!applyToAllCols && (colIndex < startCol || colIndex > endCol)) {
        continue;
      }
      
      const cellKey = `${rowIndex}-${colIndex}`;
      newRowTypes[cellKey] = type;
      
      if (type === 'checkbox' && !data[rowIndex]?.[colIndex]) {
        const newData = [...data];
        if (!newData[rowIndex]) newData[rowIndex] = [];
        newData[rowIndex][colIndex] = false;
        setData(newData);
      }
      
      if (type === 'dropdown' && options.dropdownOptions) {
        newRowDropdowns[cellKey] = options.dropdownOptions;
      }
      
      if (type === 'autocomplete' && options.autocompleteOptions) {
        newRowDropdowns[cellKey] = options.autocompleteOptions;
      }
    }
    
    setRowTypes(newRowTypes);
    setRowDropdowns(newRowDropdowns);
    updateField({ rowTypes: newRowTypes, rowDropdowns: newRowDropdowns });
  };

  const removeRowType = (rowIndex) => {
    // Save current state to history before making changes
    addToHistory(data);
    
    const newRowTypes = { ...rowTypes };
    const newRowDropdowns = { ...rowDropdowns };
    
    // Remove type for all cells in the row
    for (let colIndex = 0; colIndex < cols; colIndex++) {
      const cellKey = `${rowIndex}-${colIndex}`;
      delete newRowTypes[cellKey];
      delete newRowDropdowns[cellKey];
    }
    
    setRowTypes(newRowTypes);
    setRowDropdowns(newRowDropdowns);
    updateField({ rowTypes: newRowTypes, rowDropdowns: newRowDropdowns });
  };

  const getRowType = (rowIndex) => {
    // Get type from first cell in row
    const cellKey = `${rowIndex}-0`;
    return rowTypes[cellKey] || 'text';
  };

  const getRowOptions = (rowIndex) => {
    // Get options from first cell in row
    const cellKey = `${rowIndex}-0`;
    return rowDropdowns[cellKey] || [];
  };

  // Enhanced getCellType function that checks both column and row types
  const getCellType = (rowIndex, colIndex) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    
    // Row type takes precedence over column type
    if (rowTypes[cellKey]) {
      return rowTypes[cellKey];
    }
    
    // Fall back to column type
    if (cellTypes[cellKey]) {
      return cellTypes[cellKey];
    }
    
    // Default to text
    return 'text';
  };

  // Enhanced getCellOptions function that checks both column and row options
  const getCellOptions = (rowIndex, colIndex) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    
    // Row options take precedence over column options
    if (rowDropdowns[cellKey]) {
      return rowDropdowns[cellKey];
    }
    
    // Fall back to column options
    if (cellDropdowns[cellKey]) {
      return cellDropdowns[cellKey];
    }
    
    // Default to empty array
    return [];
  };

  // Column Type Modal Handlers
  const openColumnTypeModal = (colIndex) => {
    const currentType = getColumnType(colIndex);
    const currentOptions = getColumnOptions(colIndex);
    setColumnTypeModalData({ columnIndex: colIndex, currentType, currentOptions });
    setShowColumnTypeModal(true);
  };

  const handleColumnTypeSave = (colIndex, type, config) => {
    setColumnType(colIndex, type, config);
    setShowColumnTypeModal(false);
    setColumnTypeModalData(null);
  };

  const handleColumnTypeCancel = () => {
    setShowColumnTypeModal(false);
    setColumnTypeModalData(null);
  };

  // Row Type Modal Handlers
  const openRowTypeModal = (rowIndex) => {
    const currentType = getRowType(rowIndex);
    const currentOptions = getRowOptions(rowIndex);
    setRowTypeModalData({ rowIndex, currentType, currentOptions });
    setShowRowTypeModal(true);
  };

  const handleRowTypeSave = (rowIndex, type, config) => {
    setRowType(rowIndex, type, config);
    setShowRowTypeModal(false);
    setRowTypeModalData(null);
  };

  const handleRowTypeCancel = () => {
    setShowRowTypeModal(false);
    setRowTypeModalData(null);
  };

  // Merged Cells Management Functions
  const setMerge = (startRow, startCol, endRow, endCol) => {
    console.log('🔗 setMerge called with:', { startRow, startCol, endRow, endCol });
    
    // Save current state to history before making changes
    addToHistory(data);
    
    const mergeKey = `${startRow}-${startCol}`;
    const newMergedCells = { ...mergedCells };
    
    console.log('🔗 Current mergedCells:', mergedCells);
    console.log('🔗 New mergeKey:', mergeKey);
    
    // Remove any existing merges that overlap with the new merge
    const overlappingMerges = Object.entries(newMergedCells).filter(([key, merge]) => {
      const [sr, sc, er, ec] = key.split('-').map(Number);
      return !(endRow < sr || startRow > er || endCol < sc || startCol > ec);
    });
    
    console.log('🔗 Overlapping merges to remove:', overlappingMerges);
    
    overlappingMerges.forEach(([key]) => {
      delete newMergedCells[key];
    });
    
    // Add the new merge
    newMergedCells[mergeKey] = { startRow, startCol, endRow, endCol };
    
    console.log('🔗 Final mergedCells:', newMergedCells);
    
    setMergedCells(newMergedCells);
    updateField({ mergedCells: newMergedCells });
    
    console.log('🔗 Merge operation completed');
  };

  const getMerge = (rowIndex, colIndex) => {
    // Check if this cell is the start of a merge
    const mergeKey = `${rowIndex}-${colIndex}`;
    if (mergedCells[mergeKey]) {
      return mergedCells[mergeKey];
    }
    
    // Check if this cell is part of any merge
    for (const [key, merge] of Object.entries(mergedCells)) {
      const { startRow, startCol, endRow, endCol } = merge;
      if (rowIndex >= startRow && rowIndex <= endRow && 
          colIndex >= startCol && colIndex <= endCol) {
        return merge;
      }
    }
    
    return null;
  };

  const removeMerge = (rowIndex, colIndex) => {
    // Save current state to history before making changes
    addToHistory(data);
    
    const mergeKey = `${rowIndex}-${colIndex}`;
    const newMergedCells = { ...mergedCells };
    
    if (newMergedCells[mergeKey]) {
      delete newMergedCells[mergeKey];
      setMergedCells(newMergedCells);
      updateField({ mergedCells: newMergedCells });
      return true;
    }
    
    // Check if this cell is part of any merge
    for (const [key, merge] of Object.entries(newMergedCells)) {
      const { startRow, startCol, endRow, endCol } = merge;
      if (rowIndex >= startRow && rowIndex <= endRow && 
          colIndex >= startCol && colIndex <= endCol) {
        delete newMergedCells[key];
        setMergedCells(newMergedCells);
        updateField({ mergedCells: newMergedCells });
        return true;
      }
    }
    
    return false;
  };

  const destroyMerged = () => {
    // Save current state to history before making changes
    addToHistory(data);
    
    setMergedCells({});
    updateField({ mergedCells: {} });
  };

  const isMergeStartCell = (rowIndex, colIndex) => {
    const mergeKey = `${rowIndex}-${colIndex}`;
    return mergedCells[mergeKey] !== undefined;
  };

  const getMergeSpan = (rowIndex, colIndex) => {
    const merge = getMerge(rowIndex, colIndex);
    if (!merge) return { rowSpan: 1, colSpan: 1 };
    
    const { startRow, startCol, endRow, endCol } = merge;
    if (rowIndex === startRow && colIndex === startCol) {
      return {
        rowSpan: endRow - startRow + 1,
        colSpan: endCol - startCol + 1
      };
    }
    
    return { rowSpan: 1, colSpan: 1 };
  };

  const rows = Math.max(data.length, field?.rows || field?.defaultRows || 5);
  const cols = Math.max(data[0]?.length || 0, field?.cols || field?.defaultCols || 5);

  return (
    <div className="jspreadsheet-ce4-container" style={{ 
      width: '100%', 
      height: isFormFill ? '500px' : '400px',
      border: '2px solid #007bff',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#fff'
    }} onMouseUp={handleMouseUp}>
      
      {/* Column Type Configuration Modal */}
      {showColumnTypeModal && columnTypeModalData && (
        <ColumnTypeModal
          columnIndex={columnTypeModalData.columnIndex}
          currentType={columnTypeModalData.currentType}
          currentOptions={columnTypeModalData.currentOptions}
          onSave={handleColumnTypeSave}
          onCancel={handleColumnTypeCancel}
        />
      )}

      {/* Row Type Configuration Modal */}
      {/* {showRowTypeModal && rowTypeModalData && (
        <RowTypeModal
          rowIndex={rowTypeModalData.rowIndex}
          currentType={rowTypeModalData.currentType}
          currentOptions={rowTypeModalData.currentOptions}
          onSave={handleRowTypeSave}
          onCancel={handleRowTypeCancel}
        />
      )} */}
      
      {/* Header */}
      {!isFormFill && (
        <div style={{
          padding: '8px',
          backgroundColor: '#e3f2fd',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#1976d2',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>📊 jSpreadsheet CE v4 (Custom Table) — {rows} rows × {cols} columns</span>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <button
              onClick={() => setIsReadOnly(!isReadOnly)}
              style={{
                padding: '4px 8px',
                backgroundColor: isReadOnly ? '#f44336' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Toggle Read Only"
            >
              {isReadOnly ? '🔒' : '🔓'}
            </button>
            <div style={{ borderLeft: '1px solid #ddd', height: '20px', margin: '0 5px' }} />
            <button onClick={addRow} disabled={isReadOnly} style={{ padding: '4px 8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>+ Row</button>
            <button onClick={addColumn} disabled={isReadOnly} style={{ padding: '4px 8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>+ Col</button>
            <button onClick={deleteRow} disabled={isReadOnly} style={{ padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>- Row</button>
            <button onClick={deleteColumn} disabled={isReadOnly} style={{ padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>- Col</button>
            <div style={{ borderLeft: '1px solid #ddd', height: '20px', margin: '0 5px' }} />
            <button
              onClick={() => openColumnTypeModal(selectedCell ? parseInt(selectedCell.split('-')[1]) : 0)}
              disabled={isReadOnly}
              style={{ padding: '4px 8px', backgroundColor: '#9c27b0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              title="Set Column Type"
            >
              🔧 Type
            </button>
            <button
              onClick={() => {
                if (selectedCell) {
                  const [rowIndex] = selectedCell.split('-').map(Number);
                  openRowTypeModal(rowIndex);
                }
              }}
              disabled={isReadOnly}
              style={{ padding: '4px 8px', backgroundColor: '#9c27b0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              title="Set Row Type"
            >
              🔧 Row Type
            </button>
            <div style={{ borderLeft: '1px solid #ddd', height: '20px', margin: '0 5px' }} />
            <label style={{ cursor: 'pointer', fontSize: '12px', background: '#6f42c1', color: '#fff', padding: '4px 8px', borderRadius: 4 }}>
              📥 Import CSV
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => importFromCSV(e.target.files?.[0])} />
            </label>
            <button onClick={exportToCSV} style={{ padding: '4px 8px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>📤 Export CSV</button>
          </div>
        </div>
      )}

      {/* Autocomplete Datalists */}
      {!isFormFill && Array.from({ length: cols }, (_, colIndex) => {
        const cellType = getColumnType(colIndex);
        const options = getColumnOptions(colIndex);
        
        if (cellType === 'autocomplete' && options.length > 0) {
          return (
            <datalist key={`autocomplete-${colIndex}`} id={`autocomplete-${colIndex}`}>
              {options.map((option, idx) => (
                <option key={idx} value={option} />
              ))}
            </datalist>
          );
        }
        return null;
      })}

      {/* Enhanced Spreadsheet Table */}
      <div style={{ 
        overflowX: 'auto',
        overflowY: 'auto',
        maxHeight: isFormFill ? '380px' : '280px',
        border: '1px solid #ddd'
      }}>
        <table ref={tableRef} style={{ 
          width: '100%', 
          borderCollapse: 'separate',
          borderSpacing: '0',
          fontSize: '12px',
          fontFamily: '"Segoe UI", Arial, sans-serif',
          userSelect: 'none',
          backgroundColor: '#ffffff',
          border: '1px solid #9c9c9c',
          tableLayout: 'fixed'
        }}>
          {!isFormFill && (
            <thead>
              <tr>
                <th style={{
                  width: '30px',
                  height: '40px',
                  backgroundColor: '#f2f2f2',
                  border: '1px solid #d4d4d4',
                  borderTop: '1px solid #9c9c9c',
                  borderLeft: '1px solid #9c9c9c',
                  borderBottom: '2px solid #8a8a8a',
                  borderRight: '1px solid #d4d4d4',
                  fontSize: '12px',
                  fontWeight: 'normal',
                  color: '#262626',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '2px 1px',
                  backgroundImage: 'linear-gradient(to bottom, #ffffff 0%, #f0f0f0 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)'
                }}
                onClick={!isFormFill ? () => {
                  const maxRows = Math.max(data.length, 1);
                  const maxCols = Math.max(data[0]?.length || 0, 1);
                  setSelectedRange({
                    startRow: 0,
                    endRow: maxRows - 1,
                    startCol: 0,
                    endCol: maxCols - 1
                  });
                  setSelectedCell(null);
                  setShowToolbar(true);
                } : undefined}
                title={isFormFill ? "jSpreadsheet CE v4" : "Select All"}
                >
                  ⊞
                </th>
                {Array.from({ length: cols }, (_, colIndex) => (
                  <th 
                    key={colIndex} 
                    style={{
                      minWidth: `${getColumnWidth(colIndex)}px`,
                      width: `${getColumnWidth(colIndex)}px`,
                      height: '40px',
                      backgroundColor: selectedRange && 
                        selectedRange.startCol <= colIndex && 
                        selectedRange.endCol >= colIndex ? '#d4e6f8' : '#f2f2f2',
                      backgroundImage: selectedRange && 
                        selectedRange.startCol <= colIndex && 
                        selectedRange.endCol >= colIndex 
                          ? 'linear-gradient(to bottom, #e8f1fd 0%, #c4daf8 100%)' 
                          : 'linear-gradient(to bottom, #ffffff 0%, #f0f0f0 100%)',
                      border: '1px solid #d4d4d4',
                      borderTop: '1px solid #9c9c9c',
                      borderBottom: '2px solid #8a8a8a',
                      borderLeft: '1px solid #d4d4d4',
                      borderRight: '1px solid #d4d4d4',
                      padding: '2px 4px',
                      fontWeight: 'normal',
                      fontSize: '12px',
                      color: '#262626',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      cursor: 'pointer',
                      userSelect: 'none',
                      textAlign: 'center',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={(e) => !isFormFill && handleColumnHeaderClick(colIndex, e)}
                    title={isFormFill ? `Column ${getColumnHeader(colIndex)}` : `Select Column ${getColumnHeader(colIndex)}`}
                                     >
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                       <span>{getColumnHeader(colIndex)}</span>
                       <span style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>
                         {getColumnType(colIndex) !== 'text' ? getColumnType(colIndex) : ''}
                       </span>
                       {/* Show range info if type is applied to specific rows */}
                       {(() => {
                         const type = getColumnType(colIndex);
                         if (type === 'text') return null;
                         
                         // Find the range for this column type
                         let rangeInfo = '';
                         for (let r = 0; r < rows; r++) {
                           const cellKey = `${r}-${colIndex}`;
                           if (cellTypes[cellKey] === type) {
                             if (rangeInfo === '') {
                               rangeInfo = `R${r + 1}`;
                             } else {
                               const lastRow = rangeInfo.split('-')[1] || rangeInfo.split('R')[1];
                               if (r + 1 > parseInt(lastRow)) {
                                 rangeInfo = rangeInfo.includes('-') ? 
                                   rangeInfo.split('-')[0] + `-${r + 1}` : 
                                   `${rangeInfo}-${r + 1}`;
                               }
                             }
                           }
                         }
                         
                         return rangeInfo ? (
                           <span style={{ fontSize: '8px', color: '#999', fontStyle: 'italic' }}>
                             {rangeInfo}
                           </span>
                         ) : null;
                       })()}
                     </div>
                   </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex}>
                {!isFormFill && (
                  <td style={{
                    width: '30px',
                    height: `${getRowHeight(rowIndex)}px`,
                    backgroundColor: selectedRange && 
                      selectedRange.startRow <= rowIndex && 
                      selectedRange.endRow >= rowIndex ? '#d4e6f8' : '#f2f2f2',
                    backgroundImage: selectedRange && 
                      selectedRange.startRow <= rowIndex && 
                      selectedRange.endRow >= rowIndex 
                        ? 'linear-gradient(to bottom, #e8f1fd 0%, #c4daf8 100%)' 
                        : 'linear-gradient(to bottom, #ffffff 0%, #f0f0f0 100%)',
                    border: '1px solid #d4d4d4',
                    borderLeft: '1px solid #9c9c9c',
                    borderRight: '2px solid #8a8a8a',
                    borderTop: '1px solid #d4d4d4',
                    borderBottom: '1px solid #d4d4d4',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 'normal',
                    color: '#262626',
                    position: 'sticky',
                    left: 0,
                    zIndex: 5,
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '1px 2px',
                    boxShadow: 'inset 0 0 1px rgba(255,255,255,0.8)',
                    lineHeight: '36px'
                  }}
                  onClick={(e) => handleRowHeaderClick(rowIndex, e)}
                  title={`Select Row ${rowIndex + 1}`}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span>{rowIndex + 1}</span>
                      <span style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>
                        {getRowType(rowIndex) !== 'text' ? getRowType(rowIndex) : ''}
                      </span>
                      {/* Show range info if type is applied to specific columns */}
                      {(() => {
                        const type = getRowType(rowIndex);
                        if (type === 'text') return null;
                        
                        // Find the range for this row type
                        let rangeInfo = '';
                        for (let c = 0; c < cols; c++) {
                          const cellKey = `${rowIndex}-${c}`;
                          if (rowTypes[cellKey] === type) {
                            if (rangeInfo === '') {
                              rangeInfo = `${getColumnHeader(c)}`;
                            } else {
                              const lastCol = rangeInfo.split('-')[1] || rangeInfo;
                              if (c > getColumnHeader(lastCol).charCodeAt(0) - 65) {
                                rangeInfo = rangeInfo.includes('-') ? 
                                  rangeInfo.split('-')[0] + `-${getColumnHeader(c)}` : 
                                  `${rangeInfo}-${getColumnHeader(c)}`;
                              }
                            }
                          }
                        }
                        
                        return rangeInfo ? (
                          <span style={{ fontSize: '8px', color: '#999', fontStyle: 'italic' }}>
                            {rangeInfo}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </td>
                )}
                {Array.from({ length: cols }, (_, colIndex) => {
                  const cellKey = `${rowIndex}-${colIndex}`;
                  const isSelected = selectedCell === cellKey;
                  const isInRange = isCellInRange(rowIndex, colIndex);
                  
                  // Check if this cell is part of a merge
                  const merge = getMerge(rowIndex, colIndex);
                  const isMergeStart = isMergeStartCell(rowIndex, colIndex);
                  
                  // Skip rendering if this cell is part of a merge but not the start
                  if (merge && !isMergeStart) {
                    return null;
                  }
                  
                  // Get merge span for the start cell
                  const { rowSpan, colSpan } = getMergeSpan(rowIndex, colIndex);

                  const baseCellStyle = {
                    width: colSpan > 1 ? `${getColumnWidth(colIndex) * colSpan}px` : `${getColumnWidth(colIndex)}px`,
                    minWidth: colSpan > 1 ? `${getColumnWidth(colIndex) * colSpan}px` : `${getColumnWidth(colIndex)}px`,
                    height: rowSpan > 1 ? `${getRowHeight(rowIndex) * rowSpan}px` : `${getRowHeight(rowIndex)}px`,
                    border: merge ? '2px solid #17a2b8' : 
                           isSelected ? '2px solid #007bff' : 
                           isInRange ? '1px solid #70ad47' : '1px solid #d4d4d4',
                    padding: '0',
                    backgroundColor: merge ? '#e3f2fd' : 
                                   dragStart && dragStart.row === rowIndex && dragStart.col === colIndex ? '#fff3cd' :
                                   isInRange ? '#e2efda' : '#ffffff',
                    position: 'relative',
                    verticalAlign: 'top',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                  };

                  return (
                    <td 
                      key={colIndex} 
                      rowSpan={rowSpan}
                      colSpan={colSpan}
                      style={baseCellStyle}
                      onMouseDown={(e) => !isFormFill && handleCellMouseDown(rowIndex, colIndex, e)}
                      onMouseEnter={() => !isFormFill && handleCellMouseEnter(rowIndex, colIndex)}
                    >
                                             {(() => {
                         const cellType = getCellType(rowIndex, colIndex);
                         const cellValue = data[rowIndex]?.[colIndex] || '';
                         const cellOptions = getCellOptions(rowIndex, colIndex);
                         
                         // Show merge info for merged cells
                         if (merge) {
                           return (
                             <div style={{ 
                               display: 'flex', 
                               flexDirection: 'column',
                               alignItems: 'center', 
                               justifyContent: 'center',
                               width: '100%',
                               height: '100%',
                               padding: '4px',
                               position: 'relative'
                             }}>
                               <div style={{
                                 position: 'absolute',
                                 top: '2px',
                                 right: '2px',
                                 fontSize: '10px',
                                 color: '#666',
                                 backgroundColor: '#e9ecef',
                                 padding: '1px 3px',
                                 borderRadius: '2px'
                               }}>
                                 {rowSpan > 1 && colSpan > 1 ? `${rowSpan}×${colSpan}` : 
                                  rowSpan > 1 ? `${rowSpan}R` : `${colSpan}C`}
                               </div>
                               <div style={{ marginTop: '12px' }}>
                                 {(() => {
                                   switch (cellType) {
                                     case 'checkbox':
                                       return (
                                         <div style={{ 
                                           display: 'flex', 
                                           alignItems: 'center', 
                                           justifyContent: 'center',
                                           width: '100%',
                                           height: '100%'
                                         }}>
                                           <input
                                             type="checkbox"
                                             checked={cellValue === true || cellValue === 'true'}
                                             onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.checked)}
                                             onFocus={() => {
                                               if (!isFormFill) {
                                                 setSelectedCell(cellKey);
                                                 setShowToolbar(true);
                                               }
                                             }}
                                             data-cell={cellKey}
                                             style={{
                                               width: '16px',
                                               height: '16px',
                                               cursor: 'pointer',
                                               accentColor: '#007bff'
                                             }}
                                             disabled={isReadOnly}
                                           />
                                         </div>
                                       );
                                     
                                     case 'dropdown':
                                       return (
                                         <select
                                           value={cellValue}
                                           onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                           onFocus={() => {
                                             if (!isFormFill) {
                                               setSelectedCell(cellKey);
                                               setShowToolbar(true);
                                             }
                                           }}
                                           data-cell={cellKey}
                                           style={{
                                             width: '100%',
                                             height: '100%',
                                             border: 'none',
                                             outline: 'none',
                                             padding: '4px',
                                             backgroundColor: 'transparent',
                                             fontSize: '12px',
                                             fontFamily: '"Segoe UI", Arial, sans-serif',
                                             cursor: 'pointer'
                                           }}
                                           disabled={isReadOnly}
                                         >
                                           <option value="">Select...</option>
                                           {cellOptions.map((option, idx) => (
                                             <option key={idx} value={option}>{option}</option>
                                           ))}
                                         </select>
                                       );
                                     
                                     case 'autocomplete':
                                       return (
                                         <input
                                           type="text"
                                           value={cellValue}
                                           onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                           onFocus={() => {
                                             if (!isFormFill) {
                                               setSelectedCell(cellKey);
                                               setShowToolbar(true);
                                             }
                                           }}
                                           onKeyDown={(e) => {
                                             if (e.key === 'Enter') {
                                               const nextRow = rowIndex + 1;
                                               if (nextRow < rows) {
                                                 const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                                 if (nextInput) nextInput.focus();
                                               }
                                             } else if (e.key === 'Tab') {
                                               e.preventDefault();
                                               const nextCol = colIndex + 1;
                                               if (nextCol < cols) {
                                                 const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                                 if (nextInput) nextInput.focus();
                                               }
                                             }
                                           }}
                                           data-cell={cellKey}
                                           style={{
                                             width: '100%',
                                             height: '100%',
                                             border: 'none',
                                             outline: 'none',
                                             padding: '8px',
                                             backgroundColor: 'transparent',
                                             fontSize: '12px',
                                             fontFamily: '"Segoe UI", Arial, sans-serif',
                                             lineHeight: '24px'
                                           }}
                                           placeholder={`${getColumnHeader(colIndex)}${rowIndex + 1}`}
                                           disabled={isReadOnly}
                                           list={`autocomplete-${rowIndex}-${colIndex}`}
                                         />
                                       );
                                     
                                     case 'date':
                                       return (
                                         <input
                                           type="date"
                                           value={cellValue}
                                           onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                           onFocus={() => {
                                             if (!isFormFill) {
                                               setSelectedCell(cellKey);
                                               setShowToolbar(true);
                                             }
                                           }}
                                           onKeyDown={(e) => {
                                             if (e.key === 'Enter') {
                                               const nextRow = rowIndex + 1;
                                               if (nextRow < rows) {
                                                 const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                                 if (nextInput) nextInput.focus();
                                               }
                                             } else if (e.key === 'Tab') {
                                               e.preventDefault();
                                               const nextCol = colIndex + 1;
                                               if (nextCol < cols) {
                                                 const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                                 if (nextInput) nextInput.focus();
                                               }
                                             }
                                           }}
                                           data-cell={cellKey}
                                           style={{
                                             width: '100%',
                                             height: '100%',
                                             border: 'none',
                                             outline: 'none',
                                             padding: '8px',
                                             backgroundColor: 'transparent',
                                             fontSize: '12px',
                                             fontFamily: '"Segoe UI", Arial, sans-serif',
                                             lineHeight: '24px'
                                           }}
                                           disabled={isReadOnly}
                                         />
                                       );
                                     
                                     case 'time':
                                       return (
                                         <input
                                           type="time"
                                           value={cellValue}
                                           onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                           onFocus={() => {
                                             if (!isFormFill) {
                                               setSelectedCell(cellKey);
                                               setShowToolbar(true);
                                             }
                                           }}
                                           onKeyDown={(e) => {
                                             if (e.key === 'Enter') {
                                               const nextRow = rowIndex + 1;
                                               if (nextRow < rows) {
                                                 const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                                 if (nextInput) nextInput.focus();
                                               }
                                             } else if (e.key === 'Tab') {
                                               e.preventDefault();
                                               const nextCol = colIndex + 1;
                                               if (nextCol < cols) {
                                                 const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                                 if (nextInput) nextInput.focus();
                                               }
                                             }
                                           }}
                                           data-cell={cellKey}
                                           style={{
                                             width: '100%',
                                             height: '100%',
                                             border: 'none',
                                             outline: 'none',
                                             padding: '8px',
                                             backgroundColor: 'transparent',
                                             fontSize: '12px',
                                             fontFamily: '"Segoe UI", Arial, sans-serif',
                                             lineHeight: '24px'
                                           }}
                                           disabled={isReadOnly}
                                         />
                                       );
                                     
                                     case 'numeric':
                                       return (
                                         <input
                                           type="number"
                                           value={cellValue}
                                           onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                           onFocus={() => {
                                             if (!isFormFill) {
                                               setSelectedCell(cellKey);
                                               setShowToolbar(true);
                                             }
                                           }}
                                           onKeyDown={(e) => {
                                             if (e.key === 'Enter') {
                                               const nextRow = rowIndex + 1;
                                               if (nextRow < rows) {
                                                 const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                                 if (nextInput) nextInput.focus();
                                               }
                                             } else if (e.key === 'Tab') {
                                               e.preventDefault();
                                               const nextCol = colIndex + 1;
                                               if (nextCol < cols) {
                                                 const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                                 if (nextInput) nextInput.focus();
                                               }
                                             }
                                           }}
                                           data-cell={cellKey}
                                           style={{
                                             width: '100%',
                                             height: '100%',
                                             border: 'none',
                                             outline: 'none',
                                             padding: '8px',
                                             backgroundColor: 'transparent',
                                             fontSize: '12px',
                                             fontFamily: '"Segoe UI", Arial, sans-serif',
                                             lineHeight: '24px'
                                           }}
                                           placeholder={`${getColumnHeader(colIndex)}${rowIndex + 1}`}
                                           disabled={isReadOnly}
                                         />
                                       );
                                     
                                     case 'color':
                                       return (
                                         <div style={{ 
                                           display: 'flex', 
                                           alignItems: 'center', 
                                           justifyContent: 'center',
                                           width: '100%',
                                           height: '100%',
                                           padding: '2px'
                                         }}>
                                           <input
                                             type="color"
                                             value={cellValue || '#000000'}
                                             onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                             onFocus={() => {
                                               if (!isFormFill) {
                                                 setSelectedCell(cellKey);
                                                 setShowToolbar(true);
                                               }
                                             }}
                                             data-cell={cellKey}
                                             style={{
                                               width: '30px',
                                               height: '30px',
                                               border: '1px solid #ddd',
                                               borderRadius: '4px',
                                               cursor: 'pointer'
                                             }}
                                             disabled={isReadOnly}
                                           />
                                         </div>
                                       );
                                     
                                     case 'image':
                                       return (
                                         <div style={{ 
                                           display: 'flex', 
                                           alignItems: 'center', 
                                           justifyContent: 'center',
                                           width: '100%',
                                           height: '100%',
                                           padding: '2px'
                                         }}>
                                           {cellValue ? (
                                             <img
                                               src={cellValue}
                                               alt="Image"
                                               style={{
                                                 maxWidth: '100%',
                                                 maxHeight: '100%',
                                                 objectFit: 'contain'
                                               }}
                                               onError={(e) => {
                                                 e.target.style.display = 'none';
                                                 e.target.nextSibling.style.display = 'block';
                                               }}
                                             />
                                           ) : null}
                                           <input
                                             type="text"
                                             value={cellValue}
                                             onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                             onFocus={() => {
                                               if (!isFormFill) {
                                                 setSelectedCell(cellKey);
                                                 setShowToolbar(true);
                                               }
                                             }}
                                             onKeyDown={(e) => {
                                               if (e.key === 'Enter') {
                                                 const nextRow = rowIndex + 1;
                                                 if (nextRow < rows) {
                                                   const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                                   if (nextInput) nextInput.focus();
                                                 }
                                               } else if (e.key === 'Tab') {
                                                 e.preventDefault();
                                                 const nextCol = colIndex + 1;
                                                 if (nextCol < cols) {
                                                   const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                                   if (nextInput) nextInput.focus();
                                                 }
                                               }
                                             }}
                                             data-cell={cellKey}
                                             style={{
                                               width: '100%',
                                               height: '100%',
                                               border: 'none',
                                               outline: 'none',
                                               padding: '8px',
                                               backgroundColor: 'transparent',
                                               fontSize: '12px',
                                               fontFamily: '"Segoe UI", Arial, sans-serif',
                                               lineHeight: '24px',
                                               display: cellValue ? 'none' : 'block'
                                             }}
                                             placeholder="Enter image URL..."
                                             disabled={isReadOnly}
                                           />
                                         </div>
                                       );
                                     
                                     case 'richtext':
                                       return (
                                         <textarea
                                           value={cellValue}
                                           onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                           onFocus={() => {
                                             if (!isFormFill) {
                                               setSelectedCell(cellKey);
                                               setShowToolbar(true);
                                             }
                                           }}
                                           onKeyDown={(e) => {
                                             if (e.key === 'Enter' && e.shiftKey) {
                                               // Allow new lines with Shift+Enter
                                               return;
                                             } else if (e.key === 'Enter') {
                                               e.preventDefault();
                                               const nextRow = rowIndex + 1;
                                               if (nextRow < rows) {
                                                 const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                                 if (nextInput) nextInput.focus();
                                               }
                                             } else if (e.key === 'Tab') {
                                               e.preventDefault();
                                               const nextCol = colIndex + 1;
                                               if (nextCol < cols) {
                                                 const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                                 if (nextInput) nextInput.focus();
                                               }
                                             }
                                           }}
                                           data-cell={cellKey}
                                           style={{
                                             width: '100%',
                                             height: '100%',
                                             border: 'none',
                                             outline: 'none',
                                             padding: '8px',
                                             backgroundColor: 'transparent',
                                             fontSize: '12px',
                                             fontFamily: '"Segoe UI", Arial, sans-serif',
                                             resize: 'none',
                                             overflow: 'hidden'
                                           }}
                                           placeholder={`${getColumnHeader(colIndex)}${rowIndex + 1}`}
                                           disabled={isReadOnly}
                                         />
                                       );
                                     
                                     default: // text
                                       return (
                                         <input
                                           type="text"
                                           value={cellValue}
                                           onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                           onFocus={() => {
                                             if (!isFormFill) {
                                               setSelectedCell(cellKey);
                                               setShowToolbar(true);
                                             }
                                           }}
                                           onKeyDown={(e) => {
                                             if (e.key === 'Enter') {
                                               const nextRow = rowIndex + 1;
                                               if (nextRow < rows) {
                                                 const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                                 if (nextInput) nextInput.focus();
                                               }
                                             } else if (e.key === 'Tab') {
                                               e.preventDefault();
                                               const nextCol = colIndex + 1;
                                               if (nextCol < cols) {
                                                 const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                                 if (nextInput) nextInput.focus();
                                               }
                                             }
                                           }}
                                           data-cell={cellKey}
                                           style={{
                                             width: '100%',
                                             height: '100%',
                                             border: 'none',
                                             outline: 'none',
                                             padding: '8px',
                                             backgroundColor: 'transparent',
                                             fontSize: '12px',
                                             fontFamily: '"Segoe UI", Arial, sans-serif',
                                             lineHeight: '24px'
                                           }}
                                           placeholder={`${getColumnHeader(colIndex)}${rowIndex + 1}`}
                                           disabled={isReadOnly}
                                         />
                                       );
                                   }
                                 })()}
                               </div>
                             </div>
                           );
                         }
                         
                         // Regular cell rendering (non-merged)
                         switch (cellType) {
                           case 'checkbox':
                             return (
                               <div style={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center',
                                 width: '100%',
                                 height: '100%',
                                 padding: '2px'
                               }}>
                                 <input
                                   type="checkbox"
                                   checked={cellValue === true || cellValue === 'true'}
                                   onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.checked)}
                                   onFocus={() => {
                                     if (!isFormFill) {
                                       setSelectedCell(cellKey);
                                       setShowToolbar(true);
                                     }
                                   }}
                                   data-cell={cellKey}
                                   style={{
                                     width: '16px',
                                     height: '16px',
                                     cursor: 'pointer',
                                     accentColor: '#007bff'
                                   }}
                                   disabled={isReadOnly}
                                 />
                               </div>
                             );
                           
                           case 'dropdown':
                             return (
                               <select
                                 value={cellValue}
                                 onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                 onFocus={() => {
                                   if (!isFormFill) {
                                     setSelectedCell(cellKey);
                                     setShowToolbar(true);
                                   }
                                 }}
                                 data-cell={cellKey}
                                 style={{
                                   width: '100%',
                                   height: '100%',
                                   border: 'none',
                                   outline: 'none',
                                   padding: '4px',
                                   backgroundColor: 'transparent',
                                   fontSize: '12px',
                                   fontFamily: '"Segoe UI", Arial, sans-serif',
                                   cursor: 'pointer'
                                 }}
                                 disabled={isReadOnly}
                               >
                                 <option value="">Select...</option>
                                 {cellOptions.map((option, idx) => (
                                   <option key={idx} value={option}>{option}</option>
                                 ))}
                               </select>
                             );
                           
                           case 'autocomplete':
                             return (
                               <input
                                 type="text"
                                 value={cellValue}
                                 onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                 onFocus={() => {
                                   if (!isFormFill) {
                                     setSelectedCell(cellKey);
                                     setShowToolbar(true);
                                   }
                                 }}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     const nextRow = rowIndex + 1;
                                     if (nextRow < rows) {
                                       const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                       if (nextInput) nextInput.focus();
                                     }
                                   } else if (e.key === 'Tab') {
                                     e.preventDefault();
                                     const nextCol = colIndex + 1;
                                     if (nextCol < cols) {
                                       const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                       if (nextInput) nextInput.focus();
                                     }
                                   }
                                 }}
                                 data-cell={cellKey}
                                 style={{
                                   width: '100%',
                                   height: '100%',
                                   border: 'none',
                                   outline: 'none',
                                   padding: '8px',
                                   backgroundColor: 'transparent',
                                   fontSize: '12px',
                                   fontFamily: '"Segoe UI", Arial, sans-serif',
                                   lineHeight: '24px'
                                 }}
                                 placeholder={`${getColumnHeader(colIndex)}${rowIndex + 1}`}
                                 disabled={isReadOnly}
                                 list={`autocomplete-${rowIndex}-${colIndex}`}
                               />
                             );
                           
                           case 'date':
                             return (
                               <input
                                 type="date"
                                 value={cellValue}
                                 onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                 onFocus={() => {
                                   if (!isFormFill) {
                                     setSelectedCell(cellKey);
                                     setShowToolbar(true);
                                   }
                                 }}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     const nextRow = rowIndex + 1;
                                     if (nextRow < rows) {
                                       const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                       if (nextInput) nextInput.focus();
                                     }
                                   } else if (e.key === 'Tab') {
                                     e.preventDefault();
                                     const nextCol = colIndex + 1;
                                     if (nextCol < cols) {
                                       const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                       if (nextInput) nextInput.focus();
                                     }
                                   }
                                 }}
                                 data-cell={cellKey}
                                 style={{
                                   width: '100%',
                                   height: '100%',
                                   border: 'none',
                                   outline: 'none',
                                   padding: '8px',
                                   backgroundColor: 'transparent',
                                   fontSize: '12px',
                                   fontFamily: '"Segoe UI", Arial, sans-serif',
                                   lineHeight: '24px'
                                 }}
                                 disabled={isReadOnly}
                               />
                             );
                           
                           case 'time':
                             return (
                               <input
                                 type="time"
                                 value={cellValue}
                                 onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                 onFocus={() => {
                                   if (!isFormFill) {
                                     setSelectedCell(cellKey);
                                     setShowToolbar(true);
                                   }
                                 }}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     const nextRow = rowIndex + 1;
                                     if (nextRow < rows) {
                                       const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                       if (nextInput) nextInput.focus();
                                     }
                                   } else if (e.key === 'Tab') {
                                     e.preventDefault();
                                     const nextCol = colIndex + 1;
                                     if (nextCol < cols) {
                                       const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                       if (nextInput) nextInput.focus();
                                     }
                                   }
                                 }}
                                 data-cell={cellKey}
                                 style={{
                                   width: '100%',
                                   height: '100%',
                                   border: 'none',
                                   outline: 'none',
                                   padding: '8px',
                                   backgroundColor: 'transparent',
                                   fontSize: '12px',
                                   fontFamily: '"Segoe UI", Arial, sans-serif',
                                   lineHeight: '24px'
                                 }}
                                 disabled={isReadOnly}
                               />
                             );
                           
                           case 'numeric':
                             return (
                               <input
                                 type="number"
                                 value={cellValue}
                                 onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                 onFocus={() => {
                                   if (!isFormFill) {
                                     setSelectedCell(cellKey);
                                     setShowToolbar(true);
                                   }
                                 }}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     const nextRow = rowIndex + 1;
                                     if (nextRow < rows) {
                                       const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                       if (nextInput) nextInput.focus();
                                     }
                                   } else if (e.key === 'Tab') {
                                     e.preventDefault();
                                     const nextCol = colIndex + 1;
                                     if (nextCol < cols) {
                                       const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                       if (nextInput) nextInput.focus();
                                     }
                                   }
                                 }}
                                 data-cell={cellKey}
                                 style={{
                                   width: '100%',
                                   height: '100%',
                                   border: 'none',
                                   outline: 'none',
                                   padding: '8px',
                                   backgroundColor: 'transparent',
                                   fontSize: '12px',
                                   fontFamily: '"Segoe UI", Arial, sans-serif',
                                   lineHeight: '24px'
                                 }}
                                 placeholder={`${getColumnHeader(colIndex)}${rowIndex + 1}`}
                                 disabled={isReadOnly}
                               />
                             );
                           
                           case 'color':
                             return (
                               <div style={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center',
                                 width: '100%',
                                 height: '100%',
                                 padding: '2px'
                               }}>
                                 <input
                                   type="color"
                                   value={cellValue || '#000000'}
                                   onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                   onFocus={() => {
                                     if (!isFormFill) {
                                       setSelectedCell(cellKey);
                                       setShowToolbar(true);
                                     }
                                   }}
                                   data-cell={cellKey}
                                   style={{
                                     width: '30px',
                                     height: '30px',
                                     border: '1px solid #ddd',
                                     borderRadius: '4px',
                                     cursor: 'pointer'
                                   }}
                                   disabled={isReadOnly}
                                 />
                               </div>
                             );
                           
                           case 'image':
                             return (
                               <div style={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center',
                                 width: '100%',
                                 height: '100%',
                                 padding: '2px'
                               }}>
                                 {cellValue ? (
                                   <img
                                     src={cellValue}
                                     alt="Image"
                                     style={{
                                       maxWidth: '100%',
                                       maxHeight: '100%',
                                       objectFit: 'contain'
                                     }}
                                     onError={(e) => {
                                       e.target.style.display = 'none';
                                       e.target.nextSibling.style.display = 'block';
                                     }}
                                   />
                                 ) : null}
                                 <input
                                   type="text"
                                   value={cellValue}
                                   onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                   onFocus={() => {
                                     if (!isFormFill) {
                                       setSelectedCell(cellKey);
                                       setShowToolbar(true);
                                     }
                                   }}
                                   onKeyDown={(e) => {
                                     if (e.key === 'Enter') {
                                       const nextRow = rowIndex + 1;
                                       if (nextRow < rows) {
                                         const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                         if (nextInput) nextInput.focus();
                                       }
                                     } else if (e.key === 'Tab') {
                                       e.preventDefault();
                                       const nextCol = colIndex + 1;
                                       if (nextCol < cols) {
                                         const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                         if (nextInput) nextInput.focus();
                                       }
                                     }
                                   }}
                                   data-cell={cellKey}
                                   style={{
                                     width: '100%',
                                     height: '100%',
                                     border: 'none',
                                     outline: 'none',
                                     padding: '8px',
                                     backgroundColor: 'transparent',
                                     fontSize: '12px',
                                     fontFamily: '"Segoe UI", Arial, sans-serif',
                                     lineHeight: '24px',
                                     display: cellValue ? 'none' : 'block'
                                   }}
                                   placeholder="Enter image URL..."
                                   disabled={isReadOnly}
                                 />
                               </div>
                             );
                           
                           case 'richtext':
                             return (
                               <textarea
                                 value={cellValue}
                                 onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                 onFocus={() => {
                                   if (!isFormFill) {
                                     setSelectedCell(cellKey);
                                     setShowToolbar(true);
                                   }
                                 }}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' && e.shiftKey) {
                                     // Allow new lines with Shift+Enter
                                     return;
                                   } else if (e.key === 'Enter') {
                                     e.preventDefault();
                                     const nextRow = rowIndex + 1;
                                     if (nextRow < rows) {
                                       const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                       if (nextInput) nextInput.focus();
                                     }
                                   } else if (e.key === 'Tab') {
                                     e.preventDefault();
                                     const nextCol = colIndex + 1;
                                     if (nextCol < cols) {
                                       const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                       if (nextInput) nextInput.focus();
                                     }
                                   }
                                 }}
                                 data-cell={cellKey}
                                 style={{
                                   width: '100%',
                                   height: '100%',
                                   border: 'none',
                                   outline: 'none',
                                   padding: '8px',
                                   backgroundColor: 'transparent',
                                   fontSize: '12px',
                                   fontFamily: '"Segoe UI", Arial, sans-serif',
                                   resize: 'none',
                                   overflow: 'hidden'
                                 }}
                                 placeholder={`${getColumnHeader(colIndex)}${rowIndex + 1}`}
                                 disabled={isReadOnly}
                               />
                             );
                           
                           default: // text
                             return (
                               <input
                                 type="text"
                                 value={cellValue}
                                 onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                 onFocus={() => {
                                   if (!isFormFill) {
                                     setSelectedCell(cellKey);
                                     setShowToolbar(true);
                                   }
                                 }}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     const nextRow = rowIndex + 1;
                                     if (nextRow < rows) {
                                       const nextInput = document.querySelector(`input[data-cell="${nextRow}-${colIndex}"]`);
                                       if (nextInput) nextInput.focus();
                                     }
                                   } else if (e.key === 'Tab') {
                                     e.preventDefault();
                                     const nextCol = colIndex + 1;
                                     if (nextCol < cols) {
                                       const nextInput = document.querySelector(`input[data-cell="${rowIndex}-${nextCol}"]`);
                                       if (nextInput) nextInput.focus();
                                     }
                                   }
                                 }}
                                 data-cell={cellKey}
                                 style={{
                                   width: '100%',
                                   height: '100%',
                                   border: 'none',
                                   outline: 'none',
                                   padding: '8px',
                                   backgroundColor: 'transparent',
                                   fontSize: '12px',
                                   fontFamily: '"Segoe UI", Arial, sans-serif',
                                   lineHeight: '24px'
                                 }}
                                 placeholder={`${getColumnHeader(colIndex)}${rowIndex + 1}`}
                                 disabled={isReadOnly}
                               />
                             );
                         }
                       })()}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toolbar */}
      {showToolbar && !isFormFill && (
        <>
          {/* Range Selection Instructions */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '4px',
            padding: '8px 12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 999,
            fontSize: '12px',
            color: '#1976d2',
            maxWidth: '300px'
          }}>
            
          </div>
          
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            display: 'flex',
            gap: '5px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => {
                if (selectedCell) {
                  const [rowIndex, colIndex] = selectedCell.split('-').map(Number);
                  openColumnTypeModal(colIndex);
                }
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Set Column Type"
            >
              🔧 Col Type
            </button>
            <button
              onClick={() => {
                if (selectedCell) {
                  const [rowIndex, colIndex] = selectedCell.split('-').map(Number);
                  openRowTypeModal(rowIndex);
                }
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Set Row Type"
            >
              🔧 Row Type
            </button>
            <button
              onClick={() => {
                if (selectedCell) {
                  const [rowIndex, colIndex] = selectedCell.split('-').map(Number);
                  removeColumnType(colIndex);
                }
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Remove Column Type"
            >
              ❌ Col Type
            </button>
            <button
              onClick={() => {
                if (selectedCell) {
                  const [rowIndex, colIndex] = selectedCell.split('-').map(Number);
                  removeRowType(rowIndex);
                }
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Remove Row Type"
            >
              ❌ Row Type
            </button>
            <button
              onClick={addRow}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Add Row"
            >
              ➕ Row
            </button>
            <button
              onClick={addColumn}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Add Column"
            >
              ➕ Col
            </button>
            <button
              onClick={deleteRow}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Delete Row"
            >
              ➖ Row
            </button>
            <button
              onClick={deleteColumn}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Delete Column"
            >
              ➖ Col
            </button>
            <button
              onClick={() => {
                if (selectedRange) {
                  const { startRow, startCol, endRow, endCol } = selectedRange;
                  console.log('🔗 Merging cells:', { startRow, startCol, endRow, endCol });
                  setMerge(startRow, startCol, endRow, endCol);
                } else {
                  console.log('❌ No range selected for merge');
                }
              }}
              disabled={!selectedRange}
              style={{
                padding: '6px 12px',
                backgroundColor: !selectedRange ? '#6c757d' : '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !selectedRange ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
              title={!selectedRange ? 
                "Select a range first: Click a cell, then Shift+Click another cell, or drag to select" : 
                `Merge ${selectedRange ? `${selectedRange.endRow - selectedRange.startRow + 1}×${selectedRange.endCol - selectedRange.startCol + 1}` : ''} cells`
              }
            >
              🔗 Merge
            </button>
            <button
              onClick={() => {
                if (selectedCell) {
                  const [rowIndex, colIndex] = selectedCell.split('-').map(Number);
                  removeMerge(rowIndex, colIndex);
                }
              }}
              disabled={!selectedCell}
              style={{
                padding: '6px 12px',
                backgroundColor: !selectedCell ? '#6c757d' : '#fd7e14',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !selectedCell ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
              title="Unmerge Selected Cell"
            >
              🔓 Unmerge
            </button>
            <button
              onClick={destroyMerged}
              style={{ padding: '6px 12px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              title="Remove All Merges">🗑️ Clear Merges</button>

            <button onClick={() => {
              if (selectedRange && dragStart) {
                const startCellValue = data[dragStart.row]?.[dragStart.col] || '';
                if (startCellValue !== '') {
                  const newData = [...data];
                  for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
                    for (let c = selectedRange.startCol; c <= selectedRange.endCol; c++) {
                      if (r === dragStart.row && c === dragStart.col) continue;
                      if (!newData[r]) newData[r] = [];
                      newData[r][c] = startCellValue;
                    }
                  }
                  setData(newData);
                  addToHistory(newData);
                  updateField({ data: newData });
                }
              }
            }}
            disabled={!selectedRange || !dragStart}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: !selectedRange || !dragStart ? '#6c757d' : '#20c997', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: !selectedRange || !dragStart ? 'not-allowed' : 'pointer', 
              fontSize: '12px' 
            }}
            title="Fill Series - Copy data from start cell to selected range">🔄 Fill Series</button>

            <button onClick={copyData}
              style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              title="Copy Selected Data">📋 Copy</button>
          </div>
        </>
      )}


      
      {/* Datalist for autocomplete */}
      {Array.from({ length: cols }, (_, colIndex) => (
        <datalist key={colIndex} id={`autocomplete-${colIndex}`}>
          {getColumnOptions(colIndex).map((option, idx) => (
            <option key={idx} value={option} />
          ))}
        </datalist>
      ))}
      
      {/* Datalist for row autocomplete */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        Array.from({ length: cols }, (_, colIndex) => (
          <datalist key={`${rowIndex}-${colIndex}`} id={`autocomplete-${rowIndex}-${colIndex}`}>
            {getCellOptions(rowIndex, colIndex).map((option, idx) => (
              <option key={idx} value={option} />
            ))}
          </datalist>
        ))
      ))}
    </div>
  );
};

export default JSpreadsheetCE4Component; 