import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { boardsAPI, getAuthToken } from '../../api/boards';
import Toolbar from '../../components/Toolbar/Toolbar';
import classes from './Board.module.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
const ERASER_WIDTH = 18;
const TEXT_SIZE = 26;
const TEXT_INPUT_WIDTH = 220;
const SHAPE_TOOLS = ['rectangle', 'circle', 'line', 'arrow'];

function drawSnapshot(context, snapshot) {
  if (!context || !context.canvas) {
    return;
  }

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  snapshot.forEach((segment) => {
    if (!segment) {
      return;
    }

    if (segment.type === 'text') {
      context.fillStyle = segment.color || '#261d28';
      context.font = `${segment.fontSize || TEXT_SIZE}px Georgia, "Times New Roman", serif`;
      context.textBaseline = 'top';
      context.fillText(segment.text || '', segment.x || 0, segment.y || 0);
      return;
    }

    if (segment.type === 'shape') {
      const start = segment.start || { x: 0, y: 0 };
      const end = segment.end || start;
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);

      if (width < 2 || height < 2) {
        return;
      }

      context.strokeStyle = segment.color || '#261d28';
      context.lineWidth = segment.width || 4;

      if (segment.shape === 'circle') {
        context.beginPath();
        context.ellipse(
          x + width / 2,
          y + height / 2,
          width / 2,
          height / 2,
          0,
          0,
          Math.PI * 2
        );
        context.stroke();
        return;
      }

      if (segment.shape === 'line' || segment.shape === 'arrow') {
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();

        if (segment.shape === 'arrow') {
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headLength = 14 + (segment.width || 4);

          context.beginPath();
          context.moveTo(end.x, end.y);
          context.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6)
          );
          context.moveTo(end.x, end.y);
          context.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6)
          );
          context.stroke();
        }
        return;
      }

      context.beginPath();
      context.roundRect(x, y, width, height, 18);
      context.stroke();
      return;
    }

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

function cloneSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(Array.isArray(snapshot) ? snapshot : []));
}

function getToolLabel(tool) {
  const labels = {
    pencil: 'карандаш',
    eraser: 'ластик',
    text: 'текст',
    rectangle: 'прямоугольник',
    circle: 'круг',
    line: 'линия',
    arrow: 'стрелка',
  };

  return labels[tool] || tool;
}

function Board() {
  const { id } = useParams();
  const { currentTool, color, brushSize } = useSelector((state) => state.toolbar);
  const canvasRef = useRef(null);
  const textInputRef = useRef(null);
  const socketRef = useRef(null);
  const snapshotRef = useRef([]);
  const currentSegmentRef = useRef(null);
  const remoteSegmentRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const [board, setBoard] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [status, setStatus] = useState('Загрузка доски...');
  const [error, setError] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [textDraft, setTextDraft] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncHistoryControls = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current >= 0 && historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const seedHistory = useCallback((snapshot) => {
    historyRef.current = [cloneSnapshot(snapshot)];
    historyIndexRef.current = 0;
    syncHistoryControls();
  }, [syncHistoryControls]);

  const recordSnapshot = (snapshot) => {
    const nextSnapshot = cloneSnapshot(snapshot);
    historyRef.current = [
      ...historyRef.current.slice(0, historyIndexRef.current + 1),
      nextSnapshot,
    ];
    historyIndexRef.current = historyRef.current.length - 1;
    syncHistoryControls();
  };

  const drawCurrentSnapshot = (snapshot) => {
    snapshotRef.current = cloneSnapshot(snapshot);
    remoteSegmentRef.current = null;
    drawSnapshot(canvasRef.current?.getContext('2d'), snapshotRef.current);
  };

  const applySnapshot = (nextSnapshot, { sync = true, record = true } = {}) => {
    drawCurrentSnapshot(nextSnapshot);

    if (record) {
      recordSnapshot(snapshotRef.current);
    }

    if (sync) {
      socketRef.current?.emit('board-snapshot', {
        boardId: id,
        snapshot: snapshotRef.current,
      });
    }
  };

  const commitTextDraft = () => {
    if (!textDraft) {
      return;
    }

    const text = textDraft.value.trim();
    setTextDraft(null);

    if (!text) {
      return;
    }

    const textSegment = {
      type: 'text',
      text,
      x: textDraft.x,
      y: textDraft.y,
      color,
      fontSize: TEXT_SIZE,
    };

    applySnapshot([...snapshotRef.current, textSegment]);
    setError('');
  };

  const cancelTextDraft = () => {
    setTextDraft(null);
  };

  useEffect(() => {
    const loadBoard = async () => {
      setError('');
      try {
        const boardData = await boardsAPI.getById(id);
        setBoard(boardData);
        drawCurrentSnapshot(boardData.snapshot);
        seedHistory(boardData.snapshot);
        setStatus('Подключение к комнате доски...');
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    loadBoard();
  }, [id, seedHistory]);

  useEffect(() => {
    if (!textDraft || !textInputRef.current) {
      return;
    }

    textInputRef.current.focus();
  }, [textDraft]);

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

        drawCurrentSnapshot(response.snapshot);
        seedHistory(response.snapshot);
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
      drawCurrentSnapshot(snapshot);
      seedHistory(snapshot);
    });

    socket.on('clear-board', () => {
      drawCurrentSnapshot([]);
      seedHistory([]);
    });

    socket.on('connect_error', () => {
      setError('Не удалось подключиться к realtime-серверу');
    });

    return () => {
      socket.disconnect();
    };
  }, [board, id, seedHistory]);

  const handlePointerDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const point = getCoordinates(event, canvas);

    if (currentTool === 'text') {
      setTextDraft({
        x: point.x,
        y: point.y,
        value: '',
      });
      setError('');
      return;
    }

    if (SHAPE_TOOLS.includes(currentTool)) {
      currentSegmentRef.current = {
        type: 'shape',
        shape: currentTool,
        color,
        width: brushSize,
        start: point,
        end: point,
      };
      setError('');
      setDrawing(true);
      return;
    }

    currentSegmentRef.current = {
      type: 'line',
      color: currentTool === 'eraser' ? '#ffffff' : color,
      width: currentTool === 'eraser' ? ERASER_WIDTH : brushSize,
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

    if (currentSegmentRef.current.type === 'shape') {
      currentSegmentRef.current = {
        ...currentSegmentRef.current,
        end: point,
      };

      drawSnapshot(canvas.getContext('2d'), [...snapshotRef.current, currentSegmentRef.current]);
      return;
    }

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
    applySnapshot(nextSnapshot);
    currentSegmentRef.current = null;
    setDrawing(false);
  };

  const handleClearBoard = () => {
    setTextDraft(null);
    applySnapshot([]);
    socketRef.current?.emit('clear-board', { boardId: id });
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) {
      return;
    }

    historyIndexRef.current -= 1;
    syncHistoryControls();
    applySnapshot(historyRef.current[historyIndexRef.current], { sync: true, record: false });
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return;
    }

    historyIndexRef.current += 1;
    syncHistoryControls();
    applySnapshot(historyRef.current[historyIndexRef.current], { sync: true, record: false });
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
          <button type="button" onClick={handleUndo} className={classes.secondaryAction} disabled={!canUndo}>
            Назад
          </button>
          <button type="button" onClick={handleRedo} className={classes.secondaryAction} disabled={!canRedo}>
            Вперёд
          </button>
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
            <span>Инструмент: {getToolLabel(currentTool)}</span>
            <span>Цвет: {currentTool === 'eraser' ? 'ластик' : color}</span>
            <span>Толщина: {currentTool === 'eraser' ? `${ERASER_WIDTH}px` : `${brushSize}px`}</span>
          </div>
          <div className={classes.canvasStage}>
            <canvas
              ref={canvasRef}
              className={classes.canvas}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishStroke}
              onPointerLeave={finishStroke}
            />
            {textDraft && (
              <textarea
                ref={textInputRef}
                value={textDraft.value}
                onChange={(event) =>
                  setTextDraft((current) => (current ? { ...current, value: event.target.value } : current))
                }
                onBlur={commitTextDraft}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelTextDraft();
                  }

                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    commitTextDraft();
                  }
                }}
                placeholder="Введите текст..."
                className={classes.textEditor}
                style={{
                  left: Math.min(textDraft.x, Math.max((canvasRef.current?.width || 0) - TEXT_INPUT_WIDTH, 12)),
                  top: textDraft.y,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Board;
