"use client";

import { useState } from "react";
import { usePeople } from "../PersonProvider";
import { LEVELS } from "@/lib/schedule";

export default function PeoplePage() {
  const { people, activeId, setActivePersonId, addPerson, updatePerson, deletePerson, loading } =
    usePeople();
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState("beginner");
  const [newStart, setNewStart] = useState(new Date().toISOString().slice(0, 10));
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    setAdding(true);
    try {
      await addPerson({ name: newName.trim(), level: newLevel, startDate: newStart });
      setNewName("");
      setNewLevel("beginner");
      setNewStart(new Date().toISOString().slice(0, 10));
    } catch (err) {
      setError(err.message || "Couldn't add that person.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    await deletePerson(id);
    setConfirmDelete(null);
  }

  return (
    <>
      <div className="card">
        <h2>Add a Person</h2>
        <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
          Add anyone you want to track — family, a client, a training partner. They don&apos;t
          need their own login; you switch between them from the dropdown under the tabs.
        </p>
        <form onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <div className="filters" style={{ marginTop: 8 }}>
            <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
              {LEVELS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="primary" type="submit" disabled={adding}>
            {adding ? "Adding..." : "Add Person"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="card">
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        </div>
      ) : (
        people.map((p) => (
          <div className="card" key={p.id}>
            <div className="row">
              <input
                type="text"
                defaultValue={p.name}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value && value !== p.name) updatePerson(p.id, { name: value });
                }}
                style={{ fontWeight: 600, fontSize: "1rem", marginTop: 0, flex: 1, minWidth: 120 }}
              />
              {p.id === activeId ? (
                <span className="pill strength">Active</span>
              ) : (
                <button className="small-btn" onClick={() => setActivePersonId(p.id)}>
                  Set Active
                </button>
              )}
            </div>

            <div className="filters" style={{ marginTop: 10 }}>
              <select value={p.level} onChange={(e) => updatePerson(p.id, { level: e.target.value })}>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={p.start_date}
                onChange={(e) => updatePerson(p.id, { start_date: e.target.value })}
              />
            </div>
            <p style={{ color: "var(--muted)", fontSize: ".78rem", marginTop: 6 }}>
              {LEVELS.find((l) => l.id === p.level)?.desc}
            </p>

            {confirmDelete === p.id ? (
              <div className="note" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span>Delete {p.name} and all of their logged days? This can&apos;t be undone.</span>
                <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className="small-btn" onClick={() => handleDelete(p.id)}>
                    Delete
                  </button>
                  <button className="small-btn" onClick={() => setConfirmDelete(null)}>
                    Cancel
                  </button>
                </span>
              </div>
            ) : (
              people.length > 1 && (
                <button
                  className="small-btn"
                  style={{ marginTop: 10, color: "var(--hiit)" }}
                  onClick={() => setConfirmDelete(p.id)}
                >
                  Remove Person
                </button>
              )
            )}
          </div>
        ))
      )}
    </>
  );
}
