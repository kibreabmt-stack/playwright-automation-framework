import 'dotenv/config';

const profiles = {
  dev: { timeout: 15_000 },
  staging: { timeout: 30_000 },
  prod: { timeout: 30_000 },
} as const;

const name = process.env.TEST_ENV ?? 'dev';
if (!(name in profiles) || !Object.hasOwn(profiles, name)) {
  throw new Error('TEST_ENV must be dev, staging, or prod');
}
const environment = name as keyof typeof profiles;
const uiURL = process.env.UI_BASE_URL;
const apiURL = process.env.API_BASE_URL;
if (Boolean(uiURL) !== Boolean(apiURL)) {
  throw new Error('Set both UI_BASE_URL and API_BASE_URL, or neither');
}
if (environment !== 'dev' && !uiURL) {
  throw new Error('Non-dev environments require explicit UI_BASE_URL and API_BASE_URL');
}

function validateURL(value: string): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Base URLs must be HTTP(S) URLs without embedded credentials');
  }
  return url.href;
}

export const config = {
  environment,
  timeout: profiles[environment].timeout,
  useDemo: !uiURL,
  uiBaseURL: validateURL(uiURL || 'http://127.0.0.1:4173'),
  apiBaseURL: validateURL(apiURL || 'http://127.0.0.1:4173'),
};
