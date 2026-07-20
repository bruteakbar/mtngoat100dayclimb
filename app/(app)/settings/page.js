"use client";

import { useState } from "react";
import { useAccount } from "../AccountProvider";
import { LEVELS } from "@/lib/schedule";

export default function SettingsPage() {
  const { profile, loading, updateProfile } = useAccount();
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  async function handleLevelChange(level) {
    setSaving(true);
    await updateProfile({ level });
    setSaving(false);
    flash();
  }

  async function handleStartDateChange(start_date) {
    if (!start_date) return;
    setSaving(true);
    await updateProfile({ start_date });
    setSaving(false);
    flash();
  }

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  if (loading || !profile) {
    return (
      <div className="card">
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Settings</h2>
      <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
        Your level and start date control which exercises you get each day and which day
        &quot;Today&quot; defaults to when you log in.
      </p>

      <div style={{ marginTop: 14 }}>
        <label style={{ fontSize: ".8rem", color: "var(--muted)" }}>Level</label>
        <div className="filters" style={{ marginTop: 6 }}>
          <select value={profile.level} onChange={(e) => handleLevelChange(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <p style={{ color: "var(--muted)", fontSize: ".78rem", marginTop: 6 }}>
          {LEVELS.find((l) => l.id === profile.level)?.desc}
        </p>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={{ fontSize: ".8rem", color: "var(--muted)" }}>Start date</label>
        <input
          type="date"
          value={profile.start_date}
          onChange={(e) => handleStartDateChange(e.target.value)}
        />
        <p style={{ color: "var(--muted)", fontSize: ".78rem", marginTop: 6 }}>
          Day 1 of your program. Changing this shifts which day &quot;Today&quot; opens to.
        </p>
      </div>

      {(saving || savedFlash) && (
        <div style={{ color: "var(--muted)", fontSize: ".75rem", marginTop: 10 }}>
          {saving ? "Saving..." : "Saved."}
        </div>
      )}
    </div>
  );
}
