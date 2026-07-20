// Lets people sign up / log in with just a username + password instead of a
// real email address, while still running on top of Supabase Auth (so we
// keep its battle-tested password hashing, session cookies, and Row Level
// Security via auth.uid() for free — see README for the tradeoffs).
//
// Under the hood, Supabase Auth still requires something shaped like an
// email. We derive a synthetic, non-deliverable one from the username and
// use that everywhere instead. This only works if "Confirm email" is turned
// OFF in Supabase (Authentication > Providers > Email) — see README — since
// these addresses can never receive a real confirmation link.
const FAKE_EMAIL_DOMAIN = "users.mtngoat.internal";

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_.-]{1,28}[a-z0-9])?$/;

export function normalizeUsername(raw) {
  return (raw || "").trim().toLowerCase();
}

// Returns an error string if invalid, or null if the username is OK.
export function validateUsername(raw) {
  const username = normalizeUsername(raw);
  if (username.length < 3) return "Username must be at least 3 characters.";
  if (username.length > 30) return "Username must be 30 characters or fewer.";
  if (!USERNAME_PATTERN.test(username)) {
    return "Use only letters, numbers, and . _ - (must start and end with a letter or number).";
  }
  return null;
}

export function usernameToEmail(raw) {
  return `${normalizeUsername(raw)}@${FAKE_EMAIL_DOMAIN}`;
}
