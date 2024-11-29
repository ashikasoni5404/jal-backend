const jwt = require('jsonwebtoken');
const Grampanchayat = require('../models/Grampanchayat');
const User = require('../models/User');
const PhedUser = require('../models/PhedUser');

const authenticateGrampanchayat = async (req, res, next) => {
  const token = req.header('x-auth-token');  // Look for the token in the request header

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using the JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the Grampanchayat from the decoded token data
    const grampanchayat = await Grampanchayat.findById(decoded._id);
    if (!grampanchayat) {
      return res.status(404).json({ success: false, message: 'Grampanchayat not found' });
    }

    // Add the Grampanchayat to the request object for use in other routes
    req.grampanchayat = grampanchayat;
    next();  // Allow the request to continue to the next route handler
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
};
const authenticateUser = async (req, res, next) => {
  const token = req.header('x-auth-token'); // Look for the token in the request header

  if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
      // Verify the token using the JWT secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the User from the decoded token data
      const user = await User.findById(decoded._id);
      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Add the user to the request object for use in other routes
      req.user = user;
      next(); // Continue to the next middleware or route handler
  } catch (error) {
      console.error(error);
      res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authenticatePhedUser = async (req, res, next) => {
  // Look for the token in the 'x-auth-token' header
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using the JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user from the decoded token data
    const user = await PhedUser.findById(decoded.id); // Use `id` as per the token structure
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Attach the user to the request object for use in other routes
    req.user = user;
    next(); // Allow the request to continue to the next route handler
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(400).json({ success: false, message: 'Invalid or expired token.' });
  }
};
module.exports = {authenticateGrampanchayat,authenticateUser,authenticatePhedUser};
