// src/config/fieldConfig.js
export const fieldConfig = {
  // Basic
  text: {
    category: 'Basic',
    editors: ['Label','Placeholder','MaxLength'],
    defaults: {
      label: 'Text Field',
      placeholder: 'Enter text here...',
      maxLength: 255
    }
  },
  textarea: {
    category: 'Basic',
    editors: ['Label','Placeholder','Rows','MaxLength'],
    defaults: {
      label: 'Text Area',
      placeholder: 'Enter your text here...',
      rows: 4,
      maxLength: 1000
    }
  },
  number: {
    category: 'Basic',
    editors: ['Label','Placeholder','Min','Max','Step'],
    defaults: {
      label: 'Number Field',
      placeholder: 'Enter a number...',
      min: 0,
      max: 100,
      step: 1
    }
  },
  password: {
    category: 'Basic',
    editors: ['Label','Key','Pattern','MinLength'],
    defaults: {
      label: 'Password',
      key: 'password',
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$',
      minLength: 8
    }
  },
  checkbox: {
    category: 'Basic',
    editors: ['Label','Key'],
    defaults: {
      label: 'Checkbox',
      key: 'checkbox'
    }
  },
  select: {
    category: 'Basic',
    editors: ['Label','Key','Options','Multiple'],
    defaults: {
      label: 'Select Option',
      key: 'selectField',
      options: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' }
      ],
      multiple: false
    }
  },
  selectboxes: {
    category: 'Basic',
    editors: ['Label','Key','Options','Multiple'],
    defaults: {
      label: 'Select Multiple',
      key: 'selectBoxes',
      options: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' }
      ],
      multiple: true
    }
  },
  radio: {
    category: 'Basic',
    editors: ['Label','Key','Options'],
    defaults: {
      label: 'Radio Buttons',
      key: 'radioGroup',
      options: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' }
      ]
    }
  },



  // Advanced
  email: {
    category: 'Advanced',
    editors: ['Label','Key','EmailValidation'],
    defaults: {
      label: 'Email Address',
      key: 'email',
      emailValidation: true
    }
  },
  url: {
    category: 'Advanced',
    editors: ['Label','Key','URLValidation'],
    defaults: {
      label: 'Website URL',
      key: 'url',
      urlValidation: true
    }
  },
  phone: {
    category: 'Advanced',
    editors: ['Label','Key','PhoneMask','MaxLength'],
    defaults: {
      label: 'Phone Number',
      key: 'phone',
      phoneMask: '(999) 999-9999',
      maxLength: 20
    }
  },
  tags: {
    category: 'Advanced',
    editors: ['Label','Key','Tags'],
    defaults: {
      label: 'Tags',
      key: 'tags',
      tags: []
    }
  },
  address: {
    category: 'Advanced',
    editors: ['Label','Key','Autocomplete'],
    defaults: {
      label: 'Address',
      key: 'address',
      autocomplete: true
    }
  },
  datetime: {
    category: 'Advanced',
    editors: ['Label','Key','DateTime'],
    defaults: {
      label: 'Date',
      key: 'datetime',
      dateTime: {
        format: 'YYYY-MM-DD',
        enableTime: false
      }
    }
  },
  day: {
    category: 'Advanced',
    editors: ['Label','Key','Date'],
    defaults: {
      label: 'Date',
      key: 'date',
      date: {
        format: 'YYYY-MM-DD',
        enableTime: false
      }
    }
  },
  time: {
    category: 'Advanced',
    editors: ['Label','Key','Time'],
    defaults: {
      label: 'Time',
      key: 'time',
      defaultValue: new Date().toTimeString().slice(0, 5), // HH:mm format
      time: {
        format: 'HH:mm',
        enableSeconds: false
      }
    }
  },
  currency: {
    category: 'Advanced',
    editors: ['Label','Key','Currency'],
    defaults: {
      label: 'Amount',
      key: 'currency',
      currency: {
        symbol: '$',
        decimalPlaces: 2,
        thousandSeparator: ','
      }
    }
  },
  signature: {
    category: 'Advanced',
    editors: ['Label','Key','Signature'],
    defaults: {
      label: 'Signature',
      key: 'signature',
      signature: {
        width: 400,
        height: 200,
        penColor: '#000000'
      }
    }
  },

  // Layout
  htmlelement: {
    category: 'Layout',
    editors: ['RawHTML'],
    defaults: {
      rawHTML: '<div class="custom-html">Custom HTML Content</div>'
    }
  },
  content: {
    category: 'Layout',
    editors: ['Label','RichText'],
    defaults: {
      label: 'Content Box',
      richText: '<p>Enter your formatted content here...</p>'
    }
  },
  columns: {
    category: 'Layout',
    editors: ['Columns','Gap'],
    defaults: {
      columns: 2,
      gap: '20px'
    }
  },
  fieldset: {
    category: 'Layout',
    editors: ['Label','Collapsible'],
    defaults: {
      label: 'Field Group',
      collapsible: false
    }
  },
  panel: {
    category: 'Layout',
    editors: ['Label','Collapsible'],
    defaults: {
      label: 'Panel',
      collapsible: true
    }
  },
  table: {
    category: 'Layout',
    editors: ['Rows','Columns','Gap'],
    defaults: {
      rows: 3,
      columns: 3,
      gap: '10px'
    }
  },
  tabs: {
    category: 'Layout',
    editors: ['Label','Labels','Default'],
    defaults: {
      label: 'Tabs',
      labels: ['Tab 1', 'Tab 2', 'Tab 3'],
      default: 0
    }
  },
  well: {
    category: 'Layout',
    editors: ['Label','Style'],
    defaults: {
      label: 'Well Container',
      style: 'default'
    }
  },

  // Data
  hidden: {
    category: 'Data',
    editors: ['Label','Key','DefaultValue','Conditional'],
    defaults: {
      label: 'Hidden Field',
      key: 'hiddenField',
      defaultValue: '',
      conditional: false
    }
  },
  container: {
    category: 'Data',
    editors: ['Label','Key','Repeatable'],
    defaults: {
      label: 'Container',
      key: 'container',
      repeatable: false
    }
  },
  datamap: {
    category: 'Data',
    editors: ['Label','Key','Mappings'],
    defaults: {
      label: 'Data Mapping',
      key: 'dataMap',
      mappings: {}
    }
  },
  datagrid: {
    category: 'Data',
    editors: ['Label','Key','Columns','InlineEdit','PageSize'],
    defaults: {
      label: 'Data Grid',
      key: 'dataGrid',
      columns: ['Column 1', 'Column 2', 'Column 3'],
      inlineEdit: false,
      pageSize: 10
    }
  },
  editgrid: {
    category: 'Data',
    editors: ['Label','Key','Columns','InlineEdit','PageSize'],
    defaults: {
      label: 'Editable Grid',
      key: 'editGrid',
      columns: ['Column 1', 'Column 2', 'Column 3'],
      inlineEdit: true,
      pageSize: 10
    }
  },

  // Premium
  file: {
    category: 'Premium',
    editors: ['Label','Key','Types','Size'],
    defaults: {
      label: 'File Upload',
      key: 'fileUpload',
      types: ['image/*', 'application/pdf'],
      size: 5242880 // 5MB
    }
  }
};
