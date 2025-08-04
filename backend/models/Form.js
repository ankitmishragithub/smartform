const mongoose = require('mongoose');

const FormSchema = new mongoose.Schema({
  schemaJson: { type: Object, required: true },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Form', FormSchema);