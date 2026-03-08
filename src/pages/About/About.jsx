import React from 'react';
import { Link } from 'react-router-dom';
import classes from './About.module.css'; // ← Добавлен импорт CSS Module

function About() {
  return (
    <div className={classes.about}>
      <h1 className={classes.aboutTitle}>О проекте</h1>
      <p className={classes.aboutText}>
        Интерактивная доска для совместной работы в реальном времени.
        Приложение позволяет нескольким пользователям одновременно 
        рисовать, добавлять заметки и обмениваться идеями.
      </p>
      
      <section className={classes.features}>
        <h3 className={classes.featuresTitle}>Возможности:</h3>
        <ul className={classes.featuresList}>
          <li>🎨 Рисование в реальном времени</li>
          <li>👥 Совместная работа нескольких пользователей</li>
          <li>💾 Сохранение и загрузка досок</li>
          <li>🔧 Набор инструментов: карандаш, ластик, цвета</li>
        </ul>
      </section>
      
      <Link to="/" className={classes.homeLink}>
        На главную
      </Link>
    </div>
  );
}

export default About;