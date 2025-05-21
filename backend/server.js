const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const salonRoutes = require('./routes/salonRoutes');

const app = express();
const PORT = 8080;

// Middlewares
app.use(cors());
app.use(bodyParser.json());


// Connect MongoDB
mongoose.connect('mongodb://localhost:27017/user-auth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/salons', salonRoutes);


// Test
app.get('/', (req, res) => {
  res.send('Server is running.');
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
