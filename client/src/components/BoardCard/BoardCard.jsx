import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import classes from './BoardCard.module.css';

const BoardCard = React.memo(({ id, title, ownerName, isCollaborator, lastModified, onDelete, onEdit }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <article className={classes.card}>
      <Link to={`/board/${id}`} className={classes.cardLink}>
        <div className={classes.preview} aria-hidden="true">
          <span className={classes.previewDot} />
          <span className={classes.previewLineLong} />
          <span className={classes.previewLineShort} />
          <span className={classes.previewShape} />
        </div>

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

        <div className={classes.cardFooter}>
          <span className={classes.openLabel}>Открыть доску</span>
          <span className={classes.arrow}>↗</span>
        </div>
      </Link>

      <div className={classes.actions}>
        {isConfirmingDelete ? (
          <>
            <button type="button" className={classes.cancelBtn} onClick={() => setIsConfirmingDelete(false)}>
              Отмена
            </button>
            <button
              type="button"
              className={classes.deleteBtn}
              onClick={() => {
                setIsConfirmingDelete(false);
                onDelete();
              }}
            >
              Подтвердить
            </button>
          </>
        ) : (
          <>
            <button type="button" className={classes.editBtn} onClick={onEdit}>
              Переименовать
            </button>
            <button type="button" className={classes.deleteBtn} onClick={() => setIsConfirmingDelete(true)}>
              Удалить
            </button>
          </>
        )}
      </div>
    </article>
  );
});

export default BoardCard;
