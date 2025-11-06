import React from "react";

export default function CalendarWeek({ availableSlots = new Set(), appointments = [], onSelect = () => {} }) {
  // Generate Monday–Friday dates for current week
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // shift to Monday

  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Generate time slots (9:00–16:30)
  const times = [];
  for (let h = 9; h < 17; h++) {
    times.push(`${h.toString().padStart(2, "0")}:00`);
    times.push(`${h.toString().padStart(2, "0")}:30`);
  }

  const bookedSet = new Set(appointments.map((a) => a.dateTime));

  const cellIso = (d, t) => {
    const [hh, mm] = t.split(":").map(Number);
    const dt = new Date(d);
    dt.setHours(hh, mm, 0, 0);
    return dt.toISOString();
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <div className="time-col"></div>
        {days.map((d) => (
          <div key={d.toISOString()} className="day-col">
            <div className="day-title">
              {d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>
        ))}
      </div>

      <div className="calendar-body">
        {times.map((t) => (
          <div key={t} className="time-row">
            <div className="time-col">{t}</div>
            {days.map((d) => {
              const iso = cellIso(d, t);
              const isBooked = bookedSet.has(iso);
              const isAvailable = availableSlots && availableSlots.has(iso);
              const isPast = new Date(iso) < new Date();

              return (
                <div key={iso} className="cell">
                  {isBooked ? (
                    <div className="booked">Booked</div>
                  ) : isAvailable && !isPast ? (
                    <button className="slot-btn" onClick={() => onSelect(iso)}>
                      Book
                    </button>
                  ) : (
                    <div className="unavailable">{isPast ? "Past" : "-"}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
