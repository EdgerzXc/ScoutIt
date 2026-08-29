"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";

export default function VerifiedWorkspaceBoundary({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isLoading } = useDashboard();
  // At most one bounce per mount. /onboarding sends a session-holding visitor
  // straight back here, so if the two ever disagree about whether someone is
  // signed in, an unguarded redirect ping-pongs forever and the screen just
  // flickers. One attempt either works or leaves them on a page they can act
  // on, which is always better than a strobe.
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading || currentUser?.id) {
      if (currentUser?.id) redirectedRef.current = false;
      return;
    }
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    const returnPath = `${pathname}${window.location.search}${window.location.hash}`;
    router.replace(`/onboarding?next=${encodeURIComponent(returnPath)}`);
  }, [currentUser?.id, isLoading, pathname, router]);

  if (isLoading || !currentUser?.id) {
    return (
      <main className="relative min-h-screen bg-background text-text-primary flex items-center justify-center px-6">
        <AtmosphereBackground variant="dashboard" />
        <div className="relative z-10 text-center" role="status" aria-live="polite">
          <p className="font-label-caps text-[12px] uppercase tracking-widest text-gold-accent">
            Secure workspace
          </p>
          <h1 className="mt-3 font-headline-editorial text-3xl text-on-surface">
            {isLoading ? "Verifying your access…" : "Opening secure sign-in…"}
          </h1>
        </div>
      </main>
    );
  }

  return children;
}
