import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const baseUrl = process.env.UI_CAPTURE_URL ?? "http://127.0.0.1:5173/";
const outDir = path.join(projectRoot, "artifacts", "ui-screenshots");
const viewport = { width: 1600, height: 900 };

const launchAttempts = [
  { label: "chromium", options: { headless: true } },
  { label: "msedge", options: { channel: "msedge", headless: true } },
  { label: "chrome", options: { channel: "chrome", headless: true } },
  { label: "chromium-no-sandbox", options: { headless: true, args: ["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"] } },
  { label: "msedge-no-sandbox", options: { channel: "msedge", headless: true, args: ["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"] } },
  { label: "chrome-no-sandbox", options: { channel: "chrome", headless: true, args: ["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"] } },
];

const screens = [
  { name: "01-habitat-hub.png", label: "Habitat Hub", actions: [], selector: ".habitat-hub-screen, .hq-command-deck" },
  { name: "02-deployment-assignment.png", label: "Deployment Assignment", actions: ["start"], selector: ".class-deploy-screen" },
  { name: "03-class-selection.png", label: "Class Selection", actions: ["class-assignment"], selector: ".class-selection-screen" },
  { name: "04-loadout.png", label: "Loadout", actions: ["hq-loadout", "loadout"], selector: ".loadout-locker-screen, .cosmetics-loadout-screen" },
  { name: "05-arsenal.png", label: "Arsenal", actions: ["arsenal"], selector: ".arsenal-workbench-screen" },
  { name: "05b-arsenal-sidearm.png", label: "Arsenal Sidearm Category", actions: ["arsenal"], afterActions: ["arsenal-category-sidearm"], selector: ".arsenal-workbench-screen" },
  { name: "05c-arsenal-primary.png", label: "Arsenal Primary Category", actions: ["arsenal"], afterActions: ["arsenal-category-primary"], selector: ".arsenal-workbench-screen" },
  { name: "06-ship.png", label: "Ship", actions: ["ship-systems"], selector: ".ship-dashboard-screen" },
  { name: "07-skills.png", label: "Skills", actions: ["skill-matrix"], selector: ".skill-matrix-screen" },
  { name: "08-crater-runs.png", label: "Crater Runs", actions: ["raid-select"], selector: ".raid-select-screen" },
  { name: "09-campaign-contracts.png", label: "Campaign Contracts", actions: ["intel"], selector: ".intel-board-screen" },
  { name: "10-stash.png", label: "Stash", actions: ["stash"], selector: ".stash-screen" },
  { name: "11-vendors.png", label: "Vendors", actions: ["vendors"], selector: ".vendor-screen" },
];

const report = {
  startedAt: new Date().toISOString(),
  baseUrl,
  viewport: { ...viewport, deviceScaleFactor: 1 },
  browser: null,
  launchFailures: [],
  screens: [],
};

async function assertServerRunning() {
  console.log(`Capturing UI from ${baseUrl}`);
  let response;
  try {
    response = await fetch(baseUrl, { cache: "no-store" });
  } catch (error) {
    throw new Error(`Dev server is not reachable at ${baseUrl}. Start it with: npm.cmd run dev -- --host 0.0.0.0\n${formatError(error)}`);
  }

  if (!response.ok) {
    throw new Error(`Dev server responded ${response.status} at ${baseUrl}. Start or fix the Vite dev server before capture.`);
  }
}

async function launchBrowser() {
  for (const attempt of launchAttempts) {
    try {
      const browser = await chromium.launch(attempt.options);
      report.browser = attempt.label;
      console.log(`Browser launched: ${attempt.label}`);
      return browser;
    } catch (error) {
      const message = formatError(error);
      report.launchFailures.push({ label: attempt.label, error: message });
      console.warn(`Browser launch failed (${attempt.label}): ${message}`);
    }
  }

  throw new Error("All Playwright browser launch attempts failed. See artifacts/ui-screenshots/report.json for launch errors.");
}

async function bootHome(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await settle(page);

  const playButton = page.getByRole("button", { name: /^play$/i });
  if (await playButton.isVisible({ timeout: 2500 }).catch(() => false)) {
    await playButton.click();
    await page.waitForTimeout(3000);
    await settle(page);
  }

  await page.getByText("HABITAT TRANSFER").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  await page.locator(".habitat-hub-screen, .hq-command-deck").first().waitFor({ state: "visible", timeout: 15000 });
}

async function ensureHome(page) {
  if (await page.locator(".habitat-hub-screen, .hq-command-deck").first().isVisible().catch(() => false)) {
    return;
  }

  const menuButton = page.locator('[data-action="menu"]').filter({ hasText: /back|habitat|menu/i }).first();
  if (await menuButton.isVisible({ timeout: 1200 }).catch(() => false)) {
    await menuButton.click();
    await settle(page);
  }

  if (!(await page.locator(".habitat-hub-screen, .hq-command-deck").first().isVisible().catch(() => false))) {
    await bootHome(page);
  }
}

async function clickAction(page, actions) {
  const candidates = Array.isArray(actions) ? actions : [actions];
  for (const action of candidates) {
    const locator = page.locator(`[data-action="${action}"]`).first();
    if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
      await locator.click();
      await settle(page);
      return action;
    }
  }

  throw new Error(`No visible action found for: ${candidates.join(", ")}`);
}

async function captureScreen(page, screen) {
  const outputPath = path.join(outDir, screen.name);
  const entry = {
    name: screen.name,
    label: screen.label,
    path: outputPath,
    status: "pending",
    actionUsed: null,
    error: null,
  };

  try {
    await ensureHome(page);
    if (screen.actions.length > 0) {
      entry.actionUsed = await clickAction(page, screen.actions);
    }
    if (screen.afterActions?.length > 0) {
      for (const action of screen.afterActions) {
        await clickAction(page, action);
      }
    }

    await page.locator(screen.selector).first().waitFor({ state: "visible", timeout: 12000 });
    await settle(page);
    await page.screenshot({ path: outputPath, fullPage: false });
    entry.status = "captured";
    console.log(`Captured ${screen.label}: ${outputPath}`);
  } catch (error) {
    entry.status = "failed";
    entry.error = formatError(error);
    console.error(`Failed ${screen.label}: ${entry.error}`);
  }

  report.screens.push(entry);
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

function formatError(error) {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  return String(error);
}

async function writeReport() {
  report.finishedAt = new Date().toISOString();
  report.summary = {
    captured: report.screens.filter((screen) => screen.status === "captured").map((screen) => screen.name),
    failed: report.screens.filter((screen) => screen.status === "failed").map((screen) => screen.name),
  };
  const reportPath = path.join(outDir, "report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Report written: ${reportPath}`);
}

await mkdir(outDir, { recursive: true });

let browser;
try {
  await assertServerRunning();
  browser = await launchBrowser();
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await bootHome(page);

  for (const screen of screens) {
    await captureScreen(page, screen);
  }

  await context.close();
} catch (error) {
  console.error(formatError(error));
  report.fatalError = formatError(error);
  process.exitCode = 1;
} finally {
  if (browser) {
    await browser.close().catch(() => {});
  }
  await writeReport();
}
