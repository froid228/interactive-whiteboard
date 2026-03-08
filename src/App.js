import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Импорт страниц
import Home from './pages/Home/Home';
import Board from './pages/Board/Board';
import About from './pages/About/About';
import Messages from './pages/Messages/Messages';
import Login from './pages/Login/Login';
import Settings from './pages/Settings/Settings'; // ← Добавьте этот импорт

// Импорт компонентов
import Header from './components/Header/Header';
import Toolbar from './components/Toolbar/Toolbar';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <Toolbar />
        
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          
          {/* ← Добавьте этот маршрут */}
          <Route path="/settings" element={<Settings />} />
          
          {/* Защищённые маршруты */}
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
              <ProtectedRoute requiredRights={['can_view_boards', 'can_edit_boards']}>
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