# Birdchime Appointment Booking System

A full-stack appointment booking application with an interactive calendar view, built with React (frontend) and Node.js/Express (backend). This application allows users to book, view, and manage appointments through an intuitive interface.

## Features

- **Interactive Weekly Calendar View** - Visual time slot selection with 30-minute intervals
- **Book Appointments** - Simple booking form with name, email, and reason
- **Cancel Appointments** - One-click cancellation directly from the calendar view
- **Real-time Updates** - Appointments refresh automatically after booking/cancellation
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Past Slot Handling** - Automatically disables past time slots
- **Modern UI** - Clean, accessible interface with smooth animations
- **Error Handling** - User-friendly error messages and loading states
- **Form Validation** - Client and server-side validation for all inputs

## Project Structure

```
birdchime-appointment-booking/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── App.jsx           # Main application component
│   │   └── index.css         # Global styles
│   └── package.json
├── backend/                  # Node.js + Express backend
│   ├── server.js            # Main server file
│   ├── data/                # Data storage
│   │   └── data.json        # Appointment data
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
- React 18 with Hooks
- Vite (Build Tool)
- CSS3 with Flexbox/Grid
- React Router for navigation
- Fetch API for HTTP requests
- Responsive Design Principles

### Backend
- Node.js
- Express.js
- Custom CORS middleware
- File-based JSON storage
- RESTful API design

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

- **Data Persistence**: Backend uses a JSON file (`data.json`) for data storage
- **CORS Configuration**: Configured to allow requests from development servers
- **ID Generation**: Appointment IDs are generated using timestamps for uniqueness
- **Time Handling**: All times are displayed in the user's local timezone
- **Code Organization**:
  - Frontend components are modular and reusable
  - CSS is organized with BEM methodology
  - Error boundaries and loading states are implemented throughout
- **Performance**:
  - Code splitting with React.lazy
  - Optimized re-renders with useCallback and useMemo
  - Efficient data fetching with proper loading states

## License

MIT
