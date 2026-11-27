// GET /api/reports/rows?from=&to=&team=&page= : 500 rows a page.
// Only users with the analyst or admin role may call it; others get 403.
import { requireRole } from '../auth.js';
import { queryRows } from './query.js';
export const PAGE_SIZE = 500;
export const ROLES = ['analyst', 'admin'];
export function registerRoutes(app) {
  app.get('/api/reports/rows', requireRole(ROLES), async (req, res) => res.json(await queryRows(req.query, PAGE_SIZE)));
}
