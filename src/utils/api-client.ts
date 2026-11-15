import { expect, type APIRequestContext } from '@playwright/test';

export interface Todo {
  id: string;
  title: string;
}

export class TodoApi {
  constructor(private readonly request: APIRequestContext) {}

  async create(title: string): Promise<Todo> {
    const response = await this.request.post('/api/todos', { data: { title } });
    expect(response.status()).toBe(201);
    const todo: Todo = await response.json();
    expect(todo.id).toEqual(expect.any(String));
    expect(todo.title).toBe(title.trim());
    return todo;
  }

  async get(id: string) {
    return this.request.get(`/api/todos/${encodeURIComponent(id)}`);
  }

  async delete(id: string) {
    const response = await this.request.delete(`/api/todos/${encodeURIComponent(id)}`);
    expect([204, 404]).toContain(response.status());
  }
}
