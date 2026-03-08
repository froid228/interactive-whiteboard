// src/pages/Board/Board.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import classes from './Board.module.css';

function Board() {
  // Получаем параметр :id из URL
  const { id } = useParams();

  return (
    <div className={classes.board}>
      <header className={classes.boardHeader}>
        <Link to="/" className={classes.backLink}>
          ← Назад
        </Link>
        <h2 className={classes.boardTitle}>Доска №{id}</h2>
        
        {/* Ссылка на чат доски — требование Практики 4 */}
        <Link 
          to={`/board/${id}/messages`} 
          className={classes.chatLink}
        >
          💬 Сообщения
        </Link>
      </header>
      
      <main className={classes.canvasArea}>
        <p className={classes.placeholder}>
          Область рисования
        </p>
      </main>
    </div>
  );
}

export default Board;