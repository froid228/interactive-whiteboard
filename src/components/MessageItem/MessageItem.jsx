import React from 'react';
import classes from './MessageItem.module.css';

// Оптимизация: React.memo для предотвращения лишних ререндеров
const MessageItem = React.memo(({ author, text, time }) => {
  return (
    <div className={classes.message}>
      <div className={classes.messageHeader}>
        <span className={classes.author}>{author}</span>
        <span className={classes.time}>{time}</span>
      </div>
      <p className={classes.text}>{text}</p>
    </div>
  );
});

export default MessageItem;