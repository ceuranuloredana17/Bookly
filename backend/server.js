const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const salonRoutes = require('./routes/salonRoutes');
const workerRoutes = require('./routes/workerRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const workerAuthRoutes = require('./routes/workerAuthRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const Salon = require('./Salon');
const Business = require('./Business');
const Worker = require('./Worker');
const WorkerUser = require('./WorkerUser');
const Invitation = require('./Invitation');
const Booking = require('./Booking');

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
.then(() => {
  console.log('Connected to MongoDB');
  checkAndCreateTestData();
})
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/salons', salonRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/worker-auth', workerAuthRoutes);
app.use('/api/bookings', bookingRoutes);

// Test
app.get('/', (req, res) => {
  res.send('Server is running.');
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

// Function to create test data if none exists
async function checkAndCreateTestData() {
  try {
    // Check if we have any salons
    const salonCount = await Salon.countDocuments();
    
    if (salonCount === 0) {
      console.log('No salons found, creating test data...');
      
      // Create a test business first
      const testBusiness = await Business.findOne({ role: 'owner' });
      
      let ownerId;
      
      if (!testBusiness) {
        // Create a test business/owner
        const newBusiness = new Business({
          username: 'testsalon',
          email: 'test@salon.com',
          password: '$2b$10$x5d5WytrLdKK.C7PJiRxku8wMYVE31UjV2LI.6DEPOpkpP6eZjJpK', // 'password'
          role: 'owner',
          approved: true,
          prenume: 'Test',
          nume: 'Owner',
          telefon: '0722222222'
        });
        
        const savedBusiness = await newBusiness.save();
        ownerId = savedBusiness._id;
        console.log('Created test business owner');
      } else {
        ownerId = testBusiness._id;
      }
      
      // Create test salons
      const testSalons = [
        {
          name: 'Salon Frumusețe',
          description: 'Un salon modern și elegant pentru toate serviciile de înfrumusețare',
          address: {
            street: 'Strada Victoriei',
            number: '10',
            sector: '1'
          },
          location: {
            lat: 44.439663,
            lng: 26.096306
          },
          ownerId: ownerId,
          services: ['Tuns', 'Coafat', 'Vopsit'],
          workingHours: [
            { dayOfWeek: 'Luni', from: '09:00', to: '18:00' },
            { dayOfWeek: 'Marți', from: '09:00', to: '18:00' },
            { dayOfWeek: 'Miercuri', from: '09:00', to: '18:00' },
            { dayOfWeek: 'Joi', from: '09:00', to: '18:00' },
            { dayOfWeek: 'Vineri', from: '09:00', to: '19:00' },
            { dayOfWeek: 'Sâmbătă', from: '10:00', to: '16:00' }
          ]
        },
        {
          name: 'Beauty Lounge',
          description: 'Relaxare și înfrumusețare într-un singur loc',
          address: {
            street: 'Bulevardul Unirii',
            number: '25',
            sector: '3'
          },
          location: {
            lat: 44.427753,
            lng: 26.104336
          },
          ownerId: ownerId,
          services: ['Manichiura', 'Pedichiura', 'Tratament facial'],
          workingHours: [
            { dayOfWeek: 'Luni', from: '10:00', to: '20:00' },
            { dayOfWeek: 'Marți', from: '10:00', to: '20:00' },
            { dayOfWeek: 'Miercuri', from: '10:00', to: '20:00' },
            { dayOfWeek: 'Joi', from: '10:00', to: '20:00' },
            { dayOfWeek: 'Vineri', from: '10:00', to: '20:00' },
            { dayOfWeek: 'Sâmbătă', from: '10:00', to: '18:00' },
            { dayOfWeek: 'Duminică', from: '12:00', to: '16:00' }
          ]
        }
      ];
      
      // Note: Since there's a unique constraint on ownerId, we'll create only the first salon
      // or we could make different owners for each salon in a real implementation
      const savedSalon = await Salon.create(testSalons[0]);
      console.log('Created test salon:', savedSalon.name);
      
      // Create test workers for the salon
      const workerCount = await Worker.countDocuments();
      
      if (workerCount === 0) {
        const testWorkers = [
          {
            name: 'Maria',
            surname: 'Popescu',
            phoneNumber: '0722111222',
            email: 'maria@salon.com',
            services: ['Tuns', 'Coafat'],
            salonId: savedSalon._id,
            availability: [
              { dayOfWeek: 'Luni', from: '09:00', to: '17:00' },
              { dayOfWeek: 'Marți', from: '09:00', to: '17:00' },
              { dayOfWeek: 'Miercuri', from: '09:00', to: '17:00' },
              { dayOfWeek: 'Joi', from: '09:00', to: '17:00' },
              { dayOfWeek: 'Vineri', from: '09:00', to: '17:00' }
            ],
            experience: 5,
            bio: 'Specializată în tunsori moderne și coafuri pentru evenimente speciale.'
          },
          {
            name: 'Alexandru',
            surname: 'Ionescu',
            phoneNumber: '0733222333',
            email: 'alex@salon.com',
            services: ['Tuns', 'Vopsit'],
            salonId: savedSalon._id,
            availability: [
              { dayOfWeek: 'Luni', from: '12:00', to: '20:00' },
              { dayOfWeek: 'Marți', from: '12:00', to: '20:00' },
              { dayOfWeek: 'Miercuri', from: '12:00', to: '20:00' },
              { dayOfWeek: 'Joi', from: '12:00', to: '20:00' },
              { dayOfWeek: 'Vineri', from: '12:00', to: '20:00' }
            ],
            experience: 3,
            bio: 'Pasionat de culori și stiluri moderne.'
          }
        ];
        
        const savedWorkers = await Worker.create(testWorkers);
        console.log(`Created ${savedWorkers.length} test workers`);
      }
      
      console.log('Test data created successfully!');
    }
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}
