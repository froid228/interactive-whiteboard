// Проверка, авторизован ли пользователь (листинг 6.2 из методички)
export const isAuthenticated = (user) => !!user;

// Проверка наличия прав (листинг 6.2 из методички)
export const isAllowed = (user, rights) => {
  if (!user || !user.rights) return false;
  return rights.some(right => user.rights.includes(right));
};

// Проверка наличия роли (листинг 6.2 из методички)
export const hasRole = (user, roles) => {
  if (!user || !user.roles) return false;
  return roles.some(role => user.roles.includes(role));
};

// Проверка токена (имитация PKCE flow)
export const validateToken = () => {
  const token = localStorage.getItem('authToken');
  return !!token && !token.includes('expired');
};

// Получение текущего пользователя
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};