import authReducer from './redux/reducers/authReducer';

test('stores authenticated user after login success', () => {
  const nextState = authReducer(undefined, {
    type: 'LOGIN_SUCCESS',
    payload: {
      token: 'token',
      user: {
        id: 1,
        name: 'Alice',
        role: 'user',
        roles: ['user'],
        rights: ['can_view_boards'],
      },
    },
  });

  expect(nextState.isAuthenticated).toBe(true);
  expect(nextState.user.name).toBe('Alice');
});
