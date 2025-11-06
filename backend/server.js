const express = require('express');
const cors = require('cors');

const app = express();
let inMemoryData = [];

// ✅ Whitelist your frontend URLs
const whitelist = [
  'https://babfrontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

// ✅ CORS configuration delegate
const corsOptionsDelegate = function (req, callback) {
  const origin = req.header('Origin');
  const isWhitelisted = whitelist.includes(origin);

  console.log('🌐 CORS check for:', origin, '| Allowed:', isWhitelisted);

  const corsOptions = {
    origin: isWhitelisted,
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
  callback(null, corsOptions);
};

// ✅ Apply CORS globally before all routes
app.use(cors(corsOptionsDelegate));
app.options(/.*/, cors(corsOptionsDelegate)); 

// ✅ Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Appointment Booking API',
    status: 'running',
    endpoints: {
      health: '/api/health',
      appointments: '/api/appointments',
      createAppointment: 'POST /api/appointments',
      deleteAppointment: 'DELETE /api/appointments/:id'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/appointments', (req, res) => {
  try {
    console.log('Fetching all appointments');
    const data = [...inMemoryData];
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments', details: err.message });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    console.log('Received appointment request:', req.body);

    const { name, email, dateTime: dateTimeStr, reason = '' } = req.body;

    if (!name || !email || !dateTimeStr) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!dateTimeStr) missingFields.push('dateTime');

      return res.status(400).json({
        error: 'Missing required fields',
        missing: missingFields
      });
    }

    const dateTime = new Date(dateTimeStr);
    if (isNaN(dateTime.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        details: 'Use ISO 8601 format (e.g., 2023-11-06T14:30:00.000Z)'
      });
    }

    const isDuplicate = inMemoryData.some(appt => {
      const apptTime = new Date(appt.dateTime).getTime();
      return Math.abs(apptTime - dateTime.getTime()) < 60000;
    });

    if (isDuplicate) {
      return res.status(400).json({
        error: 'Time slot already booked',
        requestedTime: dateTime.toISOString()
      });
    }

    const appointment = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      dateTime: dateTime.toISOString(),
      reason: reason.trim(),
      createdAt: new Date().toISOString()
    };

    inMemoryData.push(appointment);
    res.status(201).json(appointment);

  } catch (err) {
    console.error('Unexpected error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const appointmentId = Number(id);
    const index = inMemoryData.findIndex(a => a.id === appointmentId);

    if (index === -1) {
      return res.status(404).json({
        error: 'Appointment not found',
        requestedId: id
      });
    }

    inMemoryData = inMemoryData.filter(a => a.id !== appointmentId);
    res.json({
      success: true,
      id: appointmentId,
      deletedAt: new Date().toISOString()
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
