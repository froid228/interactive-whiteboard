import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import classes from './BoardCard.module.css';

const PREVIEW_WIDTH = 900;
const PREVIEW_HEIGHT = 560;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function percentX(value) {
  return `${clamp((value / PREVIEW_WIDTH) * 100, 4, 92)}%`;
}

function percentY(value) {
  return `${clamp((value / PREVIEW_HEIGHT) * 100, 6, 86)}%`;
}

function renderPreview(snapshot) {
  if (!Array.isArray(snapshot) || snapshot.length === 0) {
    return (
      <>
        <span className={classes.previewDot} />
        <span className={classes.previewLineLong} />
        <span className={classes.previewLineShort} />
        <span className={classes.previewShape} />
      </>
    );
  }

  return snapshot.slice(0, 4).map((segment, index) => {
    if (segment?.type === 'text') {
      return (
        <span
          key={`preview-text-${index}`}
          className={classes.previewText}
          style={{
            left: percentX(segment.x || 80),
            top: percentY(segment.y || 80),
            color: segment.color || '#fff7f2',
          }}
        >
          {(segment.text || 'Текст').slice(0, 10)}
        </span>
      );
    }

    if (segment?.type === 'shape') {
      const start = segment.start || { x: 90, y: 90 };
      const end = segment.end || start;
      const left = Math.min(start.x, end.x);
      const top = Math.min(start.y, end.y);
      const width = Math.max(Math.abs(end.x - start.x), 40);
      const height = Math.max(Math.abs(end.y - start.y), 30);

      if (segment.shape === 'line' || segment.shape === 'arrow') {
        const dx = (end.x || 0) - (start.x || 0);
        const dy = (end.y || 0) - (start.y || 0);
        const length = Math.max(Math.sqrt(dx * dx + dy * dy), 44);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        return (
          <span
            key={`preview-shape-${index}`}
            className={`${classes.previewSegment} ${
              segment.shape === 'arrow' ? classes.previewArrow : classes.previewStroke
            }`}
            style={{
              left: percentX(start.x || 90),
              top: percentY(start.y || 90),
              width: `${clamp((length / PREVIEW_WIDTH) * 100, 10, 40)}%`,
              color: segment.color || '#fff7f2',
              background: segment.shape === 'arrow' ? 'transparent' : (segment.color || '#fff7f2'),
              transform: `rotate(${angle}deg)`,
            }}
          />
        );
      }

      return (
        <span
          key={`preview-shape-${index}`}
          className={`${classes.previewSegment} ${
            segment.shape === 'circle' ? classes.previewCircle : classes.previewRect
          }`}
          style={{
            left: percentX(left),
            top: percentY(top),
            width: `${clamp((width / PREVIEW_WIDTH) * 100, 10, 30)}%`,
            height: `${clamp((height / PREVIEW_HEIGHT) * 100, 8, 28)}%`,
            borderColor: segment.color || '#fff7f2',
          }}
        />
      );
    }

    if (Array.isArray(segment?.points) && segment.points.length > 1) {
      const start = segment.points[0];
      const end = segment.points[segment.points.length - 1];
      const dx = (end.x || 0) - (start.x || 0);
      const dy = (end.y || 0) - (start.y || 0);
      const length = Math.max(Math.sqrt(dx * dx + dy * dy), 54);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      return (
        <span
          key={`preview-line-${index}`}
          className={classes.previewStroke}
          style={{
            left: percentX(start.x || 70),
            top: percentY(start.y || 70),
            width: `${clamp((length / PREVIEW_WIDTH) * 100, 12, 44)}%`,
            background: segment.color || '#f0d7c7',
            transform: `rotate(${angle}deg)`,
          }}
        />
      );
    }

    return null;
  });
}

const TITLE_LIMIT = 120;

const BoardCard = React.memo(({ id, title, description, ownerName, isCollaborator, lastModified, snapshot, onDelete, onEdit }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  const handleSaveEdit = async () => {
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === title) {
      setIsEditing(false);
      setDraftTitle(title);
      return;
    }

    try {
      await onEdit(trimmed);
      setIsEditing(false);
    } catch (error) {
      // Parent handles notifications; keep form open for correction.
    }
  };

  return (
    <article className={classes.card}>
      <Link to={`/board/${id}`} className={classes.cardLink}>
        <div className={classes.preview} aria-hidden="true">
          {renderPreview(snapshot)}
        </div>

        <div className={classes.cardHeader}>
          <span className={classes.badge}>{isCollaborator ? 'Совместная' : 'Моя доска'}</span>
          <h3 className={classes.cardTitle}>{title}</h3>
          {description ? <p className={classes.cardDescription}>{description}</p> : null}
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
        {isEditing ? (
          <div className={classes.editForm}>
            <input
              type="text"
              value={draftTitle}
              maxLength={TITLE_LIMIT}
              onChange={(event) => setDraftTitle(event.target.value)}
              className={classes.editInput}
              placeholder="Новое название доски"
            />
            <div className={classes.editMeta}>
              <span className={classes.counter}>{draftTitle.length}/{TITLE_LIMIT}</span>
              <div className={classes.editFormActions}>
                <button
                  type="button"
                  className={classes.cancelBtn}
                  onClick={() => {
                    setDraftTitle(title);
                    setIsEditing(false);
                  }}
                >
                  Отмена
                </button>
                <button type="button" className={classes.editBtn} onClick={handleSaveEdit}>
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
            <button type="button" className={classes.editBtn} onClick={() => setIsEditing(true)}>
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
