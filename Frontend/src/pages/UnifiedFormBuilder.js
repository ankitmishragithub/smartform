import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "reactstrap";
import api from "../api/api";
import Palette from "../screens/selectform/Palette";
import Canvas from "../screens/canva/Canvas";
import SettingsModal from "../components/SettingsModal";
import JsonEditorModal from "../components/JsonEditorModal";
import "../css/App.css";
import LivePreview from "./livepreview/livepreview";
import EdiPreview from "./livepreview/editpreview";
import { formUtils } from "../utils/formUtils";
import { useFormAPI } from "../hooks/useFormAPI";
import FolderAutocomplete from "../components/FolderAutocomplete";

// Separate component to handle tabs to avoid hooks issues and prevent page refresh
function TabsBuilderPreviewComponent({ node, renderFormNode }) {
  // Safety check for node structure
  if (!node || !node.tabs || !Array.isArray(node.tabs)) {
    console.error('TabsBuilderPreviewComponent: Invalid node structure', node);
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
          node.tabs[activeTab].children.map(child => renderFormNode(child))
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            color: "#9ca3af",
            fontStyle: "italic"
          }}>
            Drop fields here for {node.tabs[activeTab]?.name}
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ Helper: get heading node
function getHeadingField(fields) {
  return fields.find((f) => f.type === "heading");
}

function UnifiedFormBuilder() {
  const { id } = useParams(); // Get form ID from URL (null for new forms)
  const [fields, setFields] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [folderName, setFolderName] = useState("");
  const [folderOptions, setFolderOptions] = useState([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);
  
  const { getFolders } = useFormAPI();
  const headingNode = getHeadingField(fields);
  const heading = headingNode?.label || "";
  
  // Determine if we're in edit mode
  const isEditMode = Boolean(id);

  // ✅ Fetch existing folders for dropdown
  useEffect(() => {
    if (isEditMode) {
      // EditForm style - direct API call
      api.get('/forms/folders')
        .then(res => setFolderOptions(res.data))
        .catch(() => {});
    } else {
      // FormBuilder style - using hook
      getFolders().then(setFolderOptions).catch(() => {});
    }
  }, [isEditMode, getFolders]);

  // ✅ Fetch existing form schema when editing
  useEffect(() => {
    if (!isEditMode) {
      console.log("🆕 New form mode");
      return;
    }

    console.log("📡 Edit mode - Fetching form with ID:", id);
    setLoading(true);
    api
      .get(`/forms/${id}`)
      .then((res) => {
        console.log("✅ Loaded form:", res.data);
        const schema = res.data?.schemaJson || [];
        
        // Extract folderName from schema
        const extractedFolderName = formUtils.getFolderName(schema);
        
        // Remove folderName fields from the main fields array for editing
        const fieldsWithoutMeta = schema.filter(f => f.type !== 'folderName');
        
        setFields(fieldsWithoutMeta);
        setFolderName(extractedFolderName);
      })
      .catch((err) => {
        console.error("❌ Fetch error:", err);
        setError("Failed to load form data");
      })
      .finally(() => setLoading(false));
  }, [id, isEditMode]);

  // Handle typing in the live preview
  const handlePreviewChange = (id, val) => {
    console.log(`Field ${id} changed to:`, val, 'Type:', typeof val);
    setValues((prev) => ({ ...prev, [id]: val }));
  };

  // ✅ Add new field/component
  const handleAdd = (item, parentId = null, row = null, col = null) => {
    if (!heading.trim()) {
      alert("⚠️ Please enter a heading before adding fields!");
      return;
    }

    const id = Date.now().toString();
    let node;

    if (item.type === "columns") {
      const cols = item.defaultCols || 2;
      node = {
        id,
        type: "columns",
        label: item.label,
        cols,
        children: Array.from({ length: cols }, () => []),
      };
    } else if (item.type === "table") {
      const rows = item.defaultRows || 2;
      const cols = item.defaultCols || 2;
      node = {
        id,
        type: "table",
        label: item.label,
        rows,
        cols,
        children: Array.from({ length: rows }, () =>
          Array.from({ length: cols }, () => [])
        ),
      };
    } else if (item.type === "tabs") {
      const tabCount = item.defaultTabs || 2;
      node = {
        id,
        type: "tabs",
        label: item.label,
        activeTab: 0,
        tabs: Array.from({ length: tabCount }, (_, i) => ({
          name: `Tab ${i + 1}`,
          children: []
        })),
      };
    } else {
      node = {
        id,
        type: item.type,
        label: item.label,
        required: false,
        placeholder: item.placeholderByDefault ? "" : undefined,
        options: item.optionsByDefault ? ["Option 1", "Option 2"] : undefined,
      };
    }

    setFields((list) => {
      if (!parentId) return [...list, node];
      return insertIntoParent(list, parentId, row, col, node);
    });
  };

  // ✅ Insert into nested columns/tables
  function insertIntoParent(nodes, parentId, row, col, newNode) {
    return nodes.map((n) => {
      if (n.id === parentId) {
        if (n.type === "columns") {
          const colsCopy = [...n.children];
          colsCopy[col] = [...colsCopy[col], newNode];
          return { ...n, children: colsCopy };
        }
        if (n.type === "table") {
          const gridCopy = n.children.map((r) => [...r]);
          gridCopy[row][col] = [...gridCopy[row][col], newNode];
          return { ...n, children: gridCopy };
        }
        if (n.type === "tabs") {
          const tabsCopy = [...n.tabs];
          tabsCopy[row] = { ...tabsCopy[row], children: [...tabsCopy[row].children, newNode] };
          return { ...n, tabs: tabsCopy };
        }
      }
      if (n.type === "columns") {
        return {
          ...n,
          children: n.children.map((colArr) =>
            insertIntoParent(colArr, parentId, row, col, newNode)
          ),
        };
      }
      if (n.type === "table") {
        return {
          ...n,
          children: n.children.map((rowArr) =>
            rowArr.map((cellArr) =>
              insertIntoParent(cellArr, parentId, row, col, newNode)
            )
          ),
        };
      }
      if (n.type === "tabs") {
        return {
          ...n,
          tabs: n.tabs.map((tab) => ({
            ...tab,
            children: insertIntoParent(tab.children, parentId, row, col, newNode)
          })),
        };
      }
      return n;
    });
  }

  // ✅ Delete a field
  const deleteField = (fid) => {
    setFields((old) => removeById(old, fid));
    if (selectedId === fid) setSelectedId(null);
  };

  function removeById(nodes, targetId) {
    return nodes.reduce((acc, n) => {
      if (n.id === targetId) return acc;

      const copy = { ...n };

      // Handle different node types with their specific structures
      if (copy.type === "table" && Array.isArray(copy.children)) {
        copy.children = copy.children.map((row) =>
          row.map((cellArr) =>
            Array.isArray(cellArr) ? removeById(cellArr, targetId) : cellArr
          )
        );
      } else if (copy.type === "columns" && Array.isArray(copy.children)) {
        copy.children = copy.children.map((colArr) =>
          removeById(colArr, targetId)
        );
      } else if (copy.type === "tabs" && Array.isArray(copy.tabs)) {
        copy.tabs = copy.tabs.map((tab) => ({
          ...tab,
          children: removeById(tab.children, targetId)
        }));
      } else if (Array.isArray(copy.children)) {
        copy.children = removeById(copy.children, targetId);
      }

      acc.push(copy);
      return acc;
    }, []);
  }

  // ✅ Update field props
  const updateField = (fid, props) => {
    console.log('🔄 UnifiedFormBuilder - Updating field:', fid, 'with props:', props);
    setFields((list) => {
      const updated = updateById(list, fid, props);
      console.log('✅ UnifiedFormBuilder - Fields state updated successfully');
      return updated;
    });
  };

  function updateById(nodes, fid, props) {
    if (!Array.isArray(nodes)) return nodes;
    return nodes.map((n) => {
      if (n.id === fid) {
        console.log('✅ UnifiedFormBuilder - Found and updating field:', fid, 'with props:', props);
        return { ...n, ...props };
      }

      let copy = { ...n };

      // Handle different node types with their specific structures
      if (n.type === "columns" && Array.isArray(copy.children)) {
        copy.children = n.children.map((colArr) =>
          updateById(colArr, fid, props)
        );
      } else if (n.type === "table" && Array.isArray(copy.children)) {
        copy.children = n.children.map((rowArr) =>
          rowArr.map((cellArr) => updateById(cellArr, fid, props))
        );
      } else if (n.type === "tabs" && Array.isArray(n.tabs)) {
        console.log('🔍 UnifiedFormBuilder - Processing tabs node:', n.id, 'looking for:', fid, 'tabs count:', n.tabs.length);
        copy.tabs = n.tabs.map((tab, tabIndex) => {
          console.log(`  📋 UnifiedFormBuilder - Checking tab ${tabIndex}: "${tab.name}" with ${tab.children?.length || 0} children`);
          return {
            ...tab,
            children: updateById(tab.children, fid, props)
          };
        });
      } else if (Array.isArray(copy.children)) {
        copy.children = updateById(n.children, fid, props);
      }
      
      return copy;
    });
  }

  // ✅ Move fields (drag & drop reorder) - handles nested structures
  const moveField = (fromIndex, toIndex, parentId = null, row = null, col = null) => {
    setFields((fields) => {
      // Root level reordering
      if (!parentId) {
        const copy = [...fields];
        const [moved] = copy.splice(fromIndex, 1);
        copy.splice(toIndex, 0, moved);
        return copy;
      }

      // Nested reordering within containers
      return moveFieldInParent(fields, parentId, row, col, fromIndex, toIndex);
    });
  };

  // Helper function to move fields within nested containers
  function moveFieldInParent(nodes, parentId, row, col, fromIndex, toIndex) {
    return nodes.map((n) => {
      if (n.id === parentId) {
        if (n.type === "columns") {
          const colsCopy = [...n.children];
          const targetCol = [...colsCopy[col]];
          const [moved] = targetCol.splice(fromIndex, 1);
          targetCol.splice(toIndex, 0, moved);
          colsCopy[col] = targetCol;
          return { ...n, children: colsCopy };
        }
        if (n.type === "table") {
          const gridCopy = n.children.map((r) => [...r]);
          const targetCell = [...gridCopy[row][col]];
          const [moved] = targetCell.splice(fromIndex, 1);
          targetCell.splice(toIndex, 0, moved);
          gridCopy[row][col] = targetCell;
          return { ...n, children: gridCopy };
        }
        if (n.type === "tabs") {
          const tabsCopy = [...n.tabs];
          const targetTab = { ...tabsCopy[row], children: [...tabsCopy[row].children] };
          const [moved] = targetTab.children.splice(fromIndex, 1);
          targetTab.children.splice(toIndex, 0, moved);
          tabsCopy[row] = targetTab;
          return { ...n, tabs: tabsCopy };
        }
      }
      
      // Recursively search nested structures
      if (n.type === "columns") {
        return {
          ...n,
          children: n.children.map((colArr) =>
            moveFieldInParent(colArr, parentId, row, col, fromIndex, toIndex)
          ),
        };
      }
      if (n.type === "table") {
        return {
          ...n,
          children: n.children.map((rowArr) =>
            rowArr.map((cellArr) =>
              moveFieldInParent(cellArr, parentId, row, col, fromIndex, toIndex)
            )
          ),
        };
      }
      if (n.type === "tabs") {
        return {
          ...n,
          tabs: n.tabs.map((tab) => ({
            ...tab,
            children: moveFieldInParent(tab.children, parentId, row, col, fromIndex, toIndex)
          })),
        };
      }
       
      return n;
    });
  }

  // ✅ Find field by ID
  function findFieldById(nodes, fid) {
    if (!Array.isArray(nodes)) return null;

    for (const node of nodes) {
      if (node.id === fid) return node;

      if (Array.isArray(node.children)) {
        const children = node.children;

        // Handle Table: children[row][col] → each is an array of fields
        if (Array.isArray(children[0]) && Array.isArray(children[0][0])) {
          for (const row of children) {
            for (const cell of row) {
              const found = findFieldById(cell, fid);
              if (found) return found;
            }
          }
        }

        // Handle Columns: children[col] → each is an array of fields
        else if (Array.isArray(children[0])) {
          for (const col of children) {
            const found = findFieldById(col, fid);
            if (found) return found;
          }
        }

        // Handle regular flat children (just in case)
        else {
          const found = findFieldById(children, fid);
          if (found) return found;
        }
      }

      // Handle Tabs: node.tabs → each tab has children array  
      if (Array.isArray(node.tabs)) {
        for (const tab of node.tabs) {
          const found = findFieldById(tab.children, fid);
          if (found) return found;
        }
      }
    }

    return null;
  }

  const selectedField = findFieldById(fields, selectedId);

  // ✅ Update heading
  const handleHeadingChange = (val) => {
    setFields((list) => {
      const hasHeading = list.some((f) => f.type === "heading");
      if (hasHeading) {
        return updateById(list, getHeadingField(list).id, { label: val });
      } else {
        const headingNode = {
          id: "heading-" + Date.now(),
          type: "heading",
          label: val,
        };
        return [headingNode, ...list];
      }
    });
  };

  // Settings modal handlers
  const handleFieldSelect = (fieldId) => {
    setSelectedId(fieldId);
    setIsSettingsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSettingsModalOpen(false);
  };

  // JSON Editor handlers
  const handleOpenJsonEditor = () => {
    setIsJsonEditorOpen(true);
  };

  const handleCloseJsonEditor = () => {
    setIsJsonEditorOpen(false);
  };

  const handleJsonSave = (newFormData, newFolderName) => {
    try {
      // Update the form fields with the new JSON data
      setFields(newFormData);
      
      // Update folder name if changed
      if (newFolderName && newFolderName !== folderName) {
        setFolderName(newFolderName);
      }
      
      // Close the JSON editor
      setIsJsonEditorOpen(false);
      
      // Reset values to sync with new schema
      setValues({});
      
      console.log('Form schema updated from JSON editor:', newFormData);
    } catch (error) {
      console.error('Error applying JSON changes:', error);
    }
  };

  // Column and row management functions
  function removeColumnFromParent(nodes, parentId, colIdx) {
    return nodes.map((n) => {
      if (n.id === parentId && n.type === "columns") {
        return { ...n, children: n.children.filter((_, idx) => idx !== colIdx) };
      }
      let copy = { ...n };
      if (n.type === "columns" && Array.isArray(copy.children)) {
        copy.children = n.children.map((colArr) =>
          removeColumnFromParent(colArr, parentId, colIdx)
        );
      } else if (n.type === "table" && Array.isArray(copy.children)) {
        copy.children = n.children.map((rowArr) =>
          rowArr.map((cellArr) =>
            removeColumnFromParent(cellArr, parentId, colIdx)
          )
        );
      } else if (n.type === "tabs" && Array.isArray(n.tabs)) {
        copy.tabs = n.tabs.map((tab) => ({
          ...tab,
          children: removeColumnFromParent(tab.children, parentId, colIdx)
        }));
      } else if (Array.isArray(copy.children)) {
        copy.children = removeColumnFromParent(copy.children, parentId, colIdx);
      }
      return copy;
    });
  }

  const handleDeleteColumn = (parentId, colIdx) => {
    setFields((oldFields) =>
      removeColumnFromParent(oldFields, parentId, colIdx)
    );
    if (selectedField && selectedField.parentId === parentId) {
      setSelectedId(null);
    }
  };

  function removeTableColumn(nodes, parentId, colIdx) {
    return nodes.map((n) => {
      if (n.id === parentId && n.type === "table") {
        const newChildren = n.children.map((rowArr) =>
          rowArr.filter((_, c) => c !== colIdx)
        );
        return { ...n, cols: n.cols - 1, children: newChildren };
      }
      let copy = { ...n };
      if (n.type === "columns" && Array.isArray(copy.children)) {
        copy.children = copy.children.map((colArr) =>
          removeTableColumn(colArr, parentId, colIdx)
        );
      } else if (n.type === "table" && Array.isArray(copy.children)) {
        copy.children = n.children.map((rowArr) =>
          rowArr.map((cellArr) =>
            removeTableColumn(cellArr, parentId, colIdx)
          )
        );
      } else if (n.type === "tabs" && Array.isArray(n.tabs)) {
        copy.tabs = n.tabs.map((tab) => ({
          ...tab,
          children: removeTableColumn(tab.children, parentId, colIdx)
        }));
      } else if (Array.isArray(copy.children)) {
        copy.children = removeTableColumn(copy.children, parentId, colIdx);
      }
      return copy;
    });
  }

  const handleDeleteTableColumn = (parentId, colIdx) =>
    setFields((old) => removeTableColumn(old, parentId, colIdx));

  function removeTableRow(nodes, parentId, rowIdx) {
    return nodes.map((n) => {
      if (n.id === parentId && n.type === "table") {
        const newChildren = n.children.filter((_, r) => r !== rowIdx);
        return { ...n, rows: n.rows - 1, children: newChildren };
      }
      let copy = { ...n };
      if (n.type === "columns" && Array.isArray(copy.children)) {
        copy.children = copy.children.map((colArr) =>
          removeTableRow(colArr, parentId, rowIdx)
        );
      } else if (n.type === "table" && Array.isArray(copy.children)) {
        copy.children = n.children.map((rowArr) =>
          rowArr.map((cellArr) =>
            removeTableRow(cellArr, parentId, rowIdx)
          )
        );
      } else if (n.type === "tabs" && Array.isArray(n.tabs)) {
        copy.tabs = n.tabs.map((tab) => ({
          ...tab,
          children: removeTableRow(tab.children, parentId, rowIdx)
        }));
      } else if (Array.isArray(copy.children)) {
        copy.children = removeTableRow(copy.children, parentId, rowIdx);
      }
      return copy;
    });
  }

  const handleDeleteTableRow = (parentId, rowIdx) =>
    setFields((old) => removeTableRow(old, parentId, rowIdx));

  function insertColumn(nodes, parentId, colIdx) {
    return nodes.map((n) => {
      if (n.id === parentId && n.type === "columns") {
        const newChildren = [...n.children];
        newChildren.splice(colIdx + 1, 0, []);
        return { ...n, cols: n.cols + 1, children: newChildren };
      }
      let copy = { ...n };
      if (Array.isArray(copy.children)) {
        if (n.type === "columns") {
          copy.children = n.children.map((colArr) =>
            insertColumn(colArr, parentId, colIdx)
          );
        } else if (n.type === "table") {
          copy.children = n.children.map((rowArr) =>
            rowArr.map((cellArr) => insertColumn(cellArr, parentId, colIdx))
          );
        }
      }
      return copy;
    });
  }

  const handleAddColumn = (parentId, colIdx) => {
    setFields((old) => insertColumn(old, parentId, colIdx));
  };

  // Loading & Error states for edit mode
  if (isEditMode && loading) return <div style={{ padding: 20 }}>⏳ Loading form...</div>;
  if (isEditMode && error) return <div style={{ padding: 20, color: "red" }}>⚠️ {error}</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        {/* Form Config Header */}
        <div className="form-config-header">
          <div className="form-config-container">
            <div className="form-config-title">
              <h2>{isEditMode ? '✏️ Edit Form' : '🎨 Smartfactory Form Builder'}</h2>
              <p>{isEditMode ? 'Modify your existing form' : 'Create forms with drag & drop'}</p>
            </div>
            
            <div className="form-config-fields">
              <div className="form-field">
                <label>Form Name *</label>
                <input
                  className="form-input"
                  type="text"
                  value={heading}
                  placeholder="Enter your form name..."
                  onChange={(e) => handleHeadingChange(e.target.value)}
                />
              </div>
              
              <div className="form-field">
                <label>Folder Name *</label>
                <div className="folder-input-wrapper">
                  <FolderAutocomplete
                    value={folderName}
                    onChange={(value) => setFolderName(value)}
                    options={folderOptions}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {!heading.trim() && (
            <div className="form-warning">
              <span className="warning-icon">⚠️</span>
              Please enter a form name before adding any fields
            </div>
          )}
        </div>

        <div className="builder-container" style={{ opacity: heading.trim() ? 1 : 0.4, pointerEvents: heading.trim() ? "auto" : "none" }}>
          <div className="palette">
            <Palette onAdd={handleAdd} />
          </div>
          <div className="canvas">
            <Canvas
              fields={fields}
              onDrop={handleAdd}
              onSelect={handleFieldSelect}
              onDelete={deleteField}
              onMove={moveField}
              handleDeleteColumn={handleDeleteColumn}
              handleDeleteTableColumn={handleDeleteTableColumn}
              handleDeleteTableRow={handleDeleteTableRow}
              onAddColumn={handleAddColumn}
              onUpdateField={updateField}
            />
          </div>
        </div>
        
        {/* JSON Editor Section */}
        <div style={{ marginTop: "12rem", marginBottom: "2rem" }}>
          <div className="card card-preview" style={{
            background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)",
            border: "2px solid #c7d2fe",
            transition: "all 0.3s ease"
          }}>
            <div className="card-inner">
              <div className="card-title-group">
                <div className="card-title">
                  <h6 className="title" style={{ color: "#4f46e5", fontWeight: "600" }}>
                    <i className="ni ni-code me-2 text-primary"></i>
                    JSON Schema Editor
                  </h6>
                  <p className="text-muted small mb-0">
                    Edit your form schema directly in JSON format for advanced customization
                  </p>
                </div>
                <div className="card-tools">
                  <Button
                    size="lg"
                    onClick={handleOpenJsonEditor}
                    disabled={fields.length === 0}
                    className="d-flex align-items-center"
                    style={{
                      background: fields.length > 0 
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                        : "#e5e7eb",
                      border: "none",
                      color: fields.length > 0 ? "white" : "#9ca3af",
                      fontWeight: "600",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "12px",
                      boxShadow: fields.length > 0 
                        ? "0 4px 15px rgba(102, 126, 234, 0.3)" 
                        : "none",
                      transition: "all 0.3s ease",
                      cursor: fields.length > 0 ? "pointer" : "not-allowed"
                    }}
                    onMouseEnter={(e) => {
                      if (fields.length > 0) {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (fields.length > 0) {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.3)";
                      }
                    }}
                  >
                    <i className="ni ni-code me-2"></i>
                    Open JSON Editor
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview - Use different components based on mode */}
        <div>
          {isEditMode ? (
            <EdiPreview
              formId={id}   
              fields={fields}
              values={values}
              onChange={handlePreviewChange}
              folderName={folderName}
            />
          ) : (
            <LivePreview 
              fields={fields} 
              values={values} 
              onChange={handlePreviewChange} 
              folderName={folderName} 
            />
          )}
        </div>
        
        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={handleCloseModal}
          field={selectedField}
          onChange={(props) => updateField(selectedField?.id, props)}
        />

        {/* JSON Editor Modal */}
        <JsonEditorModal
          isOpen={isJsonEditorOpen}
          onClose={handleCloseJsonEditor}
          formData={fields}
          onSave={handleJsonSave}
          folderName={folderName}
        />
      </div>
    </DndProvider>
  );
}

export default UnifiedFormBuilder; 