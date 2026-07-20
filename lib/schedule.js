// Exercise database + 100-day schedule generator.
// Ported from the standalone HTML tracker — same data, same logic, tested
// against all 100 days (see project README for the verification notes).

// Every exercise carries a `fam` (movement family) and `tier` (1=easiest,
// 4=hardest within that family). Swapping only ever offers exercises from
// the same family, so a substitution always stays equipment-appropriate and
// targets a comparable movement pattern — just easier, similar, or harder.
export const EX = [
  // ---- Bodyweight Calisthenics ----
  { id: "cal01", name: "Push-up", cat: "Calisthenics", area: "Chest / Shoulders / Triceps", hiit: false, fam: "push_bw", tier: 2 },
  { id: "cal02", name: "Incline Push-up", cat: "Calisthenics", area: "Chest / Shoulders / Triceps", hiit: false, fam: "push_bw", tier: 1 },
  { id: "cal03", name: "Diamond Push-up", cat: "Calisthenics", area: "Triceps / Chest", hiit: false, fam: "push_bw", tier: 3 },
  { id: "cal04", name: "Pike Push-up", cat: "Calisthenics", area: "Shoulders", hiit: false, fam: "push_bw", tier: 3 },
  { id: "cal05", name: "Bodyweight Squat", cat: "Calisthenics", area: "Quads / Glutes", hiit: false, fam: "squat_bw", tier: 1 },
  { id: "cal06", name: "Reverse Lunge", cat: "Calisthenics", area: "Legs / Glutes", hiit: false, fam: "squat_bw", tier: 2 },
  { id: "cal07", name: "Bulgarian Split Squat", cat: "Calisthenics", area: "Legs / Glutes", hiit: false, fam: "squat_bw", tier: 3 },
  { id: "cal08", name: "Glute Bridge", cat: "Calisthenics", area: "Glutes / Posterior Chain", hiit: false, fam: "hinge_bw", tier: 1 },
  { id: "cal09", name: "Single-Leg Glute Bridge", cat: "Calisthenics", area: "Glutes", hiit: false, fam: "hinge_bw", tier: 2 },
  { id: "cal10", name: "Plank", cat: "Calisthenics", area: "Core", hiit: false, fam: "core_hold", tier: 1 },
  { id: "cal11", name: "Side Plank", cat: "Calisthenics", area: "Core / Obliques", hiit: false, fam: "core_hold", tier: 2 },
  { id: "cal12", name: "Hollow Body Hold", cat: "Calisthenics", area: "Core", hiit: false, fam: "core_hold", tier: 3 },
  { id: "cal13", name: "Superman", cat: "Calisthenics", area: "Lower Back / Posterior Chain", hiit: false, fam: "core_dynamic", tier: 1 },
  { id: "cal14", name: "Bird Dog", cat: "Calisthenics", area: "Core / Stability", hiit: false, fam: "core_dynamic", tier: 1 },
  { id: "cal15", name: "Bicycle Crunch", cat: "Calisthenics", area: "Core / Obliques", hiit: false, fam: "core_dynamic", tier: 2 },
  { id: "cal16", name: "Mountain Climbers", cat: "Calisthenics", area: "Core / Full Body", hiit: true, fam: "cardio_bw", tier: 2 },
  { id: "cal17", name: "Burpee", cat: "Calisthenics", area: "Full Body", hiit: true, fam: "cardio_bw", tier: 4 },
  { id: "cal18", name: "Jumping Jacks", cat: "Calisthenics", area: "Full Body", hiit: true, fam: "cardio_bw", tier: 1 },
  { id: "cal19", name: "High Knees", cat: "Calisthenics", area: "Legs / Cardio", hiit: true, fam: "cardio_bw", tier: 2 },
  { id: "cal20", name: "Squat Jump", cat: "Calisthenics", area: "Legs / Power", hiit: true, fam: "cardio_bw", tier: 3 },
  { id: "cal21", name: "Bear Crawl", cat: "Calisthenics", area: "Full Body / Core", hiit: true, fam: "cardio_bw", tier: 3 },
  { id: "cal22", name: "Wall Sit", cat: "Calisthenics", area: "Legs (isometric)", hiit: false, fam: "squat_bw", tier: 2 },
  { id: "cal23", name: "Step-up", cat: "Calisthenics", area: "Legs / Glutes", hiit: false, fam: "squat_bw", tier: 2 },
  { id: "cal24", name: "Pistol Squat Progression", cat: "Calisthenics", area: "Legs / Balance", hiit: false, fam: "squat_bw", tier: 4 },
  { id: "cal25", name: "Inchworm", cat: "Calisthenics", area: "Full Body / Mobility", hiit: false, fam: "core_dynamic", tier: 2 },

  // ---- Pull-up Bar ----
  { id: "pb01", name: "Dead Hang", cat: "Pull-up Bar", area: "Grip / Shoulders / Lats", hiit: false, fam: "pull_bar", tier: 1 },
  { id: "pb02", name: "Scapular Pull (Shrug)", cat: "Pull-up Bar", area: "Upper Back / Lats", hiit: false, fam: "pull_bar", tier: 1 },
  { id: "pb03", name: "Negative Pull-up", cat: "Pull-up Bar", area: "Back / Biceps", hiit: false, fam: "pull_bar", tier: 2 },
  { id: "pb04", name: "Band-Assisted Pull-up", cat: "Pull-up Bar", area: "Back / Biceps", hiit: false, fam: "pull_bar", tier: 2 },
  { id: "pb05", name: "Pull-up", cat: "Pull-up Bar", area: "Back / Biceps", hiit: false, fam: "pull_bar", tier: 3 },
  { id: "pb06", name: "Chin-up", cat: "Pull-up Bar", area: "Back / Biceps", hiit: false, fam: "pull_bar", tier: 3 },
  { id: "pb07", name: "Neutral-Grip Pull-up", cat: "Pull-up Bar", area: "Back / Biceps", hiit: false, fam: "pull_bar", tier: 3 },
  { id: "pb08", name: "Commando Pull-up", cat: "Pull-up Bar", area: "Back / Core", hiit: false, fam: "pull_bar", tier: 4 },
  { id: "pb09", name: "Hanging Knee Raise", cat: "Pull-up Bar", area: "Core / Hip Flexors", hiit: false, fam: "core_hang", tier: 2 },
  { id: "pb10", name: "Hanging Leg Raise", cat: "Pull-up Bar", area: "Core", hiit: false, fam: "core_hang", tier: 3 },
  { id: "pb11", name: "Hanging L-Sit Hold", cat: "Pull-up Bar", area: "Core", hiit: false, fam: "core_hang", tier: 4 },
  { id: "pb12", name: "Fat-Grip / Towel Hang", cat: "Pull-up Bar", area: "Grip / Forearm", hiit: false, fam: "pull_bar", tier: 1 },

  // ---- Single Kettlebell ----
  { id: "kb01", name: "KB Deadlift", cat: "Kettlebell", area: "Posterior Chain / Legs", hiit: false, wt: "moderate/heavy", fam: "kb_hinge", tier: 1 },
  { id: "kb02", name: "KB Goblet Squat", cat: "Kettlebell", area: "Legs / Core", hiit: false, wt: "moderate/heavy", fam: "kb_squat", tier: 1 },
  { id: "kb03", name: "Two-Hand KB Swing", cat: "Kettlebell", area: "Posterior Chain / Cardio", hiit: true, wt: "light", fam: "kb_hinge", tier: 2 },
  { id: "kb04", name: "Single-Arm KB Swing", cat: "Kettlebell", area: "Posterior Chain / Core / Cardio", hiit: true, wt: "light", fam: "kb_hinge", tier: 3 },
  { id: "kb05", name: "KB Clean", cat: "Kettlebell", area: "Full Body / Power", hiit: true, wt: "light", fam: "kb_power", tier: 2 },
  { id: "kb06", name: "KB Clean & Press", cat: "Kettlebell", area: "Full Body / Shoulders", hiit: false, wt: "moderate", fam: "kb_press", tier: 3 },
  { id: "kb07", name: "KB Strict Press", cat: "Kettlebell", area: "Shoulders", hiit: false, wt: "light", fam: "kb_press", tier: 1 },
  { id: "kb08", name: "KB Push Press", cat: "Kettlebell", area: "Shoulders / Legs", hiit: false, wt: "moderate", fam: "kb_press", tier: 2 },
  { id: "kb09", name: "KB Snatch", cat: "Kettlebell", area: "Full Body / Power / Cardio", hiit: true, wt: "light", fam: "kb_power", tier: 3 },
  { id: "kb10", name: "Single-Arm KB Row", cat: "Kettlebell", area: "Back / Lats", hiit: false, wt: "moderate/heavy", fam: "kb_pull", tier: 1 },
  { id: "kb11", name: "Renegade Row", cat: "Kettlebell", area: "Core / Back", hiit: false, wt: "moderate", fam: "kb_pull", tier: 2 },
  { id: "kb12", name: "Turkish Get-Up", cat: "Kettlebell", area: "Full Body / Core / Stability", hiit: false, wt: "light-to-moderate", fam: "kb_core_mobility", tier: 4 },
  { id: "kb13", name: "KB Windmill", cat: "Kettlebell", area: "Core / Shoulders / Mobility", hiit: false, wt: "light", fam: "kb_core_mobility", tier: 2 },
  { id: "kb14", name: "KB Halo", cat: "Kettlebell", area: "Shoulders / Core", hiit: false, wt: "light", fam: "kb_core_mobility", tier: 1 },
  { id: "kb15", name: "KB Front Rack Lunge", cat: "Kettlebell", area: "Legs / Core", hiit: false, wt: "moderate", fam: "kb_squat", tier: 2 },
  { id: "kb16", name: "KB Overhead Carry", cat: "Kettlebell", area: "Shoulders / Core / Stability", hiit: false, wt: "moderate", fam: "kb_carry", tier: 3 },
  { id: "kb17", name: "KB Suitcase Carry", cat: "Kettlebell", area: "Core / Grip", hiit: false, wt: "moderate/heavy", fam: "kb_carry", tier: 2 },
  { id: "kb18", name: "KB Farmer's Carry", cat: "Kettlebell", area: "Grip / Core / Traps", hiit: false, wt: "moderate/heavy", fam: "kb_carry", tier: 1 },
  { id: "kb19", name: "KB High Pull", cat: "Kettlebell", area: "Upper Back / Shoulders / Power", hiit: true, wt: "light", fam: "kb_hinge", tier: 3 },
  { id: "kb20", name: "KB Thruster", cat: "Kettlebell", area: "Full Body / Legs / Shoulders", hiit: true, wt: "light-to-moderate", fam: "kb_press", tier: 3 },
  { id: "kb21", name: "KB Around-the-Body Pass", cat: "Kettlebell", area: "Core / Grip", hiit: false, wt: "light", fam: "kb_core_mobility", tier: 1 },

  // ---- Rowing Machine ----
  { id: "row01", name: "Steady-State Row", cat: "Row", area: "Cardio / Full Body / Posterior Chain", hiit: false, fam: "row", tier: 1 },
  { id: "row02", name: "Row Intervals", cat: "Row", area: "Cardio / Full Body", hiit: true, fam: "row", tier: 2 },
  { id: "row03", name: "Pyramid Row Intervals", cat: "Row", area: "Cardio / Full Body", hiit: true, fam: "row", tier: 3 },
  { id: "row04", name: "Tabata Row", cat: "Row", area: "Cardio / Full Body", hiit: true, fam: "row", tier: 4 },
  { id: "row05", name: "Recovery Row", cat: "Row", area: "Cardio (low intensity)", hiit: false, fam: "row", tier: 1 },

  // ---- Rucking ----
  { id: "ruck01", name: "Steady Ruck Walk", cat: "Ruck", area: "Legs / Posterior Chain / Cardio", hiit: false, fam: "ruck", tier: 1 },
  { id: "ruck02", name: "Ruck Interval", cat: "Ruck", area: "Full Body / Cardio", hiit: true, fam: "ruck", tier: 3 },
  { id: "ruck03", name: "Hill / Incline Ruck", cat: "Ruck", area: "Legs / Glutes / Cardio", hiit: false, fam: "ruck", tier: 2 },
  { id: "ruck04", name: "Ruck for Time / Distance (Test)", cat: "Ruck", area: "Full Body / Cardio Endurance", hiit: false, fam: "ruck", tier: 3 },
];

export const EXBY = Object.fromEntries(EX.map((e) => [e.id, e]));

const TITLES = {
  A: "Calisthenics + Pull-up Bar (Full Body)",
  B: "Single Kettlebell — Strength & Power",
  C: "Row Conditioning + Pull-up Accessory",
  D: "Ruck + Core",
  E: "Power & Grip Conditioning (Kettlebell + Bar)",
  F: "Full-Body HIIT Finisher",
};
const PILL = { A: "strength", B: "strength", C: "hiit", D: "strength", E: "hiit", F: "hiit" };

// --- Difficulty levels -------------------------------------------------
export const WEEK_PATTERNS = {
  beginner: ["A", "REST", "B", "REST", "C", "REST", "D"], // 4 on / 3 off
  intermediate: ["A", "B", "REST", "C", "D", "REST", "E"], // 5 on / 2 off
  advanced: ["A", "B", "C", "REST", "D", "E", "F"], // 6 on / 1 off
};

const LEVEL_PHASE_SHIFT = { beginner: 0, intermediate: 1, advanced: 2 };

export const LEVELS = [
  { id: "beginner", label: "Beginner", desc: "4 days on / 3 off — same program you started with." },
  { id: "intermediate", label: "Intermediate", desc: "5 days on / 2 off — harder prescriptions, plus a Power & Grip conditioning day." },
  { id: "advanced", label: "Advanced", desc: "6 days on / 1 off — hardest prescriptions, plus Power & Grip and a full-body HIIT finisher." },
];

const TPL = {
  A: {
    1: [["cal02", "3 x 8-10"], ["cal05", "3 x 12"], ["pb01", "3 x 15-20s hang"], ["cal10", "3 x 20-30s"], ["cal08", "3 x 12"], ["pb02", "3 x 8"]],
    2: [["cal01", "3 x 10-12"], ["cal06", "3 x 10 / leg"], ["pb03", "4 x 3 (5s slow descent)"], ["cal11", "3 x 25-30s / side"], ["cal09", "3 x 10 / leg"], ["cal12", "3 x 20s"]],
    3: [["cal03", "3 x 10"], ["cal07", "3 x 10 / leg"], ["pb04", "4 x 4-6 (assist as needed)"], ["cal12", "3 x 30s"], ["pb09", "3 x 10"], ["cal17", "3 x 8 (finisher)"]],
    4: [["cal04", "3 x 10-12"], ["cal24", "3 x 5 / leg"], ["pb05", "4 x 6-8 (or max effort)"], ["pb08", "3 x 6"], ["pb11", "3 x 15-20s"], ["cal12", "3 x 40s"]],
  },
  B: {
    1: [["kb01", "3 x 10"], ["kb02", "3 x 10"], ["kb03", "3 x 12"], ["kb07", "3 x 8 / side"], ["kb10", "3 x 10 / side"], ["kb12", "2 x 2 / side (slow, technique)"]],
    2: [["kb02", "4 x 12"], ["kb04", "4 x 12 / side"], ["kb05", "3 x 6 / side"], ["kb08", "3 x 8 / side"], ["kb11", "3 x 8 / side"], ["kb17", "3 x 30m / side"]],
    3: [["kb15", "3 x 8 / leg"], ["kb06", "4 x 6 / side"], ["kb09", "4 x 8 / side"], ["kb12", "3 x 3 / side"], ["kb13", "3 x 8 / side"], ["kb18", "3 x 40m"]],
    4: [["kb20", "4 x 10"], ["kb09", "5 x 8 / side"], ["kb16", "3 x 30m / side"], ["kb12", "3 x 3 / side"], ["kb06", "4 rounds x 5"], ["kb14", "3 x 10 / direction"]],
  },
  C: {
    1: [["row01", "15 min easy-moderate pace"], ["pb01", "3 x 20s"], ["pb02", "3 x 10"], ["row05", "5 min cooldown"]],
    2: [["row01", "18-20 min moderate"], ["row02", "5 x 250m moderate-hard, 90s rest"], ["pb09", "3 x 12"], ["row05", "5 min cooldown"]],
    3: [["row02", "6 x 250m hard, 75s rest"], ["row03", "250-500-750-500-250m"], ["pb10", "3 x 10"], ["row05", "5 min cooldown"]],
    4: [["row04", "8 rounds: 20s all-out / 10s rest"], ["pb05", "3 x max reps"], ["row05", "5 min cooldown"]],
  },
  D: {
    1: [["ruck01", "20-25 min, light load, flat terrain"], ["cal10", "2 x 30s"], ["cal14", "2 x 10 / side"]],
    2: [["ruck01", "30-35 min, moderate load"], ["cal15", "3 x 15 / side"], ["cal13", "3 x 12"]],
    3: [["ruck03", "30 min hill/incline (or ruck02 25 min intervals)"], ["cal11", "3 x 30s / side"], ["cal12", "3 x 30s"]],
    4: [["ruck03", "35-40 min heavier load"], ["cal10", "3 x 45s"], ["cal15", "3 x 20 / side"]],
  },
  E: {
    1: [["kb18", "3 x 40m"], ["kb19", "3 x 10"], ["pb12", "3 x 20s"], ["kb11", "3 x 8 / side"], ["cal16", "3 x 20s"]],
    2: [["kb17", "3 x 40m / side"], ["kb09", "3 x 8 / side"], ["pb12", "3 x 25s"], ["kb13", "3 x 8 / side"], ["cal17", "3 x 10"]],
    3: [["kb18", "4 x 50m (heavier)"], ["kb19", "4 x 10"], ["pb08", "3 x 6"], ["kb20", "3 x 10"], ["cal16", "4 x 30s"]],
    4: [["kb16", "4 x 40m / side"], ["kb09", "5 x 10 / side"], ["pb11", "3 x 20s"], ["kb20", "4 x 12"], ["cal17", "4 x 12"]],
  },
  F: {
    1: [["cal17", "3 x 10"], ["row02", "4 x 250m"], ["cal19", "3 x 20s"], ["cal20", "3 x 12"]],
    2: [["cal17", "3 x 12"], ["row02", "5 x 250m"], ["cal16", "3 x 30s"], ["cal18", "3 x 30s"]],
    3: [["cal17", "4 x 15"], ["row04", "6 rounds"], ["cal20", "4 x 15"], ["cal21", "4 x 20s"]],
    4: [["cal17", "5 x 15"], ["row04", "8 rounds"], ["ruck02", "20 min intervals"], ["cal20", "5 x 15"]],
  },
};

const REST_CONTENT = {
  1: ["20 min easy walk (conversational pace)", "Full-body stretch — 8-10 min, hold each 30s", "Hips/ankles/shoulders mobility flow — 5 min"],
  2: ["25 min easy walk or light bike", "Foam rolling — quads, glutes, upper back, 8 min", "Mobility flow + light stretching, 10 min"],
  3: ["25-30 min easy walk or hike", "Foam rolling, 10 min", "Mobility flow — hips, t-spine, shoulders, 10 min"],
  4: ["20-30 min easy walk, keep it easy — recovery matters most this phase", "Light stretching, 10 min", "Prioritize sleep this week — this is deload territory"],
};

// Benchmark items tested on Days 1 / 50 / 100. Shared keys let the Today
// page collect a number for each and the Progress page line the three test
// days up side by side. `type` drives which input the Today page renders:
// "reps" -> a plain integer input, "time" -> a minutes+seconds input
// (stored as total seconds).
export const BENCHMARK_ITEMS = {
  pushups: { label: "Max push-ups in 1 set", type: "reps", unit: "reps" },
  plank: { label: "Max plank hold", type: "time" },
  pullups: { label: "Max pull-ups", type: "reps", unit: "reps" },
  deadhang: { label: "Max dead-hang (if no pull-ups yet)", type: "time" },
  row1000: { label: "1000m row for time", type: "time" },
  ruck1mi: { label: "1 mile ruck for time", type: "time" },
  capstone_ruck: { label: "Optional: 1-3 mile ruck for time (capstone)", type: "time" },
};

const OVERRIDES = {
  1: {
    title: "Baseline Fitness Test",
    blocks: ["pushups", "plank", "pullups", "deadhang", "row1000", "ruck1mi"],
    note: "Record every number — this is your baseline. You will retest on Day 50 and Day 100 to see the gains.",
  },
  50: {
    title: "Midpoint Retest",
    blocks: ["pushups", "plank", "pullups", "deadhang", "row1000", "ruck1mi"],
    note: "Same tests as Day 1 — your Day 1 numbers are shown alongside each field so you can see how far you've come.",
  },
  100: {
    title: "Day 100 — Final Test & Celebration",
    blocks: ["pushups", "plank", "pullups", "deadhang", "row1000", "ruck1mi", "capstone_ruck"],
    note: "100 days done. Compare every number back to Day 1 on the Progress page. Take a full rest day tomorrow — you earned it.",
  },
};

export function phaseForDay(d) {
  if (d <= 25) return 1;
  if (d <= 50) return 2;
  if (d <= 75) return 3;
  return 4;
}

export function typeForDay(d, level = "beginner") {
  const pattern = WEEK_PATTERNS[level] || WEEK_PATTERNS.beginner;
  const idx = (d - 1) % 7;
  return pattern[idx];
}

export function isDeload(d) {
  return d >= 92 && d <= 99;
}

// Same-family, sorted alternates for a given exercise — used by the "swap
// this exercise" UI so a substitution always stays equipment-appropriate
// and targets the same movement pattern, just easier/similar/harder.
export function getAlternates(exerciseId) {
  const ex = EXBY[exerciseId];
  if (!ex || !ex.fam) return [];
  return EX.filter((e) => e.fam === ex.fam && e.id !== ex.id)
    .map((e) => ({
      ex: e,
      relation: e.tier < ex.tier ? "easier" : e.tier > ex.tier ? "harder" : "similar",
    }))
    .sort((a, b) => a.ex.tier - b.ex.tier);
}

function effectivePhase(d, level) {
  const shift = LEVEL_PHASE_SHIFT[level] ?? 0;
  return Math.min(4, phaseForDay(d) + shift);
}

// `swaps` is an optional { [blockIndex]: substituteExerciseId } map (as
// stored per person/day in Supabase). When present, it overrides which
// exercise appears at that slot while keeping the slot's original
// sets/reps prescription — the user picked a different movement, not a
// different volume.
export function getDayPlan(d, level = "beginner", swaps = null) {
  const phase = phaseForDay(d);

  if (OVERRIDES[d]) {
    const o = OVERRIDES[d];
    return {
      day: d,
      phase,
      kind: "TEST",
      title: o.title,
      pillClass: "test",
      blocks: o.blocks.map((key) => ({ key, ...BENCHMARK_ITEMS[key] })),
      note: o.note,
    };
  }

  const type = typeForDay(d, level);

  if (type === "REST") {
    const opts = REST_CONTENT[phase];
    return {
      day: d,
      phase,
      kind: "REST",
      title: "Active Rest Day",
      pillClass: "rest",
      blocks: opts.map((raw) => ({ raw })),
      note: isDeload(d) ? "Deload week — prioritize recovery ahead of Day 100." : null,
    };
  }

  const effPhase = effectivePhase(d, level);
  const tpl = TPL[type][effPhase];
  const blocks = tpl.map(([id, presc], idx) => {
    const swappedId = swaps && swaps[idx];
    const finalId = swappedId && EXBY[swappedId] ? swappedId : id;
    return {
      id: finalId,
      presc,
      ex: EXBY[finalId],
      originalId: id,
      swapped: finalId !== id,
    };
  });

  return {
    day: d,
    phase,
    kind: type,
    title: TITLES[type],
    pillClass: PILL[type],
    blocks,
    note: isDeload(d)
      ? "Deload week — reduce sets/reps ~20-25%, prioritize form & recovery ahead of Day 100."
      : null,
  };
}

export const PHASE_NAMES = ["", "Foundation", "Build", "Intensify", "Peak / Test"];

// Benchmark days a person gets tested on — used by the Progress page to
// pull comparison rows.
export const BENCHMARK_DAYS = [1, 50, 100];

// `value` is stored as total seconds for "time" items, plain reps for
// "reps" items. Renders "" for null/undefined so inputs stay controlled-blank.
export function formatBenchmarkValue(type, value) {
  if (value === null || value === undefined || value === "") return "";
  if (type === "reps") return String(value);
  const total = Number(value);
  if (!Number.isFinite(total)) return "";
  const m = Math.floor(total / 60);
  const s = Math.round(total % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
