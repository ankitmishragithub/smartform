/**
 * Centralized configuration for all form field types
 * This eliminates duplication and makes field management consistent
 */

export const fieldTypes = {
  // Basic Input Fields
  text: {
    type: "text",
    label: "Text Input",
    icon: "text-paragraph",
    placeholderByDefault: true,
    component: "input",
    category: "basic"
  },
  email: {
    type: "email",
    label: "Email Input",
    icon: "envelope",
    placeholderByDefault: true,
    component: "input",
    category: "basic"
  },
  number: {
    type: "number",
    label: "Number Input",
    icon: "hash",
    placeholderByDefault: true,
    component: "input",
    category: "basic"
  },
  password: {
    type: "password",
    label: "Password Input",
    icon: "lock",
    placeholderByDefault: true,
    component: "input",
    category: "basic"
  },
  url: {
    type: "url",
    label: "URL Input",
    icon: "link",
    placeholderByDefault: true,
    component: "input",
    category: "basic"
  },

  // Multi-line Input
  textarea: {
    type: "textarea",
    label: "Text Area",
    icon: "file-text",
    placeholderByDefault: true,
    component: "textarea",
    category: "basic"
  },

  // Advanced Fields
  phone: {
    type: "phone",
    label: "Phone Number",
    icon: "phone",
    placeholderByDefault: true,
    component: "input",
    category: "advanced"
  },
  datetime: {
    type: "datetime",
    label: "Date",
    icon: "calendar",
    component: "datetime",
    category: "advanced"
  },
  day: {
    type: "day",
    label: "Date",
    icon: "calendar",
    component: "date",
    category: "advanced"
  },
  time: {
    type: "time",
    label: "Time",
    icon: "clock",
    component: "time",
    category: "advanced"
  },
  signature: {
    type: "signature",
    label: "Digital Signature",
    icon: "pen-tool",
    component: "signature",
    category: "advanced"
  },
  rating: {
    type: "rating",
    label: "Rating",
    icon: "star",
    component: "rating",
    category: "advanced"
  },
  slider: {
    type: "slider",
    label: "Slider",
    icon: "sliders",
    component: "slider",
    category: "advanced"
  },
  color: {
    type: "color",
    label: "Color Picker",
    icon: "palette",
    component: "color",
    category: "advanced"
  },




  // Selection Fields
  select: {
    type: "select",
    label: "Dropdown",
    icon: "chevron-down",
    optionsByDefault: true,
    component: "select",
    category: "selection"
  },
  radio: {
    type: "radio",
    label: "Radio Buttons",
    icon: "circle",
    optionsByDefault: true,
    component: "radio",
    category: "selection"
  },
  checkbox: {
    type: "checkbox",
    label: "Checkbox",
    icon: "check-square",
    component: "checkbox",
    category: "selection"
  },
  selectboxes: {
    type: "selectboxes",
    label: "Multiple Checkboxes",
    icon: "list-check",
    optionsByDefault: true,
    component: "selectboxes",
    category: "selection"
  },

  // Layout Components
  columns: {
    type: "columns",
    label: "Columns Layout",
    icon: "columns",
    defaultCols: 2,
    component: "columns",
    category: "layout"
  },
  table: {
    type: "table",
    label: "Table Layout",
    icon: "table",
    defaultRows: 2,
    defaultCols: 2,
    component: "table",
    category: "layout"
  },
  tabs: {
    type: "tabs",
    label: "Tabs Layout",
    icon: "layout-tabs",
    defaultTabs: 2,
    component: "tabs",
    category: "layout"
  },
  spreadsheet: {
    type: "spreadsheet",
    label: "Spreadsheet",
    icon: "grid-3x3",
    defaultSheets: 1,
    defaultRows: 5,
    defaultCols: 5,
    component: "spreadsheet",
    category: "layout"
  },
  well: {
    type: "well",
    label: "Well Container",
    icon: "box",
    component: "well",
    category: "layout"
  },
  content: {
    type: "content",
    label: "Content Box",
    icon: "file-text",
    component: "content",
    category: "layout"
  },

  // Special Fields
  heading: {
    type: "heading",
    label: "Form Heading",
    icon: "type-h1",
    component: "heading",
    category: "special"
  }
};

// Field categories for organization
export const fieldCategories = {
  basic: {
    label: "Basic Fields",
    description: "Simple input fields",
    fields: ["text", "email", "number", "password", "url", "textarea"]
  },
  selection: {
    label: "Selection Fields",
    description: "Fields for choosing options",
    fields: ["select", "radio", "checkbox", "selectboxes"]
  },
  layout: {
    label: "Layout Components", 
    description: "Structural components",
    fields: ["columns", "table", "tabs", "spreadsheet", "well", "content"]
  },
  advanced: {
    label: "Advanced Fields",
    description: "Advanced input fields",
    fields: ["phone", "datetime", "day", "time", "signature"]
  },
  special: {
    label: "Special Fields",
    description: "Special purpose fields",
    fields: ["heading"]
  }
};

// Get field type by type name
export const getFieldType = (typeName) => {
  return fieldTypes[typeName] || null;
};

// Get all field types
export const getAllFieldTypes = () => {
  return Object.values(fieldTypes);
};

// Get field types by category
export const getFieldTypesByCategory = (category) => {
  return fieldCategories[category]?.fields.map(type => fieldTypes[type]) || [];
};

// Get all categories
export const getAllCategories = () => {
  return Object.keys(fieldCategories).map(key => ({
    key,
    ...fieldCategories[key]
  }));
};

// Default field properties
export const getDefaultFieldProps = (type) => {
  const fieldType = getFieldType(type);
  if (!fieldType) return {};

  const defaults = {
    required: false,
    label: fieldType.label,
    placeholder: fieldType.placeholderByDefault ? "" : undefined,
    options: fieldType.optionsByDefault ? ["Option 1", "Option 2"] : undefined
  };

  // Add default values for date/time fields
  if (type === "datetime") {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    defaults.value = `${year}-${month}-${day}`;
  } else if (type === "day") {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const now = new Date();
    defaults.value = weekdays[now.getDay()];
  } else if (type === "time") {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    defaults.value = `${hours}:${minutes}`;
  } else if (type === "well") {
    defaults.label = "Content Box";
    defaults.children = [];
  } else if (type === "content") {
    defaults.label = "Content Box";
    defaults.richText = '<p>Enter your formatted content here...</p>';
  }



  // Add layout-specific defaults
  if (type === "columns") {
    defaults.cols = fieldType.defaultCols;
    defaults.children = Array.from({ length: fieldType.defaultCols }, () => []);
  } else if (type === "table") {
    defaults.rows = fieldType.defaultRows;
    defaults.cols = fieldType.defaultCols;
    defaults.children = Array.from({ length: fieldType.defaultRows }, () =>
      Array.from({ length: fieldType.defaultCols }, () => [])
    );
  } else if (type === "tabs") {
    defaults.activeTab = 0;
    defaults.tabs = Array.from({ length: fieldType.defaultTabs }, (_, i) => ({
      name: `Tab ${i + 1}`,
      children: []
    }));
  } else if (type === "spreadsheet") {
    const getDefaultFormatting = () => ({
      // Font Group
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      bold: false,
      italic: false,
      underline: 'none',
      strikethrough: false,
      textTransform: 'none',
      fontWeight: 'normal',
      color: '#000000',
      backgroundColor: '#ffffff',
      
      // Alignment Group
      textAlign: 'left',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
      textOrientation: 0,
      paddingLeft: 0,
      
      // Number Group
      numberFormat: 'general',
      decimalPlaces: 2,
      currencySymbol: '$',
      
      // Styles Group
      conditionalFormatting: null
    });

    defaults.sheets = Array.from({ length: fieldType.defaultSheets }, (_, i) => ({
      name: `Sheet ${i + 1}`,
      rows: fieldType.defaultRows,
      cols: fieldType.defaultCols,
      headers: Array.from({ length: fieldType.defaultCols }, (_, j) => `Column ${j + 1}`),
      data: Array.from({ length: fieldType.defaultRows }, () =>
        Array.from({ length: fieldType.defaultCols }, () => ({
          content: '',
          formatting: getDefaultFormatting()
        }))
      ),
      mergedCells: [],
      activeSheet: 0
    }));
  }

  return defaults;
}; 