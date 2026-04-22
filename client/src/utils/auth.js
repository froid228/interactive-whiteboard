export const isAuthenticated = (user) => Boolean(user);

export const isAllowed = (user, rights) => {
  if (!user || !Array.isArray(user.rights)) {
    return false;
  }

  return rights.every((right) => user.rights.includes(right));
};

export const hasRole = (user, roles) => {
  if (!user || !Array.isArray(user.roles)) {
    return false;
  }

  return roles.some((role) => user.roles.includes(role));
};
