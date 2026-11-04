import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isPipelineRole, deckOrderForRole } from "../workspaceDeck";

const read = (relPath) => readFileSync(path.resolve(process.cwd(), relPath), "utf8");

describe("A-295 — Buyer/Seeker Workspace Simplification & No-CRM Enforcement", () => {
  it("enforces that non-pipeline roles (buyer, seeker, exploring) have no CRM in deckOrderForRole", () => {
    expect(deckOrderForRole("buyer")).toEqual(["workspace", "inbox"]);
    expect(deckOrderForRole("seeker")).toEqual(["workspace", "inbox"]);
    expect(deckOrderForRole("exploring")).toEqual(["workspace", "inbox"]);
    expect(isPipelineRole(["buyer"])).toBe(false);
    expect(isPipelineRole(["seeker"])).toBe(false);
    expect(isPipelineRole(["exploring"])).toBe(false);
  });

  it("enforces that pipeline roles (owner, broker, salesperson) have CRM in deckOrderForRole", () => {
    expect(deckOrderForRole("owner")).toEqual(["crm", "workspace", "inbox", "calendar"]);
    expect(deckOrderForRole("broker")).toEqual(["crm", "workspace", "inbox", "calendar"]);
    expect(deckOrderForRole("salesperson")).toEqual(["crm", "workspace", "inbox", "calendar"]);
    expect(isPipelineRole(["owner"])).toBe(true);
    expect(isPipelineRole(["broker"])).toBe(true);
    expect(isPipelineRole(["salesperson"])).toBe(true);
  });

  it("filters out CRM in WorkspaceCommandBar for non-pipeline roles while retaining Calendar for viewings", () => {
    const barCode = read("src/components/dashboard/WorkspaceCommandBar.js");
    expect(barCode).toContain("isPipelineRole");
    expect(barCode).toContain("visibleDestinations");
    expect(barCode).toContain('d.id === "crm"');
    expect(barCode).toContain('gridClass = visibleDestinations.length === 3 ? "grid-cols-3" : "grid-cols-4"');
  });

  it("wires mode prop through WorkspaceDeckDrawer to WorkspaceCommandBar", () => {
    const drawerCode = read("src/components/dashboard/WorkspaceDeckDrawer.js");
    expect(drawerCode).toContain("mode = ");
    expect(drawerCode).toContain("mode={mode}");
  });

  it("removes redundant 'Active Workspace: ... Role: ...' strip and binds mode to command bar in dashboard page.js", () => {
    const dashboardCode = read("src/app/dashboard/page.js");
    // Redundant text and developer code leak must be removed
    expect(dashboardCode).not.toContain("Active Workspace:");
    expect(dashboardCode).not.toContain("Role:</span>");
    // Command bar and drawer must receive mode
    expect(dashboardCode).toContain("<WorkspaceDeckDrawer active=\"workspace\" badges={{ inbox: unreadInboxCount }} isWizardActive={isWizardActive} mode={mode} />");
    expect(dashboardCode).toContain("<WorkspaceCommandBar active=\"workspace\" badges={{ inbox: unreadInboxCount }} mode={mode} />");
  });

  it("gates desktop switcher 'Master CRM' utility behind isPipelineRole and offers 'Explore Spaces' to buyers", () => {
    const dashboardCode = read("src/app/dashboard/page.js");
    expect(dashboardCode).toContain("isPipelineRole(heldRoles)");
    expect(dashboardCode).toContain("Master CRM ↗");
    expect(dashboardCode).toContain("Explore Spaces ↗");
    expect(dashboardCode).toContain('href="/property"');
  });

  it("passes mode to WorkspaceCommandBar in Inbox, CRM, and Calendar pages", () => {
    const inboxCode = read("src/app/dashboard/inbox/page.js");
    const crmCode = read("src/app/dashboard/crm/page.js");
    const calendarCode = read("src/app/dashboard/calendar/page.js");

    expect(inboxCode).toContain('mode={isPipelineRole(currentUser?.active_roles) ? "owner" : "buyer"}');
    expect(crmCode).toContain('mode={viewingAs || "owner"}');
    expect(calendarCode).toContain("mode={activeMode}");
    expect(calendarCode).toContain('const activeMode = isPipeline ? "owner" : "buyer";');
  });

  it("strictly gates /dashboard/crm doorway preventing buyers from opening pipeline by URL", () => {
    const crmCode = read("src/app/dashboard/crm/page.js");
    expect(crmCode).toContain("const isPipeline = isPipelineRole(currentUser?.active_roles);");
    expect(crmCode).toContain("if (!isPipeline)");
    expect(crmCode).toContain("Pipeline Workspace Unavailable");
    expect(crmCode).toContain("href=\"/dashboard\"");
  });
});
