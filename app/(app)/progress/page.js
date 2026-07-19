"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { dayNumberFromStartDate, getAllProgress } from "@/lib/db";
import { getDayPlan, LEVELS } from "@/lib/schedule";
import { usePeople } from "../PersonProvider";

export default function ProgressPage() {
  const supabase = createClient();
  const { activePerson, loading: peopleLoading } = usePeople();
  const [stats, setStats] = useState({
    completed: 0,
    remaining: 100,
    streak: 0,
    hiit: 0,
    strength: 0,
    rest: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activePerson) return;
    (async () => {
      setLoading(true);
      const rows = await getAllProgress(supabase, activePerson.id);
      const done = rows.filter((r) => r.done);

      let hiitCount = 0,
        strCount = 0,
        restCount = 0;
      done.forEach((r) => {
        const plan = getDayPlan(r.day, activePerson.level);
        if (plan.kind === "REST") restCount++;
        else if (plan.pillClass === "hiit") hiitCount++;
        else strCount++;
      });

      const today = dayNumberFromStartDate(activePerson.start_date);
      const doneDaySet = new Set(done.map((r) => r.day));
      let streak = 0;
      for (let d = today; d >= 1; d--) {
        if (doneDaySet.has(d)) streak++;
        else break;
      }

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
  }, [activePerson?.id, activePerson?.level, activePerson?.start_date]);

  if (peopleLoading || !activePerson) {
    return (
      <div className="card">
        <p style={{ color: "var(--muted)" }}>
          {peopleLoading ? "Loading..." : "No person set up yet — add one on the People page."}
        </p>
      </div>
    );
  }

  const levelLabel = LEVELS.find((l) => l.id === activePerson.level)?.label || "Beginner";

  return (
    <>
      <div className="card">
        <div className="row">
          <h2>{activePerson.name}&apos;s Progress</h2>
          <span className="pill phase">{levelLabel}</span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 4 }}>
          Started {activePerson.start_date} ·{" "}
          <Link href="/people" style={{ color: "var(--accent)" }}>
            edit level, start date, or add another person
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
