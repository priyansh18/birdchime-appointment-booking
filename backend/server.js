const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;
const isVercel = process.env.VERCEL === '1';
const DATA_FILE = isVercel ? null : path.join(__dirname, 'data.json');

// In-memory storage for Vercel (read-only filesystem)
let inMemoryData = [];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS with specific options
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200,
  credentials: true,
  preflightContinue: false
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route to verify CORS is working
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'CORS is working!' });
});

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
  return new Promise((resolve, reject) => {
    // In production (Vercel), use in-memory storage
    if (process.env.NODE_ENV === 'production') {
      inMemoryData = [...data]; // Create a new array to ensure immutability
      console.log('Data updated in memory. Current count:', inMemoryData.length);
      return resolve();
    }
    
    // In development, write to file
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) {
          console.error('Error writing data file:', err);
          return reject(err);
        }
        console.log('Data successfully written to file');
        resolve();
      });
    } catch (error) {
      console.error('Error in writeData:', error);
      reject(error);
    }
  });
};

// Routes
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

app.post('/api/appointments', async (req, res) => {
  try {
    console.log('Received appointment request:', req.body);
    
    // Ensure we have a valid request body
    if (!req.body) {
      console.error('No request body received');
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, email, dateTime: dateTimeStr, reason = '' } = req.body;

    // Validate required fields
    if (!name || !email || !dateTimeStr) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!dateTimeStr) missingFields.push('dateTime');
      
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({ 
        error: 'Missing required fields',
        missing: missingFields
      });
    }

    // Parse and validate date
    const dateTime = new Date(dateTimeStr);
    if (isNaN(dateTime.getTime())) {
      console.error('Invalid date format received:', dateTimeStr);
      return res.status(400).json({ 
        error: 'Invalid date format',
        details: 'Please use ISO 8601 format (e.g., 2023-11-06T14:30:00.000Z)'
      });
    }

    const data = readData();
    console.log(`Current appointments count: ${data.length}`);

    // Check for duplicate appointments (within the same minute to avoid millisecond precision issues)
    const appointmentTime = dateTime.getTime();
    const isDuplicate = data.some(appt => {
      const apptTime = new Date(appt.dateTime).getTime();
      return Math.abs(apptTime - appointmentTime) < 60000; // 60 seconds
    });

    if (isDuplicate) {
      console.error('Time slot already booked:', dateTime.toISOString());
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
      reason: reason ? reason.trim() : '',
      createdAt: new Date().toISOString()
    };

    console.log('Creating new appointment:', appointment);
    data.push(appointment);
    
    try {
      await writeData(data);
      console.log('Appointment created successfully');
      return res.status(201).json(appointment);
    } catch (writeError) {
      console.error('Failed to save appointment:', writeError);
      return res.status(500).json({ 
        error: 'Failed to save appointment',
        details: process.env.NODE_ENV === 'development' ? writeError.message : undefined
      });
    }
  } catch (err) {
    console.error('Unexpected error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Received delete request for appointment ID: ${id}`);
    
    if (!id) {
      console.error('No appointment ID provided');
      return res.status(400).json({ 
        error: 'Appointment ID is required',
        details: 'Please provide a valid appointment ID'
      });
    }

    const data = readData();
    const appointmentId = Number(id);
    const index = data.findIndex(a => a.id === appointmentId);
    
    if (index === -1) {
      console.error(`Appointment with ID ${id} not found`);
      return res.status(404).json({ 
        error: 'Appointment not found',
        requestedId: id,
        availableIds: data.map(a => a.id).slice(0, 10) // Show first 10 IDs for debugging
      });
    }

    const [deletedAppointment] = data.splice(index, 1);
    
    try {
      await writeData(data);
      console.log(`Successfully deleted appointment: ${id}`);
      return res.json({ 
        success: true, 
        id: appointmentId,
        deletedAt: new Date().toISOString()
      });
    } catch (writeError) {
      console.error('Failed to save after deletion:', writeError);
      return res.status(500).json({ 
        error: 'Failed to save changes after deletion',
        details: process.env.NODE_ENV === 'development' ? writeError.message : undefined
      });
    }
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// For Vercel serverless functions
exports.handler = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Forward the request to Express
  return app(req, res);
};

// Only start the server if running locally (not in Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Storage mode: ${process.env.NODE_ENV === 'production' ? 'in-memory' : 'file-based'}`);
  });
}
