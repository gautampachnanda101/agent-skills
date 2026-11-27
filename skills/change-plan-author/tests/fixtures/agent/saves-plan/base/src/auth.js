export const requireRole = roles => (req, res, next) => (roles.some(r => req.user?.roles?.includes(r)) ? next() : res.status(req.user ? 403 : 401).end());
