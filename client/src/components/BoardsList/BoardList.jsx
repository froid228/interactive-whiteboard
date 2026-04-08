import React, { useEffect, useState } from 'react';
import { boardsAPI } from '../../api/boards';
import classes from './BoardList.module.css';

function BoardList() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  // Загрузка досок при монтировании
  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardsAPI.getAll();
      setBoards(data);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError('Не удалось загрузить доски. Убедитесь, что сервер запущен на порту 5001');
    } finally {
      setLoading(false);
    }
  };

  // Создание новой доски
  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!newTitle.trim()) {
      alert('Введите название доски!');
      return;
    }

    try {
      const newBoard = await boardsAPI.create(newTitle);
      setBoards([newBoard, ...boards]);
      setNewTitle('');
      alert('Доска успешно создана!');
    } catch (err) {
      console.error('Ошибка создания:', err);
      alert('Ошибка при создании доски: ' + (err.response?.data?.message || err.message));
    }
  };

  // Удаление доски
  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту доску?')) return;

    try {
      await boardsAPI.delete(id);
      setBoards(boards.filter(board => board.id !== id));
      alert('Доска удалена!');
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка при удалении: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return <div className={classes.loading}>Загрузка досок...</div>;
  }

  return (
    <div className={classes.container}>
      <h2 className={classes.title}>Ваши доски</h2>
      
      {/* Форма создания */}
      <form onSubmit={handleCreate} className={classes.createForm}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Название доски"
          className={classes.input}
        />
        <button type="submit" className={classes.createBtn}>
          Создать
        </button>
      </form>

      {/* Сообщение об ошибке */}
      {error && <div className={classes.error}>{error}</div>}

      {/* Список досок */}
      <div className={classes.list}>
        {boards.length === 0 ? (
          <p className={classes.empty}>Нет досок. Создайте первую!</p>
        ) : (
          boards.map(board => (
            <div key={board.id} className={classes.boardCard}>
              <span className={classes.boardTitle}>{board.title}</span>
              <button 
                onClick={() => handleDelete(board.id)}
                className={classes.deleteBtn}
                title="Удалить доску"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BoardList;