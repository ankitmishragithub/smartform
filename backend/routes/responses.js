const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const Response = require('../models/Response');
const router = express.Router();

// Delete a response (must come BEFORE other routes to avoid conflicts)
router.delete('/:responseId', async (req, res) => {
  try {
    const { responseId } = req.params;
    
    if (global.usingMongoDB) {
      const deleted = await Response.findByIdAndDelete(responseId);
      if (!deleted) {
        return res.status(404).json({ error: 'Response not found' });
      }
    } else {
      // For fallback data, we need to implement delete functionality
      const response = global.fallbackData.getResponseById(responseId);
      if (!response) {
        return res.status(404).json({ error: 'Response not found' });
      }
      // Remove from memory array
      global.fallbackData.deleteResponse(responseId);
    }
    
    res.json({ success: true, message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

// Submit (no auth required for public forms)
router.post('/', async (req, res) => {
  try {
    const { form, formId, bundleId, submitterName, submitterEmail, answers } = req.body;
    
    // Support both 'form' and 'formId' for backward compatibility
    const actualFormId = form || formId;
    
    if (!actualFormId) {
      return res.status(400).json({ error: 'Form ID is required' });
    }
    
    if (!submitterName || !submitterEmail) {
      return res.status(400).json({ error: 'Submitter name and email are required' });
    }
    
    let resp;
    if (global.usingMongoDB) {
      resp = await Response.create({
        form: actualFormId,
        bundle: bundleId || null,
        filledBy: req.user?.id || null, // Optional user if authenticated
        submitterName: submitterName.trim(),
        submitterEmail: submitterEmail.trim(),
        answers
      });
    } else {
      resp = global.fallbackData.createResponse({
        form: actualFormId,
        bundle: bundleId || null,
        filledBy: req.user?.id || null,
        submitterName: submitterName.trim(),
        submitterEmail: submitterEmail.trim(),
    answers
  });
    }
    
  res.status(201).json(resp);
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Get all responses (for finding submitted forms)
router.get('/', async (req, res) => {
  try {
    let responses;
    if (global.usingMongoDB) {
      responses = await Response.find({})
        .sort({ submittedAt: -1 });
    } else {
      responses = global.fallbackData.getAllResponses();
    }
    res.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Debug endpoint to check response structure (must come before /:responseId)
router.get('/debug/structure', async (req, res) => {
  try {
    let responses;
    if (global.usingMongoDB) {
      responses = await Response.find({}).limit(3);
    } else {
      responses = global.fallbackData.getAllResponses();
    }
    
    const debugInfo = {
      totalResponses: responses.length,
      sampleResponses: responses.map(r => ({
        _id: r._id,
        hasForm: !!r.form,
        hasSubmitterName: !!r.submitterName,
        hasSubmitterEmail: !!r.submitterEmail,
        hasAnswers: !!r.answers,
        answersType: typeof r.answers,
        answersKeys: r.answers ? Object.keys(r.answers) : [],
        submittedAt: r.submittedAt,
        allFields: Object.keys(r.toObject ? r.toObject() : r)
      }))
    };
    
    res.json(debugInfo);
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Debug failed', details: error.message });
  }
});

// Admin: list by form (must come before /:responseId)
router.get('/form/:formId', requireAuth, requireAdmin, async (req, res) => {
  const responses = await Response.find({ form: req.params.formId })
    .populate('filledBy', 'email')
    .sort({ submittedAt: -1 });
  res.json(responses);
});

// Admin: list by bundle (must come before /:responseId)
router.get('/bundle/:bundleId', requireAuth, requireAdmin, async (req, res) => {
  const responses = await Response.find({ bundle: req.params.bundleId })
    .populate('filledBy', 'email')
    .sort({ submittedAt: -1 });
  res.json(responses);
});

// Update a specific response by ID
router.put('/:responseId', async (req, res) => {
  try {
    const { responseId } = req.params;
    const { submitterName, submitterEmail, answers } = req.body;
    
    // Basic validation
    if (submitterName !== undefined && (!submitterName || submitterName.trim() === '')) {
      return res.status(400).json({ error: 'Submitter name cannot be empty' });
    }
    
    if (submitterEmail !== undefined && (!submitterEmail || submitterEmail.trim() === '')) {
      return res.status(400).json({ error: 'Submitter email cannot be empty' });
    }
    
    if (submitterEmail !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(submitterEmail.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }
    
    let response;
    if (global.usingMongoDB) {
      response = await Response.findById(responseId);
      if (!response) {
        return res.status(404).json({ error: 'Response not found' });
      }
      
      // Update the response fields
      if (submitterName !== undefined) response.submitterName = submitterName.trim();
      if (submitterEmail !== undefined) response.submitterEmail = submitterEmail.trim();
      if (answers !== undefined) response.answers = answers;
      
      // Update the timestamp to reflect the edit
      response.submittedAt = new Date();
      
      await response.save();
    } else {
      response = global.fallbackData.getResponseById(responseId);
      if (!response) {
        return res.status(404).json({ error: 'Response not found' });
      }
      
      // Update the response fields for fallback data
      if (submitterName !== undefined) response.submitterName = submitterName.trim();
      if (submitterEmail !== undefined) response.submitterEmail = submitterEmail.trim();
      if (answers !== undefined) response.answers = answers;
      
      // Update the timestamp to reflect the edit
      response.submittedAt = new Date();
      
      // Update in memory - find and replace the response
      const responses = global.fallbackData.getAllResponses();
      const index = responses.findIndex(r => r._id === responseId);
      if (index !== -1) {
        responses[index] = response;
      }
    }
    
    console.log('Updated response:', responseId);
    res.json(response);
  } catch (error) {
    console.error('Error updating response:', error);
    res.status(500).json({ error: 'Failed to update response' });
  }
});

// Get a specific response by ID (must come AFTER specific routes)
router.get('/:responseId', async (req, res) => {
  try {
    const { responseId } = req.params;
    let response;
    
    if (global.usingMongoDB) {
      response = await Response.findById(responseId);
    } else {
      response = global.fallbackData.getResponseById(responseId);
    }
    
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    console.log('Fetching response:', responseId);
    console.log('Response fields:', Object.keys(response.toObject ? response.toObject() : response));
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ error: 'Failed to fetch response' });
  }
});

module.exports = router;
