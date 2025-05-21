const mongoose = require("mongoose");

const SalonSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  address: {
    street:  { type: String },
    number:  { type: String },
    sector:  { type: String }
  },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
    unique: true  // un owner are un singur salon
  },
  // **noile câmpuri**:
  services: [String],    
  workingHours: [
    {
      dayOfWeek: String,  // 'Luni', 'Marti'…
      from: String,       // '08:00'
      to: String          // '17:00'
    }
  ]
});

module.exports = mongoose.model("Salon", SalonSchema);
