import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("A-023 phase 3 - structured broker editor contract", () => {
  it("uses one shared public identity composition for dossier and preview", () => {
    const publicPage = read("src/app/brokers/[broker-slug]/page.js");
    const editor = read("src/components/brokers/BrokerDossierEditor.js");
    expect(publicPage).toContain("<BrokerDossierIdentity");
    expect(editor).toContain("<BrokerDossierIdentity");
  });

  it("loads privately, autosaves by revision, publishes explicitly, and protects dirty state", () => {
    const editor = read("src/components/brokers/BrokerDossierEditor.js");
    expect(editor).toContain('fetch("/api/broker/dossier"');
    expect(editor).toContain('method: "PATCH"');
    expect(editor).toContain('method: "POST"');
    expect(editor).toContain("expectedRevision");
    expect(editor).toContain('addEventListener("beforeunload"');
    expect(editor).toMatch(/setTimeout\([\s\S]*saveDraft/);
  });

  it("offers only structured broker-declared fields and no freeform code/layout controls", () => {
    const editor = read("src/components/brokers/BrokerDossierEditor.js");
    for (const label of ["Portrait URL", "Biography", "Firm", "Markets", "Categories", "Languages", "Service areas", "Working style", "Availability", "Intro media URL"]) {
      expect(editor).toContain(label);
    }
    expect(editor).not.toContain("dangerouslySetInnerHTML");
    expect(editor).not.toMatch(/custom (?:font|color|html|layout)/i);
  });
});
