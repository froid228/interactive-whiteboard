import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BoardCard from '../../components/BoardCard/BoardCard';
import { boardsAPI } from '../../api/boards';
import classes from './Home.module.css';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setBoards([]);
      return;
    }

    let cancelled = false;

    const loadBoards = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await boardsAPI.getAll();
        if (!cancelled) {
          setBoards(data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBoards();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Введите название доски');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const createdBoard = await boardsAPI.create(trimmedTitle);
      setBoards((current) => [createdBoard, ...current]);
      setTitle('');
      navigate(`/board/${createdBoard.id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту доску?')) {
      return;
    }

    try {
      await boardsAPI.remove(id);
      setBoards((current) => current.filter((board) => board.id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleEdit = async (id, currentTitle) => {
    const updatedTitle = window.prompt('Новое название:', currentTitle);
    if (!updatedTitle || updatedTitle.trim() === currentTitle) {
      return;
    }

    try {
      const updatedBoard = await boardsAPI.update(id, updatedTitle.trim());
      setBoards((current) =>
        current.map((board) => (board.id === id ? { ...board, ...updatedBoard } : board))
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className={classes.hero}>
        <div className={classes.heroContent}>
          <div className={classes.heroText}>
            <p className={classes.kicker}>Realtime collaboration studio</p>
            <h1 className={classes.homeTitle}>Интерактивная доска для командной работы, обсуждения идей и совместного рисования</h1>
            <p className={classes.description}>
              Пространство, где участники команды могут вместе рисовать, обсуждать схемы, собирать идеи
              и быстро переходить от мысли к общей визуальной карте.
            </p>
            <div className={classes.heroActions}>
              <Link to="/login" className={classes.primaryLink}>
                Открыть рабочее пространство
              </Link>
              <Link to="/about" className={classes.secondaryLink}>
                Узнать о проекте
              </Link>
            </div>
            <div className={classes.heroPanel}>
              <div className={classes.heroStat}>
                <span>Совместная работа</span>
                <strong>Общий холст для команды</strong>
              </div>
              <div className={classes.heroStat}>
                <span>Живое взаимодействие</span>
                <strong>Синхронизация изменений в реальном времени</strong>
              </div>
              <div className={classes.heroStat}>
                <span>Гибкость сценариев</span>
                <strong>Брейнштормы, схемы, заметки и прототипы</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={classes.home}>
      <div className={classes.topline}>
        <div>
          <p className={classes.kicker}>Рабочее пространство</p>
          <h1 className={classes.homeTitle}>Доски пользователя {user?.name}</h1>
          <p className={classes.subtitle}>Создавай новые доски, открывай совместный доступ и переходи прямо в живой режим рисования.</p>
        </div>
        <div className={classes.statusCard}>
          <span className={classes.statusLabel}>Роль</span>
          <strong>{user?.role === 'admin' ? 'Администратор' : 'Участник'}</strong>
          <span className={classes.statusNote}>{boards.length} доступных досок</span>
        </div>
      </div>

      <div className={classes.commandBar}>
        <div className={classes.form}>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleCreate()}
            placeholder="Название новой доски"
            className={classes.input}
            disabled={loading}
          />
          <button onClick={handleCreate} className={classes.button} disabled={loading || !title.trim()}>
            {loading ? 'Сохранение...' : 'Создать доску'}
          </button>
        </div>
        <Link to="/about" className={classes.inlineLink}>
          Подробнее о проекте
        </Link>
      </div>

      {error && <div className={classes.error}>Ошибка: {error}</div>}
      {loading && <div className={classes.info}>Загрузка досок и синхронизация рабочего пространства...</div>}

      <div className={classes.grid}>
        {boards.length === 0 && !loading ? (
          <div className={classes.emptyState}>
            <div className={classes.emptyIllustration} aria-hidden="true">
              <span className={classes.emptyCircle} />
              <span className={classes.emptyLineLong} />
              <span className={classes.emptyLineShort} />
            </div>
            <h3>Пока нет доступных досок</h3>
            <p>Создай первую доску или попроси владельца выдать тебе доступ к уже существующей.</p>
          </div>
        ) : (
          boards.map((board) => (
            <BoardCard
              key={board.id}
              id={board.id}
              title={board.title}
              ownerName={board.owner_name}
              isCollaborator={board.is_collaborator}
              lastModified={board.updated_at || board.created_at}
              onDelete={() => handleDelete(board.id)}
              onEdit={() => handleEdit(board.id, board.title)}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default Home;
