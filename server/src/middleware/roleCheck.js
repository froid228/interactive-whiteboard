// Middleware для проверки роли (Практика 8 - RBAC)
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Получаем роль и ID из заголовков
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];
    
    console.log('🔍 Middleware checkRole:', { 
      userRole, 
      userId, 
      allowedRoles,
      type: typeof userId 
    });
    
    // Если роль не передана - используем 'user' по умолчанию
    const role = userRole || 'user';
    
    // Преобразуем ID в строку (без timestamp!)
    let id = userId;
    if (!id) {
      id = '1';
    } else {
      // Если это timestamp (большое число), заменяем на дефолтный ID
      const numericId = parseInt(userId);
      if (numericId > 1000000) {
        console.warn('⚠️ ID похож на timestamp, заменяем на 1');
        id = '1';
      } else {
        id = String(numericId);
      }
    }
    
    // Проверяем, разрешена ли роль
    if (!allowedRoles.includes(role)) {
      console.log('❌ Доступ запрещён для роли:', role);
      return res.status(403).json({ 
        message: 'Недостаточно прав для выполнения этой операции' 
      });
    }
    
    console.log('✅ Доступ разрешён для роли:', role, 'ID:', id);
    
    // Сохраняем данные пользователя в запросе
    req.user = { id, role };
    next();
  };
};

module.exports = checkRole;