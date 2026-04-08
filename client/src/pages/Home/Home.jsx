import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BoardCard from '../../components/BoardCard/BoardCard';
import classes from './Home.module.css';

function Home() {
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user: reduxUser } = useSelector((state) => state.auth || {});
  const API_URL = 'http://localhost:5001';

  // Функция получения корректного ID пользователя
  const getUserId = () => {
    const user = reduxUser || JSON.parse(localStorage.getItem('user') || '{}');
    let userId = user.id;
    
    // Если ID - timestamp (большое число), используем дефолтный
    if (userId && parseInt(userId) > 1000000) {
      console.warn('⚠️ ID похож на timestamp, используем ID=2');
      return 2;
    }
    
    return parseInt(userId) || 2;
  };

  // Функция получения роли пользователя
  const getUserRole = () => {
    const user = reduxUser || JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || 'user';
  };

  // Загрузка досок
  const loadBoards = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = getUserId();
      const userRole = getUserRole();
      
      console.log('📡 Загрузка досок, user:', { userId, userRole });
      
      const res = await fetch(`${API_URL}/api/boards`, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole,
          'X-User-Id': String(userId),
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Ошибка ${res.status}: ${errorData.message || 'Неизвестная ошибка'}`);
      }
      
      const data = await res.json();
      console.log('✅ Доски загружены:', data);
      setBoards(data);
    } catch (e) {
      console.error('❌ Ошибка загрузки:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  // Создание доски
  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Введите название доски');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const userId = getUserId();
      const userRole = getUserRole();
      
      console.log('📡 Создание доски:', { 
        title: trimmedTitle, 
        userId, 
        userRole 
      });
      
      const res = await fetch(`${API_URL}/api/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole,
          'X-User-Id': String(userId),
        },
        body: JSON.stringify({ title: trimmedTitle }),
      });

      console.log('📦 Ответ сервера:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Ошибка создания:', errorData);
        throw new Error(errorData.message || 'Не удалось создать доску');
      }

      const newBoard = await res.json();
      console.log('✅ Доска создана:', newBoard);
      setBoards([newBoard, ...boards]);
      setTitle('');
    } catch (err) {
      console.error('❌ Ошибка:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Удаление доски
  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту доску?')) return;

    try {
      const userId = getUserId();
      const userRole = getUserRole();
      
      const res = await fetch(`${API_URL}/api/boards/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole,
          'X-User-Id': String(userId),
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Не удалось удалить');
      }

      setBoards(boards.filter(b => b.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // Обновление доски
  const handleEdit = async (id, currentTitle) => {
    const newTitle = window.prompt('Новое название:', currentTitle);
    if (!newTitle || !newTitle.trim() || newTitle === currentTitle) return;

    try {
      const userId = getUserId();
      const userRole = getUserRole();
      
      const res = await fetch(`${API_URL}/api/boards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole,
          'X-User-Id': String(userId),
        },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Не удалось обновить');
      }

      const updated = await res.json();
      setBoards(boards.map(b => b.id === id ? updated : b));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={classes.home}>
      <h1 className={classes.homeTitle}>Ваши доски</h1>

      <div className={classes.form}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Название новой доски"
          className={classes.input}
          disabled={loading}
        />
        <button 
          onClick={handleCreate}
          className={classes.button}
          disabled={loading || !title.trim()}
        >
          {loading ? 'Создание...' : 'Создать доску'}
        </button>
      </div>

      {loading && <p className={classes.info}>Загрузка...</p>}
      {error && <p className={classes.error}>Ошибка: {error}</p>}
      
      <div className={classes.grid}>
        {boards.length === 0 && !loading ? (
          <p className={classes.empty}>Нет досок. Создайте первую!</p>
        ) : (
          boards.map(board => (
            <BoardCard
              key={board.id}
              id={board.id}
              title={board.title}
              lastModified={board.updated_at || board.created_at}
              onDelete={() => handleDelete(board.id)}
              onEdit={() => handleEdit(board.id, board.title)}
            />
          ))
        )}
      </div>
      
      <div className={classes.actions}>
        <Link to="/about" className={classes.link}>О проекте</Link>
      </div>
    </div>
  );
}

export default Home;