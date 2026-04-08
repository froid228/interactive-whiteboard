export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const LOGOUT = 'LOGOUT';

export const loginRequest = () => ({
  type: LOGIN_REQUEST,
});

export const loginSuccess = (user) => ({
  type: LOGIN_SUCCESS,
  payload: user,
});

export const loginFailure = (error) => ({
  type: LOGIN_FAILURE,
  payload: error,
});

export const logout = () => ({
  type: LOGOUT,
});

// Async action creator для логина (имитация API)
export const login = (email, password) => async (dispatch) => {
  dispatch(loginRequest());
  
  try {
    // Имитация запроса к серверу
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Простая валидация (в реальности — запрос к API)
    if (email && password.length >= 6) {
      const user = {
        id: Date.now(),
        email,
        name: email.split('@')[0],
        roles: ['user'],
        rights: ['can_view_boards', 'can_edit_boards'],
        token: 'mock-jwt-token-' + Date.now(),
      };
      
      // Сохраняем токен в localStorage
      localStorage.setItem('authToken', user.token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch(loginSuccess(user));
      return { success: true };
    } else {
      throw new Error('Неверный email или пароль');
    }
  } catch (error) {
    dispatch(loginFailure(error.message));
    return { success: false, error: error.message };
  }
};