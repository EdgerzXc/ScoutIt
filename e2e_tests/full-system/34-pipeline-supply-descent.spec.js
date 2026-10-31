import { test, expect } from "@playwright/test";
import { gotoAndSettle, trackErrors } from "./helpers";

test("Descent Stratosphere layer presents entry flow and transitions smoothly", async ({ page }) => {
  const errors = trackErrors(page);
  const response = await gotoAndSettle(page, "/layer/stratosphere");
  expect(response.status()).toBeLessThan(400);

  // Layer header and kicker
  await expect(page.getByText(/Layer 02 · Stratosphere/i)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /The ground shifts/i })).toBeVisible();

  // Exploration step cards
  await expect(page.getByRole("heading", { level: 2, name: /Track developments & trends/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Find your area/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Read the story/i })).toBeVisible();

  // Primary Call-to-action
  const enterCta = page.getByRole("link", { name: /Enter Stratosphere/i });
  await expect(enterCta).toBeVisible();
  await expect(enterCta).toHaveAttribute("href", "/stratosphere");

  // Next layer transition link to Metropolis
  const nextLayer = page.locator('a[href="/layer/metropolis"]').first();
  await expect(nextLayer).toBeVisible();

  expect(errors).toEqual([]);
});
