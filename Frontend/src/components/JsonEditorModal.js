import React, { useState, useEffect } from 'react';
import { JsonEditor } from 'json-edit-react';
import '../css/JsonEditor.css';

const JsonEditorModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  onSave, 
  folderName 
}) => {
  const [jsonData, setJsonData] = useState({});
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize JSON data when modal opens
  useEffect(() => {
    if (isOpen && formData) {
      setJsonData(formData);
      setHasChanges(false);
      setError('');
    } else if (isOpen && !formData) {
      setJsonData([]);
    }
  }, [isOpen, formData, folderName]);

  const handleDataChange = (newData) => {
    try {
      // Validate that newData is an array
      if (!Array.isArray(newData)) {
        console.warn('JsonEditor data change: newData is not an array, attempting to fix...');
        
        // If it's an object that should be an array, try to convert it
        if (typeof newData === 'object' && newData !== null) {
          // If it has array-like properties, try to extract the array
          if (newData.formSchema && Array.isArray(newData.formSchema)) {
            newData = newData.formSchema;
          } else {
            // Create an array from the object if possible
            newData = Object.values(newData).filter(item => 
              item && typeof item === 'object' && item.id && item.type
            );
          }
        } else {
          // Fallback to empty array
          newData = [];
        }
      }

      // Ensure each field in the array has the required properties
      const validatedData = newData.map(field => {
        if (!field || typeof field !== 'object') {
          return { id: `field-${Date.now()}`, type: 'text', label: 'Invalid Field' };
        }

        return {
          ...field,
          id: field.id || `field-${Date.now()}`,
          type: field.type || 'text'
        };
      });

      setJsonData(validatedData);
      setHasChanges(true);
      setError('');
    } catch (err) {
      console.error('JsonEditor data change error:', err);
      setError(`Error updating JSON: ${err.message}`);
    }
  };

  const handleSave = () => {
    try {
      // Validate the JSON structure
      if (!Array.isArray(jsonData)) {
        setError('Invalid JSON structure: Form schema must be an array');
        return;
      }

      // Basic validation for required fields
      const hasValidStructure = jsonData.every(field => 
        field.hasOwnProperty('id') && 
        field.hasOwnProperty('type')
      );

      if (!hasValidStructure) {
        setError('Invalid form structure: Each field must have an "id" and "type" property');
        return;
      }

      // Clean and validate the data before saving
      const cleanedData = jsonData.map(field => {
        const cleanField = { ...field };
        
        // Handle spreadsheet fields specifically
        if (field.type === 'spreadsheet') {
          if (!cleanField.sheets) {
            cleanField.sheets = [];
          }
          
          // Ensure each sheet has proper structure
          cleanField.sheets = cleanField.sheets.map(sheet => {
            const cleanSheet = {
              name: sheet.name || 'Sheet 1',
              rows: sheet.rows || 10,
              cols: sheet.cols || 10,
              headers: Array.isArray(sheet.headers) ? sheet.headers : [],
              data: Array.isArray(sheet.data) ? sheet.data : [],
              mergedCells: Array.isArray(sheet.mergedCells) ? sheet.mergedCells : []
            };

            // Clean the data array to ensure proper cell structure (simplified)
            if (Array.isArray(cleanSheet.data)) {
              cleanSheet.data = cleanSheet.data.map(row => {
                if (!Array.isArray(row)) return [];
                
                return row.map(cell => {
                  // Simple fix: just ensure content is always a string
                  if (typeof cell === 'string') {
                    // Keep simple string cells as they are
                    return cell;
                  } else if (typeof cell === 'object' && cell !== null) {
                    // For object cells, ensure content is a string
                    return {
                      ...cell,
                      content: String(cell.content || '')
                    };
                  } else {
                    // Invalid cell - return empty string
                    return '';
                  }
                });
              });
            }

            return cleanSheet;
          });
        }

        // Handle other field types that might have array properties
        if (field.options && !Array.isArray(field.options)) {
          cleanField.options = [];
        }

        return cleanField;
      });

      // Call the save callback with the cleaned form data
      onSave(cleanedData, folderName);
      setHasChanges(false);
      setError('');
      onClose(); // Close the modal after successful save
    } catch (err) {
      console.error('JSON Editor save error:', err);
      setError(`Error saving JSON: ${err.message}`);
      // Don't prevent saving - just log the error
      onSave(jsonData, folderName); // Try saving original data as fallback
      setHasChanges(false);
      onClose();
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    setHasChanges(false);
    setError('');
    onClose();
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="json-editor-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="json-editor-header">
          <div className="json-editor-title">
            <h3>
              <i className="ni ni-code me-2"></i>
              JSON Schema Editor
            </h3>
            {hasChanges && (
              <span className="json-editor-badge">
                <i className="ni ni-edit me-1"></i>
                Unsaved Changes
              </span>
            )}
          </div>
          <button className="json-editor-close-btn" onClick={handleClose}>
            <i className="ni ni-cross"></i>
          </button>
        </div>
        
        <div className="json-editor-body">
          {error && (
            <div className="json-editor-error">
              <i className="ni ni-alert-circle me-2"></i>
              {error}
            </div>
          )}
          
          <div className="json-editor-info">
            <div className="json-editor-info-item">
              <small>
                <i className="ni ni-info me-1"></i>
                Edit your form schema directly in JSON format
              </small>
            </div>
            <div className="json-editor-info-item">
              <small>
                <i className="ni ni-folder me-1"></i>
                Folder: {folderName || 'Not specified'}
              </small>
            </div>
          </div>

          <div className="json-editor-container">
            {jsonData && (Array.isArray(jsonData) ? jsonData.length > 0 : Object.keys(jsonData).length > 0) ? (
              <div style={{ 
                border: '2px solid #e5e7eb', 
                padding: '20px', 
                minHeight: '400px',
                width: '100%',
                background: 'white',
                borderRadius: '8px',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
              }}>
                <JsonEditor
                  data={jsonData}
                  setData={handleDataChange}
                />
              </div>
            ) : (
              <div className="json-editor-loading">
                <div className="spinner"></div>
                <p>Loading JSON data...</p>
              </div>
            )}
          </div>

          <div className="json-editor-help">
            <div className="json-editor-help-section">
              <h6>
                <i className="ni ni-bulb me-1"></i>
                Quick Tips:
              </h6>
              <ul>
                <li>• Double-click values to edit them</li>
                <li>• Use Ctrl+Enter for multi-line text</li>
                <li>• Hold Alt while opening nodes to expand all children</li>
                <li>• Drag and drop to reorder items</li>
              </ul>
            </div>
            <div className="json-editor-help-section">
              <h6>
                <i className="ni ni-shield-exclamation me-1"></i>
                Required Structure:
              </h6>
              <ul>
                <li>• Each field must have an "id" property</li>
                <li>• Each field must have a "type" property</li>
                <li>• formSchema must be an array</li>
                <li>• Changes apply immediately to the canvas</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="json-editor-footer">
          <button 
            className="json-editor-btn json-editor-btn-secondary"
            onClick={() => setJsonData(jsonData)}
            disabled={!hasChanges}
          >
            <i className="ni ni-refresh me-1"></i>
            Reset Changes
          </button>
          <button 
            className="json-editor-btn json-editor-btn-secondary"
            onClick={handleClose}
          >
            <i className="ni ni-cross me-1"></i>
            Cancel
          </button>
          <button 
            className="json-editor-btn json-editor-btn-primary"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <i className="ni ni-check me-1"></i>
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default JsonEditorModal;