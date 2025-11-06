const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'data.json');

// In-memory storage for Vercel (read-only filesystem)
let inMemoryData = [];

// Enable CORS for all routes
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://babb-priyansh.vercel.app',
  'https://babf-priyansh.vercel.app',
  'https://birdchime-appointment-booking.vercel.app',
  'https://appointment-scheduler-server.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app') || 
        origin.endsWith('birdchime-appointment-booking.vercel.app')) {
      return callback(null, true);
    }
    
    console.log('CORS blocked for origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
app.use(express.json());

// Initialize data file if it doesn't exist (only for local development)
if (process.env.NODE_ENV !== 'production') {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
  }
  // Load existing data into memory
  try {
    inMemoryData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (error) {
    console.log('No existing data file, starting fresh');
    inMemoryData = [];
  }
} else {
  console.log('Running in production mode - using in-memory storage');
}

const readData = () => {
  // In production (Vercel), use in-memory storage
  if (process.env.NODE_ENV === 'production') {
    return inMemoryData;
  }
  
  // In development, read from file
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading data file:', error);
    return [];
  }
};

const writeData = (data) => {
  // In production (Vercel), use in-memory storage
  if (process.env.NODE_ENV === 'production') {
    inMemoryData = data;
    return;
  }
  
  // In development, write to file
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data file:', error);
    throw error;
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/appointments', (req, res) => {
  try {
    console.log('Fetching all appointments');
    const data = readData();
    console.log(`Found ${data.length} appointments`);
    res.json(data);
  } catch (err) {
    console.error('Error reading appointments:', err);
    res.status(500).json({ 
      error: 'Failed to fetch appointments',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    const { name, email, dateTime: dateTimeStr, reason = '' } = req.body;

    // Validate required fields
    if (!name || !email || !dateTimeStr) {
      return res.status(400).json({ error: 'Name, email, and dateTime are required' });
    }

    // Parse and validate date
    const dateTime = new Date(dateTimeStr);
    if (isNaN(dateTime.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Please use ISO 8601 format' });
    }

    const data = readData();

    // Check for duplicate appointments
    if (data.some(a => new Date(a.dateTime).getTime() === dateTime.getTime())) {
      return res.status(400).json({ error: 'Time slot already booked' });
    }

    const appointment = {
      id: Date.now(),
      name,
      email,
      dateTime: dateTime.toISOString(),
      reason,
      createdAt: new Date().toISOString()
    };

    data.push(appointment);
    writeData(data);
    res.status(201).json(appointment);
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Appointment ID is required' });

    const data = readData();
    const index = data.findIndex(a => a.id.toString() === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    data.splice(index, 1);
    writeData(data);
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Storage mode: ${process.env.NODE_ENV === 'production' ? 'in-memory' : 'file-based'}`);
});
