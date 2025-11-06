import React, { useEffect, useState } from "react";
import BookingModal from "./components/BookingModal";
import "./index.css";

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null); // ISO string
  const [loading, setLoading] = useState(true);

  // fetch appointments from backend
  async function fetchAppointments() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/appointments");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Fetched appointments:', data); // Debug log
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  // generate Mon-Fri slots for current week, 9:00-16:30 (30-min increments)
  function generateWeekSlots() {
    const now = new Date();
    // get Monday of current week
    const monday = new Date(now);
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday=0
    monday.setDate(now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const slots = [];
    // Generate for current week (7 days)
    for (let d = 0; d < 7; d++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + d);
      
      // Skip weekends
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      
      // Generate time slots from 9:00 to 16:30 with 30-minute intervals
      for (let hour = 9; hour < 17; hour++) {
        for (let minute of [0, 30]) {
          // Skip 17:00 slot since we only go up to 16:30
          if (hour === 16 && minute === 30) continue;
          
          const slot = new Date(day);
          slot.setHours(hour, minute, 0, 0);
          slots.push(slot);
        }
      }
    }
    return slots;
  }

  const slots = generateWeekSlots();

  // helper: check if slot is booked (compare by exact time)
  function findAppointmentForSlot(slotDate) {
    return appointments.find((a) => {
      const d = new Date(a.dateTime);
      return d.getTime() === slotDate.getTime();
    });
  }
  
  // Check if a slot is booked
  const isSlotBooked = (slotDate) => {
    return appointments.some(a => {
      const d = new Date(a.dateTime);
      return d.getTime() === slotDate.getTime();
    });
  };

  // open modal for a slot
  function openForSlot(slotDate) {
    setSelectedSlot(slotDate.toISOString());
  }

  // after successful booking: update state and close modal
  async function onBooked(newAppointment) {
    // Add the new appointment to the local state immediately for better UX
    setAppointments(prev => [...prev, newAppointment].sort((a, b) => 
      new Date(a.dateTime) - new Date(b.dateTime)
    ));
    setSelectedSlot(null);
    
    // Then refresh from server to ensure consistency
    await fetchAppointments();
  }

  // Group slots by day of week
  const slotsByDay = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Initialize empty arrays for each day
  days.forEach(day => {
    slotsByDay[day] = [];
  });
  
  // Group slots by day
  slots.forEach(slot => {
    const dayName = slot.toLocaleDateString([], { weekday: 'long' });
    slotsByDay[dayName].push(slot);
  });
  
  // Filter out empty days and weekends
  const weekDays = days
    .filter(day => day !== 'Saturday' && day !== 'Sunday')
    .filter(day => slotsByDay[day].length > 0);

  return (
    <div className="app-light">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1>Weekly Appointment Slots</h1>
        <p style={{ color: '#666', marginTop: '8px' }}>30-minute slots | {new Date().toLocaleDateString([], { month: 'long', year: 'numeric' })}</p>
      </div>

      {loading ? (
        <p>Loading appointments…</p>
      ) : (
        <>
          <div className="week-view">
            {weekDays.map((day) => (
              <div key={day} className="day-column">
                <div className="day-header">
                  <div className="day-name">{day}</div>
                  <div className="day-date">
                    {slotsByDay[day][0].toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="time-slots">
                  {slotsByDay[day].map((s) => {
                    const iso = s.toISOString();
                    const appt = findAppointmentForSlot(s);
                    const isPast = s.getTime() < Date.now();
                    const isCurrentHour = new Date().getHours() === s.getHours() && 
                                       new Date().getDate() === s.getDate();
                    
                    return (
                      <div 
                        key={iso} 
                        className={`time-slot ${isCurrentHour ? 'current-hour' : ''} ${isPast || appt ? 'disabled' : ''}`}
                      >
                        <div className="time-label">
                          {s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="slot-content">
                          {appt ? (
                            <div className="booked-slot">
                              <span className="booked-badge">Booked</span>
                              <div className="booked-by">{appt.name}</div>
                            </div>
                          ) : isPast ? (
                            <div className="past-slot">
                              Not available
                            </div>
                          ) : (
                            <button 
                              className="book-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openForSlot(s);
                              }}
                            >
                              Book
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {selectedSlot && (
            <BookingModal
              slotIso={selectedSlot}
              onClose={() => setSelectedSlot(null)}
              onBooked={onBooked}
            />
          )}

          <div className="appointments-section">
            <h2 style={{ margin: '40px 0 20px', color: '#2d3748' }}>Upcoming Appointments</h2>
            {appointments.length === 0 ? (
              <p className="no-appointments">No upcoming appointments. Book a slot above to get started!</p>
            ) : (
              <div className="appointments-list">
                {appointments
                  .slice()
                  .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
                  .map((a) => (
                    <div key={a.id} className="appointment-row">
                      <div className="appointment-time">
                        <div className="appointment-date">
                          {new Date(a.dateTime).toLocaleDateString([], {
                            weekday: "short",
                            day: "numeric",
                            month: "short"
                          })}
                        </div>
                        <div className="appointment-time-slot">
                          {new Date(a.dateTime).toLocaleTimeString([], { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </div>
                      </div>
                      <div className="appointment-details">
                        <div className="appointment-header">
                          <h4 className="appointment-name">{a.name}</h4>
                          <a href={`mailto:${a.email}`} className="appointment-email">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                              <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            {a.email}
                          </a>
                        </div>
                        {a.reason && (
                          <div className="appointment-reason">
                            <span className="reason-label">Reason:</span>
                            <span className="reason-text">{a.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
