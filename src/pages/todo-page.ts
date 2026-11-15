import { type Page, type Locator } from '@playwright/test';

export class TodoPage {
  readonly status: Locator;

  constructor(private readonly page: Page) {
    this.status = page.getByRole('status');
  }

  async open() {
    await this.page.goto('/');
  }

  async create(title: string) {
    await this.page.getByRole('textbox', { name: 'Todo title', exact: true }).fill(title);
    await this.page.getByRole('button', { name: 'Create todo' }).click();
  }

  async find(id: string) {
    await this.page.getByRole('textbox', { name: 'Todo ID', exact: true }).fill(id);
    await this.page.getByRole('button', { name: 'Find todo' }).click();
  }
}
