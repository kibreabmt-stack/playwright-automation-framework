import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { log } from '../utils/logger';

export default class SummaryReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    log('test.finished', {
      title: test.title,
      status: result.status,
      durationMs: result.duration,
      retry: result.retry,
    });
  }

  onEnd(result: FullResult) {
    log('suite.finished', { status: result.status, durationMs: result.duration });
  }
}
