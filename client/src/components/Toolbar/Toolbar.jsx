import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearCanvas, setColor, setTool } from '../../redux/actions/toolbarActions';
import classes from './Toolbar.module.css';

function Toolbar({ onClear }) {
  const dispatch = useDispatch();
  const { currentTool, color } = useSelector((state) => state.toolbar);

  const tools = [
    { id: 'pencil', icon: '✏️', label: 'Карандаш', hint: 'Рисование тонкой линией' },
    { id: 'eraser', icon: '🧽', label: 'Ластик', hint: 'Стирание фрагментов' },
    { id: 'text', icon: 'T', label: 'Текст', hint: 'Подготовлено для следующего этапа' },
    { id: 'shape', icon: '▢', label: 'Фигура', hint: 'Подготовлено для следующего этапа' },
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

      <button type="button" className={classes.clear} onClick={handleClear}>
        Очистить доску
      </button>
    </section>
  );
}

export default Toolbar;
