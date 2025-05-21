const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  prenume: { type: String, required: true },
  nume: { type: String, required: true },
  telefon: { type: String, required: true },
  role: { type: String, default: 'User', required: true }
});

module.exports = mongoose.model('User', userSchema);
