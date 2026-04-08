import React from 'react';
import { Link } from 'react-router-dom';
import AgreementForm from '../../components/AgreementForm/AgreementForm';
import classes from './Settings.module.css';

function Settings() {
  return (
    <div className={classes.settings}>
      <header className={classes.header}>
        <Link to="/" className={classes.backLink}>← На главную</Link>
        <h2>Настройки совместной работы</h2>
      </header>
      
      <main className={classes.content}>
        <AgreementForm />
        
        <section className={classes.info}>
          <h3>Как это работает?</h3>
          <ul>
            <li>Выберите инструмент на панели</li>
            <li>Пригласите коллег по ссылке</li>
            <li>Рисуйте вместе в реальном времени</li>
            <li>Все изменения сохраняются автоматически</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default Settings;