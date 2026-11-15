import { test, expect } from '../../fixtures/test';
import { todoTitle } from '../../fixtures/test-data';

test('API-created data is visible in the UI and deletion is reflected', async ({ api, todoPage, trackTodo }) => {
  const todo = await api.create(todoTitle('E2E'));
  trackTodo(todo.id);
  await todoPage.open();
  await todoPage.find(todo.id);
  await expect(todoPage.status).toHaveText(todo.title);
  await api.delete(todo.id);
  await todoPage.find(todo.id);
  await expect(todoPage.status).toHaveText('Not found');
});

test('UI-created data is available through the API', async ({ api, todoPage, trackTodo }) => {
  const title = todoTitle('E2E UI');
  await todoPage.open();
  await todoPage.create(title);
  await expect(todoPage.status).toHaveText(title);
  const id = await todoPage.status.getAttribute('data-todo-id');
  expect(id).toBeTruthy();
  trackTodo(id!);
  const response = await api.get(id!);
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ id, title });
});
