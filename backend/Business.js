const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  prenume:   { type: String, required: true },
  nume: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  telefon: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAccepted: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no',
    required: true
  },
  role: {
  type: String,
  enum: ['owner', 'expert'],
  default: 'owner', 
  required: true
}

}, { timestamps: true });

module.exports = mongoose.model('Business', BusinessSchema);
