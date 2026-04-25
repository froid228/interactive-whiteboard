import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import { boardsAPI } from '../../api/boards';
import { useNotifications } from '../../context/NotificationContext';
import classes from './Header.module.css';

function formatActivity(item) {
  const actor = item.actor_name || 'Кто-то';
  const title = item.board_title ? `«${item.board_title}»` : 'доску';

  switch (item.action) {
    case 'created':
      return `${actor} создал доску ${title}`;
    case 'deleted':
      return `${actor} удалил доску ${title}`;
    case 'shared':
      return `${actor} выдал доступ к доске ${title}${item.metadata?.sharedWithName ? ` для ${item.metadata.sharedWithName}` : ''}`;
    case 'access_removed':
      return `${actor} убрал доступ к доске ${title}${item.metadata?.removedUserName ? ` для ${item.metadata.removedUserName}` : ''}`;
    case 'updated':
      return `${actor} обновил доску ${title}`;
    default:
      return `${actor} изменил доску ${title}`;
  }
}

function getActivityMeta(action) {
  switch (action) {
    case 'created':
      return { icon: '+', tone: 'created' };
    case 'deleted':
      return { icon: '×', tone: 'deleted' };
    case 'shared':
      return { icon: '↗', tone: 'shared' };
    case 'updated':
      return { icon: '•', tone: 'updated' };
    default:
      return { icon: '•', tone: 'default' };
  }
}

function pluralizeEvents(count) {
  const abs = Math.abs(count) % 100;
  const lastDigit = abs % 10;

  if (abs > 10 && abs < 20) {
    return `${count} событий`;
  }

  if (lastDigit === 1) {
    return `${count} событие`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} события`;
  }

  return `${count} событий`;
}

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { notify } = useNotifications();
  const panelRef = useRef(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [filter, setFilter] = useState('all');

  const storageKey = useMemo(
    () => (user?.id ? `whiteboard:lastSeenActivity:${user.id}` : 'whiteboard:lastSeenActivity:guest'),
    [user?.id]
  );

  const unreadCount = useMemo(() => {
    const lastSeen = localStorage.getItem(storageKey);
    if (!lastSeen) {
      return activity.length;
    }

    const lastSeenTime = new Date(lastSeen).getTime();
    return activity.filter((item) => new Date(item.created_at).getTime() > lastSeenTime).length;
  }, [activity, storageKey]);

  const filteredActivity = useMemo(() => {
    if (filter === 'mine') {
      return activity.filter((item) => Number(item.actor_id) === Number(user?.id));
    }

    if (filter === 'access') {
      return activity.filter((item) => item.action === 'shared' || item.action === 'access_removed');
    }

    if (filter === 'changes') {
      return activity.filter((item) => item.action === 'created' || item.action === 'updated' || item.action === 'deleted');
    }

    return activity;
  }, [activity, filter, user?.id]);

  const markAllAsRead = useCallback(() => {
    if (activity.length === 0) {
      return;
    }

    localStorage.setItem(storageKey, activity[0].created_at);
    setActivity((current) => [...current]);
  }, [activity, storageKey]);

  useEffect(() => {
    if (!isAuthenticated) {
      setActivity([]);
      setIsPanelOpen(false);
      return;
    }

    let cancelled = false;

    const loadActivity = async (silent = false) => {
      setLoadingActivity(true);
      try {
        const data = await boardsAPI.getActivity();
        if (!cancelled) {
          setActivity(data);
        }
      } catch (error) {
        if (!cancelled && !silent) {
          notify('Не удалось загрузить уведомления', 'danger');
        }
      } finally {
        if (!cancelled) {
          setLoadingActivity(false);
        }
      }
    };

    loadActivity();
    const intervalId = window.setInterval(() => {
      loadActivity(true);
    }, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, notify]);

  useEffect(() => {
    if (!isPanelOpen || activity.length === 0) {
      return;
    }

    markAllAsRead();
  }, [activity, isPanelOpen, markAllAsRead]);

  useEffect(() => {
    if (!isPanelOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isPanelOpen]);

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
            <div className={classes.notificationsWrap} ref={panelRef}>
              <button
                type="button"
                className={classes.bellButton}
                onClick={() => setIsPanelOpen((current) => !current)}
                aria-label="Открыть уведомления"
              >
                <svg
                  className={classes.bellIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M12 4.25a4 4 0 0 0-4 4v1.28c0 .88-.27 1.74-.77 2.47l-1.12 1.63a1.75 1.75 0 0 0 1.44 2.74h9.9a1.75 1.75 0 0 0 1.44-2.74l-1.12-1.63A4.26 4.26 0 0 1 16 9.53V8.25a4 4 0 0 0-4-4Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.75 18a2.25 2.25 0 0 0 4.5 0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
                {unreadCount > 0 ? <span className={classes.bellBadge}>{unreadCount}</span> : null}
              </button>

              {isPanelOpen ? (
                <div className={classes.notificationsPanel}>
                  <div className={classes.panelHeader}>
                    <div>
                      <strong>Уведомления</strong>
                      <span>{pluralizeEvents(activity.length)}</span>
                    </div>
                    <button
                      type="button"
                      className={classes.markReadButton}
                      onClick={markAllAsRead}
                      disabled={activity.length === 0}
                    >
                      Прочитано
                    </button>
                  </div>

                  <div className={classes.panelList}>
                    <div className={classes.filterRow}>
                      <button type="button" className={`${classes.filterButton} ${filter === 'all' ? classes.filterActive : ''}`} onClick={() => setFilter('all')}>
                        Все
                      </button>
                      <button type="button" className={`${classes.filterButton} ${filter === 'mine' ? classes.filterActive : ''}`} onClick={() => setFilter('mine')}>
                        Мои
                      </button>
                      <button type="button" className={`${classes.filterButton} ${filter === 'access' ? classes.filterActive : ''}`} onClick={() => setFilter('access')}>
                        Доступ
                      </button>
                      <button type="button" className={`${classes.filterButton} ${filter === 'changes' ? classes.filterActive : ''}`} onClick={() => setFilter('changes')}>
                        Изменения
                      </button>
                    </div>

                    {loadingActivity ? <p className={classes.panelEmpty}>Загрузка уведомлений...</p> : null}

                    {!loadingActivity && filteredActivity.length === 0 ? (
                      <p className={classes.panelEmpty}>Пока нет событий по доскам.</p>
                    ) : null}

                    {!loadingActivity
                      ? filteredActivity.slice(0, 8).map((item) => (
                          <article key={item.id} className={classes.panelItem}>
                            <span
                              className={`${classes.itemIcon} ${
                                getActivityMeta(item.action).tone === 'created'
                                  ? classes.itemCreated
                                  : getActivityMeta(item.action).tone === 'deleted'
                                    ? classes.itemDeleted
                                    : getActivityMeta(item.action).tone === 'shared'
                                      ? classes.itemShared
                                      : classes.itemUpdated
                              }`}
                            >
                              {getActivityMeta(item.action).icon}
                            </span>
                            <div className={classes.itemBody}>
                              <p className={classes.panelText}>{formatActivity(item)}</p>
                              <span className={classes.panelTime}>
                                {new Date(item.created_at).toLocaleString('ru-RU')}
                              </span>
                            </div>
                          </article>
                        ))
                      : null}
                  </div>
                </div>
              ) : null}
            </div>

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
