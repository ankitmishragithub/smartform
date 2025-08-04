import React, { useState } from 'react';
import FormFieldRenderer from './FormFieldRenderer';

// Separate component to handle tabs to avoid hooks issues
function TabsFormNodeComponent({ node, values, onChange, onFieldSelect, selectedId, preview }) {
  // Safety check
  if (!node || !node.tabs || !Array.isArray(node.tabs)) {
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
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Modern Tab Headers */}
      <div style={{
        display: "flex",
        backgroundColor: "#f8f9ff",
        padding: "8px",
        borderRadius: "12px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        gap: "4px"
      }}>
        {node.tabs.map((tab, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => handleTabClick(index, e)}
            style={{
              flex: 1,
              padding: "12px 20px",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              background: activeTab === index 
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "transparent",
              color: activeTab === index ? "#ffffff" : "#6b7280",
              boxShadow: activeTab === index 
                ? "0 4px 15px rgba(102, 126, 234, 0.4)" 
                : "none",
              transform: activeTab === index ? "translateY(-1px)" : "none"
            }}
            onMouseEnter={(e) => {
              if (activeTab !== index) {
                e.target.style.backgroundColor = "#e5e7eb";
                e.target.style.color = "#374151";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== index) {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#6b7280";
              }
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>
      
      {/* Modern Tab Content */}
      <div style={{ 
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
        minHeight: "200px"
      }}>
        {node.tabs[activeTab] && Array.isArray(node.tabs[activeTab].children) && node.tabs[activeTab].children.length > 0 ? (
          node.tabs[activeTab].children.map(child => (
            <FormNodeRenderer
              key={child.id}
              node={child}
              values={values}
              onChange={onChange}
              onFieldSelect={onFieldSelect}
              selectedId={selectedId}
              preview={preview}
            />
          ))
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            color: "#9ca3af",
            fontSize: "16px"
          }}>
            <div style={{ 
              fontSize: "48px", 
              marginBottom: "16px",
              opacity: 0.3
            }}>📋</div>
            <p style={{ margin: 0, fontStyle: "italic" }}>
              This tab is empty
            </p>
            <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>
              Drag fields here to add content
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable form node renderer component
 * Handles rendering of nested form structures (columns, tables, fields)
 */
const FormNodeRenderer = ({ 
  node, 
  values = {}, 
  onChange, 
  onFieldSelect = null,
  selectedId = null,
  preview = false,
  className = ""
}) => {
  const handleFieldSelect = () => {
    if (onFieldSelect && node.type !== "heading") {
      onFieldSelect(node.id);
    }
  };

  // Render heading
  if (node.type === "heading") {
    return (
      <h2
        key={node.id}
        style={{
          textAlign: "center",
          marginBottom: "1.5rem",
          fontWeight: "700",
          color: "#2c3e50"
        }}
      >
        {node.label || "Untitled Form"}
      </h2>
    );
  }

  // Render columns layout
  if (node.type === "columns") {
    return (
      <div
        key={node.id}
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem"
        }}
      >
        {node.children.map((colChildren, colIndex) => (
          <div key={colIndex} style={{ flex: 1 }}>
            {colChildren.map((child) => (
              <FormNodeRenderer
                key={child.id}
                node={child}
                values={values}
                onChange={onChange}
                onFieldSelect={onFieldSelect}
                selectedId={selectedId}
                preview={preview}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Render table layout
  if (node.type === "table") {
    return (
      <div
        key={node.id}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${node.cols}, 1fr)`,
          gap: "1rem",
          marginBottom: "1rem"
        }}
      >
        {node.children.map((rowArr, rowIndex) =>
          rowArr.map((cellArr, colIndex) => (
            <div
              key={`${node.id}-r${rowIndex}c${colIndex}`}
              style={{
                border: "1px solid #e0e0e0",
                padding: "12px",
                borderRadius: "8px",
                background: "#fafafa"
              }}
            >
              {cellArr.map((child) => (
                <FormNodeRenderer
                  key={child.id}
                  node={child}
                  values={values}
                  onChange={onChange}
                  onFieldSelect={onFieldSelect}
                  selectedId={selectedId}
                  preview={preview}
                />
              ))}
            </div>
          ))
        )}
      </div>
    );
  }

  // Render tabs layout
  if (node.type === "tabs") {
    return (
      <TabsFormNodeComponent 
        key={node.id}
        node={node}
        values={values}
        onChange={onChange}
        onFieldSelect={onFieldSelect}
        selectedId={selectedId}
        preview={preview}
      />
    );
  }

  // Render individual form field
  const isSelected = selectedId === node.id;
  const fieldValue = values[node.id];
  
  return (
    <div
      key={node.id}
      onClick={handleFieldSelect}
      className={`form-field-container ${className} ${isSelected ? 'selected' : ''}`}
      style={{
        border: isSelected ? '2px solid #007bff' : '1px solid transparent',
        borderRadius: '8px',
        padding: isSelected ? '8px' : '4px',
        marginBottom: '8px',
        cursor: onFieldSelect ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }}
    >
      <FormFieldRenderer
        field={node}
        value={fieldValue}
        onChange={onChange}
        preview={preview}
      />
    </div>
  );
};

export default FormNodeRenderer; 