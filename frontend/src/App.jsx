import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookingModal from './components/BookingModal';
import UpcomingAppointments from './pages/UpcomingAppointments';
import './index.css';
import './App.css';
import {API_URL} from "./constants";

const TimeSlot = ({ slot, appointment, onBook, onCancel }) => {
  const isPast = slot.getTime() < Date.now();
  const isCurrentHour = new Date().getHours() === slot.getHours() && 
                       new Date().getDate() === slot.getDate();

  return (
    <div className={`time-slot ${isCurrentHour ? 'current-hour' : ''} ${isPast ? 'disabled' : ''} ${appointment ? 'booked' : ''}`}>
      <div className="time-label">
        {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="slot-content">
        {appointment ? (
          <div className="booked-slot">
            <div className="booked-info">
              <span className="booked-badge">Booked</span>
              <div className="booked-by">{appointment.name}</div>
            </div>
            <button className="cancel-appointment-btn" onClick={(e) => onCancel(e, appointment)}>
              Cancel
            </button>
          </div>
        ) : isPast ? (
          <div className="past-slot">Not available</div>
        ) : (
          <button className="book-button" onClick={() => onBook(slot)}>Book</button>
        )}
      </div>
    </div>
  );
};

const DayColumn = ({ day, slots, appointments, onBook, onCancel }) => {
  const findAppointment = (slot) => {
    if (!Array.isArray(appointments)) {
      console.error('appointments is not an array:', appointments);
      return null;
    }
    if (!(slot instanceof Date) || isNaN(slot.getTime())) {
      console.error('Invalid slot date:', slot);
      return null;
    }
    return appointments.find(a => {
      try {
        if (!a || !a.dateTime) return false;
        const appointmentDate = new Date(a.dateTime);
        return !isNaN(appointmentDate.getTime()) && 
               appointmentDate.getTime() === slot.getTime();
      } catch (error) {
        console.error('Error processing appointment:', error);
        return false;
      }
    }) || null;
  };

  return (
    <div className="day-column">
      <div className="day-header">
        <div className="day-name">{day}</div>
        <div className="day-date">
          {slots[0].toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </div>
      </div>
      <div className="time-slots">
        {slots.map((slot) => (
          <TimeSlot
            key={slot.toISOString()}
            slot={slot}
            appointment={findAppointment(slot)}
            onBook={onBook}
            onCancel={onCancel}
          />
        ))}
      </div>
    </div>
  );
};
const CalendarPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      // Ensure the URL ends with a single slash
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const res = await fetch(`${baseUrl}/api/appointments`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch appointments: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        console.error('Expected array of appointments but got:', data);
        throw new Error('Invalid response format: expected array of appointments');
      }
      
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const generateWeekSlots = () => {
    const now = new Date();
    const startDay = new Date(now);
    startDay.setDate(now.getDate() - 1); // Start from yesterday
    startDay.setHours(0, 0, 0, 0);

    return Array(5).fill().flatMap((_, dayOffset) => {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + dayOffset);
      
      return Array(16).fill().map((_, i) => {
        const slot = new Date(day);
        const hour = 9 + Math.floor(i / 2);
        const minute = (i % 2) * 30;
        if (hour >= 17) return null;
        
        slot.setHours(hour, minute, 0, 0);
        return slot;
      }).filter(Boolean);
    });
  };

  const slots = generateWeekSlots();
  const slotsByDay = slots.reduce((acc, slot) => {
    const day = slot.toLocaleDateString([], { weekday: 'long' });
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});

  const handleBooked = async (newAppointment) => {
    try {
      setAppointments(prev => {
        // Ensure prev is an array, fallback to empty array if not
        const prevAppointments = Array.isArray(prev) ? [...prev] : [];
        
        // Ensure newAppointment is valid
        if (!newAppointment || typeof newAppointment !== 'object') {
          console.error('Invalid appointment data:', newAppointment);
          return prevAppointments;
        }
        
        // Create new array with the new appointment and sort by date
        const updatedAppointments = [...prevAppointments, newAppointment];
        return updatedAppointments.sort((a, b) => {
          const dateA = a?.dateTime ? new Date(a.dateTime) : 0;
          const dateB = b?.dateTime ? new Date(b.dateTime) : 0;
          return dateA - dateB;
        });
      });
      
      setSelectedSlot(null);
      await fetchAppointments();
    } catch (error) {
      console.error('Error handling booked appointment:', error);
    }
  };

  const handleCancel = async (e, appointment) => {
    e.stopPropagation();
    if (!appointment?.id) {
      console.error('No appointment ID provided for cancellation');
      return;
    }
    
    if (!window.confirm(`Cancel appointment with ${appointment.name || 'this person'}?`)) {
      return;
    }
    
    try {
      // Ensure the URL is properly formatted
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const url = `${baseUrl}/api/appointments/${appointment.id}`;
      console.log('Sending DELETE request to:', url);
      
      const response = await fetch(url, { 
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        mode: 'cors'
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use the status text
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      // Refresh the appointments list
      await fetchAppointments();
      alert('Appointment cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling appointment:', {
        error: error.message,
        stack: error.stack,
        appointmentId: appointment?.id
      });
      alert(`Error: ${error.message || 'Failed to cancel appointment. Please try again.'}`);
    }
  };

  return (
    <div className="app-light">
      <nav className="main-nav">
        <div className="nav-container">
          <h1>Appointment Scheduler</h1>
          <div className="nav-links">
            <Link to="/" className="nav-link active">Calendar</Link>
            <Link to="/upcoming" className="nav-link">My Appointments</Link>
          </div>
        </div>
      </nav>
      
      <div className="header">
        <h2>Weekly Appointment Slots</h2>
        <p className="subtitle">
          30-minute slots | {new Date().toLocaleDateString([], { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <p>Loading appointments…</p>
      ) : (
        <>
          <div className="week-view">
            {Object.entries(slotsByDay).map(([day, daySlots]) => (
              <DayColumn
                key={day}
                day={day}
                slots={daySlots}
                appointments={appointments}
                onBook={setSelectedSlot}
                onCancel={handleCancel}
              />
            ))}
          </div>

          {selectedSlot && (
            <BookingModal
              slotIso={selectedSlot.toISOString()}
              onClose={() => setSelectedSlot(null)}
              onBooked={handleBooked}
            />
          )}

          <div className="view-appointments-container">
            <Link to="/upcoming" className="view-appointments-btn">
              View My Appointments
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<CalendarPage />} />
      <Route path="/upcoming" element={
        <div className="app-light">
          <nav className="main-nav">
            <div className="nav-container">
              <h1>Appointment Scheduler</h1>
              <div className="nav-links">
                <Link to="/" className="nav-link">Calendar</Link>
                <Link to="/upcoming" className="nav-link active">My Appointments</Link>
              </div>
            </div>
          </nav>
          <UpcomingAppointments />
        </div>
      } />
    </Routes>
  </Router>
);

export default App;
