"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useModalDialog } from "./useModalDialog";
import styles from "./FirstVisitPresentation.module.css";

export default function FirstVisitPresentation({ onComplete }) {
  const dialogRef = useRef(null);
  const completeRef = useRef(onComplete);
  const [appearance, setAppearance] = useState("dark");
  const [detail, setDetail] = useState("pro");

  useEffect(() => { completeRef.current = onComplete; }, [onComplete]);
  const dismiss = useCallback(() => completeRef.current(null), []);
  useModalDialog(dialogRef, { active: true, onClose: dismiss });

  return (
    <div className={styles.backdrop} onPointerDown={(event) => {
      if (event.target === event.currentTarget) dismiss();
    }}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="presentation-title"
        aria-describedby="presentation-intro"
        className={styles.card}
      >
        <div className={styles.header}>
          <span className={styles.eyebrow}>YOUR SCOUTIT VIEW</span>
          <button type="button" className={styles.close} onClick={dismiss} aria-label="Keep Dark and Pro">×</button>
          <h2 id="presentation-title">Choose your view</h2>
          <p id="presentation-intro">Set how ScoutIt looks and how much detail it shows. You can change either choice in Help &amp; Display.</p>
          <svg className={styles.orbitLine} viewBox="0 0 440 24" fill="none" aria-hidden="true">
            <path d="M1 19 C74 2 143 2 220 14 S364 22 439 4" />
            <circle cx="220" cy="14" r="3" />
          </svg>
        </div>

        <div className={styles.groups}>
          <fieldset className={styles.group}>
            <legend>Appearance</legend>
            <label className={styles.choice}>
              <input type="radio" name="presentation-appearance" value="dark" checked={appearance === "dark"} onChange={() => setAppearance("dark")} />
              <span className={styles.choiceVisual}>
                <strong>Dark</strong><small>ScoutIt’s cinematic default</small>
              </span>
            </label>
            <label className={styles.choice}>
              <input type="radio" name="presentation-appearance" value="light" checked={appearance === "light"} onChange={() => setAppearance("light")} />
              <span className={styles.choiceVisual}>
                <strong>White Lens</strong><small>A quieter professional view</small>
              </span>
            </label>
          </fieldset>

          <fieldset className={styles.group}>
            <legend>Detail</legend>
            <label className={styles.choice}>
              <input type="radio" name="presentation-detail" value="pro" checked={detail === "pro"} onChange={() => setDetail("pro")} />
              <span className={styles.choiceVisual}>
                <strong>Pro</strong><small>Full detail, current default</small>
              </span>
            </label>
            <label className={styles.choice}>
              <input type="radio" name="presentation-detail" value="simple" checked={detail === "simple"} onChange={() => setDetail("simple")} />
              <span className={styles.choiceVisual}>
                <strong>Simple</strong><small>Fewer words, same access</small>
              </span>
            </label>
          </fieldset>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.dismiss} onClick={dismiss}>Keep Dark + Pro</button>
          <button type="button" className={styles.confirm} onClick={() => completeRef.current({ appearance, detail })}>Use these choices</button>
        </div>
      </section>
    </div>
  );
}
