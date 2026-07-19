"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="auth-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="MTN GOAT — 100 Day Climb" className="auth-logo" />
        <div className="card">
          <h2>Check your email</h2>
          <p style={{ color: "var(--muted)", fontSize: ".9rem" }}>
            We sent a confirmation link to <b>{email}</b>. Click it, then come back and log in.
          </p>
          <Link className="muted-link" href="/login">
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="MTN GOAT — 100 Day Climb" className="auth-logo" />
      <div className="card">
        <h2>Create your account</h2>
        <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>Start your 100 days</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="error-text">{error}</div>}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <Link className="muted-link" href="/login">
          Already have an account? Log in
        </Link>
      </div>
    </main>
  );
}
