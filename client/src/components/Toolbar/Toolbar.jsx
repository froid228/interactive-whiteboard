import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearCanvas, setBrushSize, setColor, setTool } from '../../redux/actions/toolbarActions';
import classes from './Toolbar.module.css';

function Toolbar({ onClear }) {
  const dispatch = useDispatch();
  const { currentTool, color, brushSize } = useSelector((state) => state.toolbar);

  const tools = [
    { id: 'pencil', icon: '✏️', label: 'Карандаш', hint: 'Рисование тонкой линией' },
    { id: 'eraser', icon: '🧽', label: 'Ластик', hint: 'Стирание фрагментов' },
    { id: 'text', icon: 'T', label: 'Текст', hint: 'Добавление текста по клику на холст' },
    { id: 'rectangle', icon: '▢', label: 'Прямоугольник', hint: 'Нарисовать прямоугольную фигуру' },
    { id: 'circle', icon: '◯', label: 'Круг', hint: 'Нарисовать круг или эллипс' },
    { id: 'line', icon: '／', label: 'Линия', hint: 'Нарисовать прямую линию' },
    { id: 'arrow', icon: '↗', label: 'Стрелка', hint: 'Нарисовать стрелку' },
  ];

  const handleClear = () => {
    dispatch(clearCanvas());
    onClear?.();
  };

  return (
    <section className={classes.toolbar}>
      <div className={classes.group}>
        <span className={classes.groupLabel}>Инструменты</span>
        <div className={classes.toolGrid}>
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={`${classes.tool} ${currentTool === tool.id ? classes.active : ''}`}
              onClick={() => dispatch(setTool(tool.id))}
              title={tool.hint}
            >
              <span className={classes.toolIcon}>{tool.icon}</span>
              <span className={classes.toolLabel}>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={classes.group}>
        <span className={classes.groupLabel}>Цвет линии</span>
        <label className={classes.colorBlock}>
          <span className={classes.colorPreview} style={{ backgroundColor: color }} />
          <input
            type="color"
            value={color}
            onChange={(event) => dispatch(setColor(event.target.value))}
            className={classes.colorPicker}
            title="Выбрать цвет"
          />
        </label>
      </div>

      <div className={classes.group}>
        <span className={classes.groupLabel}>Толщина</span>
        <div className={classes.sizeBlock}>
          <input
            type="range"
            min="2"
            max="18"
            step="1"
            value={brushSize}
            onChange={(event) => dispatch(setBrushSize(Number(event.target.value)))}
            className={classes.sizeSlider}
          />
          <span className={classes.sizeValue}>{brushSize}px</span>
        </div>
      </div>

      <button type="button" className={classes.clear} onClick={handleClear}>
        Очистить доску
      </button>
    </section>
  );
}

export default Toolbar;
