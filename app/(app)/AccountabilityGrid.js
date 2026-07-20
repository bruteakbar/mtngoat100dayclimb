"use client";

import { useRouter } from "next/navigation";
import { dayNumberFromStartDate } from "@/lib/db";

// 10x10 master accountability layout: one cell per day (1-100).
//   blue  = completed
//   brown = missed (day already passed and never marked done)
//   plain = not due yet (or is today, still in progress)
// When `linkable` is true (viewing your own grid), clicking a cell jumps
// you back to that day on Today so you can fill in anything you missed.
export default function AccountabilityGrid({ startDate, doneDays, linkable = true }) {
  const router = useRouter();
  const currentDay = dayNumberFromStartDate(startDate);

  const cells = [];
  for (let day = 1; day <= 100; day++) {
    let status = "future";
    if (day < currentDay) status = doneDays.has(day) ? "done" : "missed";
    else if (day === currentDay) status = doneDays.has(day) ? "done" : "today";

    const classes = ["accountability-cell", status === "done" ? "done" : status === "missed" ? "missed" : "", linkable ? "clickable" : ""]
      .filter(Boolean)
      .join(" ");

    const title = `Day ${day} — ${status === "done" ? "Completed" : status === "missed" ? "Missed" : status === "today" ? "Today" : "Not yet due"}`;

    cells.push(
      <button
        key={day}
        type="button"
        className={classes}
        title={title}
        aria-label={title}
        onClick={linkable ? () => router.push(`/today?day=${day}`) : undefined}
        disabled={!linkable}
      />
    );
  }

  return (
    <>
      <div className="accountability-grid">{cells}</div>
      <div className="legend" style={{ marginTop: 10 }}>
        <span>
          <span className="dot" style={{ background: "var(--strength)", borderRadius: 3 }}></span>Completed
        </span>
        <span>
          <span className="dot" style={{ background: "var(--missed)", borderRadius: 3 }}></span>Missed
        </span>
        <span>
          <span className="dot" style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 3 }}></span>Not yet due
        </span>
      </div>
    </>
  );
}
