import { fieldConfig } from '../settingsConfig';

/**
 * Get default values for a specific field type
 * @param {string} fieldType - The type of field (e.g., 'text', 'email', 'select')
 * @returns {object} Default values for the field
 */
export const getFieldDefaults = (fieldType) => {
  const config = fieldConfig[fieldType];
  if (!config) {
    console.warn(`Field type '${fieldType}' not found in configuration`);
    return {};
  }
  return config.defaults || {};
};

/**
 * Create a new field with default values
 * @param {string} fieldType - The type of field
 * @param {object} customValues - Custom values to override defaults
 * @returns {object} Complete field configuration
 */
export const createFieldWithDefaults = (fieldType, customValues = {}) => {
  const defaults = getFieldDefaults(fieldType);
  const config = fieldConfig[fieldType];
  
  if (!config) {
    throw new Error(`Field type '${fieldType}' not found in configuration`);
  }

  // Merge defaults with custom values
  const fieldData = {
    type: fieldType,
    category: config.category,
    editors: config.editors,
    ...defaults,
    ...customValues
  };

  // Generate unique key if not provided
  if (!fieldData.key) {
    fieldData.key = `${fieldType}_${Date.now()}`;
  }

  return fieldData;
};

/**
 * Get all available field types
 * @returns {array} Array of field type objects with category info
 */
export const getAvailableFieldTypes = () => {
  return Object.entries(fieldConfig).map(([type, config]) => ({
    type,
    category: config.category,
    label: config.defaults?.label || type,
    editors: config.editors
  }));
};

/**
 * Get field types by category
 * @param {string} category - Category name (Basic, Advanced, Layout, Data, Premium)
 * @returns {array} Array of field types in the specified category
 */
export const getFieldTypesByCategory = (category) => {
  return Object.entries(fieldConfig)
    .filter(([_, config]) => config.category === category)
    .map(([type, config]) => ({
      type,
      label: config.defaults?.label || type,
      editors: config.editors
    }));
};

/**
 * Validate field configuration
 * @param {object} field - Field configuration to validate
 * @returns {object} Validation result with isValid and errors
 */
export const validateField = (field) => {
  const errors = [];
  
  if (!field.type) {
    errors.push('Field type is required');
  }
  
  if (!fieldConfig[field.type]) {
    errors.push(`Invalid field type: ${field.type}`);
  }
  
  if (!field.label) {
    errors.push('Field label is required');
  }
  
  if (!field.key) {
    errors.push('Field key is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get field configuration for a specific field type
 * @param {string} fieldType - The type of field
 * @returns {object} Complete field configuration
 */
export const getFieldConfig = (fieldType) => {
  return fieldConfig[fieldType] || null;
};

/**
 * Get all categories
 * @returns {array} Array of category names
 */
export const getCategories = () => {
  const categories = new Set();
  Object.values(fieldConfig).forEach(config => {
    categories.add(config.category);
  });
  return Array.from(categories);
};

/**
 * Example usage functions
 */
export const examples = {
  // Create a text field with defaults
  createTextField: () => createFieldWithDefaults('text'),
  
  // Create an email field with custom label
  createEmailField: () => createFieldWithDefaults('email', {
    label: 'Contact Email',
    key: 'contactEmail'
  }),
  
  // Create a select field with custom options
  createSelectField: () => createFieldWithDefaults('select', {
    label: 'Department',
    key: 'department',
    options: [
      { label: 'Engineering', value: 'engineering' },
      { label: 'Marketing', value: 'marketing' },
      { label: 'Sales', value: 'sales' },
      { label: 'HR', value: 'hr' }
    ]
  }),
  
  // Create a number field with custom range
  createNumberField: () => createFieldWithDefaults('number', {
    label: 'Age',
    key: 'age',
    min: 18,
    max: 100
  })
}; 