import assert from 'node:assert/strict';
import test from 'node:test';
import { sum } from '../src/sum.js';

test('adds numbers', () => assert.equal(sum(1, 2, 3), 6));
test('rejects text', () => assert.throws(() => sum(1, 'two'), TypeError));
