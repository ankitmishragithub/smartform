import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardBody, 
  Badge, 
  Button, 
  Spinner
} from 'reactstrap';
import './SimpleDragDropTree.css';

const ItemTypes = {
  FORM: 'form'
};

// Draggable Form Item
const DraggableForm = ({ form, folderPath, onMoveForm }) => {
  const navigate = useNavigate();
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FORM,
    item: { 
      formId: form._id,
      formName: form.heading,
      currentFolder: folderPath
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div 
      ref={drag}
      className={`draggable-form ${isDragging ? 'dragging' : ''}`}
    >
      <Card className="form-card">
        <CardBody>
          <div className="d-flex flex-column">
            <div className="d-flex align-items-center mb-2">
              <i className="ni ni-file-docs me-2 text-success"></i>
              <span className="flex-grow-1 fw-bold">{form.name}</span>
              <Badge color="secondary" size="sm">Form</Badge>
            </div>
            
            {/* Action Buttons */}
            <div className="d-flex gap-1">
              <Button
                color="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`${process.env.PUBLIC_URL}/forms/fill/${form._id}`);
                }}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                <i className="ni ni-play me-1"></i>
                Fill
              </Button>
              <Button
                color="outline-secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`${process.env.PUBLIC_URL}/formBuilder/${form._id}`);
                }}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                <i className="ni ni-edit me-1"></i>
                Edit
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

// Droppable Folder Item
const DroppableFolder = ({ 
  folder, 
  forms, 
  level = 0, 
  onMoveForm, 
  onToggleFolder, 
  expandedFolders,
  isMoving 
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.FORM,
    drop: (item) => {
      if (item.currentFolder !== folder.path) {
        onMoveForm(item.formId, item.currentFolder, folder.path);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isExpanded = expandedFolders.has(folder.path);
  const folderForms = forms.filter(form => form.folderPath === folder.path);
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div className={`folder-item level-${level}`}>
      <div
        ref={drop}
        className={`droppable-folder ${isOver && canDrop ? 'drop-target' : ''}`}
      >
        <Card className="folder-card">
          <CardBody>
            <div className="d-flex align-items-center">
              {/* Expand/Collapse Button */}
              <div style={{ width: '24px', marginRight: '8px' }}>
                {(hasChildren || folderForms.length > 0) && (
                  <Button
                    color="link"
                    size="sm"
                    className="p-0"
                    onClick={() => onToggleFolder(folder.path)}
                    disabled={isMoving}
                  >
                    <i className={`ni ${isExpanded ? 'ni-chevron-down' : 'ni-chevron-right'}`}></i>
                  </Button>
                )}
              </div>
              
              {/* Folder Icon and Name */}
              <i 
                className="ni ni-folder me-2" 
                style={{ 
                  color: level === 0 ? '#007bff' : level === 1 ? '#28a745' : '#ffc107',
                  fontSize: '1.1rem'
                }}
              ></i>
              <span className="flex-grow-1 folder-name">{folder.name}</span>
              
              {/* Stats */}
              <div className="d-flex align-items-center gap-1">
                {folderForms.length > 0 && (
                  <Badge color="primary" size="sm">
                    {folderForms.length}
                  </Badge>
                )}
                {hasChildren && (
                  <Badge color="info" size="sm">
                    +{folder.children.length}
                  </Badge>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="folder-content">
          {/* Child Folders First */}
          {hasChildren && folder.children.map(childFolder => (
            <DroppableFolder
              key={childFolder.path}
              folder={childFolder}
              forms={forms}
              level={level + 1}
              onMoveForm={onMoveForm}
              onToggleFolder={onToggleFolder}
              expandedFolders={expandedFolders}
              isMoving={isMoving}
            />
          ))}
          
          {/* Forms in this folder */}
          {folderForms.map(form => (
            <DraggableForm
              key={form._id}
              form={form}
              folderPath={folder.path}
              onMoveForm={onMoveForm}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
const SimpleDragDropTree = ({ 
  folders = [], 
  forms = [], 
  onMoveForm,
  isLoading = false 
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [isMoving, setIsMoving] = useState(false);

  const handleToggleFolder = (folderPath) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const handleMoveForm = async (formId, fromFolder, toFolder) => {
    setIsMoving(true);
    try {
      await onMoveForm(formId, fromFolder, toFolder);
    } finally {
      setIsMoving(false);
    }
  };

  const handleExpandAll = () => {
    const allPaths = new Set();
    const collectPaths = (folderList) => {
      folderList.forEach(folder => {
        allPaths.add(folder.path);
        if (folder.children) {
          collectPaths(folder.children);
        }
      });
    };
    collectPaths(folders);
    setExpandedFolders(allPaths);
  };

  const handleCollapseAll = () => {
    setExpandedFolders(new Set());
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Spinner color="primary" />
        <p className="mt-2 text-muted">Loading folders...</p>
      </div>
    );
  }

  return (
    <div className="simple-drag-drop-tree">
      {/* Controls */}
      <div className="tree-controls">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="ni ni-move me-2"></i>
            Drag & Drop Forms
          </h6>
          <div>
            <Button
              color="outline-secondary"
              size="sm"
              onClick={handleExpandAll}
              className="me-2"
              disabled={isMoving}
            >
              <i className="ni ni-plus-square me-1"></i>
              Expand All
            </Button>
            <Button
              color="outline-secondary"
              size="sm"
              onClick={handleCollapseAll}
              disabled={isMoving}
            >
              <i className="ni ni-minus-square me-1"></i>
              Collapse All
            </Button>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isMoving && (
        <div className="moving-overlay">
          <div className="moving-indicator">
            <Spinner size="sm" />
            <span className="ms-2">Moving form...</span>
          </div>
        </div>
      )}

      {/* Tree Content */}
      <div className="tree-content">
        {folders.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="ni ni-folder" style={{ fontSize: '2rem' }}></i>
            <p className="mt-2">No folders available</p>
          </div>
        ) : (
          folders.map(folder => (
            <DroppableFolder
              key={folder.path}
              folder={folder}
              forms={forms}
              onMoveForm={handleMoveForm}
              onToggleFolder={handleToggleFolder}
              expandedFolders={expandedFolders}
              isMoving={isMoving}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SimpleDragDropTree; 