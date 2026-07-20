"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { adminListProfiles, adminUpdateProfile, adminSetAdmin, adminDeleteUser } from "@/lib/db";
import { LEVELS } from "@/lib/schedule";
import { useAccount } from "../AccountProvider";

export default function AdminPage() {
  const supabase = createClient();
  const { userId, profile, loading: accountLoading } = useAccount();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const profiles = await adminListProfiles(supabase);
      setUsers(profiles);
    } catch (err) {
      setError(err.message || "Couldn't load users.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (profile?.is_admin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.is_admin]);

  const adminCount = users.filter((u) => u.is_admin).length;

  async function handleUsernameChange(u, e) {
    const value = e.target.value.trim();
    if (!value || value === u.display_name) return;
    setBusyId(u.id);
    setError("");
    try {
      await adminUpdateProfile(supabase, u.id, { display_name: value });
      await load();
    } catch (err) {
      setError(
        /duplicate|unique/i.test(err.message || "")
          ? "That username is already taken."
          : err.message || "Couldn't update username."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleLevelChange(u, level) {
    setBusyId(u.id);
    try {
      await adminUpdateProfile(supabase, u.id, { level });
      await load();
    } catch (err) {
      setError(err.message || "Couldn't update level.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleStartDateChange(u, start_date) {
    if (!start_date) return;
    setBusyId(u.id);
    try {
      await adminUpdateProfile(supabase, u.id, { start_date });
      await load();
    } catch (err) {
      setError(err.message || "Couldn't update start date.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleAdmin(u) {
    if (u.is_admin && adminCount <= 1) {
      setError("You can't remove the last admin.");
      return;
    }
    setBusyId(u.id);
    try {
      await adminSetAdmin(supabase, u.id, !u.is_admin);
      await load();
    } catch (err) {
      setError(err.message || "Couldn't change admin status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(u) {
    if (u.is_admin && adminCount <= 1) {
      setError("You can't delete the last admin.");
      setConfirmDelete(null);
      return;
    }
    setBusyId(u.id);
    try {
      await adminDeleteUser(supabase, u.id);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setError(err.message || "Couldn't delete that account.");
    } finally {
      setBusyId(null);
    }
  }

  if (accountLoading || !profile) {
    return (
      <div className="card">
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!profile.is_admin) {
    return (
      <div className="card">
        <p style={{ color: "var(--muted)" }}>Admins only.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Admin — Users</h2>
      <p style={{ color: "var(--muted)", fontSize: ".8rem" }}>
        Manage accounts here — username, level, start date, admin status. Workout progress stays
        private to each account; admins don&apos;t have access to it.
      </p>
      {error && <div className="error-text">{error}</div>}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      ) : (
        <table className="admin-table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Level</th>
              <th>Start date</th>
              <th>Admin</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <input
                    type="text"
                    defaultValue={u.display_name || ""}
                    disabled={busyId === u.id}
                    onBlur={(e) => handleUsernameChange(u, e)}
                    style={{ minWidth: 110, marginTop: 0 }}
                  />
                  {u.id === userId && <span style={{ color: "var(--muted)" }}> (you)</span>}
                </td>
                <td>
                  <select
                    value={u.level}
                    disabled={busyId === u.id}
                    onChange={(e) => handleLevelChange(u, e.target.value)}
                  >
                    {LEVELS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="date"
                    value={u.start_date}
                    disabled={busyId === u.id}
                    onChange={(e) => handleStartDateChange(u, e.target.value)}
                  />
                </td>
                <td>
                  <button
                    className="small-btn"
                    disabled={busyId === u.id}
                    onClick={() => handleToggleAdmin(u)}
                  >
                    {u.is_admin ? "Demote" : "Promote"}
                  </button>
                  {u.is_admin && <span className="badge-admin">Admin</span>}
                </td>
                <td>
                  {u.id === userId ? null : confirmDelete === u.id ? (
                    <span className="admin-row-actions">
                      <button className="small-btn" style={{ color: "var(--hiit)" }} onClick={() => handleDelete(u)}>
                        Confirm delete
                      </button>
                      <button className="small-btn" onClick={() => setConfirmDelete(null)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      className="small-btn"
                      style={{ color: "var(--hiit)" }}
                      disabled={busyId === u.id}
                      onClick={() => setConfirmDelete(u.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
