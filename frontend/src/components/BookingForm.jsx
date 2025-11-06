import React, { useState } from "react";

export default function BookingForm({ slot, onBooked, onCancel }) {
  const [form, setForm] = useState({ name: "", email: "", reason: "" });
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");

    try {
      const res = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dateTime: slot }),
      });

      if (res.ok) {
        setMsg("✅ Appointment booked successfully!");
        onBooked();
      } else {
        const err = await res.json();
        setMsg(`❌ ${err.error || "Failed to book appointment"}`);
      }
    } catch {
      setMsg("❌ Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const label = {
    fontWeight: 500,
    color: "#333",
    display: "block",
    marginTop: 10,
    marginBottom: 4,
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ color: "#222", marginTop: 0 }}>
        Booking for{" "}
        {new Date(slot).toLocaleDateString([], {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}
      </h3>

      <label style={label}>Name*</label>
      <input
        required
        placeholder="Your name"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        style={{
          width: "100%",
          padding: 8,
          border: "1px solid #ddd",
          borderRadius: 6,
        }}
      />

      <label style={label}>Email*</label>
      <input
        required
        type="email"
        placeholder="Your email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        style={{
          width: "100%",
          padding: 8,
          border: "1px solid #ddd",
          borderRadius: 6,
        }}
      />

      <label style={label}>Reason (optional)</label>
      <textarea
        maxLength={200}
        placeholder="Reason for appointment"
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
        style={{
          width: "100%",
          padding: 8,
          border: "1px solid #ddd",
          borderRadius: 6,
          minHeight: 60,
        }}
      />

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            flex: 1,
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: 8,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Booking..." : "Confirm Booking"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            background: "#e5e7eb",
            color: "#333",
            border: "none",
            padding: "8px 12px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      {msg && (
        <p
          style={{
            color: msg.startsWith("✅") ? "#16a34a" : "#dc2626",
            marginTop: 10,
          }}
        >
          {msg}
        </p>
      )}
    </form>
  );
}
