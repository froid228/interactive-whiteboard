import React from 'react';
import { Link } from 'react-router-dom';
import classes from './About.module.css';

function About() {
  return (
    <section className={classes.about}>
      <div className={classes.hero}>
        <p className={classes.kicker}>О проекте</p>
        <h1 className={classes.title}>Интерактивная доска для совместной работы в реальном времени</h1>
        <p className={classes.lead}>
          Приложение создано как курсовой fullstack-проект: у него есть клиент, сервер, база данных,
          авторизация, роли пользователей и синхронизация рисования через websocket-события.
        </p>
      </div>

      <div className={classes.grid}>
        <article className={classes.card}>
          <h3>Что умеет система</h3>
          <ul className={classes.list}>
            <li>авторизация через backend API и JWT</li>
            <li>создание и хранение досок в PostgreSQL</li>
            <li>совместное рисование в одной комнате</li>
            <li>распределение доступа между участниками</li>
          </ul>
        </article>

        <article className={classes.card}>
          <h3>Технологический стек</h3>
          <ul className={classes.list}>
            <li>React + Redux на клиенте</li>
            <li>Node.js + Express на сервере</li>
            <li>Socket.IO для realtime-синхронизации</li>
            <li>PostgreSQL и Docker для инфраструктуры</li>
          </ul>
        </article>

        <article className={classes.cardWide}>
          <h3>Зачем это полезно</h3>
          <p>
            Такой формат подходит для брейнштормов, обсуждения схем, коллективной подготовки архитектуры
            и демонстрации того, как в одном проекте соединяются клиент, сервер, база данных и работа в реальном времени.
          </p>
          <div className={classes.actions}>
            <Link to="/" className={classes.primaryLink}>
              Перейти к доскам
            </Link>
            <Link to="/login" className={classes.secondaryLink}>
              Войти в систему
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

export default About;
