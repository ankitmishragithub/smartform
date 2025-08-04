// Form tree manipulation utilities
export const formUtils = {
  /**
   * Find a field by ID in a nested form structure
   */
  findFieldById: (nodes, id) => {
    for (const node of nodes) {
      if (node.id === id) return node;
      
      if (Array.isArray(node.children)) {
        if (node.type === "table") {
          for (const row of node.children) {
            for (const cell of row) {
              const found = formUtils.findFieldById(cell, id);
              if (found) return found;
            }
          }
        } else if (node.type === "columns") {
          for (const col of node.children) {
            const found = formUtils.findFieldById(col, id);
            if (found) return found;
          }
        } else {
          const found = formUtils.findFieldById(node.children, id);
          if (found) return found;
        }
      }
    }
    return null;
  },

  /**
   * Remove a field by ID from nested structure
   */
  removeById: (nodes, targetId) => {
    return nodes.reduce((acc, n) => {
      if (n.id === targetId) return acc;

      const copy = { ...n };

      if (Array.isArray(copy.children)) {
        if (copy.type === "table") {
          copy.children = copy.children.map((row) =>
            row.map((cellArr) =>
              Array.isArray(cellArr) ? formUtils.removeById(cellArr, targetId) : cellArr
            )
          );
        } else if (copy.type === "columns") {
          copy.children = copy.children.map((colArr) =>
            formUtils.removeById(colArr, targetId)
          );
        } else {
          copy.children = formUtils.removeById(copy.children, targetId);
        }
      }

      acc.push(copy);
      return acc;
    }, []);
  },

  /**
   * Insert a new field into parent container
   */
  insertIntoParent: (nodes, parentId, row, col, newNode) => {
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
      }
      if (n.type === "columns") {
        return {
          ...n,
          children: n.children.map((colArr) =>
            formUtils.insertIntoParent(colArr, parentId, row, col, newNode)
          ),
        };
      }
      if (n.type === "table") {
        return {
          ...n,
          children: n.children.map((rowArr) =>
            rowArr.map((cellArr) =>
              formUtils.insertIntoParent(cellArr, parentId, row, col, newNode)
            )
          ),
        };
      }
      return n;
    });
  },

  /**
   * Update a field by ID
   */
  updateById: (nodes, fid, props) => {
    return nodes.map((n) => {
      if (n.id === fid) return { ...n, ...props };

      let copy = { ...n };

      if (Array.isArray(copy.children)) {
        if (n.type === "columns") {
          copy.children = n.children.map((colArr) =>
            formUtils.updateById(colArr, fid, props)
          );
        } else if (n.type === "table") {
          copy.children = n.children.map((rowArr) =>
            rowArr.map((cellArr) => formUtils.updateById(cellArr, fid, props))
          );
        }
      }
      return copy;
    });
  },

  /**
   * Get heading field from form structure
   */
  getHeadingField: (fields) => {
    return fields.find(f => f.type === "heading");
  },

  /**
   * Get folder name field from form structure
   */
  getFolderField: (fields) => {
    return fields.find(f => f.type === "folderName");
  },

  /**
   * Get folder name from form structure
   */
  getFolderName: (fields) => {
    const folderField = formUtils.getFolderField(fields);
    return folderField?.label || "Default";
  },

  /**
   * Create a new field node
   */
  createFieldNode: (item, id) => {
    const fieldType = getFieldType(item.type);
    if (!fieldType) {
      throw new Error(`Unknown field type: ${item.type}`);
    }

    const defaults = getDefaultFieldProps(item.type);
    
    return {
      id,
      type: item.type,
      label: item.label || fieldType.label,
      ...defaults
    };
  }
};

// Import centralized field types configuration
import { getFieldType, getDefaultFieldProps } from '../config/fieldTypes';

// Validation utilities
export const validationUtils = {
  isRequired: (field) => field.required === true,
  
  validateField: (field, value) => {
    const errors = [];
    
    if (validationUtils.isRequired(field) && !value) {
      errors.push(`${field.label || 'This field'} is required`);
    }
    
    if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push("Please enter a valid email address");
    }
    
    if (field.type === "number" && value && isNaN(Number(value))) {
      errors.push("Please enter a valid number");
    }
    
    return errors;
  },
  
  validateForm: (fields, values) => {
    const errors = {};
    
    fields.forEach(field => {
      const fieldErrors = validationUtils.validateField(field, values[field.id]);
      if (fieldErrors.length > 0) {
        errors[field.id] = fieldErrors;
      }
    });
    
    return errors;
  }
}; 