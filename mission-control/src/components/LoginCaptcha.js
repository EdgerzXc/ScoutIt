"use client";

import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function LoginCaptcha({ widgetRef, onToken }) {
  const [error, setError] = useState("");
  const unavailable = (message) => {
    onToken("");
    setError(message);
  };

  if (!SITE_KEY) {
    return <p role="alert" className="text-danger text-xs">Security verification is unavailable. Contact your administrator.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-xs uppercase tracking-widest text-foreground/70">Security check</p>
      <Turnstile
        ref={widgetRef}
        siteKey={SITE_KEY}
        options={{ theme: "dark", size: "flexible", action: "mission-control-login" }}
        onSuccess={(token) => { setError(""); onToken(token); }}
        onExpire={() => onToken("")}
        onTimeout={() => onToken("")}
        onError={(code) => unavailable(code === "110200"
          ? "Security verification is not enabled for this address. Contact your administrator."
          : "Security verification failed. Retry the check.")}
        onUnsupported={() => unavailable("This browser cannot complete security verification. Try an updated browser.")}
        scriptOptions={{ onError: () => unavailable("Security verification could not load. Refresh the page to retry.") }}
      />
      {error && (
        <div role="alert" className="text-danger text-xs space-y-2">
          <p>{error}</p>
          <button type="button" className="font-mono uppercase tracking-widest text-gold" onClick={() => {
            onToken("");
            setError("");
            widgetRef.current?.reset();
          }}>Retry security check</button>
        </div>
      )}
    </div>
  );
}
