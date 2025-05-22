const express = require('express');
const router = express.Router();
const Booking = require('../Booking');
const Worker = require('../Worker');
const Salon = require('../Salon');
const { isValidObjectId } = require('mongoose');

// Get available time slots for a worker on a specific date
router.get('/available-slots', async (req, res) => {
  try {
    const { workerId, date, service } = req.query;
    
    if (!workerId || !date || !service) {
      return res.status(400).json({ message: 'Worker ID, date, and service are required' });
    }
    
    if (!isValidObjectId(workerId)) {
      return res.status(400).json({ message: 'Invalid worker ID format' });
    }

    // Parse the date string to a Date object
    const bookingDate = new Date(date);
    
    // Reset hours, minutes, seconds, and milliseconds to get just the date part
    bookingDate.setHours(0, 0, 0, 0);
    
    // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = bookingDate.getDay();
    const daysOfWeek = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
    const dayName = daysOfWeek[dayOfWeek];
    
    // Get worker data to check availability and services
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    // Check if worker provides the requested service
    if (!worker.services.includes(service)) {
      return res.status(400).json({ 
        message: `Worker does not provide the ${service} service` 
      });
    }
    
    // Get worker's availability for the requested day
    const availability = worker.availability.find(a => a.dayOfWeek === dayName);
    
    if (!availability) {
      return res.status(404).json({ 
        message: `Worker is not available on ${dayName}` 
      });
    }
    
    // Parse worker's availability hours
    const startTime = availability.from.split(':').map(Number);
    const endTime = availability.to.split(':').map(Number);
    
    // Generate all possible 1-hour slots during worker's availability
    const availableSlots = [];
    const nextDayDate = new Date(bookingDate);
    nextDayDate.setDate(nextDayDate.getDate() + 1);
    
    // Get existing bookings for this worker on this date
    const existingBookings = await Booking.find({
      workerId,
      date: {
        $gte: bookingDate,
        $lt: nextDayDate
      },
      status: { $ne: 'cancelled' }
    });
    
    // Convert existing bookings to a set of occupied time slots
    const occupiedSlots = new Set(existingBookings.map(booking => booking.timeSlot));
    
    // Generate hourly slots from start time to end time
    for (let hour = startTime[0]; hour < endTime[0]; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      
      // Check if this slot is already booked
      if (!occupiedSlots.has(timeSlot)) {
        availableSlots.push(timeSlot);
      }
    }
    
    res.json({
      worker: {
        id: worker._id,
        name: worker.name,
        surname: worker.surname
      },
      date: bookingDate,
      dayOfWeek: dayName,
      availableSlots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const { 
      userId, 
      salonId, 
      workerId, 
      service, 
      date, 
      timeSlot, 
      clientName, 
      clientEmail, 
      clientPhone 
    } = req.body;
    
    // Validate required fields
    if (!salonId || !workerId || !service || !date || !timeSlot || !clientName || !clientEmail || !clientPhone) {
      return res.status(400).json({ message: 'All fields are required except userId' });
    }
    
    // Validate IDs format
    if (
      (userId && !isValidObjectId(userId)) || 
      !isValidObjectId(salonId) || 
      !isValidObjectId(workerId)
    ) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    // Convert date string to Date object
    const bookingDate = new Date(date);
    
    // Reset hours, minutes, seconds, and milliseconds
    bookingDate.setHours(0, 0, 0, 0);
    
    // Validate if worker exists
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    // Validate if salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    
    // Check if the worker is associated with the salon
    if (worker.salonId.toString() !== salonId) {
      return res.status(400).json({ message: 'Worker is not associated with the salon' });
    }
    
    // Check if worker provides the requested service
    if (!worker.services.includes(service)) {
      return res.status(400).json({ message: `Worker does not provide the ${service} service` });
    }
    
    // Check if slot is available
    const nextDayDate = new Date(bookingDate);
    nextDayDate.setDate(nextDayDate.getDate() + 1);
    
    const existingBooking = await Booking.findOne({
      workerId,
      date: {
        $gte: bookingDate,
        $lt: nextDayDate
      },
      timeSlot,
      status: { $ne: 'cancelled' }
    });
    
    if (existingBooking) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }
    
    // Create new booking
    const booking = new Booking({
      userId,
      salonId,
      workerId,
      service,
      date: bookingDate,
      timeSlot,
      clientName,
      clientEmail,
      clientPhone
    });
    
    await booking.save();
    
    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        status: booking.status,
        worker: {
          id: worker._id,
          name: worker.name,
          surname: worker.surname
        },
        salon: {
          id: salon._id,
          name: salon.name
        },
        service: booking.service
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bookings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const bookings = await Booking.find({ userId })
      .sort({ date: -1, timeSlot: 1 });
    
    // Populate worker and salon details for each booking
    const populatedBookings = await Promise.all(bookings.map(async (booking) => {
      const worker = await Worker.findById(booking.workerId);
      const salon = await Salon.findById(booking.salonId);
      
      return {
        id: booking._id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        service: booking.service,
        status: booking.status,
        worker: worker ? {
          id: worker._id,
          name: worker.name,
          surname: worker.surname
        } : null,
        salon: salon ? {
          id: salon._id,
          name: salon.name,
          address: salon.address
        } : null
      };
    }));
    
    res.json(populatedBookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bookings for a salon
router.get('/salon/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;
    
    if (!isValidObjectId(salonId)) {
      return res.status(400).json({ message: 'Invalid salon ID format' });
    }
    
    const bookings = await Booking.find({ salonId })
      .sort({ date: -1, timeSlot: 1 });
    
    // Populate worker details for each booking
    const populatedBookings = await Promise.all(bookings.map(async (booking) => {
      const worker = await Worker.findById(booking.workerId);
      
      return {
        id: booking._id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        service: booking.service,
        status: booking.status,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        worker: worker ? {
          id: worker._id,
          name: worker.name,
          surname: worker.surname
        } : null
      };
    }));
    
    res.json(populatedBookings);
  } catch (error) {
    console.error('Error fetching salon bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bookings for a worker
router.get('/worker/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    
    if (!isValidObjectId(workerId)) {
      return res.status(400).json({ message: 'Invalid worker ID format' });
    }
    
    const bookings = await Booking.find({ workerId })
      .sort({ date: -1, timeSlot: 1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching worker bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel a booking
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 