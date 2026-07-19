"use client";

import { useMemo, useState } from "react";
import { EX } from "@/lib/schedule";

export default function LibraryPage() {
  const [cat, setCat] = useState("all");
  const [hiit, setHiit] = useState("all");

  const list = useMemo(() => {
    return EX.filter((e) => {
      if (cat !== "all" && e.cat !== cat) return false;
      if (hiit === "yes" && !e.hiit) return false;
      if (hiit === "no" && e.hiit) return false;
      return true;
    });
  }, [cat, hiit]);

  return (
    <div className="card">
      <div className="filters">
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="Calisthenics">Bodyweight Calisthenics</option>
          <option value="Pull-up Bar">Pull-up Bar</option>
          <option value="Kettlebell">Single Kettlebell</option>
          <option value="Row">Rowing Machine</option>
          <option value="Ruck">Rucking</option>
        </select>
        <select value={hiit} onChange={(e) => setHiit(e.target.value)}>
          <option value="all">HIIT + Non-HIIT</option>
          <option value="yes">HIIT / Cardio only</option>
          <option value="no">Strength / Non-HIIT only</option>
        </select>
      </div>
      <div>
        {list.map((e) => (
          <div className="lib-item" key={e.id}>
            <div className="row">
              <div className="name">{e.name}</div>
              <span className={`pill ${e.hiit ? "hiit" : "strength"}`}>{e.hiit ? "HIIT" : "STRENGTH"}</span>
            </div>
            <div className="meta">
              {e.cat} · {e.area}
              {e.wt ? ` · ${e.wt} KB` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
