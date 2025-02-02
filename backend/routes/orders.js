const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');
const crypto = require('crypto');

// Get buyer's orders
router.get('/buyer', auth, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('item')
      .populate('seller', 'firstName lastName email')
      .populate('buyer', 'firstName lastName email')
      .sort('-createdAt');

    res.json({
      status: 'success',
      data: { orders }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// Get seller's orders
router.get('/seller', auth, async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user.id })
      .populate('item')
      .populate('seller', 'firstName lastName email')
      .populate('buyer', 'firstName lastName email')
      .sort('-createdAt');

    res.json({
      status: 'success',
      data: { orders }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// Create a new order
router.post('/', auth, async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body;
    
    // Find the item and check availability
    const item = await Item.findById(itemId).populate('seller');
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found'
      });
    }

    // Prevent self-buying
    if (item.seller._id.toString() === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot buy your own item'
      });
    }

    // Check if item is available or reserved by this user
    if (item.status !== 'available' && 
        !(item.status === 'reserved' && item.reservedBy?.toString() === req.user.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Item not available for purchase'
      });
    }

    const totalAmount = item.price * quantity;

    // Generate transaction ID
    const transactionId = crypto.randomBytes(8).toString('hex').toUpperCase();

    // Create order
    const order = new Order({
      buyer: req.user.id,
      seller: item.seller._id,
      item: itemId,
      quantity,
      totalAmount,
      status: 'pending',
      transactionId,
      otp: {
        code: '', // Will be set by createHashedOTP
        expiresAt: new Date(),
        attempts: 0
      }
    });

    // Generate and hash OTP
    const plainOtp = await order.createHashedOTP();
    await order.save();

    // Mark item as reserved
    item.status = 'reserved';
    item.reservedBy = req.user.id;
    item.reservedAt = new Date();
    await item.save();

    // Remove from buyer's cart
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { cart: itemId }
    });

    // Populate necessary fields for response
    await order.populate([
      { path: 'item', select: 'name price' },
      { path: 'seller', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      status: 'success',
      data: {
        order: {
          ...order.toObject(),
          otp: plainOtp // Send plain OTP only once during order creation
        }
      },
      message: 'Order created successfully. Share the OTP with the seller to complete the delivery.'
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(400).json({
      status: 'error',
      message: err.message || 'Failed to create order'
    });
  }
});

// Get orders for current user (as buyer)
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('item')
      .populate('seller', 'firstName lastName email contactNumber')
      .sort('-createdAt');

    res.json({
      status: 'success',
      data: { orders }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// Get orders to deliver (as seller)
router.get('/to-deliver', auth, async (req, res) => {
  try {
    const orders = await Order.find({ 
      seller: req.user.id,
      status: { $in: ['pending', 'delivered'] }
    })
      .populate('item')
      .populate('buyer', 'firstName lastName email contactNumber')
      .sort('-createdAt');

    // Calculate statistics
    const stats = {
      pending: orders.filter(order => order.status === 'pending').length,
      delivered: orders.filter(order => order.status === 'delivered').length,
      totalEarnings: orders.filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + order.totalAmount, 0)
    };

    res.json({
      status: 'success',
      data: { orders, stats }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// Verify OTP and complete delivery
router.post('/:orderId/verify-otp', auth, async (req, res) => {
  try {
    const { otp } = req.body;
    
    // Find order with OTP code (which is normally hidden)
    const order = await Order.findById(req.params.orderId).select('+otp.code');
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Verify seller is the one verifying OTP
    if (order.seller.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Only the seller can verify OTP'
      });
    }

    // Check if order is pending
    if (order.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `Order is already ${order.status}`
      });
    }

    // Verify OTP using the model method
    try {
      await order.verifyOtp(otp);
    } catch (otpError) {
      return res.status(400).json({
        status: 'error',
        message: otpError.message
      });
    }

    // Update order status
    order.status = 'delivered';
    await order.save();

    // Mark item as sold
    const item = await Item.findById(order.item);
    if (item) {
      item.status = 'sold';
      item.reservedBy = null;
      item.reservedAt = null;
      await item.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Delivery completed successfully'
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(400).json({
      status: 'error',
      message: err.message || 'Failed to verify OTP'
    });
  }
});

// Regenerate OTP for an order
router.post('/:orderId/regenerate-otp', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      buyer: req.user.id,
      status: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or cannot regenerate OTP'
      });
    }

    // Generate new OTP
    const newOtp = await order.generateNewOTP();

    res.json({
      status: 'success',
      message: 'New OTP generated successfully',
      data: {
        otp: newOtp,
        expiresAt: order.otp.expiresAt
      }
    });
  } catch (err) {
    console.error('OTP regeneration error:', err);
    res.status(400).json({
      status: 'error',
      message: err.message || 'Failed to regenerate OTP'
    });
  }
});

// Cancel order
router.post('/:orderId/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      $or: [
        { buyer: req.user.id },
        { seller: req.user.id }
      ],
      status: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or cannot be cancelled'
      });
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    // Make item available again
    const item = await Item.findById(order.item);
    if (item) {
      item.status = 'available';
      item.reservedBy = null;
      item.reservedAt = null;
      await item.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully'
    });
  } catch (err) {
    console.error('Order cancellation error:', err);
    res.status(400).json({
      status: 'error',
      message: err.message || 'Failed to cancel order'
    });
  }
});

module.exports = router; 