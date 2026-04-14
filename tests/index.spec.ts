import { test, expect } from "@playwright/test";

test("basic test", async ({ page }) => {
  await page.goto("http://localhost:3333/index.html");
  const title = await page.title();
  console.log("Title:", title);
  expect(title).toBe("Hello World");
});
