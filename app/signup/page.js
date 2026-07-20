"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validateUsername, cleanUsername, randomSyntheticEmail } from "@/lib/auth";

export default function SignupPage() {
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    setLoading(true);
    const clean = cleanUsername(username);
    const { error } = await supabase.auth.signUp({
      email: randomSyntheticEmail(),
      password,
      options: { data: { username: clean } },
    });
    setLoading(false);
    if (error) {
      setError(
        /already registered|already exists|duplicate|unique|database error/i.test(error.message)
          ? "That username is already taken. Try another."
          : error.message
      );
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
          <h2>You're in</h2>
          <p style={{ color: "var(--muted)", fontSize: ".9rem" }}>
            Your account is ready — head back and log in with your username and password.
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
            type="text"
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
        <p style={{ color: "var(--muted)", fontSize: ".78rem", marginTop: 10 }}>
          Any username you like. No email needed.
        </p>
        <Link className="muted-link" href="/login">
          Already have an account? Log in
        </Link>
      </div>
    </main>
  );
}
