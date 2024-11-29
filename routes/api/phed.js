require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const PhedUser = require('../../models/PhedUser');

const router = express.Router();

// JWT token generator
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '6m' });
};

/**
 * @route   POST http://localhost:5050/v1/api/phed/register
 * @desc    Register a new user
 */
router.post('/register', async (req, res) => {
  const { name, mobile, phed_id, password } = req.body;

  try {
    const existingUser = await PhedUser.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this mobile number.' });
    }

    const user = new PhedUser({ name, mobile, phed_id, password });
    await user.save();

    res.status(201).json({ success: true, message: 'User registered successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error registering user.', error });
  }
});

/**
 * @route   POST http://localhost:5050/v1/api/phed/login
 * @desc    Log in a user and return a JWT token
 */
router.post('/login', async (req, res) => {
  const { mobile, password } = req.body;

  try {
    const user = await PhedUser.findOne({ mobile, password });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({ success: true, message: 'Login successful.', token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging in user.', error });
  }
});

/**
 * @route   GET http://localhost:5050/v1/api/phed/detail
 * @desc    Get the logged-in user's profile
 */
router.get('/detail', async (req, res) => {
  const token = req.headers['x-auth-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized access. Token required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await PhedUser.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.', error });
  }
});

module.exports = router;
