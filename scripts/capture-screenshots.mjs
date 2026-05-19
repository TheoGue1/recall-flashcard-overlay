import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs', 'screenshots');
const STORAGE_KEY = 'recall-flashcards';
const BASE_URL = process.env.SCREENSHOT_URL ?? 'http://localhost:5173';

const DEFAULT_SETTINGS = {
  timerEnabled: true,
  timerIntervalMinutes: 30,
  timerCardCount: 5,
  learningStepsMinutes: [1, 10],
  graduatingIntervalDays: 1,
  easyIntervalDays: 4,
};

function card(front, back, overrides = {}) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    front,
    back,
    deck: 'Default',
    state: 'new',
    ease: 2.5,
    interval: 0,
    stepIndex: 0,
    due: now,
    reps: 0,
    lapses: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function demoData(session = { mandatoryActive: false, mandatoryRemaining: 0, lastTimerFired: null }) {
  return {
    cards: [
      card('What is spaced repetition?', 'A learning technique that schedules reviews at increasing intervals'),
      card('Ebbinghaus forgetting curve', 'Memory decays exponentially over time without review'),
      card('SM-2 ease factor default', '2.5 (minimum 1.3 in Anki)'),
    ],
    settings: DEFAULT_SETTINGS,
    session,
  };
}

async function seed(page, data) {
  await page.addInitScript(
    ({ key, payload }) => {
      localStorage.setItem(key, JSON.stringify(payload));
    },
    { key: STORAGE_KEY, payload: data }
  );
}

async function capture(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.locator('#root').screenshot({ path: file });
  console.log(`Saved ${path.relative(root, file)}`);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 420, height: 520 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });

  // Study — question side
  {
    const page = await context.newPage();
    await seed(page, demoData());
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.getByText('What is spaced repetition?').waitFor();
    await capture(page, 'study-front');
    await page.close();
  }

  // Study — answer + ratings
  {
    const page = await context.newPage();
    await seed(page, demoData());
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Show answer' }).click();
    await page.getByText('A learning technique that schedules reviews').waitFor();
    await page.waitForTimeout(600);
    await capture(page, 'study-back');
    await page.close();
  }

  // Study break banner
  {
    const page = await context.newPage();
    await seed(
      page,
      demoData({ mandatoryActive: true, mandatoryRemaining: 3, lastTimerFired: Date.now() })
    );
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.getByText('Study break').waitFor();
    await capture(page, 'study-break');
    await page.close();
  }

  // Settings
  {
    const page = await context.newPage();
    await seed(page, demoData());
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByText('Study timer').waitFor();
    await capture(page, 'settings');
    await page.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
