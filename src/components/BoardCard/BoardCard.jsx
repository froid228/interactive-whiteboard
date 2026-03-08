import React from 'react';
import { Link } from 'react-router-dom';
import classes from './BoardCard.module.css';

// Оптимизация: React.memo предотвращает лишний ререндер
const BoardCard = React.memo(({ id, title, lastModified }) => {
  return (
    <div className={classes.card}>
      <Link to={`/board/${id}`} className={classes.cardLink}>
        <h3 className={classes.cardTitle}>{title}</h3>
        {lastModified && (
          <p className={classes.cardDate}>
            Обновлено: {new Date(lastModified).toLocaleDateString()}
          </p>
        )}
      </Link>
    </div>
  );
});

export default BoardCard;