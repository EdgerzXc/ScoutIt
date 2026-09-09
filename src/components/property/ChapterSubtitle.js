"use client";

import { useSimpleMode } from "@/hooks/useSimpleMode";
import { chapterSubtitleVisible } from "@/lib/simpleModeSurfaces";

// A-083 phase 1 — the one place a chapter subtitle renders.
//
// Every chapter subtitle in `chapterConfig.js` is a `description` by the
// derivation rule: explanatory prose attached to a named thing. Simple omits
// it; Pro is untouched.
//
// This exists as a component rather than a condition repeated at each call
// site because CommercialFlow and ResidentialFlow carried EIGHTEEN copies of
// the identical block between them. Eighteen copies of a rule is eighteen
// chances to get one wrong, and this ledger has already recorded that shape
// twice this session — the BrokerMode panel where one of two cells was fixed,
// and the property "Intel source" field duplicated across both flows.
//
// The markup and styling are lifted verbatim from those call sites, so Pro
// renders byte-identically to before.

export default function ChapterSubtitle({ text }) {
  const simple = useSimpleMode();

  if (!chapterSubtitleVisible(text, simple)) return null;

  return (
    <div
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "13px",
        color: "var(--text-secondary)",
        marginBottom: "10px",
        letterSpacing: "0.01em",
      }}
    >
      {text}
    </div>
  );
}
