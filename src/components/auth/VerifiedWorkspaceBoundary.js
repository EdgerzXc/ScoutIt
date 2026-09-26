"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";

export default function VerifiedWorkspaceBoundary({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, identityResolved } = useDashboard();
  // Workspace inventory can continue loading after identity has resolved.
  // Only identity resolution may replace the page with the access boundary.
  const isLoading = !identityResolved;
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (isLoading || currentUser?.id) return;
    const returnPath = `${pathname}${window.location.search}${window.location.hash}`;
    router.replace(`/onboarding?next=${encodeURIComponent(returnPath)}`);
  }, [currentUser?.id, isLoading, pathname, router]);

  if (isLoading || !currentUser?.id) {
    if (timedOut && isLoading) {
      return (
        <main className="relative min-h-screen bg-background text-text-primary flex items-center justify-center px-6">
          <AtmosphereBackground variant="dashboard" />
          <div className="relative z-10 max-w-md text-center p-8 rounded-2xl bg-surface/60 backdrop-blur-xl border border-white/10 shadow-2xl" role="alert">
            <p className="font-label-caps text-[12px] uppercase tracking-widest text-gold-accent mb-2">
              Connection Delayed
            </p>
            <h1 className="font-headline-editorial text-2xl md:text-3xl text-on-surface mb-3">
              Verification taking longer than usual
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Your security session is taking a moment to resolve. You can reload the secure workspace or return to the directory.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="bg-gold-accent hover:bg-gold-bright text-background font-working-title text-sm font-bold px-6 py-3 rounded-full transition-all duration-300 cursor-pointer"
              >
                Reload Workspace
              </button>
              <button
                type="button"
                onClick={() => router.push("/property")}
                className="border border-white/15 hover:border-white/30 text-text-secondary hover:text-text-primary font-working-title text-sm px-6 py-3 rounded-full transition-all duration-300 cursor-pointer"
              >
                Return to Directory
              </button>
            </div>
          </div>
        </main>
      );
    }

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
