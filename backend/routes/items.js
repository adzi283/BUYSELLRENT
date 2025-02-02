const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateItem } = require('../middleware/validate');
const upload = require('../config/upload');
const fs = require('fs');
const Item = require('../models/Item');

// Get all items with filters
router.get('/', async (req, res) => {
  try {
    const { search, categories } = req.query;
    let query = {};

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by categories
    if (categories) {
      query.category = { 
        $in: categories.split(',')
      };
    }

    // Only show available items
    query.status = 'available';

    const items = await Item.find(query)
      .populate('seller', 'firstName lastName email')
      .sort('-createdAt');

    // Convert Buffer to base64 string for each item
    const itemsWithImages = items.map(item => {
      const itemObj = item.toObject();
      if (itemObj.image && itemObj.image.data) {
        itemObj.image.data = itemObj.image.data.toString('base64');
      }
      return itemObj;
    });

    res.json({
      status: 'success',
      data: { items: itemsWithImages }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// Get user's listings
router.get('/my-listings', auth, async (req, res) => {
  try {
    const items = await Item.find({ seller: req.user.id })
      .populate('seller', 'firstName lastName email')
      .sort('-createdAt');

    res.json({
      status: 'success',
      data: { items }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('seller', 'firstName lastName email contactNumber');

    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found'
      });
    }

    const itemObj = item.toObject();
    if (itemObj.image && itemObj.image.data) {
      itemObj.image.data = itemObj.image.data.toString('base64');
    }

    res.json({
      status: 'success',
      data: { item: itemObj }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// Create new item with image
router.post('/', auth, upload.single('image'), validateItem, async (req, res) => {
  try {
    const newItem = new Item({
      ...req.body,
      seller: req.user.id,
      image: req.file ? {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype
      } : null
    });

    await newItem.save();

    // Remove file from uploads folder after saving to DB
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(201).json({
      status: 'success',
      data: { item: newItem }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
});

// Update item
router.patch('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found'
      });
    }

    // Check ownership
    if (item.seller.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this item'
      });
    }

    // Don't allow status change through this route
    delete req.body.status;

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      data: { item: updatedItem }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
});

// Delete item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found'
      });
    }

    // Check ownership
    if (item.seller.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this item'
      });
    }

    // Delete the item
    await Item.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Item deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router; 