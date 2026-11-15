import { test, expect } from '../../fixtures/test';
import { todoTitle } from '../../fixtures/test-data';

test('create a todo using the page object', async ({ todoPage, trackTodo }) => {
  const title = todoTitle('UI');
  await todoPage.open();
  await todoPage.create(title);
  await expect(todoPage.status).toHaveText(title);
  const id = await todoPage.status.getAttribute('data-todo-id');
  expect(id).toBeTruthy();
  trackTodo(id!);
});

test('show a helpful message for a missing todo', async ({ todoPage }) => {
  await todoPage.open();
  await todoPage.find('00000000-0000-0000-0000-000000000000');
  await expect(todoPage.status).toHaveText('Not found');
});
