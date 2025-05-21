const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../User');
const Business = require('../Business');  // import business model
const authenticateJWT = require('../middlewares/jwtMiddleware');

const router = express.Router();

// GET /api/auth/me - user profile
router.get('/me', authenticateJWT, async (req, res) => {
  console.log(req);
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Utilizator negasit' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

console.log('Auth routes loaded!');

// POST /api/auth/register - user registration
router.post('/register', async (req, res) => {
  console.log(req.body);
  const { username, email, password, prenume, nume, telefon } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, prenume, nume, telefon });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Unified login endpoint (user + business)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Completează username și parola!' });
  }

  let account;
  let isBusiness = false;

  try {
    // Try finding in User
    account = await User.findOne({ username });

    // If not found, try Business
    if (!account) {
      account = await Business.findOne({ username });
      isBusiness = true;
    }

    if (!account) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (isBusiness && account.isAccepted !== 'yes') {
      return res.status(403).json({ message: 'Contul business nu a fost încă aprobat.' });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Date de autentificare incorecte.' });
    }

    const token = jwt.sign(
      { id: account._id, business: isBusiness },
      'secretKey',
      { expiresIn: '1h' }
    );

    if (isBusiness) {
      return res.json({
        token,
        business: {
          username: account.username,
          email: account.email,
          prenume: account.prenume,
          nume: account.nume,
          telefon: account.telefon,
          role: account.role
        }
      });
    } else {
      return res.json({
        token,
        user: {
          username: account.username,
          email: account.email
        }
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Eroare internă server.' });
  }
});


// GET /api/admin/pending-businesses
router.get('/pending-businesses', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const businesses = await Business.find({ isAccepted: 'no' });
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/approve-business/:id
router.put('/approve-business/:id', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Business.findByIdAndUpdate(req.params.id, { isAccepted: 'yes' });
    res.json({ message: 'Business approved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;
