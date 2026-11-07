import { describe, it, expect } from "vitest";
import React, { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import fs from "fs";
import path from "path";

import {
  ListingsProvider,
  useListings,
  DEFAULT_LISTINGS_VALUE,
  DEFAULT_MAP_CENTER,
} from "@/context/ListingsContext";
import {
  NotificationsProvider,
  useNotifications,
  DEFAULT_NOTIFICATIONS_VALUE,
} from "@/context/NotificationsContext";
import {
  DealsProvider,
  useDeals,
  DEFAULT_DEALS_VALUE,
} from "@/context/DealsContext";
import {
  WalletProvider,
  useWallet,
  DEFAULT_WALLET_VALUE,
} from "@/context/WalletContext";
import {
  UserProvider,
  useUser,
  DEFAULT_USER_VALUE,
} from "@/context/UserContext";

const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

describe("A-314: Dashboard God Object Split & Domain Isolation", () => {
  it("Domain context modules export dedicated hooks and complete default contracts", () => {
    expect(typeof useListings).toBe("function");
    expect(typeof useNotifications).toBe("function");
    expect(typeof useDeals).toBe("function");
    expect(typeof useWallet).toBe("function");
    expect(typeof useUser).toBe("function");

    expect(Array.isArray(DEFAULT_LISTINGS_VALUE.listings)).toBe(true);
    expect(Array.isArray(DEFAULT_LISTINGS_VALUE.catalogue)).toBe(true);
    expect(typeof DEFAULT_LISTINGS_VALUE.searchByRadius).toBe("function");
    expect(Array.isArray(DEFAULT_MAP_CENTER)).toBe(true);

    expect(Array.isArray(DEFAULT_NOTIFICATIONS_VALUE.notifications)).toBe(true);
    expect(Array.isArray(DEFAULT_NOTIFICATIONS_VALUE.toasts)).toBe(true);
    expect(typeof DEFAULT_NOTIFICATIONS_VALUE.addToast).toBe("function");
    expect(typeof DEFAULT_NOTIFICATIONS_VALUE.addNotification).toBe("function");

    expect(Array.isArray(DEFAULT_DEALS_VALUE.pitches)).toBe(true);
    expect(typeof DEFAULT_DEALS_VALUE.sendPitch).toBe("function");

    expect(typeof DEFAULT_WALLET_VALUE.connects).toBe("number");
    expect(typeof DEFAULT_WALLET_VALUE.getCurrentTier).toBe("function");

    expect(DEFAULT_USER_VALUE.currentUser).toBeNull();
    expect(Array.isArray(DEFAULT_USER_VALUE.savedIds)).toBe(true);
  });

  it("DashboardContext source code re-exports all domain hooks and composes providers", () => {
    const src = read("src/context/DashboardContext.js");

    // All domain hooks are exported from DashboardContext
    expect(src).toContain("export { useListings, ListingsContext, DEFAULT_LISTINGS_VALUE }");
    expect(src).toContain("export { useDeals, DealsContext, DEFAULT_DEALS_VALUE }");
    expect(src).toContain("export { useWallet, WalletContext, DEFAULT_WALLET_VALUE }");
    expect(src).toContain("export { useNotifications, NotificationsContext, DEFAULT_NOTIFICATIONS_VALUE }");
    expect(src).toContain("export { useUser, UserContext, DEFAULT_USER_VALUE }");

    // Composes domain providers in tree
    expect(src).toContain("<UserContext.Provider value={userValue}>");
    expect(src).toContain("<WalletContext.Provider value={walletValue}>");
    expect(src).toContain("<ListingsContext.Provider value={listingsValue}>");
    expect(src).toContain("<DealsContext.Provider value={dealsValue}>");
    expect(src).toContain("<NotificationsProvider");
    expect(src).toContain("<DashboardCompositeBridge");

    // Memoizes listingsValue independently from notifications
    expect(src).toMatch(/const listingsValue = useMemo\(\(\) => \(\{[\s\S]*?listings,[\s\S]*?catalogue,/);
    expect(src).toMatch(/const dealsValue = useMemo\(\(\) => \(\{[\s\S]*?pitches,/);
    expect(src).toMatch(/const walletValue = useMemo\(\(\) => \(\{[\s\S]*?connects,/);
  });

  it("notifications-only changes do NOT re-render components consuming only useListings()", async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;

    let listingsRenderCount = 0;
    let notificationsRenderCount = 0;
    let notificationsControls = null;

    function ListingsWatcher() {
      const { listings } = useListings();
      listingsRenderCount += 1;
      return createElement("div", { id: "listings-count" }, String(listings.length));
    }

    function NotificationsConsumer() {
      const ctx = useNotifications();
      notificationsControls = ctx;
      notificationsRenderCount += 1;
      return createElement("div", { id: "notif-count" }, String(ctx.notifications.length));
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const initialListings = [{ id: "prop-alpha", title: "Alpha Space" }];

    await act(async () => {
      root.render(
        createElement(
          ListingsProvider,
          { value: { listings: initialListings, catalogue: initialListings } },
          createElement(
            NotificationsProvider,
            null,
            createElement("div", null, [
              createElement(ListingsWatcher, { key: "lw" }),
              createElement(NotificationsConsumer, { key: "nc" }),
            ])
          )
        )
      );
    });

    expect(listingsRenderCount).toBe(1);
    expect(notificationsRenderCount).toBe(1);
    expect(container.querySelector("#listings-count")?.textContent).toBe("1");
    expect(container.querySelector("#notif-count")?.textContent).toBe("0");

    // 1. Add notification
    await act(async () => {
      notificationsControls.addNotification({
        title: "Deal Inbound",
        desc: "A broker submitted a pitch",
      });
    });

    expect(notificationsRenderCount).toBeGreaterThan(1);
    // CRITICAL EXIT CRITERION: Listings tree did NOT re-render!
    expect(listingsRenderCount).toBe(1);
    expect(container.querySelector("#notif-count")?.textContent).toBe("1");

    // 2. Mark notifications read
    await act(async () => {
      notificationsControls.markNotificationsRead();
    });

    expect(notificationsRenderCount).toBeGreaterThan(2);
    // Listings tree still did NOT re-render!
    expect(listingsRenderCount).toBe(1);

    // 3. Add toast
    await act(async () => {
      notificationsControls.addToast("Changes saved", "✓");
    });

    expect(notificationsRenderCount).toBeGreaterThan(3);
    // Listings tree still did NOT re-render!
    expect(listingsRenderCount).toBe(1);

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});

describe("A-314: Flow Duplication Extraction Contracts", () => {
  it("PropertyChapterHeader enforces typography and theme token standards", () => {
    const src = read("src/components/property/PropertyChapterHeader.js");
    expect(src).toContain("import ChapterSubtitle from");
    expect(src).toContain("chapterNumber");
    expect(src).toContain("chapterLabel");
    expect(src).toContain("subtitle");
    expect(src).toContain("var(--font-mono)");
    expect(src).toContain("var(--text-muted)");
    expect(src).toContain("var(--border)");
    // Must NOT contain raw hex
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  it("PropertyVaultSection encapsulates 3D tour, blueprints, and sidebar metadata", () => {
    const src = read("src/components/property/PropertyVaultSection.js");
    expect(src).toContain("import dynamic from \"next/dynamic\"");
    expect(src).toContain("SpatialVaultWidget");
    expect(src).toContain("THE VAULT");
    expect(src).toContain("3D Virtual Tours & Blueprints");
    expect(src).toContain("Vault Status");
    expect(src).toContain("Cluster Tier Only");
    expect(src).toContain("intelSourceLabel");
    // Must NOT contain raw hex
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  it("PropertyRateSection enforces commercial verification gating and residential disclaimers", () => {
    const src = read("src/components/property/PropertyRateSection.js");
    expect(src).toContain("formatUnitPrice");
    expect(src).toContain("AffordabilityCalculator");
    expect(src).toContain("MonthlyCostCalculator");
    expect(src).toContain("isCommercial");
    expect(src).toContain("Verified by");
    expect(src).toContain("Price on request");
    expect(src).toContain("Current Property Representation");
    // Must NOT contain raw hex
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  it("CommercialFlow and ResidentialFlow consume extracted property components", () => {
    const commercialSrc = read("src/components/property/CommercialFlow.js");
    const residentialSrc = read("src/components/property/ResidentialFlow.js");

    for (const [name, src] of [["CommercialFlow", commercialSrc], ["ResidentialFlow", residentialSrc]]) {
      expect(src, `${name} must import PropertyChapterHeader`).toContain("import PropertyChapterHeader");
      expect(src, `${name} must import PropertyVaultSection`).toContain("import PropertyVaultSection");
      expect(src, `${name} must import PropertyRateSection`).toContain("import PropertyRateSection");

      expect(src, `${name} must render <PropertyChapterHeader`).toContain("<PropertyChapterHeader");
      expect(src, `${name} must render <PropertyVaultSection`).toContain("<PropertyVaultSection");
      expect(src, `${name} must render <PropertyRateSection`).toContain("<PropertyRateSection");

      // Verify that the old inline vault panel duplicate has been removed
      expect(src, `${name} must not contain duplicated inline vault panel`).not.toContain("Floor plans, scans & spatial records");
    }
  });
});
