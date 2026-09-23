import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Facebook share is an ease-of-life feature with two honest states, not a
// promised auto-poster (silent timeline posting died with publish_actions).
// Render tests are impossible here (JSX in .js), so this pins the branching
// logic by reading source — the analyticsEmitters convention.

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");
const MODAL = "src/components/property/ShareModal.js";

describe("facebook share — two usable states, never a void", () => {
  it("keeps the no-App-ID sharer fallback carrying the link", () => {
    const src = read(MODAL);
    expect(src).toContain("https://www.facebook.com/sharer/sharer.php?u=${u}");
  });

  it("prefills via the Share dialog only when an App ID is configured", () => {
    const src = read(MODAL);
    expect(src).toContain("export function facebookShareHref(url, quote)");
    expect(src).toContain("https://www.facebook.com/dialog/share?");
    expect(src).toContain("quote");
    expect(src).toContain('hashtag: "#ScoutIt"');
    expect(src).toContain("if (FACEBOOK_APP_ID && text) return facebookShareHref(url, text);");
  });

  it("decides copy-vs-prefill per tap, not once at module load", () => {
    const src = read(MODAL);
    // The branch must read the live text, not a stale closure: the caption
    // (with hashtags) is built fresh in handleChannel on every tap.
    expect(src).toContain('channel.key === "facebook" ? Boolean(FACEBOOK_APP_ID) : channel.prefill');
  });

  it("keeps a clipboard backup for Facebook in case the dialog drops quote", () => {
    const src = read(MODAL);
    expect(src).toContain("!prefill || channel.key === \"facebook\"");
    expect(src).toContain("Backup copy kept");
  });

  it("shares to WhatsApp and Telegram with full prefill, no registration", () => {
    const src = read(MODAL);
    expect(src).toContain("https://wa.me/?text=${t}");
    expect(src).toContain("https://t.me/share/url?url=${u}&text=${t}");
  });

  it("tells the user to hit Post instead of implying it posted for them", () => {
    const src = read(MODAL);
    expect(src).toContain("hit Post");
    expect(src).toContain("auto-posting to timelines");
    expect(src).not.toContain("automatically share");
    expect(src).not.toContain("autoPost(");
  });

  it("still counts the share only when the window actually opens", () => {
    const src = read(MODAL);
    expect(src).toContain("const win = window.open(");
    expect(src).toContain("if (win) {");
  });
});
