// GET /api/reports/rows?from=&to=&team=&page= : 500 rows a page.
// Only users with the analyst or admin role may call it.
export const PAGE_SIZE = 500;
export const ROLES = ['analyst', 'admin'];
