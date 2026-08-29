import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const readCode = (p) =>
  read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const IDENTITY = "src/components/brokers/BrokerDossierIdentity.js";
const SCHEMA = "src/lib/brokerDossierSchema.js";
const PAGE = "src/app/brokers/[broker-slug]/page.js";
const SERVER = "src/lib/serverBrokerCredential.js";

// ─────────────────────────────────────────────────────────────────────────
// RA 9646 credential currency, pinned at every layer it could regress.
//
// A PRC real estate broker licence is valid for three years. The badge used to
// depend on a single Airtable checkbox with no expiry anywhere in the chain,
// so a lapsed licence read as current to both humans and search engines.
// ─────────────────────────────────────────────────────────────────────────

describe("RA 9646 — the badge cannot regress to a bare boolean", () => {
  it("renders the badge from credential state, not from licenseVerified", () => {
    const code = readCode(IDENTITY);
    expect(code).toContain("CREDENTIAL_STATES.VERIFIED_CURRENT");
    expect(code).toContain("CREDENTIAL_STATES.EXPIRED");
    // The old shape: `identity.licenseVerified && <badge>`.
    expect(code).not.toMatch(/identity\.licenseVerified\s*&&/);
  });

  it("states a lapsed registration rather than going silently blank", () => {
    expect(readCode(IDENTITY)).toContain("prc-lapsed-badge");
  });

  it("gates the licensed-profession claim on licence currency", () => {
    const code = readCode(SCHEMA);
    // Asserting RealEstateAgent for an expired licence is a licensing claim.
    expect(code).toContain("credential?.canAssertLicensedProfession === true");
    expect(code).not.toMatch(/const verified = identity\.licenseVerified === true/);
  });

  it("resolves credential state on the page and passes it to both consumers", () => {
    const code = readCode(PAGE);
    expect(code).toContain("loadBrokerCredentialRecord(authorityId)");
    expect(code).toContain("buildBrokerCredential({ identity, record: credentialRecord })");
    expect(code).toContain("buildBrokerDossierJsonLd({ identity, credential })");
    expect(code).toContain("credential={credential}");
  });

  it("reads only credential columns, never profile content, from Supabase", () => {
    const code = readCode(SERVER);
    expect(code).toContain("prc_expiry");
    expect(code).toContain("prc_verified_at");
    expect(code).not.toContain('select("*")');
    // DHSUD registration renews annually and has no expiry column, so the
    // number is read but deliberately not published.
    expect(readCode(IDENTITY)).not.toMatch(/dhsud/i);
  });
});
