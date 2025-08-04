// routes/forms.js
const express = require('express');
const Form = require('../models/Form');
const router = express.Router();

// Helper to extract folder name (fallback to "Default")
function getFolderNameFromSchema(schemaJson) {
  if (!Array.isArray(schemaJson)) return 'Default';
  const folderField = schemaJson.find(f => f.type === 'folderName');
  return (folderField?.label || 'Default').trim() || 'Default';
}

// Compute all folder names including parent segments
async function getAllFolderNames() {
  const forms = await Form.find({}, 'schemaJson').lean();
  const allPaths = new Set();

  forms.forEach(form => {
    const folderName = getFolderNameFromSchema(form.schemaJson);
    if (!folderName || folderName === 'Default') return;
    allPaths.add(folderName);
    const parts = folderName.split('/');
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('/');
      if (parentPath.trim()) allPaths.add(parentPath);
    }
  });

  return [...allPaths].sort();
}

// Create new form
router.post('/', async (req, res) => {
  try {
    const { schemaJson } = req.body;
    if (!schemaJson) return res.status(400).json({ error: 'schemaJson is required' });
    const form = await Form.create({ schemaJson });
    res.status(201).json(form);
  } catch (err) {
    console.error('Error creating form:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all forms
router.get('/', async (req, res) => {
  try {
    const forms = await Form.find().sort({ createdAt: -1 });
    res.json(forms);
  } catch (err) {
    console.error('Error fetching forms:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

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
    const forms = await Form.find().sort({ createdAt: -1 }).lean();
    const filtered = forms.filter(form => {
      const folderName = getFolderNameFromSchema(form.schemaJson).toLowerCase();
      return folderName === targetFolder;
    });
    if (filtered.length === 0) {
      return res.status(404).json({ error: `No forms found in folder '${targetFolder}'` });
    }
    res.json(filtered);
  } catch (err) {
    console.error('Error fetching forms by folder:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single form by ID
router.get('/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    res.json(form);
  } catch (err) {
    console.error('Error fetching form:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update form
router.put('/:id', async (req, res) => {
  try {
    const { schemaJson } = req.body;
    if (!schemaJson) return res.status(400).json({ error: 'schemaJson is required' });
    const updatedForm = await Form.findByIdAndUpdate(
      req.params.id,
      { schemaJson },
      { new: true }
    );
    if (!updatedForm) return res.status(404).json({ error: 'Form not found' });
    res.json(updatedForm);
  } catch (err) {
    console.error('Error updating form:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete form
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Form.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Form not found' });
    res.json({ success: true, message: 'Form deleted successfully' });
  } catch (err) {
    console.error('Error deleting form:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
