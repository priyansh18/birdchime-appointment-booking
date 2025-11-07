const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const express = require('express');
const cors = require('cors');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Create Express server
const server = express();

// Enable CORS
server.use(cors({
  origin: [
    'https://birdchime-appointment-booking-31.onrender.com',
    'https://birdchime-appointment-booking-32.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
server.options('*', cors());

// Body parsing middleware
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Import your API routes
const apiRouter = require('../backend/server');
server.use('/api', apiRouter);

// Handle all other requests with Next.js
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

// Start the server
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  nextApp.prepare().then(() => {
    server.all('*', (req, res) => {
      return nextHandler(req, res);
    });

    server.listen(PORT, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${PORT}`);
    });
  });
}

module.exports = server;
