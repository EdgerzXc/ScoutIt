import { test, expect } from "@playwright/test";
import { gotoAndSettle, trackErrors } from "./helpers";

// One test, one page load: the Descent view mounts a WebGL backdrop, and
// stacking several of those in one browser is what kills software-GL runs.
// Everything below — pulse, pills, all four filters — happens in a single
// visit. Filter selection retries real clicks until the control confirms
// (repo convention from openYourMove: never force, never invoke directly).
async function openDescent(page) {
  const errors = trackErrors(page);
  const response = await gotoAndSettle(page, "/layer/stratosphere");
  expect(response.status()).toBeLessThan(400);
  const heading = page.getByRole("heading", { name: /Moving right now/i });
  const toggle = page.getByRole("button", { name: /Cinematic Descent/i });
  for (let i = 0; i < 4; i++) {
    await toggle.click().catch(() => {});
    try {
      await expect(heading).toBeVisible({ timeout: 4000 });
      break;
    } catch {
      // Click swallowed pre-hydration — try again.
    }
  }
  await expect(heading).toBeVisible({ timeout: 4000 });
  return errors;
}

async function selectFilter(page, name) {
  const btn = page.getByRole("button", { name, exact: true });
  await expect
    .poll(
      async () => {
        await btn.click({ timeout: 10000 }).catch(() => {});
        // React commits asynchronously: reading in the same tick as the
        // click always sees the stale value and the poll would spin forever.
        await page.waitForTimeout(600);
        return btn.getAttribute("aria-pressed").catch(() => null);
      },
      { timeout: 60000 }
    )
    .toBe("true");
}

test("Descent pipeline supply reads, filters, and never blanks", async ({ page }) => {
  test.setTimeout(90000);
  const errors = await openDescent(page);

  // Pulse strip reads the whole mocked pipeline set at a glance.
  await expect(page.getByText(/1 opening today/i)).toBeVisible();
  await expect(page.getByText(/2 rising/i)).toBeVisible();
  await expect(page.getByText(/2 planned/i)).toBeVisible();
  await expect(page.getByText(/1 overdue watch/i)).toBeVisible();

  // Badges ride beside the status line; timing lines carry the clock.
  await expect(page.getByText("UNDER CONSTRUCTION").first()).toBeVisible();
  await expect(page.getByText("Opens today").first()).toBeVisible();
  await expect(page.getByText("Timeline TBC").first()).toBeVisible();
  // The pulse counts mock rows: without the sample tag it would read as
  // verified market fact.
  await expect(page.getByText("Sample data").first()).toBeVisible();

  // Lifecycle filters narrow without ever blanking on a bad value.
  await selectFilter(page, "Opening today");
  await expect(page.getByRole("link", { name: /Solana Bay/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Meridian Park/i })).toHaveCount(0);

  await selectFilter(page, "Planned");
  await expect(page.getByRole("link", { name: /Meridian Park/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Solana Bay/i })).toHaveCount(0);

  await selectFilter(page, "Under construction");
  await expect(page.getByRole("link", { name: /Cascade Residences/i })).toBeVisible();

  await selectFilter(page, "All signals");
  await expect(page.getByRole("link", { name: /Solana Bay/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Meridian Park/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Cascade Residences/i })).toBeVisible();
  // Pre-existing signals still listed — the feed was extended, not replaced.
  await expect(page.getByRole("link", { name: /Villa Acquisition Surge/i })).toBeVisible();

  expect(errors).toEqual([]);
});
