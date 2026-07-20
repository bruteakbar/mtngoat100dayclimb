"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  adminListProfiles,
  adminUpdateProfile,
  adminSetAdmin,
  adminDeleteUser,
  adminGetAllProgress,
} from "@/lib/db";
import { LEVELS } from "@/lib/schedule";
import { useAccount } from "../AccountProvider";
import AccountabilityGrid from "../AccountabilityGrid";

export default function AdminPage() {
  const supabase = createClient();
  const { userId, profile, loading: accountLoading } = useAccount();
  const [users, setUsers] = useState([]);
  const [progressByUser, setProgressByUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [profiles, progress] = await Promise.all([
        adminListProfiles(supabase),
        adminGetAllProgress(supabase),
      ]);
      setUsers(profiles);
      const byUser = {};
      progress.forEach((r) => {
        if (!r.done) return;
        if (!byUser[r.user_id]) byUser[r.user_id] = new Set();
        byUser[r.user_id].add(r.day);
      });
      setProgressByUser(byUser);
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
    <>
      <div className="card">
        <h2>Admin — Users</h2>
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
                    {u.display_name || u.id.slice(0, 8)}
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

      {!loading &&
        users.map((u) => (
          <div className="card admin-user-block" key={u.id}>
            <h2>{u.display_name || u.id.slice(0, 8)}&apos;s Accountability</h2>
            <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 4 }}>
              Started {u.start_date} · {LEVELS.find((l) => l.id === u.level)?.label || "Beginner"}
            </p>
            <AccountabilityGrid
              startDate={u.start_date}
              doneDays={progressByUser[u.id] || new Set()}
              linkable={false}
            />
          </div>
        ))}
    </>
  );
}
