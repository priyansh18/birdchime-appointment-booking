const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ✅ full CORS setup: this handles GET, POST, DELETE, and OPTIONS preflight */
const whitelist = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];
 
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

const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
