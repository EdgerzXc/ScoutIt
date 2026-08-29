import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");

const inbox = read("src/app/dashboard/inbox/page.js");
const crm = read("src/app/dashboard/crm/page.js");
const kanban = read("src/components/dashboard/crm/KanbanBoard.js");
const calendarPage = read("src/app/dashboard/calendar/page.js");
const calendarShell = read("src/components/calendar/CalendarShell.js");
const workspaceBar = read("src/components/dashboard/WorkspaceCommandBar.js");
const chatBox = read("src/components/dashboard/ChatBox.js");
const bookingModal = read("src/components/dashboard/BookingModal.js");
const viewingCard = read("src/components/dashboard/ViewingWorkspaceCard.js");
const appointmentRoute = read("src/app/api/viewing-appointments/[id]/route.js");
const dashboardHome = read("src/app/dashboard/page.js");
const attentionRail = read("src/components/dashboard/AttentionRail.js");
const attentionRoute = read("src/app/api/dashboard/attention/route.js");
const dealsRoute = read("src/app/api/deals/route.js");

describe("A-047 ScoutIt Inbox and CRM workspace curation", () => {
  it("uses one connected workspace navigation across Inbox, CRM, and Calendar", () => {
    expect(workspaceBar).toContain('href: "/dashboard/inbox"');
    expect(workspaceBar).toContain('href: "/dashboard/crm"');
    expect(workspaceBar).toContain('href: "/dashboard/calendar"');
    expect(workspaceBar).toContain('aria-label="Deal workspace"');

    expect(inbox).toContain('<WorkspaceCommandBar active="inbox"');
    expect(crm).toContain('<WorkspaceCommandBar active="crm"');
    expect(calendarPage).toContain('<WorkspaceCommandBar active="calendar"');
  });

  it("keeps the curated workspace on ScoutIt tokens and reduced-motion-safe movement", () => {
    for (const source of [inbox, crm, workspaceBar, bookingModal, viewingCard]) {
      expect(source).not.toMatch(/#[0-9a-f]{3,8}/i);
    }
    expect(inbox).toContain("useReducedMotion");
    expect(workspaceBar).toContain("duration-300");
    expect(crm).toContain("ScoutIt CRM");
    expect(inbox).toContain("ScoutIt deal rooms");
  });

  it("defaults a phone to Agenda unless an explicit calendar view was requested", () => {
    expect(calendarShell).toContain('window.matchMedia("(max-width: 639px)").matches');
    expect(calendarShell).toContain('setView("agenda")');
    expect(calendarShell.indexOf("VALID_VIEWS.includes(urlView)"))
      .toBeLessThan(calendarShell.indexOf('setView("agenda")'));
  });
});

describe("A-050 CRM typography hierarchy", () => {
  it("uses Sans for readable content and Mono only for compact system labels", () => {
    expect(crm).toContain("font-headline-editorial text-3xl font-semibold");
    expect(crm).toContain("Keep relationships, viewings, and next actions in one place.");
    expect(crm).toContain("font-body text-2xl font-semibold tracking-tight");
    expect(crm).toContain("font-body text-base leading-snug");
    expect(crm).not.toContain("text-[12px]");
    expect(kanban).toContain("font-body text-base font-semibold");
    expect(kanban).toContain("font-label-caps text-label-caps uppercase");
    expect(kanban).toContain('type="search"');
    expect(kanban).toContain('aria-label="Search deals"');
    expect(kanban).toContain("!rounded-full");
    expect(kanban).toContain("!pl-11");
    expect(kanban).not.toContain("text-[12px]");
  });

  it("uses vector lock icons and touch-sized toolbar controls", () => {
    expect(crm).toContain("LockKeyhole");
    expect(crm).not.toContain("🔒");
    expect(crm).toContain("flex min-h-11 items-center");
  });
});

describe("A-047 ChatBox live scheduling connection", () => {
  it("books and reschedules through the same live-slot picker and returns the real row", () => {
    expect(bookingModal).toContain('mode === "reschedule"');
    expect(bookingModal).toContain('`/api/viewing-appointments/${appointmentId}`');
    expect(bookingModal).toContain('method: isReschedule ? "PATCH" : "POST"');
    expect(bookingModal).toContain("onSchedule?.(data.appointment)");
    expect(bookingModal).toContain('`/api/deals/${dealId}/slots?from=${from}&to=${to}`');
  });

  it("treats the appointment row, not a system message, as ChatBox state", () => {
    expect(chatBox).toContain('crmFetch("/api/viewing-appointments"');
    expect(chatBox).toContain('crmFetch(`/api/viewing-appointments/${activeViewing.id}`');
    expect(chatBox).toContain("setActiveViewing");
    expect(chatBox).toContain("<ViewingWorkspaceCard");
    expect(chatBox).toContain('window.dispatchEvent(new Event("calendar:refresh"))');

    expect(chatBox).not.toContain("showRescheduleModal");
    expect(chatBox).not.toContain("submitReschedule");
    expect(chatBox).not.toContain("Viewing Confirmed &amp; Calendar Synced");
  });

  it("keeps host confirmation and live-slot rescheduling permission-aware", () => {
    expect(chatBox).toContain('activeViewing?.isHost && activeViewing.status === "pending"');
    expect(chatBox).toContain('openViewingPicker("reschedule")');
    expect(viewingCard).toContain("appointment.isHost");
    expect(viewingCard).toContain('href="/dashboard/calendar"');
  });

  it("validates the viewer timezone on both first booking and reschedule", () => {
    expect(appointmentRoute).toContain('refine(isValidTimeZone, "Unrecognised timezone")');
  });
});

describe("A-051 cross-workspace attention signal", () => {
  it("puts one live urgency rail on the dashboard home for every role", () => {
    expect(dashboardHome).toContain("import AttentionRail");
    expect(dashboardHome).toContain("<AttentionRail mockUserId={user.id}");
    // Mounted outside renderActiveMode(), so switching workspace role cannot
    // hide the signal for owners, brokers, buyers or providers.
    expect(dashboardHome.indexOf("<AttentionRail"))
      .toBeLessThan(dashboardHome.indexOf("{renderActiveMode()}"));
  });

  it("reads all three workspaces through one authenticated endpoint", () => {
    expect(attentionRail).toContain('crmFetch("/api/dashboard/attention"');
    expect(attentionRoute).toContain("resolveUserId(request)");
    expect(attentionRoute).toContain('from("crm_tasks")');
    expect(attentionRoute).toContain('from("viewing_appointments")');
    expect(attentionRoute).toContain("loadUserDealRows");
    expect(attentionRoute).toContain("computeAttention");
  });

  it("derives deal membership and status buckets from one shared module", () => {
    expect(dealsRoute).toContain('from "@/lib/deals/userDeals"');
    expect(attentionRoute).toContain('from "@/lib/deals/userDeals"');
    expect(inbox).toContain('from "@/lib/deals/dealStatus"');
    // The buckets must exist in exactly one place — a second copy is how a
    // live request silently lands in the wrong state.
    expect(inbox).not.toContain("const WAITING_STATUSES");
    expect(inbox).not.toContain("const CLOSED_STATUSES");
  });

  it("says so when a workspace could not be read instead of showing calm", () => {
    expect(attentionRoute).toContain("unavailable");
    expect(attentionRail).toContain("We could not read this workspace");
    expect(attentionRail).toContain("We could not check your workspaces just now.");
  });

  it("keeps the rail on ScoutIt tokens, typography and reduced-motion rules", () => {
    expect(attentionRail).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(attentionRail).toContain("useReducedMotion");
    expect(attentionRail).toContain("font-label-caps text-label-caps uppercase");
    expect(attentionRail).toContain("font-body text-base");
    expect(attentionRail).not.toContain("text-[12px]");
    expect(attentionRail).toContain('aria-label="What needs you"');
    expect(attentionRail).toContain('aria-live="polite"');
  });
});
