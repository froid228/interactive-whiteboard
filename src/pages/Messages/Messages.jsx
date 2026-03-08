import React from 'react';
import { Link, useParams } from 'react-router-dom';
import MessageItem from '../../components/MessageItem/MessageItem';
import classes from './Messages.module.css';

// Мок-данные для демонстрации (позже придут с сервера)
const mockMessages = [
  { id: 1, author: 'Анна', text: 'Привет! Давайте начнём рисовать схему', time: '10:30' },
  { id: 2, author: 'Максим', text: 'Отлично, я уже открыл доску', time: '10:32' },
  { id: 3, author: 'Анна', text: 'Добавь, пожалуйста, блок "Архитектура"', time: '10:35' },
];

function Messages() {
  // Получаем ID доски из URL (динамический параметр)
  const { boardId } = useParams();

  return (
    <div className={classes.messages}>
      <header className={classes.messagesHeader}>
        <Link to={`/board/${boardId}`} className={classes.backLink}>
          ← Вернуться к доске №{boardId}
        </Link>
        <h2 className={classes.messagesTitle}>Чат доски</h2>
      </header>
      
      <div className={classes.messagesList}>
        {mockMessages.map(message => (
          <MessageItem
            key={message.id}
            author={message.author}
            text={message.text}
            time={message.time}
          />
        ))}
      </div>
      
      <div className={classes.messageInput}>
        <input 
          type="text" 
          placeholder="Введите сообщение..." 
          className={classes.input}
        />
        <button className={classes.sendBtn}>Отправить</button>
      </div>
    </div>
  );
}

export default Messages;