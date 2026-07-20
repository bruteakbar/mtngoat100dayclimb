"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { getDayProgressRow, upsertDayProgress, dayNumberFromStartDate } from "@/lib/db";
import { getDayPlan, getAlternates, PHASE_NAMES, LEVELS } from "@/lib/schedule";
import { useAccount } from "../AccountProvider";

export default function TodayPage() {
  return (
    <Suspense fallback={<div className="card"><p style={{ color: "var(--muted)" }}>Loading...</p></div>}>
      <TodayPageInner />
    </Suspense>
  );
}

const RELATION_LABEL = { easier: "Easier", similar: "Similar", harder: "Harder" };

function minPart(totalSeconds) {
  if (totalSeconds === undefined || totalSeconds === null || totalSeconds === "") return "";
  return String(Math.floor(Number(totalSeconds) / 60));
}
function secPart(totalSeconds) {
  if (totalSeconds === undefined || totalSeconds === null || totalSeconds === "") return "";
  return String(Math.round(Number(totalSeconds) % 60)).padStart(2, "0");
}
function secondsFromMinSec(min, sec) {
  const hasMin = min !== "" && min !== undefined;
  const hasSec = sec !== "" && sec !== undefined;
  if (!hasMin && !hasSec) return undefined;
  const m = parseInt(min, 10) || 0;
  const s = parseInt(sec, 10) || 0;
  return m * 60 + s;
}

function TodayPageInner() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const dayOverride = parseInt(searchParams.get("day"), 10);
  const { userId, profile, loading: accountLoading } = useAccount();

  const [day, setDay] = useState(dayOverride >= 1 && dayOverride <= 100 ? dayOverride : 1);
  const [record, setRecord] = useState({ done: false, checks: {}, notes: "", swaps: {}, benchmarks: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSwapIdx, setOpenSwapIdx] = useState(null);

  // Once we know the account's start date, default to "today" unless a
  // ?day= override was passed in from the Schedule page or the grid.
  useEffect(() => {
    if (!profile) return;
    if (dayOverride >= 1 && dayOverride <= 100) return;
    setDay(dayNumberFromStartDate(profile.start_date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const loadDay = useCallback(
    async (d) => {
      if (!userId) return;
      setLoading(true);
      const row = await getDayProgressRow(supabase, userId, d);
      setRecord({
        done: row?.done || false,
        checks: row?.checks || {},
        notes: row?.notes || "",
        swaps: row?.swaps || {},
        benchmarks: row?.benchmarks || {},
      });
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  useEffect(() => {
    if (day && userId) loadDay(day);
    setOpenSwapIdx(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, userId]);

  async function persist(patch) {
    if (!userId) return;
    setSaving(true);
    await upsertDayProgress(supabase, userId, day, patch);
    setSaving(false);
  }

  function fullPatch(overrides) {
    return {
      checks: record.checks,
      done: record.done,
      notes: record.notes,
      swaps: record.swaps,
      benchmarks: record.benchmarks,
      ...overrides,
    };
  }

  function toggleCheck(idx) {
    const checks = { ...record.checks, [idx]: !record.checks[idx] };
    setRecord((r) => ({ ...r, checks }));
    persist(fullPatch({ checks }));
  }

  function updateNotes(notes) {
    setRecord((r) => ({ ...r, notes }));
  }

  function saveNotes() {
    persist(fullPatch({}));
  }

  function toggleDone() {
    const done = !record.done;
    setRecord((r) => ({ ...r, done }));
    persist(fullPatch({ done }));
  }

  function applySwap(idx, newExerciseId) {
    const swaps = { ...record.swaps, [idx]: newExerciseId };
    setRecord((r) => ({ ...r, swaps }));
    persist(fullPatch({ swaps }));
    setOpenSwapIdx(null);
  }

  function revertSwap(idx) {
    const swaps = { ...record.swaps };
    delete swaps[idx];
    setRecord((r) => ({ ...r, swaps }));
    persist(fullPatch({ swaps }));
    setOpenSwapIdx(null);
  }

  function updateBenchmark(key, value) {
    const benchmarks = { ...record.benchmarks, [key]: value };
    setRecord((r) => ({ ...r, benchmarks }));
  }

  function saveBenchmarks() {
    persist(fullPatch({}));
  }

  if (accountLoading || !profile) {
    return (
      <div className="card">
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      </div>
    );
  }

  const plan = getDayPlan(day, profile.level, record.swaps);
  const kindLabel =
    plan.kind === "REST" ? "ACTIVE REST" : plan.kind === "TEST" ? "BENCHMARK TEST" : plan.pillClass === "hiit" ? "HIIT / CONDITIONING" : "STRENGTH";
  const levelLabel = LEVELS.find((l) => l.id === profile.level)?.label || "Beginner";

  return (
    <>
      <div className="daynav">
        <button onClick={() => setDay((d) => Math.max(1, d - 1))}>&#8592;</button>
        <div className="daynum">Day {day} / 100</div>
        <button onClick={() => setDay((d) => Math.min(100, d + 1))}>&#8594;</button>
      </div>
      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: ".8rem", marginTop: -6 }}>
        {levelLabel} plan ·{" "}
        <Link href="/settings" style={{ color: "var(--accent)" }}>
          change
        </Link>
      </p>

      <div className="card">
        <div className="row">
          <h2>{plan.title}</h2>
          <span className={`pill ${plan.pillClass}`}>{kindLabel}</span>
        </div>
        <div className="pill phase">
          Phase {plan.phase} — {PHASE_NAMES[plan.phase]}
        </div>

        {plan.kind === "REST" ? (
          <div className="rest-box">
            Pick one or more:
            <ul>
              {plan.blocks.map((b, i) => (
                <li key={i}>{b.raw}</li>
              ))}
            </ul>
          </div>
        ) : plan.kind === "TEST" ? (
          <div style={{ marginTop: 12 }}>
            {plan.blocks.map((b) => (
              <div className="benchmark-row" key={b.key}>
                <div className="name">{b.label}</div>
                {b.type === "reps" ? (
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="reps"
                    className="benchmark-input"
                    value={record.benchmarks[b.key] ?? ""}
                    onChange={(e) => updateBenchmark(b.key, e.target.value === "" ? undefined : Number(e.target.value))}
                    onBlur={saveBenchmarks}
                  />
                ) : (
                  <div className="benchmark-time">
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="min"
                      className="benchmark-input small"
                      value={minPart(record.benchmarks[b.key])}
                      onChange={(e) =>
                        updateBenchmark(b.key, secondsFromMinSec(e.target.value, secPart(record.benchmarks[b.key])))
                      }
                      onBlur={saveBenchmarks}
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      inputMode="numeric"
                      placeholder="sec"
                      className="benchmark-input small"
                      value={secPart(record.benchmarks[b.key])}
                      onChange={(e) =>
                        updateBenchmark(b.key, secondsFromMinSec(minPart(record.benchmarks[b.key]), e.target.value))
                      }
                      onBlur={saveBenchmarks}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 6 }}>
            {plan.blocks.map((b, i) => {
              const alternates = getAlternates(b.id);
              const isOpen = openSwapIdx === i;
              return (
                <div key={i}>
                  <div className="exercise">
                    <input type="checkbox" checked={!!record.checks[i]} onChange={() => toggleCheck(i)} />
                    <div style={{ flex: 1 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <div className="name">{b.ex.name}</div>
                        {b.swapped && <span className="pill test">swapped</span>}
                      </div>
                      <div className="presc">{b.presc}</div>
                      <div className="tags">
                        <span>{b.ex.area}</span>
                        <span style={b.ex.hiit ? { color: "var(--hiit)" } : undefined}>
                          {b.ex.hiit ? "HIIT" : "Strength"}
                        </span>
                        {b.ex.wt && <span>{b.ex.wt} KB</span>}
                      </div>
                      {alternates.length > 0 && (
                        <button
                          className="small-btn"
                          style={{ marginTop: 6 }}
                          onClick={() => setOpenSwapIdx(isOpen ? null : i)}
                        >
                          {isOpen ? "Cancel" : "⇄ Swap exercise"}
                        </button>
                      )}
                      {isOpen && (
                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                          {b.swapped && (
                            <button className="small-btn" onClick={() => revertSwap(i)}>
                              ↺ Revert to scheduled exercise
                            </button>
                          )}
                          {alternates.map((alt) => (
                            <button
                              key={alt.ex.id}
                              className="small-btn"
                              style={{ textAlign: "left", display: "flex", justifyContent: "space-between", gap: 10 }}
                              onClick={() => applySwap(i, alt.ex.id)}
                            >
                              <span>
                                {alt.ex.name}
                                <span style={{ color: "var(--muted)" }}> · {alt.ex.area}</span>
                              </span>
                              <span
                                className="pill"
                                style={{
                                  color:
                                    alt.relation === "easier"
                                      ? "var(--strength)"
                                      : alt.relation === "harder"
                                      ? "var(--hiit)"
                                      : "var(--muted)",
                                }}
                              >
                                {RELATION_LABEL[alt.relation]}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {plan.note && <div className="note">{plan.note}</div>}

        <textarea
          placeholder="Notes: weight used, reps hit, how it felt..."
          value={record.notes}
          onChange={(e) => updateNotes(e.target.value)}
          onBlur={saveNotes}
        />

        <button className={`primary ${record.done ? "done" : ""}`} onClick={toggleDone}>
          {record.done ? "✓ Day Complete" : "Mark Day Complete"}
        </button>
        {saving && <div style={{ color: "var(--muted)", fontSize: ".75rem", marginTop: 6 }}>Saving...</div>}
      </div>
    </>
  );
}
