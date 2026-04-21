const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: 'Недостаточно прав для выполнения этой операции',
      });
    }

    return next();
  };
};

module.exports = checkRole;
