import React, { useState, useEffect } from "react";
import TabComponent from "./TabComponent";
import './TabsLayout.css';

export default function TabsLayout({
  node,
  parentId,
  row,
  col,
  onDrop,
  onSelect,
  onDelete,
  onMove,
  handleDeleteColumn,
  handleDeleteTableColumn,
  handleDeleteTableRow,
  onAddColumn,
  onUpdateField
}) {
  // Safety check for node structure
  if (!node || !node.tabs || !Array.isArray(node.tabs)) {
    console.error('TabsLayout: Invalid node structure', node);
    return <div>Error: Invalid tabs structure</div>;
  }





  const [activeTab, setActiveTab] = useState(() => {
    const initialTab = node.activeTab || 0;
    return Math.min(initialTab, node.tabs.length - 1);
  });

  // Sync local activeTab state with node changes
  useEffect(() => {
    const nodeActiveTab = node.activeTab || 0;
    const validActiveTab = Math.min(nodeActiveTab, node.tabs.length - 1);
    if (activeTab !== validActiveTab) {
      setActiveTab(validActiveTab);
    }
  }, [node.activeTab, node.tabs.length, activeTab]);

  const handleTabClick = (tabIndex) => {
    if (tabIndex >= 0 && tabIndex < node.tabs.length) {
      setActiveTab(tabIndex);
      // Update the node's activeTab state
      if (onUpdateField) {
        onUpdateField(node.id, { activeTab: tabIndex });
      }
    }
  };

  const handleAddTab = () => {
    if (!onUpdateField) {
      console.error('TabsLayout: onUpdateField not provided');
      return;
    }
    
    const newTabs = [...node.tabs, {
      name: `Tab ${node.tabs.length + 1}`,
      children: []
    }];
    onUpdateField(node.id, { tabs: newTabs });
  };

  const handleDeleteTab = (tabIndex) => {
    console.log('🗑️ Deleting tab:', tabIndex, 'from', node.tabs.length, 'tabs');
    
    const newTabs = node.tabs.filter((_, index) => index !== tabIndex);
    
    // If no tabs left, delete the entire tabs component
    if (newTabs.length === 0) {
      console.log('🗑️ No tabs left - deleting entire tabs component');
      if (onDelete) {
        onDelete(node.id);
      }
      return;
    }
    
    // Calculate new active tab
    let newActiveTab = activeTab;
    
    // If we're deleting the active tab, move to previous tab
    if (activeTab === tabIndex) {
      newActiveTab = Math.max(0, tabIndex - 1);
    } 
    // If we're deleting a tab before the active tab, shift active tab down
    else if (tabIndex < activeTab) {
      newActiveTab = activeTab - 1;
    }
    
    // Ensure activeTab is within bounds
    newActiveTab = Math.min(newActiveTab, newTabs.length - 1);
    
    console.log('🔄 Updating to', newTabs.length, 'tabs, activeTab:', newActiveTab);
    
    if (onUpdateField) {
      onUpdateField(node.id, { 
        tabs: newTabs,
        activeTab: newActiveTab 
      });
      setActiveTab(newActiveTab);
    } else {
      console.error('❌ onUpdateField is not available!');
    }
  };

  const handleTabNameChange = (tabIndex, newName) => {
    if (!onUpdateField || tabIndex < 0 || tabIndex >= node.tabs.length) {
      return;
    }
    
    const newTabs = [...node.tabs];
    newTabs[tabIndex] = { ...newTabs[tabIndex], name: newName };
    onUpdateField(node.id, { tabs: newTabs });
  };

  return (
    <div className="tabs-layout">
      {/* Tab Headers */}
      <div className="tab-headers">
        {node.tabs.map((tab, index) => (
          <div
            key={index}
            className={`tab-header ${activeTab === index ? 'active' : ''}`}
            onClick={() => handleTabClick(index)}
          >
            <input
              type="text"
              value={tab.name}
              onChange={(e) => handleTabNameChange(index, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="tab-name-input"
            />
            <button
              type="button"
              className="delete-tab-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteTab(index);
              }}
              title="Delete tab"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="add-tab-btn"
          onClick={handleAddTab}
          title="Add new tab"
        >
          <span className="add-tab-icon">+</span>
          <span className="add-tab-text">Add Tab</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {node.tabs.map((tab, index) => {
          // Ensure tab has children array  
          const tabChildren = Array.isArray(tab.children) ? tab.children : [];
          
          return (
            <div
              key={index}
              className={`tab-pane ${activeTab === index ? 'active' : ''}`}
              style={{ display: activeTab === index ? 'block' : 'none' }}
            >
              <TabComponent
                parentId={parentId}
                tabIndex={index}
                childrenNodes={tabChildren}
                onDrop={onDrop}
                onSelect={onSelect}
                onDelete={onDelete}
                onMove={onMove}
                handleDeleteColumn={handleDeleteColumn}
                handleDeleteTableColumn={handleDeleteTableColumn}
                handleDeleteTableRow={handleDeleteTableRow}
                onAddColumn={onAddColumn}
                onUpdateField={onUpdateField}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
} 