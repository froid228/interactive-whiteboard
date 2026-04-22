import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Home from './pages/Home/Home';
import Board from './pages/Board/Board';
import About from './pages/About/About';
import Messages from './pages/Messages/Messages';
import Login from './pages/Login/Login';
import Settings from './pages/Settings/Settings';
import Header from './components/Header/Header';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { loadProfile } from './redux/actions/authActions';
import './App.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadProfile());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <div className="AppShell">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/board/:id"
            element={
              <ProtectedRoute requiredRights={['can_view_boards']}>
                <Board />
              </ProtectedRoute>
            }
          />
          <Route
            path="/board/:boardId/messages"
            element={
              <ProtectedRoute requiredRights={['can_view_boards']}>
                <Messages />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
