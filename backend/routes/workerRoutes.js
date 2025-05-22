const express = require('express');
const router = express.Router();
const Worker = require('../Worker');
const Salon = require('../Salon');

// Get all workers for a specific salon
router.get('/salon/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;
    const workers = await Worker.find({ salonId });
    res.json(workers);
  } catch (error) {
    console.error('Error fetching salon workers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific worker by ID
router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.json(worker);
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new worker to a salon
router.post('/', async (req, res) => {
  try {
    const { name, surname, phoneNumber, email, services, salonId, availability, image, experience, bio } = req.body;
    
    // Verify salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    
    // Create new worker
    const newWorker = new Worker({
      name,
      surname,
      phoneNumber,
      email,
      services,
      salonId,
      availability,
      image,
      experience,
      bio
    });
    
    await newWorker.save();
    res.status(201).json(newWorker);
  } catch (error) {
    console.error('Error adding worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update worker
router.put('/:id', async (req, res) => {
  try {
    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!updatedWorker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    res.json(updatedWorker);
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete worker
router.delete('/:id', async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('Error deleting worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 