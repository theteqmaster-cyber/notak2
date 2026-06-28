// src/middleware/auth.js — Auth + role enforcement
exports.requireAuth = (req, res, next) => {
  if (!req.session.user) {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/sync')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect('/login');
  }
  next();
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.session.user) {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/sync')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect('/login');
  }
  if (!roles.includes(req.session.user.role)) {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/sync')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(403).render('error', { title: 'Forbidden', code: 403, message: "You don't have permission." });
  }
  next();
};

exports.requireGuest = (req, res, next) => {
  if (req.session.user) {
    const dest = { admin: '/admin', ci: '/ci' }[req.session.user.role] || '/app';
    return res.redirect(dest);
  }
  next();
};
