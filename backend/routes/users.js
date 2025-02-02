const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate({
        path: 'reviews',
        populate: {
          path: 'reviewer',
          select: 'firstName lastName email'
        }
      });

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// Update user profile
router.patch('/me', auth, async (req, res) => {
  try {
    // Fields that can't be updated
    const restrictedFields = ['email', 'password', 'cart', 'reviews'];
    const updates = Object.keys(req.body)
      .filter(key => !restrictedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    // Convert age to number if it's provided
    if (updates.age) {
      updates.age = Number(updates.age);
      if (isNaN(updates.age)) {
        return res.status(400).json({
          status: 'error',
          message: 'Age must be a valid number'
        });
      }
    }

    // Validate age
    if (updates.age && (updates.age < 16 || updates.age > 100 || !Number.isInteger(updates.age))) {
      return res.status(400).json({
        status: 'error',
        message: 'Age must be between 16 and 100'
      });
    }

    // Validate contact number if provided
    if (updates.contactNumber && !/^[0-9]{10}$/.test(updates.contactNumber)) {
      return res.status(400).json({
        status: 'error',
        message: 'Contact number must be exactly 10 digits'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update only the provided fields
    Object.keys(updates).forEach(key => {
      user[key] = updates[key];
    });

    await user.save();
    const updatedUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message || 'Failed to update profile'
    });
  }
});

// Add review for a user
router.post('/:userId/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.params.userId;

    // Can't review yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot review yourself'
      });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be between 1 and 5'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if user has already reviewed
    const hasReviewed = user.reviews.some(
      review => review.reviewer.toString() === req.user.id
    );

    if (hasReviewed) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this user'
      });
    }

    user.reviews.push({
      reviewer: req.user.id,
      rating,
      comment,
      createdAt: Date.now()
    });

    await user.save();

    // Populate reviewer details
    await user.populate({
      path: 'reviews.reviewer',
      select: 'firstName lastName email'
    });

    res.status(201).json({
      status: 'success',
      data: { reviews: user.reviews }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
});

// Get user's reviews
router.get('/:userId/reviews', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('reviews')
      .populate({
        path: 'reviews.reviewer',
        select: 'firstName lastName email'
      });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: { reviews: user.reviews }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router; 