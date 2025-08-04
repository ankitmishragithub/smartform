import React from 'react';
import SettingsPanel from '../screens/label/SettingsPanel';
import '../css/SettingsModal.css';

const SettingsModal = ({ isOpen, onClose, field, onChange }) => {
  if (!isOpen || !field) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-modal-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal-content">
        <div className="settings-modal-header">
          <h3>Field Settings: {field.type}</h3>
          <button 
            className="settings-modal-close" 
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>
        <div className="settings-modal-body">
          <SettingsPanel 
            field={field} 
            onChange={(props) => {
              onChange(props);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 