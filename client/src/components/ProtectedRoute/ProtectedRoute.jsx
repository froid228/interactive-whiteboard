import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasRole, isAllowed, isAuthenticated } from '../../utils/auth';

function ProtectedRoute({ children, requiredRoles = [], requiredRights = [] }) {
  const { user, isAuthenticated: isAuth } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuth || !isAuthenticated(user)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles.length > 0 && !hasRole(user, requiredRoles)) {
    return <Navigate to="/" replace />;
  }

  if (requiredRights.length > 0 && !isAllowed(user, requiredRights)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
