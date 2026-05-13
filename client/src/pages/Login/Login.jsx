import React, { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, register } from '../../redux/actions/authActions';
import classes from './Login.module.css';

const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@whiteboard.local',
    password: 'Admin123!',
  },
  user: {
    email: 'alice@whiteboard.local',
    password: 'User123!',
  },
};

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const title = useMemo(
    () => (mode === 'login' ? 'Вход в систему' : 'Регистрация нового пользователя'),
    [mode]
  );

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const handleChange = (event) => {
    const nextValue = event.target.name === 'email'
      ? event.target.value.trim().toLowerCase()
      : event.target.value;

    setFormData((current) => ({
      ...current,
      [event.target.name]: nextValue,
    }));
  };

  const fillDemo = (type) => {
    setMode('login');
    setShowPassword(false);
    setFormData((current) => ({
      ...current,
      email: DEMO_CREDENTIALS[type].email,
      password: DEMO_CREDENTIALS[type].password,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const action =
      mode === 'login'
        ? login(formData.email, formData.password)
        : register(formData.name, formData.email, formData.password);

    const result = await dispatch(action);
    if (result.success) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  };

  return (
    <section className={classes.login}>
      <div className={classes.backgroundAura} />
      <div className={classes.backgroundGrid} />
      <div className={classes.waveTop} />
      <div className={classes.waveBottom} />

      <div className={classes.loginCard}>
        <div className={classes.heading}>
          <p className={classes.kicker}>Interactive Whiteboard</p>
          <h1 className={classes.title}>{title}</h1>
          <p className={classes.subtitle}>
            Войди в пространство совместной работы, открывай доски и рисуй вместе с командой в реальном времени.
          </p>
        </div>

        <div className={classes.modeSwitch}>
          <button
            type="button"
            className={mode === 'login' ? classes.modeActive : classes.modeButton}
            onClick={() => {
              setMode('login');
              setShowPassword(false);
            }}
          >
            Вход
          </button>
          <button
            type="button"
            className={mode === 'register' ? classes.modeActive : classes.modeButton}
            onClick={() => {
              setMode('register');
              setShowPassword(false);
            }}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className={classes.form}>
          {mode === 'register' && (
            <div className={classes.inputGroup}>
              <label htmlFor="name">Имя</label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Например, Алексей"
                minLength="2"
                required
                className={classes.input}
              />
            </div>
          )}

          <div className={classes.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              required
              className={classes.input}
            />
          </div>

          <div className={classes.inputGroup}>
            <label htmlFor="password">Пароль</label>
            <div className={classes.passwordField}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Минимум 6 символов"
                required
                minLength="6"
                className={`${classes.input} ${classes.passwordInput}`}
              />

              <button
                type="button"
                className={`${classes.passwordToggle} ${showPassword ? classes.revealButtonOpen : ''}`}
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                <span className={classes.revealChevron} />
              </button>
            </div>
          </div>

          {error && <div className={classes.error}>{error}</div>}

          <button type="submit" className={classes.submitBtn} disabled={isLoading}>
            {isLoading ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <div className={classes.demo}>
          <p>Тестовые аккаунты для входа:</p>
          <div className={classes.demoButtons}>
            <button type="button" onClick={() => fillDemo('admin')} className={classes.demoBtn}>
              Админ
            </button>
            <button type="button" onClick={() => fillDemo('user')} className={classes.demoBtn}>
              Пользователь
            </button>
          </div>
          <code>admin@whiteboard.local / Admin123!</code>
          <code>alice@whiteboard.local / User123!</code>
        </div>

        <Link to="/" className={classes.backLink}>
          Вернуться на главную
        </Link>
      </div>
    </section>
  );
}

export default Login;
