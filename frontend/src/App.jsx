import React, { useEffect, useState } from "react";
import BookingModal from "./components/BookingModal";
import AppointmentsList from "./components/AppointmentsList";
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
                        className={`time-slot ${isCurrentHour ? 'current-hour' : ''} ${isPast ? 'disabled' : ''} ${appt ? 'booked' : ''}`}
                      >
                        <div className="time-label">
                          {s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="slot-content">
                          {appt ? (
                            <div className="booked-slot">
                              <div className="booked-info">
                                <span className="booked-badge">Booked</span>
                                <div className="booked-by">{appt.name}</div>
                              </div>
                              <button 
                                className="cancel-appointment-btn"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!window.confirm(`Are you sure you want to cancel this appointment with ${appt.name}?`)) {
                                    return;
                                  }
                                  
                                  try {
                                    console.log('Attempting to cancel appointment:', {
                                      id: appt.id,
                                      type: typeof appt.id,
                                      name: appt.name,
                                      dateTime: appt.dateTime
                                    });

                                    const response = await fetch(`http://localhost:4000/api/appointments/${appt.id}`, { 
                                      method: 'DELETE',
                                      headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json'
                                      }
                                    });

                                    console.log('Response status:', response.status);
                                    
                                    if (!response.ok) {
                                      const errorData = await response.json().catch(() => ({}));
                                      console.error('Error response:', errorData);
                                      throw new Error(errorData.error || 'Failed to cancel appointment');
                                    }

                                    const result = await response.json();
                                    console.log('Successfully cancelled appointment:', result);
                                    
                                    // Refresh the appointments list
                                    await fetchAppointments();
                                    
                                    // Show success message
                                    alert('Appointment cancelled successfully!');
                                    
                                  } catch (error) {
                                    console.error('Error cancelling appointment:', error);
                                    alert(`Error: ${error.message || 'Failed to cancel appointment'}`);
                                  }
                                }}
                              >
                                Cancel
                              </button>
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
            <AppointmentsList 
              appointments={appointments.filter(a => new Date(a.dateTime) > new Date())}
              onAppointmentCancelled={fetchAppointments}
            />
          </div>
        </>
      )}
    </div>
  );
}
