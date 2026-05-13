import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { settingsAPI } from '../../api/boards';
import { useNotifications } from '../../context/NotificationContext';
import classes from './Settings.module.css';

const DEFAULT_SETTINGS = {
  collaborationEnabled: true,
  allowGuestRegistration: true,
  autosaveIntervalSec: 5,
  maxBoardTitleLength: 120,
};

function Settings() {
  const user = useSelector((state) => state.auth.user);
  const { notify } = useNotifications();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      setLoading(true);
      try {
        const data = await settingsAPI.getSettings();
        if (!cancelled) {
          setSettings({ ...DEFAULT_SETTINGS, ...data });
        }
      } catch (error) {
        if (!cancelled) {
          notify(error.message, 'danger');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [notify]);

  const updateField = (field, value) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await settingsAPI.updateSettings(settings);
      setSettings({ ...DEFAULT_SETTINGS, ...updated });
      notify('Настройки сохранены', 'success');
    } catch (error) {
      notify(error.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={classes.settings}>
      <header className={classes.header}>
        <Link to="/" className={classes.backLink}>← На главную</Link>
        <h2>Настройки совместной работы</h2>
        <p>Системные параметры хранятся на сервере и применяются для всех пользователей.</p>
      </header>

      <main className={classes.content}>
        <section className={classes.form}>
          {loading ? <p className={classes.text}>Загрузка настроек...</p> : null}

          <label className={classes.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.collaborationEnabled}
              onChange={(event) => updateField('collaborationEnabled', event.target.checked)}
              disabled={!isAdmin || saving}
              className={classes.checkbox}
            />
            <span>Совместное редактирование включено</span>
          </label>

          <label className={classes.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.allowGuestRegistration}
              onChange={(event) => updateField('allowGuestRegistration', event.target.checked)}
              disabled={!isAdmin || saving}
              className={classes.checkbox}
            />
            <span>Разрешить регистрацию новых пользователей</span>
          </label>

          <label className={classes.fieldLabel}>
            <span>Интервал автосохранения snapshot, сек.</span>
            <input
              type="number"
              min="2"
              max="60"
              value={settings.autosaveIntervalSec}
              onChange={(event) => updateField('autosaveIntervalSec', Number(event.target.value))}
              disabled={!isAdmin || saving}
              className={classes.numberInput}
            />
          </label>

          <label className={classes.fieldLabel}>
            <span>Максимальная длина названия доски</span>
            <input
              type="number"
              min="20"
              max="120"
              value={settings.maxBoardTitleLength}
              onChange={(event) => updateField('maxBoardTitleLength', Number(event.target.value))}
              disabled={!isAdmin || saving}
              className={classes.numberInput}
            />
          </label>

          <button
            type="button"
            className={`${classes.submitBtn} ${!isAdmin ? classes.disabled : ''}`}
            onClick={handleSave}
            disabled={!isAdmin || saving}
          >
            {saving ? 'Сохранение...' : isAdmin ? 'Сохранить настройки' : 'Только для администратора'}
          </button>
        </section>

        <section className={classes.info}>
          <h3>Текущее состояние</h3>
          <ul>
            <li>Совместная работа: {settings.collaborationEnabled ? 'включена' : 'выключена'}</li>
            <li>Регистрация: {settings.allowGuestRegistration ? 'разрешена' : 'закрыта'}</li>
            <li>Автосохранение: каждые {settings.autosaveIntervalSec} сек.</li>
            <li>Лимит названия: {settings.maxBoardTitleLength} символов</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default Settings;
