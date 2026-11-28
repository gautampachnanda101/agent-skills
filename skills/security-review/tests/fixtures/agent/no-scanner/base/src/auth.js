// Rejects the request with 403 unless the user has the role.
export const requireRole = role => (req, res, next) => (req.user?.roles?.includes(role) ? next() : res.status(403).end());
