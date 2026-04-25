import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { boardsAPI, getAuthToken } from '../../api/boards';
import { useNotifications } from '../../context/NotificationContext';
import Toolbar from '../../components/Toolbar/Toolbar';
import { setTool } from '../../redux/actions/toolbarActions';
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
  const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function cloneSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(Array.isArray(snapshot) ? snapshot : []));
}

function getToolLabel(tool) {
  const labels = {
    select: 'выбор',
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

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function getTextBounds(segment) {
  const fontSize = segment.fontSize || TEXT_SIZE;
  const width = Math.max((segment.text || '').length * (fontSize * 0.58), 40);
  const height = fontSize * 1.35;

  return {
    left: segment.x || 0,
    top: segment.y || 0,
    right: (segment.x || 0) + width,
    bottom: (segment.y || 0) + height,
  };
}

function pointInsideRect(point, rect) {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function findSegmentIndexAtPoint(snapshot, point) {
  for (let index = snapshot.length - 1; index >= 0; index -= 1) {
    const segment = snapshot[index];

    if (segment?.type === 'text') {
      if (pointInsideRect(point, getTextBounds(segment))) {
        return index;
      }
      continue;
    }

    if (segment?.type === 'shape') {
      const start = segment.start || { x: 0, y: 0 };
      const end = segment.end || start;
      const left = Math.min(start.x, end.x);
      const right = Math.max(start.x, end.x);
      const top = Math.min(start.y, end.y);
      const bottom = Math.max(start.y, end.y);
      const threshold = Math.max(8, (segment.width || 4) + 4);

      if (segment.shape === 'line' || segment.shape === 'arrow') {
        if (distanceToSegment(point, start, end) <= threshold) {
          return index;
        }
        continue;
      }

      if (segment.shape === 'circle') {
        const cx = (left + right) / 2;
        const cy = (top + bottom) / 2;
        const rx = Math.max((right - left) / 2, 1);
        const ry = Math.max((bottom - top) / 2, 1);
        const ellipseValue = (((point.x - cx) ** 2) / (rx ** 2)) + (((point.y - cy) ** 2) / (ry ** 2));
        if (ellipseValue <= 1.15) {
          return index;
        }
        continue;
      }

      if (pointInsideRect(point, { left: left - threshold, right: right + threshold, top: top - threshold, bottom: bottom + threshold })) {
        return index;
      }
      continue;
    }

    if (Array.isArray(segment?.points) && segment.points.length > 1) {
      for (let pointIndex = 1; pointIndex < segment.points.length; pointIndex += 1) {
        if (distanceToSegment(point, segment.points[pointIndex - 1], segment.points[pointIndex]) <= Math.max(8, (segment.width || 4) + 4)) {
          return index;
        }
      }
    }
  }

  return -1;
}

function Board() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentTool, color, brushSize } = useSelector((state) => state.toolbar);
  const currentUser = useSelector((state) => state.auth.user);
  const { notify } = useNotifications();
  const canvasRef = useRef(null);
  const canvasViewportRef = useRef(null);
  const textInputRef = useRef(null);
  const socketRef = useRef(null);
  const snapshotRef = useRef([]);
  const currentSegmentRef = useRef(null);
  const remoteSegmentRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const [board, setBoard] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [status, setStatus] = useState('Загрузка доски...');
  const [error, setError] = useState('');
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [textDraft, setTextDraft] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const boardViewStorageKey = `whiteboard:view:${id}`;

  useEffect(() => {
    if (currentTool === 'select') {
      dispatch(setTool('pencil'));
    }
  }, [currentTool, dispatch]);

  const syncHistoryControls = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current >= 0 && historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const seedHistory = useCallback((snapshot) => {
    historyRef.current = [cloneSnapshot(snapshot)];
    historyIndexRef.current = 0;
    syncHistoryControls();
  }, [syncHistoryControls]);

  const recordSnapshot = useCallback((snapshot) => {
    const nextSnapshot = cloneSnapshot(snapshot);
    historyRef.current = [
      ...historyRef.current.slice(0, historyIndexRef.current + 1),
      nextSnapshot,
    ];
    historyIndexRef.current = historyRef.current.length - 1;
    syncHistoryControls();
  }, [syncHistoryControls]);

  const drawCurrentSnapshot = useCallback((snapshot) => {
    snapshotRef.current = cloneSnapshot(snapshot);
    remoteSegmentRef.current = null;
    drawSnapshot(canvasRef.current?.getContext('2d'), snapshotRef.current);
  }, []);

  const applySnapshot = useCallback((nextSnapshot, { sync = true, record = true } = {}) => {
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
  }, [drawCurrentSnapshot, id, recordSnapshot]);

  const commitTextDraft = () => {
    if (!textDraft) {
      return;
    }

    const text = textDraft.value.trim();
    const editingIndex = textDraft.editingIndex;
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

    if (typeof editingIndex === 'number') {
      const nextSnapshot = cloneSnapshot(snapshotRef.current);
      nextSnapshot[editingIndex] = textSegment;
      applySnapshot(nextSnapshot);
      setSelectedIndex(editingIndex);
    } else {
      applySnapshot([...snapshotRef.current, textSegment]);
      setSelectedIndex(snapshotRef.current.length);
    }
    setError('');
  };

  const cancelTextDraft = () => {
    setTextDraft(null);
  };

  const openTextEditorForSegment = (segment, index) => {
    setTextDraft({
      x: segment.x || 0,
      y: segment.y || 0,
      value: segment.text || '',
      editingIndex: index,
    });
  };

  const deleteSelectedSegment = () => {
    if (selectedIndex === null || selectedIndex < 0) {
      return;
    }

    const nextSnapshot = snapshotRef.current.filter((_, index) => index !== selectedIndex);
    applySnapshot(nextSnapshot);
    setSelectedIndex(null);
    notify('Объект удалён с доски', 'info');
  };

  const exportBoardAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const link = document.createElement('a');
    link.download = `board-${id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    notify('Экспорт доски в PNG готов', 'success');
  };

  useEffect(() => {
    const loadBoard = async () => {
      setLoadingBoard(true);
      setError('');
      try {
        const boardData = await boardsAPI.getById(id);
        setBoard(boardData);
        setDescriptionDraft(boardData.description || '');
        const savedView = localStorage.getItem(boardViewStorageKey);
        if (savedView) {
          try {
            const parsedView = JSON.parse(savedView);
            if (typeof parsedView.zoom === 'number') {
              setZoom(Math.min(2, Math.max(0.5, parsedView.zoom)));
            }
          } catch (storageError) {
            // Ignore corrupted stored view state.
          }
        }
        drawCurrentSnapshot(boardData.snapshot);
        seedHistory(boardData.snapshot);
        setStatus('Подключение к комнате доски...');
      } catch (requestError) {
        setError(requestError.message);
        notify(requestError.message, 'danger');
      } finally {
        setLoadingBoard(false);
      }
    };

    loadBoard();
  }, [boardViewStorageKey, drawCurrentSnapshot, id, notify, seedHistory]);

  useEffect(() => {
    if (!textDraft || !textInputRef.current) {
      return;
    }

    const focusId = window.requestAnimationFrame(() => {
      textInputRef.current?.focus();
      textInputRef.current?.setSelectionRange?.(
        textInputRef.current.value.length,
        textInputRef.current.value.length
      );
    });

    return () => window.cancelAnimationFrame(focusId);
  }, [textDraft]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const parent = canvas.parentElement;
      const nextWidth = Math.max(Math.round(rect.width || parent.clientWidth || 0), 320);
      const nextHeight = Math.max(Math.round(rect.height || parent.clientHeight || 0), 420);

      if (canvas.width === nextWidth && canvas.height === nextHeight) {
        return;
      }

      canvas.width = nextWidth;
      canvas.height = nextHeight;
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
    const viewport = canvasViewportRef.current;
    if (!viewport) {
      return;
    }

    const savedView = localStorage.getItem(boardViewStorageKey);
    if (!savedView) {
      return;
    }

    try {
      const parsedView = JSON.parse(savedView);
      viewport.scrollLeft = parsedView.scrollLeft || 0;
      viewport.scrollTop = parsedView.scrollTop || 0;
    } catch (storageError) {
      // Ignore corrupted stored view state.
    }
  }, [boardViewStorageKey, zoom]);

  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const saveView = () => {
      localStorage.setItem(
        boardViewStorageKey,
        JSON.stringify({
          zoom,
          scrollLeft: viewport.scrollLeft,
          scrollTop: viewport.scrollTop,
        })
      );
    };

    saveView();
    viewport.addEventListener('scroll', saveView, { passive: true });
    return () => viewport.removeEventListener('scroll', saveView);
  }, [boardViewStorageKey, zoom]);

  useEffect(() => {
    if (!board) {
      return undefined;
    }

    const normalizedDraft = descriptionDraft.trim();
    const normalizedOriginal = (board.description || '').trim();

    if (normalizedDraft === normalizedOriginal) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const updatedBoard = await boardsAPI.update(id, { description: normalizedDraft });
        setBoard(updatedBoard);
        notify('Описание доски сохранено автоматически', 'info');
      } catch (requestError) {
        setError(requestError.message);
      }
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [board, descriptionDraft, id, notify]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIndex !== null && !textDraft) {
        const targetTag = document.activeElement?.tagName;
        if (targetTag !== 'INPUT' && targetTag !== 'TEXTAREA') {
          event.preventDefault();
          const nextSnapshot = snapshotRef.current.filter((_, index) => index !== selectedIndex);
          applySnapshot(nextSnapshot);
          setSelectedIndex(null);
          notify('Объект удалён с доски', 'info');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [applySnapshot, notify, selectedIndex, textDraft]);

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
          notify(response?.message || 'Не удалось подключиться к доске', 'danger');
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
      notify('Не удалось подключиться к realtime-серверу', 'danger');
    });

    return () => {
      socket.disconnect();
    };
  }, [board, drawCurrentSnapshot, id, notify, seedHistory]);

  const handlePointerDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (currentTool === 'select') {
      const point = getCoordinates(event, canvas);
      const hitIndex = findSegmentIndexAtPoint(snapshotRef.current, point);
      setSelectedIndex(hitIndex >= 0 ? hitIndex : null);
      return;
    }

    const point = getCoordinates(event, canvas);

    if (currentTool === 'text') {
      const hitIndex = findSegmentIndexAtPoint(snapshotRef.current, point);
      if (hitIndex >= 0 && snapshotRef.current[hitIndex]?.type === 'text') {
        setSelectedIndex(hitIndex);
        openTextEditorForSegment(snapshotRef.current[hitIndex], hitIndex);
        return;
      }

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

  const handleViewportPointerDown = (event) => {
    if (zoom <= 1 || currentTool !== 'select') {
      return;
    }

    const viewport = canvasViewportRef.current;
    if (!viewport) {
      return;
    }

    setIsPanning(true);
    setPanStart({
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    });
  };

  const handleViewportPointerMove = (event) => {
    if (!isPanning || !panStart) {
      return;
    }

    const viewport = canvasViewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollLeft = panStart.scrollLeft - (event.clientX - panStart.x);
    viewport.scrollTop = panStart.scrollTop - (event.clientY - panStart.y);
  };

  const handleViewportPointerUp = () => {
    setIsPanning(false);
    setPanStart(null);
  };

  const handleViewportWheel = (event) => {
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }

    event.preventDefault();

    setZoom((current) => {
      const nextZoom = event.deltaY < 0 ? current + 0.1 : current - 0.1;
      return Math.min(2, Math.max(0.5, Number(nextZoom.toFixed(2))));
    });
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

    setSharing(true);
    try {
      const updatedBoard = await boardsAPI.share(id, shareEmail.trim());
      setBoard(updatedBoard);
      notify(`Доступ к доске выдан для ${shareEmail.trim()}`, 'success');
      setShareEmail('');
      setError('');
    } catch (requestError) {
      setError(requestError.message);
      notify(requestError.message, 'danger');
    } finally {
      setSharing(false);
    }
  };

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    try {
      const updatedBoard = await boardsAPI.update(id, { description: descriptionDraft.trim() });
      setBoard(updatedBoard);
      setDescriptionDraft(updatedBoard.description || '');
      notify('Описание доски сохранено', 'success');
      setError('');
    } catch (requestError) {
      setError(requestError.message);
      notify(requestError.message, 'danger');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleZoomOut = () => {
    setZoom((current) => Math.max(0.5, Number((current - 0.1).toFixed(2))));
  };

  const handleZoomIn = () => {
    setZoom((current) => Math.min(2, Number((current + 0.1).toFixed(2))));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      const updatedBoard = await boardsAPI.removeCollaborator(id, userId);
      setBoard(updatedBoard);
      notify('Доступ участника удалён', 'success');
    } catch (requestError) {
      setError(requestError.message);
      notify(requestError.message, 'danger');
    }
  };

  if (loadingBoard && !board) {
    return (
      <section className={classes.board}>
        <div className={classes.skeletonHeader}>
          <div className={classes.skeletonTitle} />
          <div className={classes.skeletonActions}>
            <span className={classes.skeletonChip} />
            <span className={classes.skeletonChip} />
            <span className={classes.skeletonChip} />
          </div>
        </div>
        <div className={classes.workspace}>
          <aside className={classes.sidebar}>
            <div className={classes.skeletonPanel} />
            <div className={classes.skeletonPanel} />
            <div className={classes.skeletonPanelTall} />
          </aside>
          <div className={classes.skeletonCanvas} />
        </div>
      </section>
    );
  }

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
          <button type="button" onClick={exportBoardAsImage} className={classes.secondaryAction}>
            Экспорт PNG
          </button>
          <div className={classes.zoomControls}>
            <button type="button" onClick={handleZoomOut} className={classes.secondaryAction} disabled={zoom <= 0.5}>
              -
            </button>
            <span className={classes.zoomValue}>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={handleZoomIn} className={classes.secondaryAction} disabled={zoom >= 2}>
              +
            </button>
            <button type="button" onClick={handleZoomReset} className={classes.secondaryAction} disabled={zoom === 1}>
              100%
            </button>
          </div>
          <Link to={`/board/${id}/messages`} className={classes.chatLink}>
            Сообщения
          </Link>
        </div>
      </header>

      {error && <p className={classes.error}>{error}</p>}

      <div className={classes.workspace}>
        <aside className={classes.sidebar}>
          <Toolbar onClear={handleClearBoard} />

          {selectedIndex !== null ? (
            <div className={classes.panel}>
              <h3>Выбранный объект</h3>
              <div className={classes.selectionActions}>
                {snapshotRef.current[selectedIndex]?.type === 'text' ? (
                  <button
                    type="button"
                    className={classes.shareButton}
                    onClick={() => openTextEditorForSegment(snapshotRef.current[selectedIndex], selectedIndex)}
                  >
                    Редактировать текст
                  </button>
                ) : null}
                <button type="button" className={classes.removeButton} onClick={deleteSelectedSegment}>
                  Удалить объект
                </button>
              </div>
            </div>
          ) : null}

          <div className={classes.panel}>
            <h3>Команда доски</h3>
            <ul className={classes.members}>
              <li>{board?.owner_name || 'Владелец'} (owner)</li>
              {(board?.collaborators || []).map((member) => (
                <li key={member.id} className={classes.memberRow}>
                  <span>
                    {member.name} ({member.role})
                  </span>
                  {(currentUser?.role === 'admin' || Number(board?.owner_id) === Number(currentUser?.id)) ? (
                    <button
                      type="button"
                      className={classes.memberAction}
                      onClick={() => handleRemoveCollaborator(member.id)}
                    >
                      Убрать
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className={classes.panel}>
            <h3>Описание доски</h3>
            <textarea
              value={descriptionDraft}
              onChange={(event) => setDescriptionDraft(event.target.value)}
              placeholder="Опиши назначение доски, сценарий использования или договорённости команды"
              className={classes.descriptionInput}
              maxLength={500}
            />
            <button
              type="button"
              className={classes.shareButton}
              onClick={handleSaveDetails}
              disabled={savingDetails}
            >
              {savingDetails ? 'Сохраняем...' : 'Сохранить описание'}
            </button>
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
            <button type="submit" className={classes.shareButton} disabled={sharing}>
              {sharing ? 'Отправляем...' : 'Добавить участника'}
            </button>
          </form>
        </aside>

        <div className={classes.canvasWrap}>
          <div className={classes.canvasMeta}>
            <span>Инструмент: {getToolLabel(currentTool)}</span>
            <span>Цвет: {currentTool === 'eraser' ? 'ластик' : color}</span>
            <span>Толщина: {currentTool === 'eraser' ? `${ERASER_WIDTH}px` : `${brushSize}px`}</span>
            <span>Навигация: Ctrl/Cmd + колесо для зума</span>
          </div>
          <div
            ref={canvasViewportRef}
            className={`${classes.canvasViewport} ${isPanning ? classes.canvasPanning : ''}`}
            onWheel={handleViewportWheel}
            onPointerDown={handleViewportPointerDown}
            onPointerMove={handleViewportPointerMove}
            onPointerUp={handleViewportPointerUp}
            onPointerLeave={handleViewportPointerUp}
          >
            <div
              className={classes.canvasScale}
              style={{
                transform: `scale(${zoom})`,
              }}
            >
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
                      top: Math.min(textDraft.y, Math.max((canvasRef.current?.height || 0) - 84, 12)),
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Board;
