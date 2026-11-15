import { test, expect } from '../../fixtures/test';
import { todoTitle } from '../../fixtures/test-data';

test('create, read, and delete a todo', async ({ api, trackTodo }) => {
  const todo = await api.create(todoTitle('API'));
  trackTodo(todo.id);
  const response = await api.get(todo.id);
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual(todo);
  await api.delete(todo.id);
  expect((await api.get(todo.id)).status()).toBe(404);
});

test('reject an empty title', async ({ request }) => {
  const response = await request.post('/api/todos', { data: { title: '' } });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'Title must contain 1–200 characters' });
});

test('reject malformed JSON', async ({ request }) => {
  const response = await request.post('/api/todos', {
    data: '{',
    headers: { 'Content-Type': 'application/json' },
  });
  expect(response.status()).toBe(400);
});
