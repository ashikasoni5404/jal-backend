require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const AssetPhed = require('../../models/phedAssets');
const PhedUser = require('../../models/PhedUser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const generateToken = require('../../middlewear/token')
const router = express.Router();
const InventoryPhed = require('../../models/InventoryPhed')


//---------------------------------------

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

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new PhedUser({ name, mobile, phed_id, password: hashedPassword });
    await user.save();

    res.status(201).json({ success: true, message: 'User registered successfully.' });
  } catch (error) {
    console.error('Error during registration:', error);
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
    // Validate input
    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: 'Mobile number and password are required.' });
    }

    // Find user by mobile
    const user = await PhedUser.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Generate a token for the user
    const token = generateToken(user._id, 'pheduser'); // You can include the role as needed

    // Send successful response
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in user.',
      error: error.message,
    });
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


//---------------------------------------


// Add a new asset
// http://localhost:5050/v1/api/phed/addAsset
router.post('/addAsset', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Asset name is required.' });
    }

    const existingAsset = await AssetPhed.findOne({ name });
    if (existingAsset) {
      return res.status(400).json({ message: 'Asset already exists.' });
    }

    const newAsset = new AssetPhed({ name });
    await newAsset.save();

    return res.status(201).json({ message: 'Asset added successfully.', asset: newAsset });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// Add quantity to an existing asset
// http://localhost:5050/v1/api/phed/addQuantity
router.put('/addQuantity', async (req, res) => {
  try {
    const { name, quantityToAdd, description } = req.body;

    if (!name || quantityToAdd === undefined) {
      return res.status(400).json({ message: 'Asset name and quantity to add are required.' });
    }

    if (!description) {
      return res
        .status(400)
        .json({ message: 'Description is required when adding or editing quantity.' });
    }

    // Use case-insensitive query
    const asset = await AssetPhed.findOne({ name: new RegExp(`^${name}$`, 'i') });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    console.log('Asset found:', asset);

    // Update quantity and add to history
    asset.quantity += quantityToAdd;
    asset.editHistory.push({
      quantityAdded: quantityToAdd,
      updatedQuantity: asset.quantity,
      description, // Add description to edit history
    });

    await asset.save();

    // Return updated asset with edit history
    return res.status(200).json({
      message: 'Quantity added successfully.',
      asset,
    });
  } catch (error) {
    console.error('Error in addQuantityToAssetPhed:', error);
    return res.status(500).json({
      message: 'Server error.',
      error: error.message,
    });
  }
});

// List all assets
//http://localhost:5050/v1/api/phed/listAssets
router.get('/listAssets', async (req, res) => {
  try {
    // Fetch all assets
    const assets = await AssetPhed.find();

    // Respond with all assets, including edit history
    return res.status(200).json({ assets });
  } catch (error) {
    console.error('Error in listAssetsPhed:', error);
    return res.status(500).json({
      message: 'Server error.',
      error: error.message,
    });
  }
});

//---------------------------------------

// Add a new asset
// http://localhost:5050/v1/api/phed/addInventry
router.post('/addInventry', async (req, res) => {
  const { name, category, quantity, description } = req.body;

  try {
    // Check if inventory item already exists
    const existingItem = await InventoryPhed.findOne({ name });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Inventory item already exists.',
      });
    }

    // Create the new inventory item
    const inventory = new InventoryPhed({
      name,
      category, // Save category
      quantity,
      editHistory: [
        {
          quantityAdded: quantity,
          updatedQuantity: quantity,
          description,
        },
      ],
    });

    await inventory.save();

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully.',
      data: inventory, // Send the entire inventory item in response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding inventory.',
      error: error.message || error,
    });
  }
});

// Update inventory quantity
// http://localhost:5050/v1/api/phed/inventry/updateQuantity
router.put('/inventry/updateQuantity', async (req, res) => {
  const { name, quantityToAdd, description } = req.body;

  try {
    if (!name || quantityToAdd === undefined || !description) {
      return res.status(400).json({ success: false, message: 'Name, quantity to add, and description are required.' });
    }

    const inventory = await InventoryPhed.findOne({ name });
    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    const updatedQuantity = inventory.quantity + quantityToAdd;

    inventory.quantity = updatedQuantity;
    inventory.editHistory.push({
      quantityAdded: quantityToAdd,
      updatedQuantity,
      description,
    });

    const updatedInventory = await inventory.save();
    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully.',
      data: updatedInventory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating inventory.', error });
  }
});


//  inventory list
// http://localhost:5050/v1/api/phed/inventry/list
// search -- >
router.get('/inventry/list', async (req, res) => {
  const { category } = req.query;

  try {
    // Build the query based on the presence of category
    const query = category ? { category } : {};

    // Fetch inventory items based on the query
    const inventoryItems = await InventoryPhed.find(query);

    // Check if any items exist
    if (inventoryItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: category
          ? `No inventory items found in the category: ${category}.`
          : 'No inventory items found.',
      });
    }

    res.status(200).json({
      success: true,
      message: category
        ? `Inventory items in category: ${category} retrieved successfully.`
        : 'All inventory items retrieved successfully.',
      data: inventoryItems,
    });
  } catch (error) {
    console.error('Error retrieving inventory items:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving inventory items.',
      error: error.message || error,
    });
  }
});





module.exports = router;
