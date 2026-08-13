import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("sample inquiry route isolation contract", () => {
  it("checks authenticated routing before Connect spend", () => {
    const source = read("src/app/api/deals/initiate/route.js");
    expect(source).toContain("validateSampleInquiryRecipients");
    expect(source).toContain("HUMAN_TEST_SAMPLE_RECIPIENT_IDS");
    expect(source.indexOf("if (!sampleRouting.ok)")).toBeLessThan(source.indexOf("spend_connects"));
  });

  it("checks logged-out routing before activity or notification writes", () => {
    const source = read("src/app/api/inquiries/route.js");
    expect(source).toContain("validateSampleInquiryRecipients");
    expect(source).toContain("HUMAN_TEST_SAMPLE_RECIPIENT_IDS");
    expect(source.indexOf("if (!sampleRouting.ok)")).toBeLessThan(source.indexOf("const logged = await logActivity"));
    expect(source.indexOf("if (!sampleRouting.ok)")).toBeLessThan(source.indexOf("await notifyUser"));
  });
});
