"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAllProgress } from "@/lib/db";
import { getDayPlan, PHASE_NAMES, LEVELS } from "@/lib/schedule";
import { usePeople } from "../PersonProvider";

export default function SchedulePage() {
  const supabase = createClient();
  const router = useRouter();
  const { activePerson, loading: peopleLoading } = usePeople();
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [doneDays, setDoneDays] = useState({});

  useEffect(() => {
    if (!activePerson) return;
    (async () => {
      const rows = await getAllProgress(supabase, activePerson.id);
      const map = {};
      rows.forEach((r) => {
        if (r.done) map[r.day] = true;
      });
      setDoneDays(map);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePerson?.id]);

  const level = activePerson?.level || "beginner";

  const days = useMemo(() => {
    const arr = [];
    for (let d = 1; d <= 100; d++) {
      const plan = getDayPlan(d, level);
      if (phaseFilter !== "all" && String(plan.phase) !== phaseFilter) continue;
      arr.push(plan);
    }
    return arr;
  }, [phaseFilter, level]);

  const levelLabel = LEVELS.find((l) => l.id === level)?.label || "Beginner";

  if (peopleLoading || !activePerson) {
    return (
      <div className="card">
        <p style={{ color: "var(--muted)" }}>
          {peopleLoading ? "Loading..." : "No person set up yet — add one on the People page."}
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="pill phase">
          {activePerson.name} · {levelLabel} plan
        </span>
      </div>
      <div className="filters">
        <select value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)}>
          <option value="all">All Phases</option>
          <option value="1">Phase 1 · Foundation (1-25)</option>
          <option value="2">Phase 2 · Build (26-50)</option>
          <option value="3">Phase 3 · Intensify (51-75)</option>
          <option value="4">Phase 4 · Peak / Test (76-100)</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Focus</th>
            <th>Type</th>
            <th>Done</th>
          </tr>
        </thead>
        <tbody>
          {days.map((plan) => (
            <tr
              className="sched-row"
              key={plan.day}
              onClick={() => router.push(`/today?day=${plan.day}`)}
            >
              <td>{plan.day}</td>
              <td>{plan.title}</td>
              <td>
                <span className={`pill ${plan.pillClass}`}>
                  {plan.kind === "REST" ? "REST" : plan.kind === "TEST" ? "TEST" : plan.pillClass === "hiit" ? "HIIT" : "STR"}
                </span>
              </td>
              <td>{doneDays[plan.day] ? "✓" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: "var(--muted)", fontSize: ".78rem", marginTop: 10 }}>
        Phases: {PHASE_NAMES.slice(1).join(" → ")}
      </p>
    </div>
  );
}
