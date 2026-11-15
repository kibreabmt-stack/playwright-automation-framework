import { randomUUID } from 'node:crypto';

export function todoTitle(prefix = 'Automation'): string {
  return `${prefix} ${randomUUID()}`;
}
