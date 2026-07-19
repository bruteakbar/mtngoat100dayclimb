"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  listPeople,
  addPerson as dbAddPerson,
  updatePerson as dbUpdatePerson,
  deletePerson as dbDeletePerson,
} from "@/lib/db";

const PersonContext = createContext(null);
const ACTIVE_KEY = "wt100_active_person";

// Makes the current account's list of people (and whichever one is
// "active" right now) available to every page under app/(app). Active
// person is remembered per-browser in localStorage so switching between
// family members on a shared device sticks across visits.
export function PersonProvider({ children }) {
  const supabase = createClient();
  const [userId, setUserId] = useState(null);
  const [people, setPeople] = useState([]);
  const [activeId, setActiveIdState] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await listPeople(supabase);
    setPeople(list);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const list = await refresh();
      const stored = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_KEY) : null;
      const validStored = stored && list.some((p) => p.id === stored);
      setActiveIdState(validStored ? stored : list[0]?.id || null);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setActivePersonId(id) {
    setActiveIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(ACTIVE_KEY, id);
  }

  async function addPerson(fields) {
    const created = await dbAddPerson(supabase, userId, fields);
    await refresh();
    setActivePersonId(created.id);
    return created;
  }

  async function updatePerson(id, patch) {
    await dbUpdatePerson(supabase, id, patch);
    await refresh();
  }

  async function deletePerson(id) {
    await dbDeletePerson(supabase, id);
    const list = await refresh();
    if (activeId === id) {
      setActivePersonId(list[0]?.id || null);
    }
  }

  const activePerson = people.find((p) => p.id === activeId) || null;

  return (
    <PersonContext.Provider
      value={{
        userId,
        people,
        activeId,
        activePerson,
        loading,
        setActivePersonId,
        addPerson,
        updatePerson,
        deletePerson,
        refresh,
      }}
    >
      {children}
    </PersonContext.Provider>
  );
}

export function usePeople() {
  const ctx = useContext(PersonContext);
  if (!ctx) throw new Error("usePeople() must be used inside <PersonProvider>");
  return ctx;
}
