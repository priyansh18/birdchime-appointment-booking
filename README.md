# Birdchime Appointment Booking System

A full-stack appointment booking application with an interactive calendar view, built with React (frontend) and Node.js/Express (backend).

## Features

- **Interactive Weekly Calendar View** - Visual time slot selection with 30-minute intervals
- **Book Appointments** - Simple booking form with name, email, and reason
- **Cancel Appointments** - One-click cancellation directly from the calendar view
- **Real-time Updates** - Appointments refresh automatically after booking/cancellation
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Past Slot Handling** - Automatically disables past time slots

## Project Structure

```
birdchime-appointment-booking/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
├── backend/           # Node.js + Express backend
│   ├── server.js
│   ├── data.json      # Appointment data storage
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   node server.js
   ```
   
   The backend will run on `http://localhost:4000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
   The frontend will run on `http://localhost:5173`

## API Endpoints

- `GET /api/appointments` - Fetch all appointments
- `POST /api/appointments` - Create a new appointment
- `DELETE /api/appointments/:id` - Cancel an appointment

## Technologies Used

### Frontend
- React 18
- Vite
- CSS3 with modern styling
- Fetch API for HTTP requests

### Backend
- Node.js
- Express.js
- CORS middleware
- File-based JSON storage

## Usage

1. **Book an Appointment**:
   - Click on an available time slot in the calendar
   - Fill in your name, email, and reason for appointment
   - Click "Book Appointment"

2. **Cancel an Appointment**:
   - Click the red "Cancel" button on any booked slot
   - Confirm the cancellation in the dialog

3. **View Appointments**:
   - Booked slots are highlighted in the calendar
   - Upcoming appointments are listed below the calendar

## Development Notes

- The backend uses a simple JSON file (`data.json`) for data persistence
- CORS is configured to allow requests from `localhost:5173` and `localhost:5174`
- Appointment IDs are generated using timestamps
- All times are displayed in the user's local timezone

## License

MIT
