import { test, expect } from '../../fixtures/test';
import { config } from '../../config/environment';
import { boundedInteger, runLoad } from '../../utils/load';

test('bounded health endpoint load', async ({ request }, testInfo) => {
  test.skip(process.env.RUN_STRESS !== '1', 'Set RUN_STRESS=1 only for an authorized target');
  test.skip(config.environment === 'prod', 'Stress tests are disabled in production');
  test.setTimeout(120_000);
  const requests = boundedInteger(process.env.STRESS_REQUESTS, 40, 1000);
  const concurrency = boundedInteger(process.env.STRESS_CONCURRENCY, 4, 20);
  const maxP95 = boundedInteger(process.env.STRESS_MAX_P95_MS, 2000, 60_000);
  // Keep the entire batch bounded by the test timeout, even on an unresponsive target.
  if (Math.ceil(requests / concurrency) * 1000 > 100_000) {
    throw new Error('Requested load exceeds the 100-second request budget');
  }
  const metrics = await runLoad(async () => {
    const response = await request.get('/api/health', { timeout: 1000 });
    try {
      return response.status() === 200;
    } finally {
      await response.dispose();
    }
  }, { requests, concurrency });
  await testInfo.attach('load-metrics', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  });
  expect(metrics.failures).toBe(0);
  expect(metrics.p95Ms).toBeLessThan(maxP95);
});
