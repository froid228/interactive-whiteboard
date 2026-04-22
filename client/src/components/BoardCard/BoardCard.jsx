import React from 'react';
import { Link } from 'react-router-dom';
import classes from './BoardCard.module.css';

const BoardCard = React.memo(({ id, title, ownerName, isCollaborator, lastModified, onDelete, onEdit }) => {
  return (
    <article className={classes.card}>
      <Link to={`/board/${id}`} className={classes.cardLink}>
        <div className={classes.cardHeader}>
          <span className={classes.badge}>{isCollaborator ? 'Совместная' : 'Моя доска'}</span>
          <h3 className={classes.cardTitle}>{title}</h3>
        </div>

        <div className={classes.meta}>
          <span>Владелец: {ownerName || 'неизвестно'}</span>
          {lastModified && (
            <span>Обновлено: {new Date(lastModified).toLocaleString('ru-RU')}</span>
          )}
        </div>
      </Link>

      <div className={classes.actions}>
        <button type="button" className={classes.editBtn} onClick={onEdit}>
          Переименовать
        </button>
        <button type="button" className={classes.deleteBtn} onClick={onDelete}>
          Удалить
        </button>
      </div>
    </article>
  );
});

export default BoardCard;
