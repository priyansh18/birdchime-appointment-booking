import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import corsOptions from './config/cors.js';

const app = express();
let inMemoryData = [];

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.get('/api/appointments', (_, res) => res.json([...inMemoryData]));

app.get('/api/appointments/upcoming', (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Start and end dates required' });
    
    const startDate = new Date(start), endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate)) return res.status(400).json({ error: 'Invalid date format' });
    
    return res.json(inMemoryData.filter(a => {
      const d = new Date(a.dateTime);
      return d >= startDate && d <= endDate;
    }));
  } catch {
    return res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    const { name, email, dateTime: dateTimeStr, reason = '' } = req.body;
    if (!name || !email || !dateTimeStr) return res.status(400).json({ error: 'Missing required fields' });

    const dateTime = new Date(dateTimeStr);
    if (isNaN(dateTime)) return res.status(400).json({ error: 'Invalid date format' });

    if (inMemoryData.some(a => Math.abs(new Date(a.dateTime) - dateTime) < 60000)) {
      return res.status(400).json({ error: 'Time slot already booked' });
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
    return res.status(201).json(appointment);
  } catch {
    return res.status(500).json({ error: 'Failed to create appointment' });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!inMemoryData.some(a => a.id === id)) return res.status(404).json({ error: 'Not found' });
    
    inMemoryData = inMemoryData.filter(a => a.id !== id);
    return res.json({ success: true, id, deletedAt: new Date().toISOString() });
  } catch {
    return res.status(500).json({ error: 'Failed to delete' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
