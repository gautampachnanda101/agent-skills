import assert from 'node:assert/strict';
import test from 'node:test';
import { discounted } from '../src/price.js';

test('takes 10% off', () => assert.equal(discounted(1000, 10), 900));
test('rounds to whole cents', () => assert.equal(discounted(999, 15), 849));
