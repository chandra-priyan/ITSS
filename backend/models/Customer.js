const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customer_id: { type: String, required: true, unique: true },
  mnemonic: String,
  short_name: String,
  name_1: String,
  street: String,
  town_country: String,
  nationality: String,
  residence: String,
  sector: String,
  account_officer: String,
  date_of_birth: String,
  customer_status: String,
  kyc_status: String,
  monthly_income: Number,
  employment_type: String
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
