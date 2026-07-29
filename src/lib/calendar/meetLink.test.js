import { describe, it, expect } from 'vitest';
import { extractMeetLink, buildViewingEventBody } from './meetLink.js';

describe('extractMeetLink', () => {
  it('reads the video entry point', () => {
    const event = {
      conferenceData: { entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/abc-defg-hij' }] },
    };
    expect(extractMeetLink(event)).toBe('https://meet.google.com/abc-defg-hij');
  });

  // entryPoints is the documented source of truth; hangoutLink is legacy.
  it('prefers the entry point over hangoutLink', () => {
    const event = {
      hangoutLink: 'https://old',
      conferenceData: { entryPoints: [{ entryPointType: 'video', uri: 'https://new' }] },
    };
    expect(extractMeetLink(event)).toBe('https://new');
  });

  it('falls back to hangoutLink', () => {
    expect(extractMeetLink({ hangoutLink: 'https://meet.google.com/x' })).toBe('https://meet.google.com/x');
  });

  it('ignores non-video entry points', () => {
    const event = { conferenceData: { entryPoints: [{ entryPointType: 'phone', uri: 'tel:+123' }] } };
    expect(extractMeetLink(event)).toBeNull();
  });

  // THE important case. Without `conferenceDataVersion=1` on the request,
  // Google accepts the call, ignores conferenceData entirely, and returns a
  // perfectly normal event with no Meet link AND no error. Success and
  // failure are indistinguishable unless the link is checked explicitly.
  it('returns null when Google silently dropped the conference request', () => {
    expect(extractMeetLink({ id: 'evt123', summary: 'Viewing' })).toBeNull();
  });

  it('survives nullish input', () => {
    expect(extractMeetLink(null)).toBeNull();
    expect(extractMeetLink(undefined)).toBeNull();
  });
});

describe('buildViewingEventBody', () => {
  const BASE = { scheduledAt: '2026-08-05T06:00:00Z' };

  it('names the property in the summary', () => {
    expect(buildViewingEventBody({ ...BASE, propertyTitle: 'One BGC Tower' }).summary)
      .toBe('Viewing — One BGC Tower');
  });

  it('requests a Google Meet conference', () => {
    const body = buildViewingEventBody(BASE);
    expect(body.conferenceData.createRequest.conferenceSolutionKey.type).toBe('hangoutsMeet');
  });

  // Google dedupes on requestId — a repeated id returns the SAME room rather
  // than minting a new one, so two different bookings must not share one.
  it('generates a unique requestId per call', () => {
    const a = buildViewingEventBody(BASE).conferenceData.createRequest.requestId;
    const b = buildViewingEventBody(BASE).conferenceData.createRequest.requestId;
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(10);
  });

  it('defaults to a 45 minute viewing', () => {
    const body = buildViewingEventBody(BASE);
    const mins = (new Date(body.end.dateTime) - new Date(body.start.dateTime)) / 60000;
    expect(mins).toBe(45);
  });

  it('honours a custom duration', () => {
    const body = buildViewingEventBody({ ...BASE, durationMinutes: 90 });
    const mins = (new Date(body.end.dateTime) - new Date(body.start.dateTime)) / 60000;
    expect(mins).toBe(90);
  });

  it('includes notes in the description', () => {
    expect(buildViewingEventBody({ ...BASE, notes: 'Bring the floor plan' }).description)
      .toContain('Bring the floor plan');
  });

  // Google rejects an attendee object with no email, and inviting a blank
  // address is worse than not inviting at all.
  it('filters out invalid attendee emails', () => {
    const body = buildViewingEventBody({
      ...BASE,
      attendeeEmails: ['a@x.com', '', null, 'not-an-email', 'b@y.com'],
    });
    expect(body.attendees.map((a) => a.email)).toEqual(['a@x.com', 'b@y.com']);
  });

  it('omits the attendees key entirely when there are none', () => {
    expect(buildViewingEventBody(BASE).attendees).toBeUndefined();
  });

  it('falls back to a generic summary and omits an absent location', () => {
    const body = buildViewingEventBody(BASE);
    expect(body.summary).toBe('Property viewing (ScoutIt)');
    expect(body.location).toBeUndefined();
  });
});
