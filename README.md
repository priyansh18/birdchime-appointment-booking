# Birdchime Appointment Booking

A simple appointment booking system with a weekly calendar view.

## Core Features

- View available time slots in a weekly calendar
- Book appointments with name, email, and reason
- Cancel existing appointments
- Real-time updates when booking or canceling
- Mobile-responsive design

## How to Use

1. **Book an Appointment**
   - Click on an available time slot
   - Fill in the booking form
   - Click "Book Appointment"

2. **Cancel an Appointment**
   - Click the "Cancel" button on a booked slot
   - Confirm the cancellation

## API Endpoints

- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create new appointment
- `DELETE /api/appointments/:id` - Cancel appointment

## Deployment

**Frontend**: [https://babfrontend.vercel.app](https://babfrontend.vercel.app)

**Important Note**: The backend uses in-memory storage on Vercel (due to read-only filesystem). Data will be reset when the server restarts. For production use, consider integrating a database like MongoDB, PostgreSQL, or Supabase.
