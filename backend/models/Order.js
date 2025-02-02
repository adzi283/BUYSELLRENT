const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const orderSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Item is required']
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer is required']
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: [1, 'Quantity must be at least 1']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'delivered', 'cancelled'],
    default: 'pending'
  },
  otp: {
    code: {
      type: String,
      required: true,
      select: false
    },
    expiresAt: {
      type: Date,
      required: true
    },
    attempts: {
      type: Number,
      default: 3
    }
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  }
}, {
  timestamps: true
});

// Index for faster queries
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// Method to create and hash OTP
orderSchema.methods.createHashedOTP = async function() {
  // Generate a random 6-digit OTP
  const plainOtp = crypto.randomInt(100000, 999999).toString();
  
  // Hash the OTP
  const hashedOtp = await bcrypt.hash(plainOtp, 10);
  
  // Set OTP details
  this.otp = {
    code: hashedOtp,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
    attempts: 3
  };
  
  await this.save();
  
  // Store plain OTP temporarily for response
  this._plainOtp = plainOtp;
  
  return plainOtp;
};

// Alias for createHashedOTP to maintain compatibility
orderSchema.methods.generateOtp = async function() {
  return await this.createHashedOTP();
};

// Verify OTP
orderSchema.methods.verifyOtp = async function(inputOtp) {
  // Check if OTP is expired
  if (Date.now() > this.otp.expiresAt) {
    throw new Error('OTP has expired');
  }

  // Check if attempts are exhausted
  if (this.otp.attempts <= 0) {
    throw new Error('Maximum OTP attempts exceeded');
  }

  // Verify OTP
  const isValid = await bcrypt.compare(inputOtp, this.otp.code);
  
  if (!isValid) {
    // Decrease attempts
    this.otp.attempts -= 1;
    await this.save();
    
    if (this.otp.attempts > 0) {
      throw new Error(`Invalid OTP. ${this.otp.attempts} attempts remaining`);
    } else {
      throw new Error('Maximum OTP attempts exceeded');
    }
  }

  return true;
};

// Regenerate OTP
orderSchema.methods.regenerateOtp = async function() {
  return await this.createHashedOTP();
};

// Virtual for time remaining until OTP expiration
orderSchema.virtual('otpTimeRemaining').get(function() {
  if (!this.otp.expiresAt) return 0;
  return Math.max(0, this.otp.expiresAt.getTime() - Date.now());
});

module.exports = mongoose.model('Order', orderSchema); 