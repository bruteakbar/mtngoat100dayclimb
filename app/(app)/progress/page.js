"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { dayNumberFromStartDate, getAllProgress } from "@/lib/db";
import { getDayPlan, LEVELS, BENCHMARK_ITEMS, BENCHMARK_DAYS, formatBenchmarkValue } from "@/lib/schedule";
import { useAccount } from "../AccountProvider";
import AccountabilityGrid from "../AccountabilityGrid";

// For "reps" bigger is better; for "time" smaller is better.
function isBest(type, value, allValues) {
  if (value === null || value === undefined || value === "") return false;
  const nums = allValues.filter((v) => v !== null && v !== undefined && v !== "");
  if (nums.length < 2) return false;
  const best = type === "reps" ? Math.max(...nums) : Math.min(...nums);
  return Number(value) === best;
}

export default function ProgressPage() {
  const supabase = createClient();
  const { userId, profile, loading: accountLoading } = useAccount();
  const [stats, setStats] = useState({
    completed: 0,
    remaining: 100,
    streak: 0,
    hiit: 0,
    strength: 0,
    rest: 0,
  });
  const [benchByDay, setBenchByDay] = useState({});
  const [doneDaySet, setDoneDaySet] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !profile) return;
    (async () => {
      setLoading(true);
      const rows = await getAllProgress(supabase, userId);
      const done = rows.filter((r) => r.done);

      let hiitCount = 0,
        strCount = 0,
        restCount = 0;
      done.forEach((r) => {
        const plan = getDayPlan(r.day, profile.level);
        if (plan.kind === "REST") restCount++;
        else if (plan.pillClass === "hiit") hiitCount++;
        else strCount++;
      });

      const today = dayNumberFromStartDate(profile.start_date);
      const doneSet = new Set(done.map((r) => r.day));
      setDoneDaySet(doneSet);
      let streak = 0;
      for (let d = today; d >= 1; d--) {
        if (doneSet.has(d)) streak++;
        else break;
      }

      const byDay = {};
      BENCHMARK_DAYS.forEach((d) => {
        byDay[d] = rows.find((r) => r.day === d)?.benchmarks || {};
      });
      setBenchByDay(byDay);

      setStats({
        completed: done.length,
        remaining: 100 - done.length,
        streak,
        hiit: hiitCount,
        strength: strCount,
        rest: restCount,
      });
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, profile?.level, profile?.start_date]);

  if (accountLoading || !profile) {
    return (
      <div className="card">
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      </div>
    );
  }

  const levelLabel = LEVELS.find((l) => l.id === profile.level)?.label || "Beginner";
  const hasAnyBenchmark = BENCHMARK_DAYS.some((d) => Object.keys(benchByDay[d] || {}).length > 0);

  return (
    <>
      <div className="card">
        <div className="row">
          <h2>Your Progress</h2>
          <span className="pill phase">{levelLabel}</span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 4 }}>
          Started {profile.start_date} ·{" "}
          <Link href="/settings" style={{ color: "var(--accent)" }}>
            edit level or start date
          </Link>
        </p>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        ) : (
          <>
            <div className="stat-grid" style={{ marginTop: 12 }}>
              <div className="stat">
                <div className="num">{stats.completed}</div>
                <div className="lbl">Days Logged</div>
              </div>
              <div className="stat">
                <div className="num">{stats.streak}</div>
                <div className="lbl">Current Streak</div>
              </div>
              <div className="stat">
                <div className="num">{stats.remaining}</div>
                <div className="lbl">Days Remaining</div>
              </div>
            </div>
            <div className="stat-grid" style={{ marginTop: 10 }}>
              <div className="stat">
                <div className="num">{stats.hiit}</div>
                <div className="lbl">HIIT Sessions</div>
              </div>
              <div className="stat">
                <div className="num">{stats.strength}</div>
                <div className="lbl">Strength Sessions</div>
              </div>
              <div className="stat">
                <div className="num">{stats.rest}</div>
                <div className="lbl">Active Rest Days</div>
              </div>
            </div>
          </>
        )}
        <div className="legend">
          <span>
            <span className="dot" style={{ background: "var(--strength)" }}></span>Strength / skill day
          </span>
          <span>
            <span className="dot" style={{ background: "var(--hiit)" }}></span>HIIT / conditioning day
          </span>
          <span>
            <span className="dot" style={{ background: "var(--rest)" }}></span>Active rest day
          </span>
          <span>
            <span className="dot" style={{ background: "var(--test)" }}></span>Benchmark test day
          </span>
        </div>
      </div>

      <div className="card">
        <h2>100-Day Accountability</h2>
        <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 4 }}>
          Tap any missed (brown) day to jump back and fill it in.
        </p>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        ) : (
          <AccountabilityGrid startDate={profile.start_date} doneDays={doneDaySet} linkable />
        )}
      </div>

      <div className="card">
        <h2>Benchmark Progress</h2>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        ) : !hasAnyBenchmark ? (
          <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 6 }}>
            No benchmark numbers logged yet. Fill in your results on{" "}
            <Link href="/today?day=1" style={{ color: "var(--accent)" }}>
              Day 1
            </Link>
            , then again on Day 50 and Day 100, and your before/after will show up here.
          </p>
        ) : (
          <table className="compare-table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Test</th>
                <th>Day 1</th>
                <th>Day 50</th>
                <th>Day 100</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(BENCHMARK_ITEMS).map(([key, item]) => {
                const raw = BENCHMARK_DAYS.map((d) => benchByDay[d]?.[key]);
                const anyValue = raw.some((v) => v !== null && v !== undefined && v !== "");
                if (!anyValue) return null;
                return (
                  <tr key={key}>
                    <td>
                      {item.label}
                      {item.unit ? <span style={{ color: "var(--muted)" }}> ({item.unit})</span> : null}
                    </td>
                    {raw.map((v, i) => (
                      <td key={i} className={isBest(item.type, v, raw) ? "best" : undefined}>
                        {formatBenchmarkValue(item.type, v) || "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>About This Program</h2>
        <p style={{ color: "var(--muted)", fontSize: ".85rem", lineHeight: 1.6 }}>
          Core session types rotate so no muscle group or system is trained twice without
          recovery: <b>A</b> Calisthenics + Pull-up Bar (full body), <b>B</b> Single Kettlebell
          (strength/power), <b>C</b> Row Conditioning + pull-up accessory work (mostly HIIT),{" "}
          <b>D</b> Rucking + Core. Intermediate and Advanced add <b>E</b> Power &amp; Grip
          Conditioning (kettlebell + bar), and Advanced also adds <b>F</b> a full-body HIIT
          finisher — that's how 5-on/2-off and 6-on/1-off fill their extra training days. Higher
          levels also pull harder prescriptions for A-D from day one, so a Beginner
          &quot;Foundation&quot; week and an Advanced &quot;Foundation&quot; week use the same
          exercise pool but very different volume and difficulty. All three levels still follow
          the same 4-phase arc (Foundation → Build → Intensify → Peak/Test), the same benchmark
          tests on Days 1, 50, and 100, and the same deload window before the finish. On any
          training day, tap &ldquo;Swap exercise&rdquo; to replace a movement with an
          easier/similar/harder alternative from the same family — handy for working around an
          injury or just picking what you'd rather do that day.
        </p>
      </div>
    </>
  );
}
