const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  form:         { type: mongoose.ObjectId, ref: 'Form', required: true },
  bundle:       { type: mongoose.ObjectId, ref: 'Bundle' },
  filledBy:     { type: mongoose.ObjectId, ref: 'User' },
  submitterName: { type: String, required: true }, // Mandatory name field
  submitterEmail: { type: String, required: true }, // Mandatory email field
  answers:      { type: Object, required: true },
  submittedAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Response', ResponseSchema);
