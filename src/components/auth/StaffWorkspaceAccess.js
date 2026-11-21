"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";
import { normalizePrivateReturnPath } from "@/lib/authReturnPath";

export function useStaffRead(path) {
  const { authedFetch, currentUser } = useDashboard();
  const userId = currentUser?.id;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    async function load() {
      let value;
      try {
        const response = await authedFetch(path, { cache: "no-store", signal: controller.signal });
        if (response.status === 403) {
          const { code } = await response.json().catch(() => ({}));
          value = { status: code === "mfa_enrollment_required" || code === "mfa_required" ? code : "denied" };
        } else if (response.status === 401) {
          value = { status: "denied" };
        } else if (response.ok) {
          value = { status: "ready", data: await response.json() };
        } else {
          value = { status: "unavailable" };
        }
      } catch {
        value = { status: "unavailable" };
      }
      if (!controller.signal.aborted) setResult({ ...value, userId, attempt });
    }
    void load();
    return () => controller.abort();
  }, [authedFetch, path, userId, attempt]);

  const current = result?.userId === userId && result?.attempt === attempt ? result : null;
  return { status: current?.status || "loading", data: current?.data, retry: () => setAttempt((n) => n + 1) };
}

export function StaffAccessState({ status, retry, destination }) {
  const pathname = usePathname();
  const returnPath = normalizePrivateReturnPath(destination ?? pathname, "/admin");
  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh bg-background text-on-surface grid place-items-center p-6">
      <div className="max-w-md text-center space-y-4">
        {status === "loading" ? (
          <p role="status">Checking staff access…</p>
        ) : status === "denied" ? (
          <h1 className="text-2xl font-display">Staff access required</h1>
        ) : status === "mfa_enrollment_required" ? (
          <>
            <h1 className="text-2xl font-display">Set up an authenticator</h1>
            <p className="text-text-secondary">Staff tools require two-factor authentication. Set up your authenticator in Settings, then return here.</p>
            <Link href="/settings#security" prefetch={false} className="inline-flex min-h-11 items-center px-3 text-accent underline">Open security settings</Link>
          </>
        ) : status === "mfa_required" ? (
          <>
            <h1 className="text-2xl font-display">Verify your authenticator</h1>
            <p className="text-text-secondary">Enter a code from your authenticator app to continue to the staff workspace.</p>
            <Link href={`/onboarding?next=${encodeURIComponent(returnPath)}`} prefetch={false} className="inline-flex min-h-11 items-center px-3 text-accent underline">Verify and return</Link>
          </>
        ) : (
          <>
            <h1 role="alert" className="text-2xl font-display">Could not load the staff workspace</h1>
            <button type="button" onClick={retry} className="min-h-11 px-4 border border-accent-muted rounded font-mono uppercase text-sm">
              Try again
            </button>
          </>
        )}
        {status !== "loading" && <Link href="/dashboard" className="inline-flex min-h-11 items-center px-3 underline">Back to dashboard</Link>}
      </div>
    </main>
  );
}

export default function StaffWorkspaceAccess({ children }) {
  const access = useStaffRead("/api/admin/access");
  if (access.status === "ready" && access.data?.allowed === true) return children;
  return <StaffAccessState status={access.status} retry={access.retry} />;
}
