import React from 'react';
import classes from './ToastContainer.module.css';

function ToastContainer({ items }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className={classes.notifications} aria-live="polite">
      {items.map((item) => (
        <div
          key={item.id}
          className={`${classes.notification} ${
            item.tone === 'success'
              ? classes.notificationSuccess
              : item.tone === 'danger'
                ? classes.notificationDanger
                : classes.notificationInfo
          }`}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
