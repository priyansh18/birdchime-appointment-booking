const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();

// CORS middleware - handle all CORS manually
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple test endpoint
app.get('/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    timestamp: new Date().toISOString()
  });
});

const DATA_FILE = "./data.json";
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// ✅ POST: create new appointment
app.post("/api/appointments", (req, res) => {
  try {
    const { name, email, dateTime, reason } = req.body;

    if (!name || !email || !dateTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const data = readData();

    // prevent duplicate date bookings
    if (data.find((a) => a.dateTime === dateTime)) {
      return res.status(400).json({ error: "Slot already booked" });
    }

    const appointment = {
      id: Date.now(),
      name,
      email,
      dateTime,
      reason: reason || "",
      createdAt: new Date().toISOString(),
    };

    data.push(appointment);
    writeData(data);
    return res.status(201).json(appointment);
  } catch (err) {
    console.error("❌ Server crash on POST /api/appointments:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ GET all appointments
app.get("/api/appointments", (req, res) => {
  res.json(readData());
});

// ✅ DELETE: cancel an appointment
app.delete("/api/appointments/:id", (req, res) => {
  try {
    const id = req.params.id;
    console.log('\n=== DELETE REQUEST ===');
    console.log('Deleting appointment with ID:', id);
    
    if (!id) {
      console.log('Error: No ID provided');
      return res.status(400).json({ 
        success: false,
        error: 'Appointment ID is required' 
      });
    }
    
    // Read current data
    let data;
    try {
      data = readData();
      console.log('Current appointments:', data.length);
    } catch (err) {
      console.error('Error reading data file:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Error reading appointments data' 
      });
    }
    
    // Find the index of the appointment to delete
    const appointmentIndex = data.findIndex(a => {
      const match = a.id.toString() === id.toString();
      console.log(`Checking ${a.id} (${typeof a.id}) vs ${id} (${typeof id}) -> ${match}`);
      return match;
    });
    
    if (appointmentIndex === -1) {
      console.log('Appointment not found with ID:', id);
      return res.status(404).json({ 
        success: false, 
        error: `Appointment not found with ID: ${id}`
      });
    }
    
    // Remove the appointment
    data.splice(appointmentIndex, 1);
    
    // Save the updated data
    try {
      writeData(data);
      console.log('Successfully deleted appointment with ID:', id);
      
      // Send success response
      return res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        deletedId: id
      });
      
    } catch (err) {
      console.error('Error writing data file:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save changes' 
      });
    }
    
  } catch (err) {
    console.error('Unexpected error in DELETE /api/appointments:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});


const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
