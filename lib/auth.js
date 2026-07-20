// Lets people sign up / log in with just a username + password instead of a
// real email address, while still running on top of Supabase Auth (so we
// keep its battle-tested password hashing, session cookies, and Row Level
// Security via auth.uid() for free — see README for the tradeoffs).
//
// Usernames can be anything (any characters, spaces, unicode — no format
// restrictions) and are never turned into an email themselves. Instead,
// each account gets a random, non-deliverable email purely so Supabase Auth
// has something to attach the account to; it's never shown anywhere and has
// no relationship to the username, so an admin renaming someone's username
// later never needs to touch it. At login time, `username_login_email()` (a
// Postgres function in supabase/schema.sql) looks up the right email for
// whatever username was typed. This only works if "Confirm email" is turned
// OFF in Supabase (Authentication > Providers > Email) — see README — since
// these addresses can never receive a real confirmation link.
const FAKE_EMAIL_DOMAIN = "users.mtngoat.internal";
const MAX_USERNAME_LENGTH = 60;

export function cleanUsername(raw) {
  return (raw || "").trim();
}

// Returns an error string if invalid, or null if the username is OK. No
// character restrictions — just needs to exist and be a sane length.
export function validateUsername(raw) {
  const username = cleanUsername(raw);
  if (!username) return "Enter a username.";
  if (username.length > MAX_USERNAME_LENGTH) {
    return `Keep it under ${MAX_USERNAME_LENGTH} characters.`;
  }
  return null;
}

export function randomSyntheticEmail() {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `u-${id}@${FAKE_EMAIL_DOMAIN}`;
}
