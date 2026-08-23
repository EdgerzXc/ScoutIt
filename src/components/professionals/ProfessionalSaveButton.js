"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/authClient";
import styles from "./professionalDirectory.module.css";

let sharedHeadersPromise;
let sharedSavedPromise;

async function authHeaders() {
  if (!sharedHeadersPromise) {
    sharedHeadersPromise = getSession()
      .then(({ data: { session } }) => session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : null)
      .catch(() => null);
  }
  return sharedHeadersPromise;
}

async function savedKeys() {
  if (!sharedSavedPromise) {
    sharedSavedPromise = (async () => {
      const headers = await authHeaders();
      if (!headers) return new Set();
      const response = await fetch("/api/professionals/saved", { headers });
      if (!response.ok) return new Set();
      const payload = await response.json();
      return new Set((payload.saved || []).map((item) => item.professional_key));
    })();
  }
  return sharedSavedPromise;
}

export default function ProfessionalSaveButton({ record }) {
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const keys = await savedKeys();
      if (!cancelled && keys.has(record.key)) setState("saved");
    })();
    return () => { cancelled = true; };
  }, [record.key]);

  const toggle = async () => {
    if (state === "saving") return;
    const headers = await authHeaders();
    if (!headers) {
      setState("signed-out");
      setMessage("Sign in to keep this interest private and available on every device.");
      return;
    }
    const wasSaved = state === "saved";
    setState("saving");
    setMessage("");
    const response = await fetch("/api/professionals/saved", {
      method: wasSaved ? "DELETE" : "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ professionalKey: record.key, category: record.category, source: record.source }),
    });
    if (response.ok) {
      const keys = await savedKeys();
      if (wasSaved) keys.delete(record.key); else keys.add(record.key);
      setState(wasSaved ? "idle" : "saved");
      setMessage(wasSaved ? "Removed from your private interests." : "Saved privately to your account.");
      return;
    }
    setState("error");
    setMessage(response.status === 401 ? "Your session expired. Sign in again to save this profile." : "Saving is unavailable right now. Your public activity was not changed.");
  };

  return (
    <div className={styles.saveWrap}>
      <button
        type="button"
        className={`${styles.saveButton} ${state === "saved" ? styles.saveButtonActive : ""}`}
        onClick={toggle}
        aria-pressed={state === "saved"}
        aria-label={`${state === "saved" ? "Remove" : "Save"} interest in ${record.name}`}
        disabled={state === "saving"}
      >
        <Bookmark size={15} aria-hidden="true" fill={state === "saved" ? "currentColor" : "none"} />
        {state === "saving" ? "Saving…" : state === "saved" ? "Interested" : "Save interest"}
      </button>
      {message && (
        <p className={styles.saveMessage} role="status">
          {message} {(state === "signed-out" || state === "error") && <Link href="/login">Sign in</Link>}
        </p>
      )}
    </div>
  );
}
