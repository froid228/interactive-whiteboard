import React from 'react';
import { Link } from 'react-router-dom';
import BoardCard from '../../components/BoardCard/BoardCard';
import classes from './Home.module.css';

function Home() {
  const boards = [
    { id: 1, title: 'Математика', lastModified: '2024-01-15' },
    { id: 2, title: 'Схема архитектуры', lastModified: '2024-01-14' },
    { id: 3, title: 'Идеи для курсовой', lastModified: '2024-01-13' },
  ];

  return (
    <div className={classes.home}>
      <h1 className={classes.homeTitle}>Ваши доски</h1>
      
      <div className={classes.grid}>
        {boards.map(board => (
          <BoardCard
            key={board.id}
            id={board.id}
            title={board.title}
            lastModified={board.lastModified}
          />
        ))}
      </div>
      
      <div className={classes.actions}>
        <Link to="/about" className={classes.link}>О проекте</Link>
      </div>
    </div>
  );
}

export default Home;