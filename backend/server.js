const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use(express.json());

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
    const { name, email, dateTime, reason = '' } = req.body;
    if (!name || !email || !dateTime) {
      return res.status(400).json({ error: 'Name, email, and dateTime are required' });
    }

    const data = readData();
    if (data.some(a => a.dateTime === dateTime)) {
      return res.status(400).json({ error: 'Time slot already booked' });
    }

    const appointment = { id: Date.now(), name, email, dateTime, reason, createdAt: new Date().toISOString() };
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
