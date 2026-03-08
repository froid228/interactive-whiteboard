import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTool, setColor, clearCanvas } from '../../redux/actions/toolbarActions';
import classes from './Toolbar.module.css';

function Toolbar() {
  const dispatch = useDispatch();
  
  // Читаем текущее состояние из Redux
  const { currentTool, color } = useSelector((state) => state.toolbar);

  const tools = [
    { id: 'pencil', icon: '✏️', label: 'Карандаш' },
    { id: 'eraser', icon: '🧼', label: 'Ластик' },
    { id: 'text', icon: '🔤', label: 'Текст' },
    { id: 'shape', icon: '⬜', label: 'Фигура' },
  ];

  return (
    <div className={classes.toolbar}>
      {/* Инструменты */}
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`${classes.tool} ${currentTool === tool.id ? classes.active : ''}`}
          onClick={() => dispatch(setTool(tool.id))}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
      
      {/* Выбор цвета */}
      <input
        type="color"
        value={color}
        onChange={(e) => dispatch(setColor(e.target.value))}
        className={classes.colorPicker}
        title="Выбрать цвет"
      />
      
      {/* Кнопка очистки */}
      <button
        className={classes.clear}
        onClick={() => dispatch(clearCanvas())}
        title="Очистить доску"
      >
        🗑️
      </button>
    </div>
  );
}

export default Toolbar;