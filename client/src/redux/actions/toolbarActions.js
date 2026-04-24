// Типы действий (константы)
export const SET_TOOL = 'SET_TOOL';
export const SET_COLOR = 'SET_COLOR';
export const SET_BRUSH_SIZE = 'SET_BRUSH_SIZE';
export const CLEAR_CANVAS = 'CLEAR_CANVAS';

// Action creators — функции, создающие действия
export const setTool = (tool) => ({
  type: SET_TOOL,
  payload: tool, // 'pencil', 'eraser', 'text', etc.
});

export const setColor = (color) => ({
  type: SET_COLOR,
  payload: color, // '#ff0000', '#00ff00', etc.
});

export const setBrushSize = (size) => ({
  type: SET_BRUSH_SIZE,
  payload: size,
});

export const clearCanvas = () => ({
  type: CLEAR_CANVAS,
});
