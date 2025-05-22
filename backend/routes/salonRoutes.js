const express = require('express');
const router = express.Router();
const Salon = require('../Salon');
const Business = require('../Business');


// Adaugă un salon nou (doar dacă nu există deja unul pentru owner)
router.post('/', async (req, res) => {
  const { name, description, address, location, ownerId,  services, workingHours } = req.body;

  try {
    const owner = await Business.findOne({ username : ownerId })
    
    const idOfTheOwner = owner._id;
    const existingSalon = await Salon.findOne({ idOfTheOwner });

    if (existingSalon) {
      return res.status(400).json({ message: 'Salonul există deja pentru acest owner.' });
    }

    const newSalon = new Salon({ name, description, address, location, ownerId : owner._id, services, workingHours });
    await newSalon.save();
    res.status(201).json(newSalon);
  } catch (error) {
    console.error('Eroare la crearea salonului:', error);
    res.status(500).json({ message: 'Eroare server.' });
  }
});

// Returnează salonul unui owner
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const owner = await Business.findOne({ username: ownerId })
    const idOfTheOwner = owner._id;
    const salon = await Salon.findOne({ ownerId: idOfTheOwner });

    if (!salon) {
      return res.status(404).json({ message: 'Salonul nu a fost găsit.' });
    }
    res.json(salon);
  } catch (error) {
    console.error('Eroare la obținerea salonului:', error);
    res.status(500).json({ message: 'Eroare server.' });
  }
});

// Returnează toate saloanele sau doar cele dintr-un sector anume
router.get('/', async (req, res) => {
  const { sector } = req.query;
  try {
    let query = {};
    if (sector) {
      query["address.sector"] = sector;
    }

    const saloane = await Salon.find(query);
    res.json(saloane);
  } catch (error) {
    console.error("Eroare la căutare saloane:", error);
    res.status(500).json({ message: "Eroare server." });
  }
});

// Search endpoint - Important: must be placed BEFORE /:id route to prevent conflict
router.get("/search", async (req, res) => {
  try {
    const { service, sector, date, time } = req.query;
    console.log("Search query:", req.query);
    
    const query = {};

    // Service filter - case insensitive search
    if (service) {
      query.services = { $regex: new RegExp(service, 'i') };
    }

    // Sector filter
    if (sector) {
      query["address.sector"] = sector;
    }

    // Day of week and time filter
    if (date && time) {
      try {
        const searchDate = new Date(date);
        if (isNaN(searchDate.getTime())) {
          throw new Error("Invalid date format");
        }
        
        // Convert day index to Romanian day name
        const days = [
          "Duminică",
          "Luni",
          "Marți",
          "Miercuri",
          "Joi",
          "Vineri",
          "Sâmbătă",
        ];
        const dayOfWeek = days[searchDate.getDay()];
        console.log("Searching for day:", dayOfWeek);

        // Query for salons with working hours on the selected day and time
        query.workingHours = {
          $elemMatch: {
            dayOfWeek: dayOfWeek,
            from: { $lte: time }, // open at or before the requested time
            to: { $gte: time }    // closes at or after the requested time
          }
        };
      } catch (err) {
        console.error("Date parsing error:", err);
        return res.status(400).json({ message: "Format de dată invalid" });
      }
    }

    console.log("Final query:", JSON.stringify(query));
    
    // Execute the query
    const salons = await Salon.find(query);
    console.log(`Found ${salons.length} salons`);
    
    res.json(salons);
  } catch (err) {
    console.error("Eroare la căutare saloane:", err);
    res.status(500).json({ message: "Eroare server la search." });
  }
});

// Editează un salon existent
router.put('/:id', async (req, res) => {
  try {
    const updatedSalon = await Salon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedSalon);
  } catch (error) {
    console.error('Eroare la actualizarea salonului:', error);
    res.status(500).json({ message: 'Eroare server.' });
  }
});

// Returnează un salon specific după ID - Must be placed AFTER more specific routes
router.get('/:id', async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    
    if (!salon) {
      return res.status(404).json({ message: 'Salonul nu a fost găsit.' });
    }
    
    res.json(salon);
  } catch (error) {
    console.error('Eroare la obținerea salonului după ID:', error);
    res.status(500).json({ message: 'Eroare server.' });
  }
});

module.exports = router;
