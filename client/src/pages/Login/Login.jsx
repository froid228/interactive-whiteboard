import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../redux/actions/authActions';
import classes from './Login.module.css';

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Если уже авторизован — редирект на главную
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(formData.email, formData.password));
    
    if (result.success) {
      // Редирект на страницу, с которой пришли (или на главную)
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className={classes.login}>
      <div className={classes.loginCard}>
        <h1 className={classes.title}>Вход в систему</h1>
        <p className={classes.subtitle}>Интерактивная доска</p>
        
        <form onSubmit={handleSubmit} className={classes.form}>
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
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Минимум 6 символов"
              required
              minLength="6"
              className={classes.input}
            />
          </div>
          
          {error && <div className={classes.error}>{error}</div>}
          
          <button 
            type="submit" 
            className={classes.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className={classes.demo}>
          <p> Демо-доступ:</p>
          <code>email: any@example.com</code>
          <code>password: 123456</code>
        </div>
        
        <Link to="/" className={classes.backLink}>← На главную</Link>
      </div>
    </div>
  );
}

export default Login;