import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import classes from './Header.module.css';

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <header className={classes.header}>
      <Link to="/" className={classes.logo}>
        <h1 className={classes.title}>Интерактивная доска</h1>
      </Link>
      
      <div className={classes.user}>
        {isAuthenticated && user ? (
          <>
            <span className={classes.userName}>👤 {user.name}</span>
            <button onClick={handleLogout} className={classes.logoutBtn}>
              Выход
            </button>
          </>
        ) : (
          <Link to="/login" className={classes.loginLink}>
            Войти
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;