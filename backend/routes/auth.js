const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegistration } = require('../middleware/validate');

// Register user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { firstName, lastName, email, password, age, contactNumber } = req.body;

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists'
      });
    }

    // Create user
    user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      age,
      contactNumber
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          age: user.age,
          contactNumber: user.contactNumber
        }
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const lowerEmail = email.toLowerCase();

    // Check if email is IIIT email
    const validDomains = ['@iiit.ac.in', '@students.iiit.ac.in', '@research.iiit.ac.in'];
    const isValidIIITEmail = validDomains.some(domain => lowerEmail.endsWith(domain));
    
    if (!email || !isValidIIITEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid IIIT email address (ending with @iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in)'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: lowerEmail }).select('+password');
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'No account found with this email address'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Incorrect password'
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from output
    user.password = undefined;

    res.json({
      status: 'success',
      token,
      data: { user }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router; 