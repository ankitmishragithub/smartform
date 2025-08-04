const mongoose = require('mongoose');

const BundleSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  forms:       [{ type: mongoose.ObjectId, ref: 'Form' }],
  shareLink:   { type: String, unique: true },
  createdBy:   { type: mongoose.ObjectId, ref: 'User' },
  sharedWith:  [{ type: mongoose.ObjectId, ref: 'User' }],
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bundle', BundleSchema);
