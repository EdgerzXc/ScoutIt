import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  ACTIVE_WORKSPACE_ROLE_KEY,
  canAccessDashboardWorkspace,
  getPersistedWorkspaceRole,
  normalizeDashboardMode,
  normalizeDashboardModes,
  resolveActiveWorkspaceSelection,
  setPersistedWorkspaceRole,
} from "../dashboardModes";
import { deckOrderForRole, isPipelineRole } from "../workspaceDeck";
import {
  CONNECT_ROLE_PURPOSES,
  getUniversalWalletOverview,
  resolveWalletRoleForMode,
} from "../connectsWallet";

function createMemoryStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

describe("A-333: Unified Workspace Lens Persistence & Non-Cluttered Domain Filter", () => {
  it("persists the active workspace role in storage and restores it when returning from Inbox/CRM without ?role=", () => {
    const storage = createMemoryStorage();
    const multiRoleAdmin = {
      id: "owner-admin-1",
      role: "admin",
      active_roles: [
        "buyer",
        "owner",
        "broker",
        "salesperson",
        "operator",
        "photographer",
        "designer",
        "researcher",
      ],
      primary_mode: "buyer",
    };

    // User switches from Buyer -> Owner in Workspace
    setPersistedWorkspaceRole("owner", storage);
    expect(getPersistedWorkspaceRole(storage)).toBe("owner");
    expect(storage.getItem(ACTIVE_WORKSPACE_ROLE_KEY)).toBe("owner");

    // User navigates to /dashboard/inbox and clicks back to /dashboard (no ?role= param in URL)
    const resolved = resolveActiveWorkspaceSelection({
      requestedRole: null,
      persistedRole: getPersistedWorkspaceRole(storage),
      user: multiRoleAdmin,
    });

    // Must stay on Owner instead of resetting to Buyer!
    expect(resolved.mode).toBe("owner");
    expect(resolved.roleKey).toBe("owner");
  });

  it("supports the unified 'all' lens for multi-role / admin accounts and includes full pipeline deck", () => {
    const storage = createMemoryStorage();
    const ownerUser = {
      id: "owner-1",
      active_roles: ["buyer", "owner", "broker"],
      primary_mode: "owner",
    };

    expect(normalizeDashboardMode("all")).toBe("all");
    expect(canAccessDashboardWorkspace("all", ["buyer", "owner"])).toBe(true);
    expect(isPipelineRole(["all"])).toBe(true);
    expect(isPipelineRole(["admin"])).toBe(true);
    expect(isPipelineRole(["staff"])).toBe(true);
    expect(normalizeDashboardModes(["buyer"], "admin")).toEqual([
      "buyer",
      "owner",
      "broker",
      "provider",
      "operator",
    ]);
    expect(deckOrderForRole("all")).toEqual(["crm", "workspace", "inbox", "calendar"]);

    setPersistedWorkspaceRole("all", storage);
    const resolved = resolveActiveWorkspaceSelection({
      requestedRole: null,
      persistedRole: getPersistedWorkspaceRole(storage),
      user: ownerUser,
    });
    expect(resolved.mode).toBe("all");
    expect(resolved.roleKey).toBe("all");
  });

  it("preserves creator specialty (designer/researcher/photographer) across route transitions", () => {
    const storage = createMemoryStorage();
    const adminUser = {
      id: "admin-1",
      role: "admin",
      active_roles: ["buyer", "owner", "designer"],
    };

    setPersistedWorkspaceRole("designer", storage);
    const resolved = resolveActiveWorkspaceSelection({
      requestedRole: null,
      persistedRole: getPersistedWorkspaceRole(storage),
      user: adminUser,
    });

    expect(resolved.mode).toBe("provider");
    expect(resolved.roleKey).toBe("designer");
    expect(resolved.providerType).toBe("designer");
  });

  it("groups 8 roles into compact domain filter pills in WorkspaceLensBar without raw hex or sub-12px text", () => {
    const lensBarPath = path.resolve(process.cwd(), "src/components/dashboard/WorkspaceLensBar.js");
    const overviewPath = path.resolve(process.cwd(), "src/components/dashboard/UnifiedOverviewMode.js");
    const lensBarSrc = fs.readFileSync(lensBarPath, "utf8");
    const overviewSrc = fs.readFileSync(overviewPath, "utf8");

    // 6 compact domain labels so 8 roles never clutter mobile or web
    for (const label of ["All", "Seeker", "Owner", "Broker", "Operator", "Creator"]) {
      expect(lensBarSrc).toContain(`shortLabel: "${label}"`);
    }

    // Open Gate utility preserved
    expect(lensBarSrc).toContain('href="/dashboard/open-gate"');
    expect(lensBarSrc).toContain("Open Gate");

    // Antislop UI & Layout Mobile compliance: 44px touch targets (min-h-11), zero raw hex, zero sub-12px text
    expect(lensBarSrc).toContain("min-h-11");
    expect(overviewSrc).toContain("min-h-11");
    expect(lensBarSrc).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(overviewSrc).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(lensBarSrc).not.toMatch(/text-\[(?:[0-9]|10|11)px\]/);
    expect(overviewSrc).not.toMatch(/text-\[(?:[0-9]|10|11)px\]/);
  });

  it("provides universal Connects wallet overview, explicit per-role Connect purpose guide, and recipient lens attribution in ChatBox", () => {
    expect(resolveWalletRoleForMode("all", undefined, ["buyer", "owner", "photographer"])).toBe("owner");
    expect(resolveWalletRoleForMode("operator", undefined, ["operator", "broker"])).toBe("broker");
    expect(resolveWalletRoleForMode("provider", "photographer", ["photographer"])).toBe("photographer");

    const overview = getUniversalWalletOverview(["owner", "photographer", "seeker"], "starry");
    expect(overview.roleBuckets.map((b) => b.role)).toEqual(["owner", "photographer", "seeker"]);
    expect(overview.totalGranted).toBeGreaterThan(0);
    expect(overview.universalTotal).toBe(overview.totalGranted + overview.purchased + overview.earned);

    for (const roleKey of ["seeker", "owner", "broker", "photographer", "designer", "researcher"]) {
      expect(CONNECT_ROLE_PURPOSES[roleKey]?.spendRule).toBeTruthy();
      expect(CONNECT_ROLE_PURPOSES[roleKey]?.receiveRule).toBeTruthy();
    }

    const chatBoxSrc = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/dashboard/ChatBox.js"),
      "utf8"
    );
    expect(chatBoxSrc).toContain("For Your Owner Lens");
    expect(chatBoxSrc).toContain("For Your Photographer Lens");
    expect(chatBoxSrc).toContain("For Your Broker Lens");
    expect(chatBoxSrc).toContain("Your Seeker Inquiry");
  });

  it("embeds Master CRM cross-lens deal feed inside UnifiedOverviewMode ('All') and filters KanbanBoard by lens", () => {
    const overviewSrc = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/dashboard/UnifiedOverviewMode.js"),
      "utf8"
    );
    const crmPageSrc = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/dashboard/crm/page.js"),
      "utf8"
    );
    const kanbanSrc = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/dashboard/crm/KanbanBoard.js"),
      "utf8"
    );

    // UnifiedOverviewMode ("All") includes embedded Master CRM deal feed & lens filter pills
    expect(overviewSrc).toContain("MASTER CRM · UNIFIED DEAL FEED");
    expect(overviewSrc).toContain("FOR YOUR OWNER LENS");
    expect(overviewSrc).toContain("FOR YOUR BROKER LENS");
    expect(overviewSrc).toContain("YOUR SEEKER INQUIRY");

    // Master CRM page & KanbanBoard filter by viewingAs and show explicit lens badges
    expect(crmPageSrc).toContain("matchesViewingLens");
    expect(kanbanSrc).toContain("resolveCardLensBadge");
    expect(kanbanSrc).toContain("OWNER LENS");
    expect(kanbanSrc).toContain("BROKER LENS");
    expect(kanbanSrc).toContain("SEEKER LENS");
    expect(kanbanSrc).toContain("CREATOR LENS");
  });
});
