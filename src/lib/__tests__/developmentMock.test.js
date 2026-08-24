import {
  isDevelopmentMockAllowed,
  isDevelopmentMockId,
  readDevelopmentMockUser,
} from "@/lib/developmentMock";

describe("development mock identity boundary", () => {
  it.each(["master-dev", "master-dev-e2e-owner", "master-dev_calendar"])(
    "accepts the explicit development identity family: %s",
    (userId) => expect(isDevelopmentMockId(userId)).toBe(true),
  );

  it.each(["real-user", "master", "master-development", "", null])(
    "rejects non-development identities: %s",
    (userId) => expect(isDevelopmentMockId(userId)).toBe(false),
  );

  it("rejects an ordinary localhost development session without the E2E flag", () => {
    expect(isDevelopmentMockAllowed({
      nodeEnv: "development",
      hostname: "localhost",
      userId: "master-dev",
    })).toBe(false);
  });

  it("rejects the mock in production even on localhost", () => {
    expect(isDevelopmentMockAllowed({
      nodeEnv: "production",
      hostname: "localhost",
      userId: "master-dev",
    })).toBe(false);
  });
  it("allows the explicit E2E build only on localhost", () => {
    expect(isDevelopmentMockAllowed({
      nodeEnv: "production",
      e2eFlag: "1",
      hostname: "localhost",
      userId: "master-dev-e2e-owner",
    })).toBe(true);
  });



  it("rejects the mock on a public host even when the E2E flag is present", () => {
    expect(isDevelopmentMockAllowed({
      nodeEnv: "production",
      e2eFlag: "1",
      hostname: "www.scoutit.space",
      userId: "master-dev",
    })).toBe(false);
  });

  it("reads the fixture only in an explicitly flagged local E2E build", () => {
    const storage = { getItem: () => JSON.stringify({ id: "master-dev", tags: ["owner"] }) };
    expect(readDevelopmentMockUser(storage, {
      nodeEnv: "production",
      e2eFlag: "1",
      hostname: "127.0.0.1",
    })?.id).toBe("master-dev");
    expect(readDevelopmentMockUser(storage, {
      nodeEnv: "development",
      hostname: "127.0.0.1",
    })).toBeNull();
    expect(readDevelopmentMockUser(storage, {
      nodeEnv: "production",
      hostname: "127.0.0.1",
    })).toBeNull();
  });
});
