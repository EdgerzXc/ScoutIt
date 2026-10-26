import assert from "node:assert/strict";
import test from "node:test";
import {
  extractCoordinatesFromInput,
  extractPhoneNumbers,
  extractEmail,
  parseRawOutreachSnippet,
  isAgingOverdue,
  AGING_THRESHOLD_MS,
  OUTREACH_TEMPLATES,
  interpolateTemplate,
  generateClaimDraftPayload,
  resolveProspectsResult,
  SEED_PROSPECTS,
} from "../src/lib/outreachPolicy.mjs";

test("extractCoordinatesFromInput extracts from diverse Google Maps URL formats", () => {
  // Format 1: @lat,lng
  const url1 = "https://www.google.com/maps/place/Zuellig+Building/@14.554729,121.024441,17z/";
  const coords1 = extractCoordinatesFromInput(url1);
  assert.ok(coords1);
  assert.equal(coords1.latitude, 14.554729);
  assert.equal(coords1.longitude, 121.024441);

  // Format 2: !3d!4d embed
  const url2 = "https://www.google.com/maps/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d14.5492!4d121.0503";
  const coords2 = extractCoordinatesFromInput(url2);
  assert.ok(coords2);
  assert.equal(coords2.latitude, 14.5492);
  assert.equal(coords2.longitude, 121.0503);

  // Format 3: ?q=lat,lng
  const url3 = "https://maps.google.com/?q=14.5833,121.0583";
  const coords3 = extractCoordinatesFromInput(url3);
  assert.ok(coords3);
  assert.equal(coords3.latitude, 14.5833);
  assert.equal(coords3.longitude, 121.0583);

  // Raw coordinates
  const coords4 = extractCoordinatesFromInput("14.5547, 121.0244");
  assert.ok(coords4);
  assert.equal(coords4.latitude, 14.5547);
  assert.equal(coords4.longitude, 121.0244);

  // Null/invalid
  assert.equal(extractCoordinatesFromInput("Just a building name"), null);
  assert.equal(extractCoordinatesFromInput(null), null);
});

test("extractPhoneNumbers captures Philippine mobile and landline patterns", () => {
  const sampleText = `
    Zuellig Building Admin Desk
    Mobile 1: 0917 888 1234
    Mobile 2 (Intl): +63 920 555 9876
    Landline: (02) 8876-5432
    Office Direct: +63 2 8123 4567
  `;
  const phones = extractPhoneNumbers(sampleText);
  assert.ok(phones.length >= 3);
  assert.ok(phones.includes("09178881234") || phones.includes("+639178881234"));
  assert.ok(phones.some((p) => p.includes("88765432")));
});

test("extractEmail extracts and lowercases emails accurately", () => {
  const text = "For leasing inquiries, reach out to LEASING.DESK@ZUELLIG.COM.PH or admin.";
  assert.equal(extractEmail(text), "leasing.desk@zuellig.com.ph");
  assert.equal(extractEmail("No email provided"), null);
});

test("parseRawOutreachSnippet extracts structured property dossier from Google Maps snippet", () => {
  const rawSnippet = `
    One Ayala Corporate Center
    1 Ayala Avenue, Makati, Metro Manila 1223
    https://maps.app.goo.gl/sample123?q=14.5505,121.0260
    Phone: 0917-123-4567
    Email: leasing@oneayala.ph
  `;

  const parsed = parseRawOutreachSnippet(rawSnippet);
  assert.equal(parsed.propertyName, "One Ayala Corporate Center");
  assert.ok(parsed.propertyAddress.includes("1 Ayala Avenue"));
  assert.equal(parsed.districtCity, "Makati");
  assert.ok(parsed.coordinates);
  assert.equal(parsed.coordinates.latitude, 14.5505);
  assert.equal(parsed.coordinates.longitude, 121.026);
  assert.ok(parsed.phoneNumber.includes("09171234567"));
  assert.equal(parsed.email, "leasing@oneayala.ph");
});

test("isAgingOverdue triggers at 72 hours for contacted/no_reply leads only", () => {
  const now = Date.now();
  const past48h = new Date(now - 48 * 3600 * 1000).toISOString();
  const past73h = new Date(now - 73 * 3600 * 1000).toISOString();

  // Under 72h
  assert.equal(isAgingOverdue(past48h, "contacted"), false);
  // Over 72h contacted
  assert.equal(isAgingOverdue(past73h, "contacted"), true);
  // Over 72h no_reply
  assert.equal(isAgingOverdue(past73h, "no_reply"), true);
  // Replied or onboarded never flags as overdue
  assert.equal(isAgingOverdue(past73h, "replied"), false);
  assert.equal(isAgingOverdue(past73h, "onboarded"), false);
  assert.equal(isAgingOverdue(past73h, "discovered"), false);
  assert.equal(isAgingOverdue(null, "contacted"), false);
});

test("interpolateTemplate replaces placeholders for Template A, B, C, D", () => {
  const vars = {
    propertyName: "Menarco Tower",
    contactName: "Ms. Carmen Tan",
    district: "BGC",
    senderName: "Jerzee",
  };

  const a = interpolateTemplate("template_a_owner", vars);
  assert.ok(a.subject.includes("Menarco Tower"));
  assert.ok(a.body.includes("Ms. Carmen Tan"));
  assert.ok(a.body.includes("BGC"));
  assert.ok(a.body.includes("Jerzee"));
  assert.deepEqual(a.channels, ["whatsapp", "viber", "email"]);

  const d = interpolateTemplate("template_d_followup", vars);
  assert.ok(d.body.includes("finalizing our BGC commercial intelligence"));

  assert.throws(() => interpolateTemplate("non_existent"), /Unknown template key/);
});

test("generateClaimDraftPayload constructs valid draft listing with claim token", () => {
  const prospect = {
    propertyName: "Arthaland Century Pacific Tower",
    propertyAddress: "5th Avenue corner 30th St, BGC, Taguig",
    districtCity: "BGC",
    coordinates: { latitude: 14.5492, longitude: 121.0503 },
    phoneNumber: "09178889999",
    email: "leasing@arthaland.com",
  };

  const { propertyPayload, claimToken, claimUrl } = generateClaimDraftPayload(prospect);

  assert.equal(propertyPayload.title, "Arthaland Century Pacific Tower");
  assert.equal(propertyPayload.lifecycle_status, "DRAFT");
  assert.equal(propertyPayload.source_type, "staff_outreach");
  assert.equal(propertyPayload.coordinates, "14.5492,121.0503");
  assert.ok(claimToken.startsWith("claim_"));
  assert.equal(claimUrl, `https://scoutit.space/claim/${claimToken}`);
});

test("resolveProspectsResult returns honest empty list when table exists and has 0 rows (A-264)", () => {
  const result = resolveProspectsResult({ data: [], error: null, demoMode: false });
  assert.deepEqual(result, { prospects: [], source: "live_database" });
});

test("resolveProspectsResult returns seed prospects when demoMode is explicitly true (A-264)", () => {
  const result = resolveProspectsResult({ data: [], error: null, demoMode: true });
  assert.deepEqual(result, { prospects: SEED_PROSPECTS, source: "mock_seed" });
});

test("resolveProspectsResult falls back to seed prospects when table is unmigrated (A-264)", () => {
  const missingTableErr = { message: 'relation "outreach_prospects" does not exist' };
  const result = resolveProspectsResult({ data: null, error: missingTableErr, demoMode: false });
  assert.deepEqual(result, { prospects: SEED_PROSPECTS, source: "mock_seed" });
});

test("resolveProspectsResult surfaces genuine database error when table exists (A-264)", () => {
  const connErr = { message: "connection timeout" };
  const result = resolveProspectsResult({ data: null, error: connErr, demoMode: false });
  assert.equal(result.source, "error");
  assert.equal(result.error, "connection timeout");
  assert.deepEqual(result.prospects, []);
});
