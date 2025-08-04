import React, { useState, useRef, useEffect } from 'react';
import './FolderAutocomplete.css';

const FolderAutocomplete = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Enter folder path (use / for subfolders)",
  required = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [suggestedPaths, setSuggestedPaths] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Parse folder hierarchy and generate suggestions
  useEffect(() => {
    const allPaths = new Set();
    
    // Add all existing full paths
    options.forEach(option => {
      allPaths.add(option);
      
      // Add parent paths for existing nested folders
      const parts = option.split('/');
      for (let i = 1; i < parts.length; i++) {
        const parentPath = parts.slice(0, i).join('/');
        if (parentPath.trim()) {
          allPaths.add(parentPath);
        }
      }
    });

    const allPathsArray = Array.from(allPaths);
    
    // Filter based on current input
    if (!value.trim()) {
      setFilteredOptions(allPathsArray);
      setSuggestedPaths([]);
    } else {
      const currentPath = value.toLowerCase();
      const filtered = allPathsArray.filter(option =>
        option.toLowerCase().includes(currentPath)
      );
      
      setFilteredOptions(filtered);
      
      // Generate path suggestions for current typing
      const suggestions = [];
      
      // If user is typing after a "/", suggest subfolders
      if (value.includes('/')) {
        const lastSlashIndex = value.lastIndexOf('/');
        const parentPath = value.substring(0, lastSlashIndex);
        const childPart = value.substring(lastSlashIndex + 1).toLowerCase();
        
        const existingSubfolders = allPathsArray
          .filter(path => path.startsWith(parentPath + '/'))
          .map(path => {
            const remaining = path.substring(parentPath.length + 1);
            return remaining.split('/')[0]; // Get first level subfolder
          })
          .filter((folder, index, arr) => arr.indexOf(folder) === index); // Remove duplicates
        
        existingSubfolders.forEach(subfolder => {
          if (subfolder.toLowerCase().includes(childPart)) {
            suggestions.push(`${parentPath}/${subfolder}`);
          }
        });
      }
      
      setSuggestedPaths(suggestions);
    }
  }, [value, options]);

  // Get folder display info
  const getFolderInfo = (folderPath) => {
    const parts = folderPath.split('/');
    const depth = parts.length - 1;
    const folderName = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join('/');
    
    return {
      folderName,
      parentPath,
      depth,
      isNested: depth > 0
    };
  };

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Handle creating subfolder
  const handleCreateSubfolder = () => {
    const trimmedValue = value.trim();
    if (trimmedValue && !trimmedValue.endsWith('/')) {
      handleOptionSelect(trimmedValue);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && filteredOptions.length === 1) {
      e.preventDefault();
      handleOptionSelect(filteredOptions[0]);
    } else if (e.key === 'Tab' && suggestedPaths.length > 0) {
      e.preventDefault();
      handleOptionSelect(suggestedPaths[0]);
    }
  };

  // Combine and sort all options for display
  const allDisplayOptions = [
    ...filteredOptions,
    ...suggestedPaths.filter(path => !filteredOptions.includes(path))
  ].sort((a, b) => {
    const aDepth = a.split('/').length;
    const bDepth = b.split('/').length;
    if (aDepth !== bDepth) return aDepth - bDepth;
    return a.localeCompare(b);
  });

  const shouldShowCreateOption = value.trim() && 
    !allDisplayOptions.some(opt => opt.toLowerCase() === value.toLowerCase().trim());

  return (
    <div className="folder-autocomplete">
      <input
        ref={inputRef}
        type="text"
        className="form-control"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      
      {isOpen && (allDisplayOptions.length > 0 || value.trim()) && (
        <div ref={dropdownRef} className="folder-dropdown">
          {/* Existing folders */}
          {allDisplayOptions.length > 0 && (
            <>
              {allDisplayOptions.map((option, index) => {
                const folderInfo = getFolderInfo(option);
                const isExisting = options.includes(option);
                
                return (
                  <div
                    key={option}
                    className={`folder-option ${folderInfo.isNested ? 'folder-option-nested' : ''} ${!isExisting ? 'folder-option-suggested' : ''}`}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <div className="folder-option-content">
                      <div className="folder-icon-container">
                        {'│  '.repeat(folderInfo.depth)}
                        <i className={`ni ${folderInfo.isNested ? 'ni-folder-plus' : 'ni-folder'} me-2`}></i>
                      </div>
                      <div className="folder-text-container">
                        <span className="option-text">{folderInfo.folderName}</span>
                        {folderInfo.isNested && (
                          <span className="option-parent">in {folderInfo.parentPath}</span>
                        )}
                      </div>
                      <small className="option-action">
                        {isExisting ? 'Existing' : 'Available path'}
                      </small>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          
          {/* Create new folder option */}
          {shouldShowCreateOption && (
            <div
              className="folder-option folder-option-new"
              onClick={handleCreateSubfolder}
            >
              <div className="folder-option-content">
                <div className="folder-icon-container">
                  <i className="ni ni-plus me-2"></i>
                </div>
                <div className="folder-text-container">
                  <span className="option-text">Create "{value.trim()}"</span>
                  {value.includes('/') && (
                    <span className="option-parent">New subfolder</span>
                  )}
                </div>
                <small className="option-action">Create new</small>
              </div>
            </div>
          )}
          
          {/* Help text */}
          <div className="folder-help">
            <small>💡 Use "/" to create subfolders (e.g., "Marketing/Campaigns")</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderAutocomplete; 