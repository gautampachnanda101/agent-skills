import assert from 'node:assert/strict';
import test from 'node:test';
import { merge } from '../src/accounts/merge.js';

const store = accounts => ({ get: id => accounts[id] });

test('a support lead can merge', () => {
  const accounts = { a: { orders: [1], disputes: [] }, b: { orders: [2], disputes: [] } };
  merge(store(accounts), 'a', 'b', { roles: ['support-lead'] });
  assert.deepEqual(accounts.a.orders, [1, 2]);
});
