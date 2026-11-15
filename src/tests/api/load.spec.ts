import { test, expect } from '@playwright/test';
import { boundedInteger, runLoad } from '../../utils/load';

test('load utility limits concurrency and completes the requested count', async () => {
  let active = 0;
  let peak = 0;
  let calls = 0;
  const metrics = await runLoad(async () => {
    calls++;
    active++;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    return true;
  }, { requests: 9, concurrency: 3 });
  expect(calls).toBe(9);
  expect(peak).toBe(3);
  expect(metrics.failures).toBe(0);
  expect(metrics.requests).toBe(9);
  expect(metrics.p95Ms).toBeGreaterThan(0);
  expect(metrics.requestsPerSecond).toBeGreaterThan(0);
});

test('load utility counts unsuccessful responses and thrown errors', async () => {
  let calls = 0;
  const metrics = await runLoad(async () => {
    calls++;
    if (calls === 1) throw new Error('Simulated network failure');
    return false;
  }, { requests: 3, concurrency: 1 });
  expect(metrics.failures).toBe(3);
  expect(calls).toBe(3);
});

test('load utility handles fewer requests than workers', async () => {
  const metrics = await runLoad(async () => true, { requests: 1, concurrency: 4 });
  expect(metrics.requests).toBe(1);
  expect(metrics.failures).toBe(0);
});

test('load settings reject unsafe and malformed limits', async () => {
  for (const value of ['0', '-1', '1.5', 'Infinity', 'abc', '', '1001']) {
    expect(() => boundedInteger(value, 40, 1000)).toThrow();
  }
  expect(boundedInteger(undefined, 40, 1000)).toBe(40);
  await expect(runLoad(async () => true, { requests: 1, concurrency: 21 })).rejects.toThrow();
  await expect(runLoad(async () => true, { requests: 0, concurrency: 1 })).rejects.toThrow();
});
