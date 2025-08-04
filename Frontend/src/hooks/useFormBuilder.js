import { useState, useCallback } from 'react';
import { formUtils, validationUtils } from '../utils/formUtils';

/**
 * Custom hook for form builder functionality
 * Manages form state, field operations, and validation
 */
export const useFormBuilder = (initialFields = []) => {
  const [fields, setFields] = useState(initialFields);
  const [selectedId, setSelectedId] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  // Get heading field
  const headingField = formUtils.getHeadingField(fields);
  const heading = headingField?.label || "";

  // Handle field value changes
  const handleValueChange = useCallback((id, value) => {
    setValues(prev => ({ ...prev, [id]: value }));
    
    // Clear validation error when user starts typing
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  }, [errors]);

  // Add new field
  const addField = useCallback((item, parentId = null, row = null, col = null) => {
    if (!heading.trim()) {
      alert("⚠️ Please enter a heading before adding fields!");
      return;
    }

    const id = Date.now().toString();
    const node = formUtils.createFieldNode(item, id);

    setFields(list => {
      if (!parentId) return [...list, node];
      return formUtils.insertIntoParent(list, parentId, row, col, node);
    });
  }, [heading]);

  // Delete field
  const deleteField = useCallback((id) => {
    setFields(old => formUtils.removeById(old, id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  // Update field properties
  const updateField = useCallback((id, props) => {
    setFields(list => formUtils.updateById(list, id, props));
  }, []);

  // Move field
  const moveField = useCallback((fromIndex, toIndex) => {
    setFields(f => {
      const newFields = [...f];
      const [movedField] = newFields.splice(fromIndex, 1);
      newFields.splice(toIndex, 0, movedField);
      return newFields;
    });
  }, []);

  // Find field by ID
  const findField = useCallback((id) => {
    return formUtils.findFieldById(fields, id);
  }, [fields]);

  // Select field
  const selectField = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    const validationErrors = validationUtils.validateForm(fields, values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [fields, values]);

  // Initialize form values
  const initializeValues = useCallback(() => {
    const initialValues = {};
    fields.forEach(field => {
      if (field.type === "checkbox") {
        initialValues[field.id] = false;
      } else if (field.type === "selectboxes") {
        initialValues[field.id] = [];
      } else {
        initialValues[field.id] = "";
      }
    });
    setValues(initialValues);
  }, [fields]);

  // Reset form
  const resetForm = useCallback(() => {
    setFields([]);
    setSelectedId(null);
    setValues({});
    setErrors({});
  }, []);

  // Load form data
  const loadForm = useCallback((formData) => {
    if (formData.schemaJson) {
      setFields(formData.schemaJson);
      initializeValues();
    }
  }, [initializeValues]);

  // Get form data for saving
  const getFormData = useCallback(() => ({
    schemaJson: fields,
    heading: heading
  }), [fields, heading]);

  return {
    // State
    fields,
    selectedId,
    values,
    errors,
    heading,
    
    // Actions
    addField,
    deleteField,
    updateField,
    moveField,
    selectField,
    handleValueChange,
    validateForm,
    resetForm,
    loadForm,
    getFormData,
    findField,
    initializeValues
  };
}; 