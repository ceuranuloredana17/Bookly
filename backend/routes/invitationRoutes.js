const express = require('express');
const router = express.Router();
const Invitation = require('../Invitation');
const Salon = require('../Salon');
const WorkerUser = require('../WorkerUser');
const Worker = require('../Worker');
const nodemailer = require('nodemailer');

// Create a test nodemailer transporter (replace with real SMTP details in production)
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: 'ethereal.user@ethereal.email', // replace with real credentials
    pass: 'ethereal_pass', // replace with real credentials
  },
});

// Generate and send invitation
router.post('/send', async (req, res) => {
  try {
    const { email, salonId, services } = req.body;
    const token = Invitation.generateToken();
    
    // Get salon details to include in the invitation
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    
    // Create the invitation record
    const invitation = new Invitation({
      email,
      salonId,
      salonName: salon.name,
      ownerId: salon.ownerId,
      token,
      services: services || []
    });
    
    await invitation.save();
    
    // Build the invitation URL
    const invitationUrl = `http://localhost:3000/worker-register/${token}`;
    
    // Email content
    const mailOptions = {
      from: '"Bookly" <no-reply@bookly.com>',
      to: email,
      subject: `Invitație pentru a lucra la ${salon.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6200ee;">Invitație pentru a lucra la ${salon.name}</h2>
          <p>Ai fost invitat să te alături echipei de la ${salon.name}.</p>
          <p>Pentru a accepta invitația și a-ți crea contul, te rugăm să accesezi link-ul de mai jos:</p>
          <a href="${invitationUrl}" style="display: inline-block; background-color: #6200ee; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0;">
            Creează-ți contul
          </a>
          <p>Link-ul va expira în 7 zile.</p>
          <p>Dacă nu ai solicitat această invitație, te rugăm să ignori acest email.</p>
          <p>Mulțumim,<br>Echipa Bookly</p>
        </div>
      `
    };
    
    // Send the email (commented out for now since we're using a test transporter)
    // In production, uncomment and set up real SMTP details
    /*
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    */
    
    // For demonstration purposes, simply log the invitation URL
    console.log('Invitation URL:', invitationUrl);
    
    res.status(201).json({
      message: 'Invitation sent successfully',
      invitationUrl,
      invitation
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify invitation token
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({ token, isUsed: false });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }
    
    // Don't mark as used yet, just return the invitation details
    res.json({
      valid: true,
      invitation: {
        email: invitation.email,
        salonId: invitation.salonId,
        salonName: invitation.salonName,
        services: invitation.services
      }
    });
  } catch (error) {
    console.error('Error verifying invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register worker using invitation
router.post('/register', async (req, res) => {
  try {
    const { token, name, surname, password, phoneNumber, bio, experience } = req.body;
    
    // Find and validate the invitation
    const invitation = await Invitation.findOne({ token, isUsed: false });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }
    
    // Check if user with email already exists
    const existingUser = await WorkerUser.findOne({ email: invitation.email });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Un cont cu acest email există deja' });
    }
    
    // Create new worker user
    const workerUser = new WorkerUser({
      name,
      surname,
      email: invitation.email,
      password,
      phoneNumber,
      salonId: invitation.salonId,
      services: invitation.services,
      bio: bio || '',
      experience: experience || 0,
      // Default availability - can be edited later
      availability: [
        { dayOfWeek: 'Luni', from: '09:00', to: '17:00' },
        { dayOfWeek: 'Marți', from: '09:00', to: '17:00' },
        { dayOfWeek: 'Miercuri', from: '09:00', to: '17:00' },
        { dayOfWeek: 'Joi', from: '09:00', to: '17:00' },
        { dayOfWeek: 'Vineri', from: '09:00', to: '17:00' }
      ]
    });
    
    await workerUser.save();
    
    // Mark invitation as used
    invitation.isUsed = true;
    await invitation.save();
    
    // Also create or update Worker record to link with the WorkerUser
    const worker = new Worker({
      name: workerUser.name,
      surname: workerUser.surname,
      phoneNumber: workerUser.phoneNumber,
      email: workerUser.email,
      services: workerUser.services,
      salonId: workerUser.salonId,
      availability: workerUser.availability,
      experience: workerUser.experience,
      bio: workerUser.bio
    });
    
    await worker.save();
    
    res.status(201).json({
      message: 'Worker account created successfully',
      workerId: workerUser._id
    });
  } catch (error) {
    console.error('Error registering worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all invitations for a salon
router.get('/salon/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;
    
    const invitations = await Invitation.find({ 
      salonId, 
      isUsed: false 
    }).sort({ createdAt: -1 });
    
    res.json(invitations);
  } catch (error) {
    console.error('Error fetching salon invitations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an invitation
router.delete('/:id', async (req, res) => {
  try {
    const invitation = await Invitation.findByIdAndDelete(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    res.json({ message: 'Invitation deleted successfully' });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 