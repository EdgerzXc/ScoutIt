import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// A-153 — modals trap Tab inside the dialog and dismiss on Escape; the app
// ships a skip-to-content link; decorative SVGs stay silent for screen
// readers.
//
// (Rule 19: written first and watched failing — no modal named Escape or a
// focus trap, layout had no skip link.)

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

const MODALS = [
  "src/components/property/InquiryModal.js",
  "src/components/property/UnitInquiryModal.js",
  "src/components/ui/EarlyAccessGate.js",
  "src/components/dashboard/BookingModal.js",
  "src/components/stratosphere/CommunityConnectModal.js",
];

describe("A-153 — modal keyboard contract", () => {
  it("every modal wires the shared dialog hook", () => {
    for (const file of MODALS) {
      const src = read(file);
      expect(src).toContain("useModalDialog");
    }
  });

  it("the hook handles Escape and traps Tab", () => {
    const src = read("src/components/ui/useModalDialog.js");
    expect(src).toContain('"Escape"');
    expect(src).toContain("trapTabKey");
    expect(src).toContain("onClose");
  });

  it("Tab wraps from last to first and first to last inside the dialog", async () => {
    const { getFocusableElements, trapTabKey } = await import(
      "@/components/ui/modalDialog.js"
    );
    document.body.innerHTML =
      '<div id="dlg"><button id="a">a</button><button id="b" disabled>no</button><button id="c">c</button></div>';
    const dlg = document.getElementById("dlg");
    // The disabled control is not in the trap set at all — a trap that
    // lands focus on a disabled button strands keyboard users.
    expect(getFocusableElements(dlg).map((el) => el.id)).toEqual(["a", "c"]);
    const a = document.getElementById("a");
    const c = document.getElementById("c");
    const tabOn = (target, shiftKey) => {
      let prevented = false;
      const handled = trapTabKey(
        {
          key: "Tab",
          shiftKey,
          target,
          preventDefault: () => {
            prevented = true;
          },
        },
        dlg,
      );
      return { handled, prevented };
    };

    // Forward Tab on the last control wraps to the first.
    c.focus();
    const fwd = tabOn(c, false);
    expect(fwd.handled).toBe(true);
    expect(fwd.prevented).toBe(true);
    expect(document.activeElement).toBe(a);

    // Shift+Tab on the first control wraps to the last.
    a.focus();
    const back = tabOn(a, true);
    expect(back.handled).toBe(true);
    expect(back.prevented).toBe(true);
    expect(document.activeElement).toBe(c);

    // A mid-dialog Tab is left alone.
    a.focus();
    const mid = tabOn(a, false);
    expect(mid.handled).toBe(false);
    expect(mid.prevented).toBe(false);

    // Non-Tab keys are never trapped.
    expect(
      trapTabKey({ key: "Enter", target: a, preventDefault: () => {} }, dlg),
    ).toBe(false);
    document.body.innerHTML = "";
  });

  it("the layout ships a skip link that lands on the page main", () => {
    expect(read("src/app/layout.js")).toContain("SkipLink");
    const src = read("src/components/ui/SkipLink.js");
    expect(src).toContain("#main-content");
    expect(src).toContain("Skip to");
  });

  it("decorative SVGs in touched modals stay silent", () => {
    // EarlyAccessGate inlines literal <svg> tags — each must be hidden.
    const gate = read("src/components/ui/EarlyAccessGate.js");
    const svgs = gate.match(/<svg[\s\S]*?>/g) || [];
    expect(svgs.length).toBeGreaterThan(0);
    for (const tag of svgs) {
      expect(tag).toContain('aria-hidden="true"');
    }
    // CommunityConnectModal uses lucide components — each decorative icon
    // must pass aria-hidden through (its buttons already carry the names).
    const ccm = read("src/components/stratosphere/CommunityConnectModal.js");
    for (const icon of ["<X ", "<Zap ", "<Shield ", "<Send ", "<CheckCircle2 "]) {
      const uses = ccm.match(new RegExp(`${icon}[^>]*>`, "g")) || [];
      expect(uses.length).toBeGreaterThan(0);
      for (const tag of uses) {
        expect(tag).toContain('aria-hidden="true"');
      }
    }
  });
});
