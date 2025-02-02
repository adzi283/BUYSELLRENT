const validator = require('validator');

exports.validateRegistration = (req, res, next) => {
  const { firstName, lastName, email, password, age, contactNumber } = req.body;
  const errors = [];

  if (!firstName || !validator.isLength(firstName, { min: 2 })) {
    errors.push('First name must be at least 2 characters');
  }

  if (!lastName || !validator.isLength(lastName, { min: 2 })) {
    errors.push('Last name must be at least 2 characters');
  }

  const validDomains = ['@iiit.ac.in', '@students.iiit.ac.in', '@research.iiit.ac.in'];
  const isValidIIITEmail = validDomains.some(domain => email && email.toLowerCase().endsWith(domain));
  
  if (!email || !validator.isEmail(email) || !isValidIIITEmail) {
    errors.push('Please provide a valid IIIT email address (ending with @iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in)');
  }

  if (!age || age < 16 || age > 100) {
    errors.push('Age must be between 16 and 100');
  }

  const phoneRegex = /^[0-9]{10}$/;
  if (!contactNumber || !phoneRegex.test(contactNumber)) {
    errors.push('Contact number must be 10 digits');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: errors[0] // Return only the first error for clearer messaging
    });
  }

  next();
};

exports.validateItem = (req, res, next) => {
  const { name, description, price, category } = req.body;
  const errors = [];

  if (!name || !validator.isLength(name, { min: 3 })) {
    errors.push('Item name must be at least 3 characters');
  }

  if (!description || !validator.isLength(description, { min: 10 })) {
    errors.push('Description must be at least 10 characters');
  }

  if (!price || price <= 0) {
    errors.push('Price must be greater than 0');
  }

  const validCategories = ['clothing', 'grocery', 'electronics', 'books', 'furniture', 'other'];
  if (!category || !validCategories.includes(category)) {
    errors.push('Invalid category');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: errors.join(', ')
    });
  }

  next();
}; 