import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function AppointmentsList({ appointments, onCancel, onAppointmentCancelled }) {
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState(null);

  const cancel = async (id) => {
    try {
      setCancellingId(id);
      setError(null);
      
      await api.delete(`/api/appointments/${id}`);
      
      if (onAppointmentCancelled) {
        onAppointmentCancelled();
      }
      if (onCancel) {
        onCancel();
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError(err.message || 'Failed to cancel appointment. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (appointments.length === 0) {
    return (
      <div className="appointments-container">
        <h3 className="appointments-title">Upcoming Appointments</h3>
        <p className="no-appointments">No upcoming appointments.</p>
      </div>
    );
  }

  return (
    <div className="appointments-container">
      <h3 className="appointments-title">Upcoming Appointments</h3>
      <div className="appointments-list">
        {appointments
          .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
          .map((appointment) => (
            <div key={appointment.id} className="appointment-item">
              <div className="appointment-details">
                <div className="appointment-time">
                  {formatDateTime(appointment.dateTime)}
                </div>
                <div className="appointment-info">
                  <span className="appointment-name">{appointment.name}</span>
                  {appointment.reason && (
                    <span className="appointment-reason"> - {appointment.reason}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => cancel(appointment.id)}
                disabled={cancellingId === appointment.id}
                className="cancel-btn"
              >
                {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
