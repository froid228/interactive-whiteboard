import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import MessageItem from '../../components/MessageItem/MessageItem';
import { chatAPI, getAuthToken } from '../../api/boards';
import { useNotifications } from '../../context/NotificationContext';
import classes from './Messages.module.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL ?? 'http://localhost:5001';

function Messages() {
  const { boardId } = useParams();
  const { notify } = useNotifications();
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('Загрузка сообщений...');
  const [loading, setLoading] = useState(true);

  const participantCount = useMemo(
    () => new Set(messages.map((message) => message.author_name || message.author || 'Пользователь')).size,
    [messages]
  );

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const data = await chatAPI.getMessages(boardId);
        if (!cancelled) {
          setMessages(data);
          setStatus('История загружена');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error.message);
          notify(error.message, 'danger');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [boardId, notify]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-board', { boardId }, (response) => {
        if (response?.ok) {
          setStatus('Realtime-чат активен');
        } else {
          setStatus(response?.message || 'Не удалось подключиться к realtime-чату');
        }
      });
    });

    socket.on('message-created', ({ message }) => {
      if (!message || Number(message.board_id) !== Number(boardId)) {
        return;
      }

      setMessages((current) => {
        if (current.some((item) => Number(item.id) === Number(message.id))) {
          return current;
        }

        return [...current, message];
      });
    });

    socket.on('connect_error', () => {
      setStatus('Realtime-сервер недоступен');
    });

    return () => socket.disconnect();
  }, [boardId]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !socketRef.current) {
      return;
    }

    socketRef.current.emit('send-message', { boardId, text }, (response) => {
      if (!response?.ok) {
        notify(response?.message || 'Не удалось отправить сообщение', 'danger');
      }
    });

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
            {status}
          </p>
        </div>
        <div className={classes.headerBadge}>
          <span>Участники</span>
          <strong>{participantCount}</strong>
        </div>
      </header>

      <div className={classes.messagesList}>
        {loading ? <p className={classes.empty}>Загрузка...</p> : null}
        {!loading && messages.length === 0 ? <p className={classes.empty}>Сообщений пока нет.</p> : null}
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            author={message.author_name || message.author || 'Пользователь'}
            text={message.text}
            time={new Date(message.created_at).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        ))}
      </div>

      <div className={classes.messageInput}>
        <input
          type="text"
          placeholder="Введите сообщение..."
          className={classes.input}
          value={draft}
          maxLength={1000}
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
