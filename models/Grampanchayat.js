const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // To hash the password
const jwt = require('jsonwebtoken');

const grampanchayatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  grampanchayatId: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  villageName: { type: String, required: true },
  password: { type: String, required: true}, 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { type: Number, default: 1 },
});

// Password hashing before saving Grampanchayat
grampanchayatSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    // Hash the password before saving it
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Ensure `updatedAt` is updated on updates
grampanchayatSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});
grampanchayatSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id, grampanchayatId: this.grampanchayatId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
};

module.exports = mongoose.model('Grampanchayat', grampanchayatSchema);
