export const SECTIONS = [
  {
    name: "📝 Basics",
    fields: [
      { type: "text", label: "📝 Single Line Text", icon: "✏️", description: "Short text input field" },
      { type: "textarea", label: "📄 Multi-line Text", icon: "📄", description: "Large text area for longer content" },
      { type: "number", label: "🔢 Number Input", icon: "🔢", description: "Numeric values only" },
      { type: "password", label: "🔒 Password Field", icon: "🔒", description: "Secure password input" },
      { type: "checkbox", label: "☑️ Single Checkbox", icon: "☑️", description: "True/false option" },
      { type: "select", label: "📋 Dropdown Menu", icon: "📋", description: "Choose one from list" },
      { type: "selectboxes", label: "☑️ Multiple Choice", icon: "☑️", description: "Select multiple options" },
      { type: "radio", label: "⭕ Radio Buttons", icon: "⭕", description: "Choose one option" },

    ],
  },
  {
    name: "🚀 Advanced",
    fields: [
      { type: "email", label: "📧 Email Address", icon: "📧", description: "Validated email input" },
      { type: "url", label: "🌐 Website URL", icon: "🌐", description: "Web address field" },
      { type: "phone", label: "📱 Phone Number", icon: "📱", description: "Phone number with formatting" },
      { type: "tags", label: "🏷️ Tags Input", icon: "🏷️", description: "Add multiple tags" },
      { type: "address", label: "📍 Address Field", icon: "📍", description: "Complete address input" },
      { type: "datetime", label: "📅 Date", icon: "📅", description: "Date picker" },
      { type: "day", label: "📆 Day Picker", icon: "📆", description: "Select specific day" },
      { type: "time", label: "⏰ Time Picker", icon: "⏰", description: "Time selection only" },
      { type: "currency", label: "💰 Money Amount", icon: "💰", description: "Currency input field" },
      { type: "signature", label: "✍️ Digital Signature", icon: "✍️", description: "Signature capture" },
      { type: "file", label: "📎 File Upload", icon: "📎", description: "Upload documents/images" },
    ],
  },
  {
    name: "🎨 Layout",
    fields: [
      { type: "htmlelement", label: "🔧 Custom HTML", icon: "🔧", description: "Raw HTML content" },
      { type: "content", label: "📝 Content Box", icon: "📝", description: "Rich text editor with formatting" },
      { type: "columns", label: "📊 Column Layout", icon: "📊", description: "Side-by-side fields", defaultCols: 2 },
      { type: "table", label: "📋 Table Grid", icon: "📋", description: "Organized in rows/columns", defaultRows: 2, defaultCols: 2 },
      { type: "tabs", label: "📂 Tab Container", icon: "📂", description: "Organize in tabs", defaultTabs: 2 },
      { type: "spreadsheet", label: "📊 Spreadsheet", icon: "📊", description: "Dynamic spreadsheet with multiple sheets", defaultSheets: 1, defaultRows: 5, defaultCols: 5 },
      { type: "jspreadsheet", label: "📈 jSpreadsheet", icon: "📈", description: "Advanced jSpreadsheet ", defaultRows: 3, defaultCols: 4 },
      { type: "well", label: "📦 Well Container", icon: "📦", description: "Bordered content area" },
    ],
  },
];
