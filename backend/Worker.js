const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  services: [{
    type: String,
    required: true
  }],
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  availability: [{
    dayOfWeek: String,
    from: String,
    to: String
  }],
  // Optional fields
  image: String,
  experience: Number, // Years of experience
  bio: String
});

module.exports = mongoose.model('Worker', workerSchema); 