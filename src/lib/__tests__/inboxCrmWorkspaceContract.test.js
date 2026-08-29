import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");

const inbox = read("src/app/dashboard/inbox/page.js");
const crm = read("src/app/dashboard/crm/page.js");
const calendarPage = read("src/app/dashboard/calendar/page.js");
const calendarShell = read("src/components/calendar/CalendarShell.js");
const workspaceBar = read("src/components/dashboard/WorkspaceCommandBar.js");
const chatBox = read("src/components/dashboard/ChatBox.js");
const bookingModal = read("src/components/dashboard/BookingModal.js");
const viewingCard = read("src/components/dashboard/ViewingWorkspaceCard.js");
const appointmentRoute = read("src/app/api/viewing-appointments/[id]/route.js");

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
