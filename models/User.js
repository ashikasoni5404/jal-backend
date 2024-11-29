const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');  // For generating unique consumerId
const jwt = require('jsonwebtoken');
const Grampanchayat = require('./Grampanchayat');
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    number_aadhar: { type: String, required: true, }, 
    mobileNo: { type: String, required: true, unique: true }, 
    consumerId: { type: String, unique: true },
    password: { type: String, required: true },
    status: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    grampanchayatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grampanchayat' }, 
  });

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    // Hash the password before saving it
    this.password = await bcrypt.hash(this.password, 10);
  }
  
  // Generate a unique consumerId
  if (!this.consumerId) {
    this.consumerId = uuidv4();  // Generate a unique consumer ID using uuid
  }

  // Set updatedAt to current date
  this.updatedAt = new Date();

  next();
});

// Method to check if the provided password matches the hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
