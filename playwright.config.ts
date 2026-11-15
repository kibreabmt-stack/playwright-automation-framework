import { defineConfig, devices } from '@playwright/test';
import { config } from './src/config/environment';

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: config.timeout,
  expect: { timeout: 5_000 },
  outputDir: 'test-results',
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['./src/reporters/summary-reporter.ts'],
  ],
  use: {
    baseURL: config.uiBaseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'ui-chromium', testMatch: '**/ui/**/*.spec.ts', use: { ...devices['Desktop Chrome'] } },
    { name: 'api', testMatch: '**/api/**/*.spec.ts' },
    { name: 'e2e', testMatch: '**/e2e/**/*.spec.ts', use: { ...devices['Desktop Chrome'] } },
    { name: 'stress', testMatch: '**/stress/**/*.spec.ts', retries: 0 },
  ],
  webServer: config.useDemo ? {
    command: 'npm run demo',
    url: new URL('/api/health', config.uiBaseURL).href,
    reuseExistingServer: false,
    timeout: 15_000,
  } : undefined,
});
