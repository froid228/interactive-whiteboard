import React, { useMemo, useState } from 'react';
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
  const { boardId } = useParams();
  const [messages, setMessages] = useState(mockMessages);
  const [draft, setDraft] = useState('');

  const participantCount = useMemo(() => new Set(messages.map((message) => message.author)).size, [messages]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        author: 'Вы',
        text,
        time: new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setDraft('');
  };

  return (
    <section className={classes.messages}>
      <header className={classes.messagesHeader}>
        <div className={classes.headerCopy}>
          <Link to={`/board/${boardId}`} className={classes.backLink}>
            ← Вернуться к доске №{boardId}
          </Link>
          <h2 className={classes.messagesTitle}>Чат доски</h2>
          <p className={classes.subtitle}>
            Обсуждайте идеи параллельно с рисованием, фиксируйте решения и держите весь контекст рядом с холстом.
          </p>
        </div>
        <div className={classes.headerBadge}>
          <span>Участники</span>
          <strong>{participantCount}</strong>
        </div>
      </header>

      <div className={classes.messagesList}>
        {messages.map((message) => (
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
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSend();
            }
          }}
        />
        <button type="button" className={classes.sendBtn} onClick={handleSend} disabled={!draft.trim()}>
          Отправить
        </button>
      </div>
    </section>
  );
}

export default Messages;
