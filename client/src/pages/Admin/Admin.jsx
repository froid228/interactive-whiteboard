import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { adminAPI } from '../../api/boards';
import { useNotifications } from '../../context/NotificationContext';
import classes from './Admin.module.css';

function Admin() {
  const currentUser = useSelector((state) => state.auth.user);
  const { notify } = useNotifications();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers();
      setUsers(data);
    } catch (error) {
      notify(error.message, 'danger');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateUser = async (id, payload) => {
    try {
      const updated = await adminAPI.updateUser(id, payload);
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      notify('Пользователь обновлен', 'success');
    } catch (error) {
      notify(error.message, 'danger');
    }
  };

  const deleteUser = async (id) => {
    try {
      await adminAPI.deleteUser(id);
      setUsers((current) => current.filter((user) => user.id !== id));
      notify('Пользователь удален', 'success');
    } catch (error) {
      notify(error.message, 'danger');
    }
  };

  return (
    <section className={classes.admin}>
      <header className={classes.header}>
        <Link to="/" className={classes.backLink}>← На главную</Link>
        <div>
          <p className={classes.kicker}>Панель администратора</p>
          <h2>Пользователи и роли</h2>
        </div>
      </header>

      <div className={classes.tableWrap}>
        {loading ? <p className={classes.empty}>Загрузка пользователей...</p> : null}

        {!loading && users.length === 0 ? <p className={classes.empty}>Пользователей пока нет.</p> : null}

        {!loading && users.length > 0 ? (
          <table className={classes.table}>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Создан</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = Number(user.id) === Number(currentUser?.id);

                return (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(event) => updateUser(user.id, { role: event.target.value })}
                        disabled={isSelf}
                        className={classes.select}
                      >
                        <option value="user">Участник</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </td>
                    <td>
                      <span className={user.is_active ? classes.activeBadge : classes.blockedBadge}>
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                    <td>
                      <div className={classes.actions}>
                        <button
                          type="button"
                          className={classes.secondaryButton}
                          onClick={() => updateUser(user.id, { isActive: !user.is_active })}
                          disabled={isSelf}
                        >
                          {user.is_active ? 'Заблокировать' : 'Разблокировать'}
                        </button>
                        <button
                          type="button"
                          className={classes.dangerButton}
                          onClick={() => deleteUser(user.id)}
                          disabled={isSelf}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}

export default Admin;
