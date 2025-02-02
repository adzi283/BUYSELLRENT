const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Item = require('../models/Item');

// Get cart items
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Populate cart items with proper fields
    const populatedUser = await User.findById(user._id)
      .populate({
        path: 'cart',
        select: 'name price description image status seller',
        populate: {
          path: 'seller',
          select: 'firstName lastName email'
        }
      });

    // Only filter out sold items
    const availableItems = populatedUser.cart.filter(item => item.status !== 'sold');

    // Format items to include base64 image data
    const formattedItems = availableItems.map(item => {
      const formattedItem = item.toObject();
      if (formattedItem.image && formattedItem.image.data) {
        formattedItem.image.data = formattedItem.image.data.toString('base64');
      }
      return formattedItem;
    });

    res.json({
      status: 'success',
      data: { items: formattedItems }
    });
  } catch (err) {
    console.error('Cart fetch error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch cart items'
    });
  }
});

// Add item to cart
router.post('/', auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({
        status: 'error',
        message: 'No itemId provided'
      });
    }

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found'
      });
    }

    // Only block if item is sold
    if (item.status === 'sold') {
      return res.status(400).json({
        status: 'error',
        message: 'Item is already sold'
      });
    }

    // Check if item is user's own item
    if (item.seller.toString() === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot add your own item to cart'
      });
    }

    // Check if item is already in cart
    const user = await User.findById(req.user.id);
    if (user.cart.includes(itemId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Item already in cart'
      });
    }

    // Add to cart
    user.cart.push(itemId);
    await user.save();

    res.json({
      status: 'success',
      message: 'Item added to cart'
    });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add item to cart'
    });
  }
});

// Remove item from cart
router.delete('/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Remove from cart
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter(id => id.toString() !== itemId);
    await user.save();

    res.json({
      status: 'success',
      message: 'Item removed from cart'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
});

// Clear entire cart
router.delete('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Clear their entire cart
    user.cart = [];
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Cart cleared'
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
});

module.exports = router; 