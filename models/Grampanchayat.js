const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // To hash the password
const jwt = require('jsonwebtoken');

const grampanchayatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  grampanchayatId: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  villageName: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  mobile: { 
    type: String, 
    required: true, 
    match: [/^\d{10}$/, 'Mobile number must be 10 digits'], 
    unique: true 
  },
  status: { type: Number, default: 1 },
});

module.exports = mongoose.model('Grampanchayat', grampanchayatSchema);
