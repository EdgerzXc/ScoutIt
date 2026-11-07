import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("A-328: Mobile Deck Drawer Breakpoint Isolation & Bottom Nav Peek Unread Badge", () => {
  const bottomNavSrc = read("src/components/layout/BottomNav.js");
  const dashboardSrc = read("src/app/dashboard/page.js");

  it("BottomNav maintains unreadCount state and listens to scoutit:unread-inbox-count event", () => {
    expect(bottomNavSrc).toContain("const [unreadCount, setUnreadCount] = useState(0);");
    expect(bottomNavSrc).toContain('window.addEventListener("scoutit:unread-inbox-count", handleUnread);');
    expect(bottomNavSrc).toContain('window.removeEventListener("scoutit:unread-inbox-count", handleUnread);');
  });

  it("BottomNav surfaces unread count badge in collapsed peek handle when unreadCount > 0", () => {
    expect(bottomNavSrc).toContain("unreadCount > 0 && !isNavExpanded");
    expect(bottomNavSrc).toContain('aria-label={`${unreadCount} unread items`}');
    expect(bottomNavSrc).toContain('unreadCount > 99 ? "99+" : unreadCount');
  });

  it("dashboard/page.js broadcasts scoutit:unread-inbox-count when unread deals are loaded", () => {
    expect(dashboardSrc).toContain('window.dispatchEvent(new CustomEvent("scoutit:unread-inbox-count", { detail: { count: total } }));');
  });

  it("dashboard/page.js strictly enforces breakpoint isolation between drawer and desktop command bar", () => {
    // Mobile container must be md:hidden
    expect(dashboardSrc).toContain('<div className="md:hidden w-full px-3 pb-1 pt-0.5 border-t border-surface-variant/40">');
    expect(dashboardSrc).toContain('<WorkspaceDeckDrawer active="workspace" badges={{ inbox: unreadInboxCount }} isWizardActive={isWizardActive} mode={mode} />');

    // Desktop command bar must be hidden md:block
    expect(dashboardSrc).toContain('<div className={`hidden md:block mb-6');
    expect(dashboardSrc).toContain('<WorkspaceCommandBar active="workspace" badges={{ inbox: unreadInboxCount }} mode={mode} />');
  });
});
