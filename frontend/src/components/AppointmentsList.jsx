export default function AppointmentsList({ appointments, onCancel }) {
  const cancel = async (id) => {
    await fetch(`http://localhost:4000/api/appointments/${id}`, { method: "DELETE" });
    onCancel();
  };

  return (
    <div>
      <h3>Booked Appointments</h3>
      {appointments.length === 0 && <p>No appointments yet.</p>}
      {appointments.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)).map(a => (
        <div key={a.id} style={{ marginBottom: 6 }}>
          {new Date(a.dateTime).toLocaleString()} - {a.name} ({a.reason || "No reason"})
          <button onClick={() => cancel(a.id)}>Cancel</button>
        </div>
      ))}
    </div>
  );
}
