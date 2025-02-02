const User = require('../models/User');
const Item = require('../models/Item');
const Cart = require('../models/Cart');

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user._id;

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

    // Prevent self-buying
    if (item.seller.toString() === userId.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot add your own items to cart'
      });
    }

    // Check if item is already in cart
    const existingCartItem = await Cart.findOne({
      user: userId,
      item: itemId
    });

    if (existingCartItem) {
      return res.status(400).json({
        status: 'error',
        message: 'Item already in cart'
      });
    }

    // Create cart item without reserving the item
    const cartItem = await Cart.create({
      user: userId,
      item: itemId
    });

    res.status(200).json({
      status: 'success',
      message: 'Item added to cart',
      data: { cartItem }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get cart items
exports.getCartItems = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'cart',
        populate: {
          path: 'seller',
          select: 'firstName lastName email'
        }
      });

    // Only filter out sold items
    const availableItems = user.cart.filter(item => item.status !== 'sold');

    // Update cart if items were removed
    if (availableItems.length !== user.cart.length) {
      user.cart = availableItems.map(item => item._id);
      await user.save();
    }

    res.status(200).json({
      status: 'success',
      data: { items: availableItems }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    await Cart.findOneAndDelete({ user: userId, item: itemId });

    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
}; 