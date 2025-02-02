const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');
const crypto = require('crypto');
const Cart = require('../models/Cart');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { itemId } = req.body;
    const buyerId = req.user._id;

    const item = await Item.findById(itemId).populate('seller');
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found'
      });
    }

    // If item is sold, can't buy it
    if (item.status === 'sold') {
      return res.status(400).json({
        status: 'error',
        message: 'Item is already sold'
      });
    }

    // Prevent self-buying
    if (item.seller._id.toString() === buyerId.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot buy your own item'
      });
    }

    // Create the order
    const order = await Order.create({
      item: itemId,
      buyer: buyerId,
      seller: item.seller._id,
      totalAmount: item.price,
      status: 'pending',
      transactionId: crypto.randomBytes(8).toString('hex').toUpperCase()
    });

    // Generate OTP and get the plain text version
    const plainOtp = await order.createHashedOTP();

    // Remove item from buyer's cart if it exists
    await Cart.findOneAndDelete({ user: buyerId, item: itemId });

    // Populate and return the new order
    const populatedOrder = await Order.findById(order._id)
      .populate('item')
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName email');

    const orderResponse = populatedOrder.toObject();
    orderResponse._plainOtp = plainOtp; // Add plain OTP to response

    res.status(201).json({
      status: 'success',
      data: {
        order: orderResponse
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get buyer's orders
exports.getBuyerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('item')
      .populate('seller', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      data: { orders }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get seller's orders
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user._id })
      .populate('item')
      .populate('buyer', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      data: { orders }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Verify OTP and complete order
exports.verifyOtp = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    const isValid = await order.verifyOtp(otp);
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid OTP'
      });
    }

    // Update order status
    order.status = 'delivered';
    await order.save();

    // Mark item as sold
    await Item.findByIdAndUpdate(order.item, { 
      status: 'sold'
    });

    // Auto-cancel other pending orders for this item
    await Order.updateMany(
      { 
        item: order.item, 
        status: 'pending',
        _id: { $ne: order._id }
      },
      { status: 'cancelled' }
    );

    res.status(200).json({
      status: 'success',
      message: 'Order completed successfully'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
}; 