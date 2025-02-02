const jwt = require('jsonwebtoken');
const User = require('../models/User');

const createTestUser = async (userData = {}) => {
  const defaultUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@iiit.ac.in',
    password: 'password123',
    age: 20,
    contactNumber: '1234567890'
  };

  const user = await User.create({
    ...defaultUser,
    ...userData
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return { user, token };
};

module.exports = {
  createTestUser
}; 