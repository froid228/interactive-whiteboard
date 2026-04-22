import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { boardsAPI, getAuthToken } from '../../api/boards';
import Toolbar from '../../components/Toolbar/Toolbar';
import classes from './Board.module.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
const DEFAULT_WIDTH = 4;
const ERASER_WIDTH = 18;

function drawSnapshot(context, snapshot) {
  if (!context || !context.canvas) {
    return;
  }

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  snapshot.forEach((segment) => {
    if (!segment?.points?.length) {
      return;
    }

    context.beginPath();
    context.strokeStyle = segment.color;
    context.lineWidth = segment.width;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.moveTo(segment.points[0].x, segment.points[0].y);

    for (let index = 1; index < segment.points.length; index += 1) {
      context.lineTo(segment.points[index].x, segment.points[index].y);
    }

    context.stroke();
  });
}

function getCoordinates(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function Board() {
  const { id } = useParams();
  const { currentTool, color } = useSelector((state) => state.toolbar);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const snapshotRef = useRef([]);
  const currentSegmentRef = useRef(null);
  const remoteSegmentRef = useRef(null);
  const [board, setBoard] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [status, setStatus] = useState('Загрузка доски...');
  const [error, setError] = useState('');
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const loadBoard = async () => {
      setError('');
      try {
        const boardData = await boardsAPI.getById(id);
        setBoard(boardData);
        snapshotRef.current = Array.isArray(boardData.snapshot) ? boardData.snapshot : [];
        setStatus('Подключение к комнате доски...');
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    loadBoard();
  }, [id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth - 2;
      canvas.height = parent.clientHeight - 2;
      const context = canvas.getContext('2d');
      drawSnapshot(context, snapshotRef.current);
      if (remoteSegmentRef.current) {
        drawSnapshot(context, [...snapshotRef.current, remoteSegmentRef.current]);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token || !board) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-board', { boardId: id }, (response) => {
        if (!response?.ok) {
          setError(response?.message || 'Не удалось подключиться к доске');
          return;
        }

        snapshotRef.current = Array.isArray(response.snapshot) ? response.snapshot : [];
        drawSnapshot(canvasRef.current?.getContext('2d'), snapshotRef.current);
        setStatus('Синхронизация активна');
      });
    });

    socket.on('draw-segment', ({ segment }) => {
      if (!segment) {
        return;
      }

      remoteSegmentRef.current = segment;
      drawSnapshot(canvasRef.current?.getContext('2d'), [...snapshotRef.current, segment]);
    });

    socket.on('board-snapshot', ({ snapshot }) => {
      snapshotRef.current = Array.isArray(snapshot) ? snapshot : [];
      remoteSegmentRef.current = null;
      drawSnapshot(canvasRef.current?.getContext('2d'), snapshotRef.current);
    });

    socket.on('clear-board', () => {
      snapshotRef.current = [];
      remoteSegmentRef.current = null;
      drawSnapshot(canvasRef.current?.getContext('2d'), snapshotRef.current);
    });

    socket.on('connect_error', () => {
      setError('Не удалось подключиться к realtime-серверу');
    });

    return () => {
      socket.disconnect();
    };
  }, [board, id]);

  const syncSnapshot = (nextSnapshot) => {
    snapshotRef.current = nextSnapshot;
    remoteSegmentRef.current = null;
    socketRef.current?.emit('board-snapshot', {
      boardId: id,
      snapshot: nextSnapshot,
    });
  };

  const handlePointerDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (currentTool === 'text' || currentTool === 'shape') {
      setError(`Инструмент "${currentTool}" пока отображается в панели как будущая возможность.`);
      return;
    }

    const point = getCoordinates(event, canvas);
    currentSegmentRef.current = {
      color: currentTool === 'eraser' ? '#ffffff' : color,
      width: currentTool === 'eraser' ? ERASER_WIDTH : DEFAULT_WIDTH,
      points: [point],
    };
    setError('');
    setDrawing(true);
  };

  const handlePointerMove = (event) => {
    if (!drawing || !currentSegmentRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const point = getCoordinates(event, canvas);
    currentSegmentRef.current = {
      ...currentSegmentRef.current,
      points: [...currentSegmentRef.current.points, point],
    };

    const previewSnapshot = [...snapshotRef.current, currentSegmentRef.current];
    drawSnapshot(canvas.getContext('2d'), previewSnapshot);
    socketRef.current?.emit('draw-segment', {
      boardId: id,
      segment: currentSegmentRef.current,
    });
  };

  const finishStroke = () => {
    if (!drawing || !currentSegmentRef.current) {
      return;
    }

    const nextSnapshot = [...snapshotRef.current, currentSegmentRef.current];
    drawSnapshot(canvasRef.current?.getContext('2d'), nextSnapshot);
    syncSnapshot(nextSnapshot);
    currentSegmentRef.current = null;
    setDrawing(false);
  };

  const handleClearBoard = () => {
    snapshotRef.current = [];
    remoteSegmentRef.current = null;
    drawSnapshot(canvasRef.current?.getContext('2d'), snapshotRef.current);
    socketRef.current?.emit('clear-board', { boardId: id });
  };

  const handleShare = async (event) => {
    event.preventDefault();

    if (!shareEmail.trim()) {
      setError('Укажи email пользователя, которому нужен доступ');
      return;
    }

    try {
      const updatedBoard = await boardsAPI.share(id, shareEmail.trim());
      setBoard(updatedBoard);
      setShareEmail('');
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className={classes.board}>
      <header className={classes.boardHeader}>
        <div>
          <Link to="/" className={classes.backLink}>
            Назад к списку досок
          </Link>
          <h2 className={classes.boardTitle}>{board?.title || `Доска №${id}`}</h2>
          <p className={classes.boardMeta}>
            Владелец: {board?.owner_name || '...'} · Статус: {status}
          </p>
        </div>
        <div className={classes.actions}>
          <button type="button" onClick={handleClearBoard} className={classes.clearButton}>
            Очистить холст
          </button>
          <Link to={`/board/${id}/messages`} className={classes.chatLink}>
            Сообщения
          </Link>
        </div>
      </header>

      {error && <p className={classes.error}>{error}</p>}

      <div className={classes.workspace}>
        <aside className={classes.sidebar}>
          <Toolbar onClear={handleClearBoard} />

          <div className={classes.panel}>
            <h3>Команда доски</h3>
            <ul className={classes.members}>
              <li>{board?.owner_name || 'Владелец'} (owner)</li>
              {(board?.collaborators || []).map((member) => (
                <li key={member.id}>
                  {member.name} ({member.role})
                </li>
              ))}
            </ul>
          </div>

          <form className={classes.panel} onSubmit={handleShare}>
            <h3>Выдать доступ</h3>
            <input
              type="email"
              value={shareEmail}
              onChange={(event) => setShareEmail(event.target.value)}
              placeholder="user@example.com"
              className={classes.shareInput}
            />
            <button type="submit" className={classes.shareButton}>
              Добавить участника
            </button>
          </form>
        </aside>

        <div className={classes.canvasWrap}>
          <div className={classes.canvasMeta}>
            <span>Инструмент: {currentTool}</span>
            <span>Цвет: {currentTool === 'eraser' ? 'ластик' : color}</span>
          </div>
          <canvas
            ref={canvasRef}
            className={classes.canvas}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerLeave={finishStroke}
          />
        </div>
      </div>
    </section>
  );
}

export default Board;
