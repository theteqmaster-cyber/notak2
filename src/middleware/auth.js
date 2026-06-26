// src/middleware/auth.js
exports.requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  if (!roles.includes(req.session.user.role)) return res.status(403).render('error', { title: 'Forbidden', code: 403, message: "You don't have permission to access this page." });
  next();
};

exports.requireGuest = (req, res, next) => {
  if (req.session.user) {
    const dest = { admin: '/admin', ci: '/ci', viewer: '/dashboard' }[req.session.user.role] || '/dashboard';
    return res.redirect(dest);
  }
  next();
};
