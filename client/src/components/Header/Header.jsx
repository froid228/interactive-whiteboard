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
        <span className={classes.eyebrow}>Realtime collaboration</span>
        <h1 className={classes.title}>Interactive Whiteboard</h1>
      </Link>

      <nav className={classes.nav}>
        <Link to="/about" className={classes.navLink}>
          О проекте
        </Link>
        {isAuthenticated && (
          <Link to="/settings" className={classes.navLink}>
            Настройки
          </Link>
        )}
      </nav>

      <div className={classes.user}>
        {isAuthenticated && user ? (
          <>
            <div className={classes.userMeta}>
              <span className={classes.userName}>{user.name}</span>
              <span className={classes.userRole}>{user.role === 'admin' ? 'Администратор' : 'Участник'}</span>
            </div>
            <button onClick={handleLogout} className={classes.logoutBtn}>
              Выйти
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
