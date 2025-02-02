const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const User = require('../models/User');

// Get reviews for a seller
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const reviews = await Review.find({ seller: req.params.sellerId })
      .populate('reviewer', 'firstName lastName email')
      .sort('-createdAt');

    res.json({
      status: 'success',
      data: { reviews }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// Add a review
router.post('/', auth, async (req, res) => {
  try {
    const { sellerId, rating, comment } = req.body;

    // Can't review yourself
    if (sellerId === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot review yourself'
      });
    }

    // Check if seller exists
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        status: 'error',
        message: 'Seller not found'
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      reviewer: req.user.id,
      seller: sellerId
    });

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this seller'
      });
    }

    const review = new Review({
      reviewer: req.user.id,
      seller: sellerId,
      rating,
      comment
    });

    await review.save();

    // Populate reviewer details
    await review.populate('reviewer', 'firstName lastName email');

    res.status(201).json({
      status: 'success',
      data: { review }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
});

// Update review
router.patch('/:reviewId', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this review'
      });
    }

    const { rating, comment } = req.body;
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    await review.save();
    await review.populate('reviewer', 'firstName lastName email');

    res.json({
      status: 'success',
      data: { review }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
});

// Delete review
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this review'
      });
    }

    await Review.findByIdAndDelete(req.params.reviewId);

    res.json({
      status: 'success',
      message: 'Review deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router; 