"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: email, error: lookupError } = await supabase.rpc("username_login_email", {
      uname: username,
    });

    if (lookupError || !email) {
      setLoading(false);
      setError("Wrong username or password.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Wrong username or password."
          : error.message
      );
      return;
    }
    router.push("/today");
    router.refresh();
  }

  return (
    <main className="auth-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="MTN GOAT — 100 Day Climb" className="auth-logo" />
      <div className="card">
        <h2>Log in</h2>
        <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>100 Days of Work</p>
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="error-text">{error}</div>}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <Link className="muted-link" href="/signup">
          Need an account? Sign up
        </Link>
      </div>
    </main>
  );
}
