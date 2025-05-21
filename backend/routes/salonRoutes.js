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

router.get("/search", async (req, res) => {
  try {
    const { service, sector, date, time } = req.query;
    const query = {};
    console.log(req.query)

    if (service) {
      query.services = service;
    }

    if (sector) {
      query["address.sector"] = sector;
    }

    if (date && time) {
      const days = [
        "Duminică",
        "Luni",
        "Marți",
        "Miercuri",
        "Joi",
        "Vineri",
        "Sâmbătă",
      ];
      const dayOfWeek = days[new Date(date).getDay()];

      query.workingHours = {
        $elemMatch: {
          dayOfWeek,
          from: { $lte: time }, 
          to:   { $gte: time }  
        },
      };
    }

    const salons = await Salon.find(query);

    res.json(salons);
  } catch (err) {
    console.error("Eroare la căutare saloane:", err);
    res.status(500).json({ message: "Eroare server la search." });
  }
});

module.exports = router;
