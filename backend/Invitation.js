const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  salonName: {
    type: String,
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  services: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    // Invitation expires after 7 days
    expires: 60 * 60 * 24 * 7
  },
  isUsed: {
    type: Boolean,
    default: false
  }
});

// Static method to generate a token
invitationSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('Invitation', invitationSchema); 