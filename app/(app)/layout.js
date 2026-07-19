import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavBar from "./NavBar";
import { PersonProvider } from "./PersonProvider";

export default async function AppLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <PersonProvider>
      <header className="topbar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="MTN GOAT — 100 Day Climb" className="app-logo" />
        <div className="sub">Calisthenics · Single Kettlebell · Row · Ruck · Pull-up Bar</div>
      </header>
      <NavBar />
      <main className="container">{children}</main>
    </PersonProvider>
  );
}
