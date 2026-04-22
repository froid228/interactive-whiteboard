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
          Это онлайн-пространство для совместного обсуждения идей, рисования схем, фиксации заметок
          и визуальной командной работы на общем холсте.
        </p>
      </div>

      <div className={classes.grid}>
        <article className={classes.card}>
          <h3>Основная идея</h3>
          <ul className={classes.list}>
            <li>объединять участников в одном общем рабочем пространстве</li>
            <li>делать обсуждение наглядным за счёт визуального холста</li>
            <li>позволять быстро переходить от идеи к совместной схеме</li>
            <li>давать доступ к доскам только нужным пользователям</li>
          </ul>
        </article>

        <article className={classes.card}>
          <h3>Как используется</h3>
          <ul className={classes.list}>
            <li>для брейнштормов и быстрых командных сессий</li>
            <li>для построения схем, структуры и набросков</li>
            <li>для совместной проработки интерфейсов и архитектуры</li>
            <li>для удалённой работы, где важно видеть действия друг друга сразу</li>
          </ul>
        </article>

        <article className={classes.cardWide}>
          <h3>Почему это удобно</h3>
          <p>
            Вместо разрозненных сообщений и скриншотов команда получает единое визуальное пространство,
            где можно одновременно рисовать, объяснять ход мысли, дополнять идеи и видеть изменения без задержек.
          </p>
          <p>
            Такой формат особенно полезен там, где важно обсуждать не только словами, но и визуально:
            при планировании, проектировании интерфейсов, разборе схем и совместном поиске решений.
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
