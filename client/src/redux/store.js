import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk';
import toolbarReducer from './reducers/toolbarReducer';
import agreementReducer from './reducers/agreementReducer';
import authReducer from './reducers/authReducer';

const rootReducer = combineReducers({
  toolbar: toolbarReducer,
  agreement: agreementReducer,
  auth: authReducer,
});

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunk))
);

export default store;
