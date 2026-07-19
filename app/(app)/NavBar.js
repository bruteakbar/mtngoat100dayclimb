"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePeople } from "./PersonProvider";

const TABS = [
  { href: "/today", label: "Today" },
  { href: "/schedule", label: "Schedule" },
  { href: "/library", label: "Library" },
  { href: "/people", label: "People" },
  { href: "/progress", label: "Progress" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { people, activeId, setActivePersonId, loading } = usePeople();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleSwitch(e) {
    const value = e.target.value;
    if (value === "__add__") {
      router.push("/people");
      return;
    }
    setActivePersonId(value);
    router.refresh();
  }

  return (
    <>
      <nav className="tabs">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={pathname.startsWith(t.href) ? "active" : ""}>
            {t.label}
          </Link>
        ))}
        <a onClick={signOut} style={{ cursor: "pointer" }}>
          Sign out
        </a>
      </nav>
      {!loading && people.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 10px 0" }}>
          <select value={activeId || ""} onChange={handleSwitch} style={{ maxWidth: 260 }}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="__add__">+ Add / manage people…</option>
          </select>
        </div>
      )}
    </>
  );
}
