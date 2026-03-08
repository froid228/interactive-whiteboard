// ← Все импорты должны быть в самом верху файла!
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasRole, isAllowed, isAuthenticated } from '../../utils/auth';
import classes from './ProtectedRoute.module.css';

function ProtectedRoute({ children, requiredRoles = [], requiredRights = [] }) {
  const { user, isAuthenticated: isAuth } = useSelector((state) => state.auth);
  const location = useLocation();

  // Если пользователь не авторизован — редирект на login
  if (!isAuth || !isAuthenticated(user)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Проверка ролей (если указаны)
  if (requiredRoles.length > 0 && !hasRole(user, requiredRoles)) {
    return (
      <div className={classes.forbidden}>
        <h2>⛔ Доступ запрещён</h2>
        <p>У вас недостаточно прав для просмотра этой страницы.</p>
        <Navigate to="/" replace />
      </div>
    );
  }

  // Проверка прав (если указаны)
  if (requiredRights.length > 0 && !isAllowed(user, requiredRights)) {
    return (
      <div className={classes.forbidden}>
        <h2>⛔ Доступ запрещён</h2>
        <p>У вас недостаточно прав для выполнения этого действия.</p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;