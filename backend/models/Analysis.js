const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  customer_id: { type: String, required: true },
  module: String,
  result: String,
  date: { type: Date, default: Date.now },
  details: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Analysis', analysisSchema);
