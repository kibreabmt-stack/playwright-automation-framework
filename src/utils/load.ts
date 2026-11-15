import { performance } from 'node:perf_hooks';

export function boundedInteger(value: string | undefined, fallback: number, max: number): number {
  const number = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(number) || number < 1 || number > max) {
    throw new Error(`Expected an integer between 1 and ${max}`);
  }
  return number;
}

export async function runLoad(
  operation: () => Promise<boolean>,
  options: { requests: number; concurrency: number },
) {
  const requests = boundedInteger(String(options.requests), 40, 1000);
  const concurrency = boundedInteger(String(options.concurrency), 4, 20);
  const durations: number[] = [];
  let next = 0;
  let failures = 0;
  const start = performance.now();
  await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, async () => {
    while (next < requests) {
      next++;
      const requestStart = performance.now();
      try {
        if (!await operation()) failures++;
      } catch {
        failures++;
      } finally {
        durations.push(performance.now() - requestStart);
      }
    }
  }));
  const elapsedMs = performance.now() - start;
  durations.sort((a, b) => a - b);
  return {
    requests,
    failures,
    elapsedMs,
    requestsPerSecond: requests / (elapsedMs / 1000),
    p95Ms: durations[Math.ceil(durations.length * 0.95) - 1],
  };
}
