// backend/routes/businessRoutes.js

const express   = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const Business  = require('../Business');   // sau '../models/Business' dacă l-ai mutat într-un subfolder
const router    = express.Router();

console.log('Business routes loaded!');

// POST /api/business/register
router.post('/register', async (req, res) => {
  const { prenume, nume, username, email, telefon, password } = req.body;
  if (!prenume || !nume || !username || !email || !telefon || !password) {
    return res.status(400).json({ message: 'Completează toate câmpurile!' });
  }

  try {
    // verificăm dacă există deja un business cu același username sau email
    if (await Business.findOne({ username })) {
      return res.status(400).json({ message: 'Business cu acest username există deja' });
    }
    if (await Business.findOne({ email })) {
      return res.status(400).json({ message: 'Business cu acest email există deja' });
    }

    const hash = await bcrypt.hash(password, 10);
    const b = new Business({
      prenume,
      nume,
      username,
      email,
      telefon,
      password: hash,
      role: 'owner' 
    });
    await b.save();

    res.status(201).json({ message: 'Cont Business creat cu succes!' });
  } catch (err) {
    console.error('Business register error:', err);
    res.status(500).json({ message: 'Eroare server' });
  }
});

// POST /api/business/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Completează username și parola!' });
  }

  try {
    const biz = await Business.findOne({ username });
    if (!biz) {
      return res.status(400).json({ message: 'Business nu există' });
    }

    const isMatch = await bcrypt.compare(password, biz.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Date incorecte' });
    }

    const token = jwt.sign(
      { businessId: biz._id, role: biz.role },
      'secretKey',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      business: {
        username: biz.username,
        email: biz.email,
        prenume: biz.prenume,
        nume: biz.nume,
        telefon: biz.telefon,
        role: account.role
      }
    });
  } catch (err) {
    console.error('Business login error:', err);
    res.status(500).json({ message: 'Eroare server' });
  }
});

module.exports = router;
