"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfile, updateProfile as dbUpdateProfile } from "@/lib/db";

const AccountContext = createContext(null);

// Makes the signed-in account's own profile (level, start date, admin
// flag) available to every page under app/(app). One account = one
// 100-day tracker now, so there's no "active person" to switch between —
// every page just reads straight from here.
export function AccountProvider({ children }) {
  const supabase = createClient();
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    async (uid) => {
      const id = uid || userId;
      if (!id) return null;
      const p = await getProfile(supabase, id);
      setProfile(p);
      return p;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      await refresh(user.id);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateProfile(patch) {
    if (!userId) return;
    await dbUpdateProfile(supabase, userId, patch);
    await refresh(userId);
  }

  return (
    <AccountContext.Provider value={{ userId, profile, loading, updateProfile, refresh }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount() must be used inside <AccountProvider>");
  return ctx;
}
