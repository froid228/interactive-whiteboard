import { authAPI } from '../../api/boards';

export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const LOGOUT = 'LOGOUT';
export const AUTH_RESTORED = 'AUTH_RESTORED';

export const loginRequest = () => ({
  type: LOGIN_REQUEST,
});

export const loginSuccess = (payload) => ({
  type: LOGIN_SUCCESS,
  payload,
});

export const loginFailure = (error) => ({
  type: LOGIN_FAILURE,
  payload: error,
});

export const restoreAuth = (payload) => ({
  type: AUTH_RESTORED,
  payload,
});

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');

  return {
    type: LOGOUT,
  };
};

function persistSession(payload) {
  localStorage.setItem('authToken', payload.token);
  localStorage.setItem('user', JSON.stringify(payload.user));
}

export const login = (email, password) => async (dispatch) => {
  dispatch(loginRequest());

  try {
    const payload = await authAPI.login({ email, password });
    persistSession(payload);
    dispatch(loginSuccess(payload));
    return { success: true };
  } catch (error) {
    dispatch(loginFailure(error.message));
    return { success: false, error: error.message };
  }
};

export const register = (name, email, password) => async (dispatch) => {
  dispatch(loginRequest());

  try {
    const payload = await authAPI.register({ name, email, password });
    persistSession(payload);
    dispatch(loginSuccess(payload));
    return { success: true };
  } catch (error) {
    dispatch(loginFailure(error.message));
    return { success: false, error: error.message };
  }
};

export const loadProfile = () => async (dispatch) => {
  const token = localStorage.getItem('authToken');
  const storedUser = localStorage.getItem('user');

  if (!token || !storedUser) {
    return;
  }

  try {
    const user = await authAPI.me();
    const payload = { token, user };
    localStorage.setItem('user', JSON.stringify(user));
    dispatch(restoreAuth(payload));
  } catch (error) {
    dispatch(logout());
  }
};
