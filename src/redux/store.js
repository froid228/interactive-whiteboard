import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk'; // ← Добавьте middleware для async actions
import toolbarReducer from './reducers/toolbarReducer';
import agreementReducer from './reducers/agreementReducer';
import authReducer from './reducers/authReducer'; // ← Новый редьюсер

const rootReducer = combineReducers({
  toolbar: toolbarReducer,
  agreement: agreementReducer,
  auth: authReducer, // ← Добавляем auth в store
});

const store = createStore(
  rootReducer,
  applyMiddleware(thunk), // ← Добавляем thunk middleware
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export default store;