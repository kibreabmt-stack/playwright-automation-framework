import { test as base, expect } from '@playwright/test';
import { config } from '../config/environment';
import { TodoApi } from '../utils/api-client';
import { TodoPage } from '../pages/todo-page';

type Fixtures = {
  api: TodoApi;
  todoPage: TodoPage;
  trackTodo: (id: string) => void;
};

export const test = base.extend<Fixtures>({
  request: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({
      baseURL: config.apiBaseURL,
      timeout: config.timeout,
    });
    try {
      await use(request);
    } finally {
      await request.dispose();
    }
  },
  api: async ({ request }, use) => {
    await use(new TodoApi(request));
  },
  todoPage: async ({ page }, use) => {
    await use(new TodoPage(page));
  },
  trackTodo: async ({ api }, use) => {
    const ids: string[] = [];
    try {
      await use((id) => ids.push(id));
    } finally {
      await Promise.all(ids.map((id) => api.delete(id)));
    }
  },
});

export { expect };
