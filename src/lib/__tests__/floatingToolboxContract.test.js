import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = () => readFileSync('src/components/ui/FloatingToolbox.js', 'utf8');

// These are source assertions, not render assertions, and that is a documented
// limitation rather than a preference: this repo writes JSX inside `.js` files,
// which the Vite/Rolldown pipeline vitest runs on will not parse, so no
// component in the codebase can be render-tested today (see ACTIVE.md, "Not in
// this queue, on purpose"). Every assertion below was mutation-tested — the
// guard it names was removed or inverted and the test was watched to fail —
// because a regression test nobody has seen go red is a test nobody knows
// works (Rule 19).
//
// The body of the outside-pointer handler is extracted rather than matched
// against the whole file. A `.not.toMatch` over the full source passes for the
// uninteresting reason that the string is absent everywhere, which would keep
// passing if the handler were deleted outright.
function outsidePointerHandler() {
  const code = source();
  const start = code.indexOf('function handleOutsidePointer');
  if (start === -1) return null;
  const open = code.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < code.length; i += 1) {
    if (code[i] === '{') depth += 1;
    if (code[i] === '}') {
      depth -= 1;
      if (depth === 0) return code.slice(start, i + 1);
    }
  }
  return null;
}

describe('A-031 FloatingToolbox outside-pointer dismiss', () => {
  it('has an outside-pointer handler at all', () => {
    // Guards every other assertion in this block: each one below reads the
    // handler body, and a null body must fail loudly rather than vacuously.
    expect(outsidePointerHandler()).not.toBeNull();
  });

  it('listens on the capture phase so the press is seen before the page', () => {
    expect(source()).toContain(
      'document.addEventListener("pointerdown", handleOutsidePointer, true)',
    );
  });

  it('removes the listener when the panel closes', () => {
    expect(source()).toContain(
      'document.removeEventListener("pointerdown", handleOutsidePointer, true)',
    );
  });

  it('ignores presses inside the panel', () => {
    expect(outsidePointerHandler()).toContain('panelRef.current?.contains(event.target)');
  });

  it('ignores presses on the trigger, so it toggles instead of double-firing', () => {
    // Without this the trigger's own handler reopens what this one just closed,
    // or closes what it just opened, depending on ordering.
    expect(outsidePointerHandler()).toContain('containerRef.current?.contains(event.target)');
  });

  it('does not self-close while the panel is being dragged', () => {
    expect(outsidePointerHandler()).toContain('isDraggingPanel.current');
  });

  it('never swallows the press it dismisses on', () => {
    // The owner's decision: the closing press passes through and reaches the
    // control underneath. A capture-phase listener that cancelled the event
    // would close the panel and eat the tap, so a phone visitor would have to
    // press twice — which is the defect this task exists to prevent.
    const handler = outsidePointerHandler();
    expect(handler).not.toContain('preventDefault');
    expect(handler).not.toContain('stopPropagation');
    expect(handler).not.toContain('stopImmediatePropagation');
  });
});

describe('A-031 FloatingToolbox Escape and focus return', () => {
  it('only closes the panel on Escape when the panel is open', () => {
    // Written as `else if (open)`. Without the guard, Escape anywhere on the
    // page calls setOpen(false) on an already-closed panel and steals focus
    // back to the trigger from whatever the visitor was actually using.
    expect(source()).toMatch(/else if \(open\)\s*\{\s*setOpen\(false\);\s*restorePanelTriggerFocus\(\);/);
  });

  it('re-runs the Escape effect when open changes', () => {
    // `open` is read inside the handler, so omitting it from the dependency
    // array closes over a stale `false` and the guard above never passes.
    expect(source()).toMatch(/window\.removeEventListener\("keydown", handleKeyDown\);\s*\}, \[open, wizardOpen\]\)/);
  });

  it('falls back to a real control when the remembered trigger is gone', () => {
    const code = source();
    expect(code).toContain('remembered?.isConnected ? remembered : fallback');
    expect(code).toContain('button[aria-label="Menu"]');
  });
});

describe('A-032 FloatingToolbox panel landmark and tokens', () => {
  it('gives the panel a named supplementary landmark', () => {
    const code = source();
    expect(code).toContain('role="complementary"');
    expect(code).toContain('aria-label="Help & Display"');
  });

  it('uses the secondary-text token rather than a raw low-contrast white', () => {
    const code = source();
    expect(code).toContain('color: "var(--text-secondary)"');
    // 30% white on the panel surface fails 4.5:1 and was the reason the token
    // exists. Pin the specific literal that was removed, not the concept.
    expect(code).not.toContain('fontSize: 12, color: "rgba(255,255,255,0.3)"');
  });
});
