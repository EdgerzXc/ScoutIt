"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "@/lib/authClient";
import { ADMIN_SESSION_API } from "@/lib/adminEntryPath";
import { StaffAccessState } from "@/components/auth/StaffWorkspaceAccess";

export default function AdminWorkspaceEntry({ destination }) {
  const [status, setStatus] = useState("initial");

  useEffect(() => {
    let active = true;
    void getSession().then(({ data }) => {
      if (active) setStatus(data?.session?.access_token ? "entry" : "signed_out");
    });
    return () => { active = false; };
  }, []);

  async function openWorkspace() {
    setStatus("loading");
    try {
      const { data } = await getSession();
      const token = data?.session?.access_token;
      if (!token) {
        setStatus("signed_out");
        return;
      }

      const response = await fetch(ADMIN_SESSION_API, {
        method: "POST",
        credentials: "same-origin",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 204) {
        window.location.replace(destination);
        return;
      }
      if (response.status === 401) {
        setStatus("signed_out");
      } else if (response.status === 403) {
        const { code } = await response.json().catch(() => ({}));
        setStatus(code === "mfa_enrollment_required" || code === "mfa_required" ? code : "denied");
      } else {
        setStatus("unavailable");
      }
    } catch {
      setStatus("unavailable");
    }
  }

  if (!["initial", "entry", "signed_out", "loading"].includes(status)) {
    return <StaffAccessState status={status} retry={openWorkspace} destination={destination} />;
  }

  const signInHref = `/onboarding?next=${encodeURIComponent(destination)}`;
  return (
    <main id="main-content" tabIndex={-1} className="grid min-h-dvh place-items-center bg-background px-5 py-12 text-on-surface">
      <section aria-labelledby="staff-access-title" className="w-full max-w-sm">
        <h1 id="staff-access-title" className="font-display text-2xl">Open the Admin Console</h1>
        <p className="mt-3 text-text-secondary">Use your staff account and authenticator.</p>
        <div role="status" className="mt-3 text-sm text-text-secondary">
          {status === "loading" ? "Checking staff access…" : status === "signed_out" ? "Sign in to continue." : null}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {(status === "entry" || status === "loading") && <button type="button" onClick={openWorkspace} disabled={status === "loading"}
            className="min-h-11 rounded-lg bg-[var(--accent-bright)] px-4 font-mono text-xs font-semibold uppercase tracking-wide text-black disabled:opacity-55">
            Continue
          </button>}
          <Link href={signInHref} prefetch={false} className="inline-flex min-h-11 items-center px-3 font-mono text-xs uppercase tracking-wide underline">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
