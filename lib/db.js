// Small data-access helpers shared by the client pages. Every call runs
// through the Supabase client the caller passes in, so RLS (auth.uid())
// scopes everything to the signed-in user automatically — admins get
// broadened access via the `is_admin()` policies in supabase/schema.sql.

export async function getProfile(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(supabase, userId, patch) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

export function dayNumberFromStartDate(startDate) {
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now.toDateString()) - new Date(start.toDateString())) / 86400000
  );
  return Math.min(100, Math.max(1, diffDays + 1));
}

// --- Per-account progress --------------------------------------------

export async function getAllProgress(supabase, userId) {
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .order("day", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getDayProgressRow(supabase, userId, day) {
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertDayProgress(supabase, userId, day, patch) {
  const { error } = await supabase
    .from("user_progress")
    .upsert({ user_id: userId, day, ...patch }, { onConflict: "user_id,day" });
  if (error) throw error;
}

// --- Admin -------------------------------------------------------------
// All of these rely on the admin-aware RLS policies in schema.sql; calling
// them as a non-admin will simply return nothing / fail silently at the DB
// level (RLS just won't return other accounts' rows).

export async function adminListProfiles(supabase) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function adminUpdateProfile(supabase, userId, patch) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

export async function adminSetAdmin(supabase, userId, isAdmin) {
  const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", userId);
  if (error) throw error;
}

export async function adminDeleteUser(supabase, userId) {
  const { error } = await supabase.rpc("admin_delete_user", { target_id: userId });
  if (error) throw error;
}
