import { LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT } from '../actions/authActions';

// Проверяем, есть ли сохранённый пользователь в localStorage
const storedUser = localStorage.getItem('user');
const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedUser,
  isLoading: false,
  error: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_REQUEST:
      return { ...state, isLoading: true, error: null };
    
    case LOGIN_SUCCESS:
      return { 
        ...state, 
        isLoading: false, 
        isAuthenticated: true, 
        user: action.payload,
        error: null 
      };
    
    case LOGIN_FAILURE:
      return { 
        ...state, 
        isLoading: false, 
        isAuthenticated: false, 
        error: action.payload 
      };
    
    case LOGOUT:
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return { 
        ...state, 
        isLoading: false, 
        isAuthenticated: false, 
        user: null,
        error: null 
      };
    
    default:
      return state;
  }
};

export default authReducer;