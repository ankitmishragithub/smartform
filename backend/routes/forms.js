const express = require('express');
const Form = require('../models/Form');
const router = express.Router();

// Helper function to extract folderName from schemaJson
function getFolderNameFromSchema(schemaJson) {
  const folderField = schemaJson?.find(field => field.type === 'folderName');
  return folderField?.label || 'Default';
}

// Helper function to extract all folder names from forms (including parent paths)
async function getAllFolderNames() {
  let forms;
  if (global.usingMongoDB) {
    forms = await Form.find({}, 'schemaJson');
  } else {
    forms = global.fallbackData.getAllForms();
  }
  
  const allPaths = new Set();
  
  forms.forEach(form => {
    const folderName = getFolderNameFromSchema(form.schemaJson);
    if (folderName && folderName !== 'Default') {
      // Add the full path
      allPaths.add(folderName);
      
      // Add all parent paths for nested folders
      const parts = folderName.split('/');
      for (let i = 1; i < parts.length; i++) {
        const parentPath = parts.slice(0, i).join('/');
        if (parentPath.trim()) {
          allPaths.add(parentPath);
        }
      }
    }
  });
  
  return [...allPaths].sort(); // Return sorted array
}

// Create new form
router.post('/', async (req, res) => {
  try {
  const { schemaJson } = req.body;
    console.log('Received form data:', { schemaJson: !!schemaJson });
    
    if (!schemaJson) return res.status(400).json({ error: 'schemaJson is required' });
    
    const folderName = getFolderNameFromSchema(schemaJson);
    console.log('Extracted folderName:', folderName);
    
  const form = await Form.create({ schemaJson });
    console.log('Form created successfully:', form._id);
  res.status(201).json(form);
  } catch (err) {
    console.error('Error creating form:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all forms
router.get('/', async (req, res) => {
  try {
    let forms;
    if (global.usingMongoDB) {
      forms = await Form.find().sort({ createdAt: -1 });
    } else {
      forms = global.fallbackData.getAllForms();
    }
    res.json(forms);
  } catch (err) {
    console.error('Error fetching forms:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// IMPORTANT: Specific routes must come BEFORE generic /:id route

// List all unique folder names
router.get('/folders', async (req, res) => {
  try {
    const folders = await getAllFolderNames();
    res.json(folders);
  } catch (err) {
    console.error('Error fetching folders:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List forms by folder name
router.get('/folder/:folderName', async (req, res) => {
  try {
    const targetFolder = decodeURIComponent(req.params.folderName).trim().toLowerCase();
    console.log('[API] Fetching forms for folder:', targetFolder);
    let forms;
    if (global.usingMongoDB) {
      forms = await Form.find().sort({ createdAt: -1 });
    } else {
      forms = global.fallbackData.getAllForms();
    }
    // Filter forms by folderName extracted from schema (case-insensitive, trimmed)
    const filteredForms = forms.filter(form => {
      const folderName = getFolderNameFromSchema(form.schemaJson).trim().toLowerCase();
      return folderName === targetFolder;
    });
    console.log(`[API] Found ${filteredForms.length} forms in folder '${targetFolder}'`);
    if (filteredForms.length === 0) {
      return res.status(404).json({ error: `No forms found in folder '${targetFolder}'` });
    }
    res.json(filteredForms);
  } catch (err) {
    console.error('Error fetching forms by folder:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single form by ID (this must come AFTER specific routes)
router.get('/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    res.json(form);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE form by ID (for editing)
router.put('/:id', async (req, res) => {
  try {
    const { schemaJson } = req.body;
    console.log('Updating form:', req.params.id, { schemaJson: !!schemaJson });
    
    if (!schemaJson) return res.status(400).json({ error: 'schemaJson is required' });
    
    const folderName = getFolderNameFromSchema(schemaJson);
    console.log('Extracted folderName:', folderName);
    
    const updatedForm = await Form.findByIdAndUpdate(
      req.params.id,
      { schemaJson },
      { new: true } // returns updated doc
    );

    if (!updatedForm) {
      return res.status(404).json({ error: 'Form not found' });
    }

    console.log('Form updated successfully:', updatedForm._id);
    res.json(updatedForm);
  } catch (err) {
    console.error('Error updating form:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a form
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Form.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Form not found' });
    res.json({ success: true, message: 'Form deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
