import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/UpcomingAppointments.css';

const UpcomingAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/api/appointments");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
      setError('Failed to load appointments. Please try again later.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/appointments/${appointmentId}`, { 
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to cancel appointment');
      }

      await fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert(`Error: ${error.message || 'Failed to cancel appointment'}`);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const upcomingAppointments = appointments
    .filter(appt => new Date(appt.dateTime) > new Date())
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your appointments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchAppointments} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="upcoming-appointments">
      <div className="appointments-header">
        <h2>My Upcoming Appointments</h2>
        <Link to="/" className="back-link">
          &larr; Back to Calendar
        </Link>
      </div>

      {upcomingAppointments.length === 0 ? (
        <div className="no-appointments">
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No Upcoming Appointments</h3>
            <p>You don't have any scheduled appointments yet.</p>
            <Link to="/" className="book-button">
              Book an Appointment
            </Link>
          </div>
        </div>
      ) : (
        <div className="appointments-grid">
          {upcomingAppointments.map((appointment) => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-time">
                <div className="date">
                  {new Date(appointment.dateTime).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="time">
                  {new Date(appointment.dateTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
              <div className="appointment-details">
                <h3>{appointment.name || 'No Name Provided'}</h3>
                <p className="appointment-email">{appointment.email}</p>
                {appointment.notes && (
                  <p className="appointment-notes">{appointment.notes}</p>
                )}
              </div>
              <button 
                className="cancel-button"
                onClick={() => handleCancelAppointment(appointment.id)}
                aria-label="Cancel appointment"
              >
                <span className="cancel-icon">✕</span>
                <span className="cancel-text">Cancel</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingAppointments;
