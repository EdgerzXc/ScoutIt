"use client";

import { useEffect, useRef, useState } from "react";

const RISKY_HIDDEN_MS = 5 * 60 * 1000;

export default function SensitiveWorkspaceGuard({ children, staffEmail, sessionReference, sessionStartedAt }) {
  const [redacted, setRedacted] = useState(false);
  const [reauthRequired, setReauthRequired] = useState(false);
  const [watermarkTime, setWatermarkTime] = useState(sessionStartedAt);
  const hiddenAt = useRef(null);
  const actionRef = useRef(null);

  useEffect(() => {
    const tick = () => setWatermarkTime(new Date().toISOString());
    const interval = window.setInterval(tick, 60_000);
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        setRedacted(true);
        return;
      }
      if (hiddenAt.current && Date.now() - hiddenAt.current >= RISKY_HIDDEN_MS) setReauthRequired(true);
      window.setTimeout(() => actionRef.current?.focus(), 0);
    };
    const onPageShow = (event) => {
      if (event.persisted) { setRedacted(true); setReauthRequired(true); }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const revalidate = () => window.location.reload();

  return (
    <>
      <div className="mc-print-notice" role="note">
        <strong>Printing prohibited</strong>
        <span>Mission Control content is redacted from print and browser PDF output. Use the audited application workflow.</span>
        <span>{staffEmail} · {sessionReference}</span>
      </div>
      <div className={`mc-sensitive-shell ${redacted ? "mc-is-redacted" : ""}`} aria-hidden={redacted || undefined} inert={redacted || undefined}>
        {children}
      </div>
      <div className="mc-watermark" aria-hidden="true">
        <span>{staffEmail}</span><span>{watermarkTime}</span><span>{sessionReference}</span>
      </div>
      {redacted && (
        <div className="mc-privacy-curtain" role="alertdialog" aria-modal="true" aria-labelledby="mc-privacy-title" aria-describedby="mc-privacy-copy">
          <div className="mc-privacy-card">
            <p className="label-mono text-gold">Protected workspace</p>
            <h1 id="mc-privacy-title">Sensitive content hidden</h1>
            <p id="mc-privacy-copy">The tab lost visibility. {reauthRequired ? "This extended or restored session must sign in again." : "Revalidate the current server session to continue."}</p>
            {reauthRequired ? (
              <form action="/auth/signout" method="POST"><button ref={actionRef} type="submit">Sign in again</button></form>
            ) : (
              <button ref={actionRef} type="button" onClick={revalidate}>Revalidate session</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

