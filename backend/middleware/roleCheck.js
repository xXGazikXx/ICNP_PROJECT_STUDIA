const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Nie zalogowano' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Brak uprawnień do tej operacji' });
    }

    next();
  };
};

module.exports = roleCheck;
