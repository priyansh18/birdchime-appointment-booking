const express = require('express');
const cors = require('cors');

const app = express();

var dynamicCorsOptions = function(req, callback) {
  var corsOptions;
  if (req.path.startsWith('/api/appointments')) {
    corsOptions = {
      origin: 'https://babfrontend.vercel.app', // Allow only a specific origin
      credentials: true,            // Enable cookies and credentials
    };
  } else {
    corsOptions = { origin: '*' };   // Allow all origins for other routes
  }
  callback(null, corsOptions);
};

app.use(cors(dynamicCorsOptions));

let inMemoryData = [];

// // Uncomment it out if in development mode
// // app.use(morgan("tiny"));
// var whitelist = [
//   "https://babfrontend.vercel.app/",
//   "https://babfrontend.vercel.app",
//   "http://localhost:5173", // for react apps
//   "http://localhost:3000", // for react apps
//   "http://localhost:4000", // for react apps
// ];

// var corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
// };


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    const data = [...inMemoryData];
    console.log(`Found ${data.length} appointments`);
    res.json(data);
  } catch (err) {
    console.error('Error reading appointments:', err);
    res.status(500).json({ 
      error: 'Failed to fetch appointments',
      details: err.message
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

    const data = [...inMemoryData];
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

    try {
      inMemoryData = [...inMemoryData, appointment]
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

    const data = [...inMemoryData];
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

    try {
      inMemoryData = data.filter((item) => item.id !== appointmentId);
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
