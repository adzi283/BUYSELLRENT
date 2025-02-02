const Item = require('../models/Item');

// Create new item
exports.createItem = async (req, res) => {
  try {
    const newItem = await Item.create({
      ...req.body,
      seller: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: {
        item: newItem
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};


// Get all items (with filters)
exports.getItems = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;
    
    // Base query - only exclude sold items
    let query = { status: { $ne: 'sold' } };

    // Add category filter if provided
    if (category && category !== 'all') {
      query.category = category;
    }

    // Add price range filter if provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Item.find(query)
      .populate('seller', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      data: { items }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get seller's items
exports.getSellerItems = async (req, res) => {
  try {
    const items = await Item.find({ seller: req.user._id })
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      data: { items }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get single item
exports.getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('seller', 'firstName lastName email');

    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        item
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found'
      });
    }

    // Check ownership
    if (item.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own items'
      });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        item: updatedItem
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Item not found'
      });
    }

    // Check ownership
    if (item.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own items'
      });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Item deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
}; 