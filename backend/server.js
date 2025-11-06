const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 4000;
const DATA_FILE = path.join(__dirname, 'data.json');

const whitelist = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://babf-priyansh.vercel.app/'];

var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// Routes
app.get('/api/appointments', (req, res) => {
  try {
    res.json(readData());
  } catch (err) {
    console.error('Error reading appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
