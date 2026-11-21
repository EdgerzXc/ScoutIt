import { expect } from "@playwright/test";
import fixture from "../fixtures/staff-auth-provider.cjs";

export async function seedStaffSession(page, kind = "staff") {
  const storageKey = `sb-${new URL(fixture.origin).hostname.split(".")[0]}-auth-token`;
  const session = fixture.fixtureSession(kind);
  await page.addInitScript(({ key, value }) => {
    if (!sessionStorage.getItem("seeded-staff-test-session")) {
      localStorage.setItem(key, JSON.stringify(value));
      sessionStorage.setItem("seeded-staff-test-session", "true");
    }
  }, { key: storageKey, value: session });
  await page.route(`${fixture.origin}/**`, async (route) => {
    const request = route.request();
    const response = fixture.fixtureResponse(new URL(request.url()), request.method(), new Headers(await request.allHeaders()));
    await route.fulfill({
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "authorization, apikey, x-client-info, x-supabase-api-version, accept-profile, content-profile, content-type, prefer",
        "access-control-allow-methods": "GET, POST, OPTIONS",
      },
      body: await response.text(),
    });
  });
  return session;
}

export async function openStaffWorkspace(page, destination = "/admin") {
  await page.goto(destination, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/admin\/access\?next=/);
  const mint = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/admin/session" && response.request().method() === "POST");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const response = await mint;
  expect(response.status(), response.status() === 204 ? undefined : await response.text()).toBe(204);
  await expect(page).toHaveURL((url) => url.pathname === destination);
}
