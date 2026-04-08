import { SET_TOOL, SET_COLOR, CLEAR_CANVAS } from '../actions/toolbarActions';

// Начальное состояние
const initialState = {
  currentTool: 'pencil',
  color: '#000000',
  brushSize: 3,
};

// Чистая функция-редьюсер (не мутирует state, возвращает новый объект)
const toolbarReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_TOOL:
      return { ...state, currentTool: action.payload };
    
    case SET_COLOR:
      return { ...state, color: action.payload };
    
    case CLEAR_CANVAS:
      // Здесь можно добавить логику очистки canvas
      return state;
    
    default:
      return state; // Если действие неизвестно — возвращаем состояние без изменений
  }
};

export default toolbarReducer;