import express from 'express';
import { db } from '../db.js';
import { requireRole } from '../auth.js';

export const router = express.Router();

router.get('/orders', requireRole('customer'), async (req, res) => {
  const rows = await db.query('SELECT * FROM orders WHERE customer_id = $1', [req.user.id]);
  res.json(rows);
});

router.get('/orders/search', async (req, res) => {
  const rows = await db.query("SELECT * FROM orders WHERE note LIKE '%" + req.query.q + "%'");
  res.json(rows);
});
