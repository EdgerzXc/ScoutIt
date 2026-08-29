"use client";

import { useEffect, useState } from "react";
import { getUser, onAuthStateChange } from "@/lib/authClient";

export default function useVerifiedIdentity() {
  const [state, setState] = useState({ status: "checking", user: null });

  useEffect(() => {
    let active = true;
    const refresh = () => {
      getUser()
        .then(({ data }) => {
          if (active) setState({ status: data?.user ? "signed-in" : "signed-out", user: data?.user || null });
        })
        .catch(() => {
          if (active) setState({ status: "signed-out", user: null });
        });
    };

    refresh();
    // refresh() calls supabase.auth.getUser(), and supabase-js holds a lock
    // for the duration of this callback — starting that call from inside it
    // races the lock's release. Deferring past the current task means the
    // callback has always returned before the auth call asks for the lock.
    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) {
        setState({ status: "signed-out", user: null });
        return;
      }
      setTimeout(() => { if (active) refresh(); }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const name = state.user?.user_metadata?.full_name
    || state.user?.user_metadata?.name
    || "Scout";

  return { ...state, name, isAuthenticated: state.status === "signed-in" };
}
