"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAccount } from "./AccountProvider";

const BASE_TABS = [
  { href: "/today", label: "Today" },
  { href: "/schedule", label: "Schedule" },
  { href: "/library", label: "Library" },
  { href: "/settings", label: "Settings" },
  { href: "/progress", label: "Progress" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { profile } = useAccount();

  const tabs = profile?.is_admin ? [...BASE_TABS, { href: "/admin", label: "Admin" }] : BASE_TABS;

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="tabs">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={pathname.startsWith(t.href) ? "active" : ""}>
          {t.label}
        </Link>
      ))}
      <a onClick={signOut} style={{ cursor: "pointer" }}>
        Sign out
      </a>
    </nav>
  );
}
