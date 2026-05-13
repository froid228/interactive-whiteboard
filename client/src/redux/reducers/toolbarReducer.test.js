import toolbarReducer from './toolbarReducer';
import { setTool } from '../actions/toolbarActions';

test('sets selection tool for object editing', () => {
  const nextState = toolbarReducer(undefined, setTool('select'));

  expect(nextState.currentTool).toBe('select');
});
