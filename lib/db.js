// Small data-access helpers shared by the client pages. Every call runs
// through the Supabase client the caller passes in, so RLS (auth.uid())
// scopes everything to the signed-in user automatically.

export async function getProfile(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function dayNumberFromStartDate(startDate) {
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now.toDateString()) - new Date(start.toDateString())) / 86400000
  );
  return Math.min(100, Math.max(1, diffDays + 1));
}

// --- People ---------------------------------------------------------
// One account can track multiple people (family, clients, etc). Each row
// in `people` is one of them, with their own level + start date.

export async function listPeople(supabase) {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addPerson(supabase, ownerId, { name, level = "beginner", startDate }) {
  const { data, error } = await supabase
    .from("people")
    .insert({
      owner_id: ownerId,
      name,
      level,
      start_date: startDate || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePerson(supabase, personId, patch) {
  const { error } = await supabase.from("people").update(patch).eq("id", personId);
  if (error) throw error;
}

export async function deletePerson(supabase, personId) {
  const { error } = await supabase.from("people").delete().eq("id", personId);
  if (error) throw error;
}

// --- Per-person progress ---------------------------------------------

export async function getAllProgress(supabase, personId) {
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("person_id", personId)
    .order("day", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getDayProgressRow(supabase, personId, day) {
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("person_id", personId)
    .eq("day", day)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertDayProgress(supabase, userId, personId, day, patch) {
  const { error } = await supabase
    .from("user_progress")
    .upsert({ user_id: userId, person_id: personId, day, ...patch }, { onConflict: "person_id,day" });
  if (error) throw error;
}
