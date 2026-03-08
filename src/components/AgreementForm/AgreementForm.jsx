import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleAgreement, submitAgreement } from '../../redux/actions/agreementActions';
import classes from './AgreementForm.module.css';

function AgreementForm() {
  const dispatch = useDispatch();
  
  const { isAccepted, isSubmitted } = useSelector((state) => state.agreement);
  

  const [showSuccess, setShowSuccess] = useState(false);

  const handleCheckboxChange = (e) => {

    dispatch(toggleAgreement(e.target.checked));
  };

  const handleSubmit = () => {
    if (isAccepted) {
      dispatch(submitAgreement());
      setShowSuccess(true);
    }
  };

  if (isSubmitted || showSuccess) {
    return (
      <div className={classes.success}>
        <p>Условия приняты! Совместная работа активирована.</p>
      </div>
    );
  }

  return (
    <div className={classes.form}>
      <h3>Условия совместной работы</h3>
      <p className={classes.text}>
        Нажимая «Начать», вы соглашаетесь на совместное редактирование доски 
        в реальном времени. Все изменения сохраняются и видны другим участникам.
      </p>
      
      <label className={classes.checkboxLabel}>
        <input
          type="checkbox"
          checked={isAccepted}
          onChange={handleCheckboxChange}
          className={classes.checkbox}
        />
        <span>Я принимаю условия</span>
      </label>
      
      <button
        className={`${classes.submitBtn} ${!isAccepted ? classes.disabled : ''}`}
        onClick={handleSubmit}
        disabled={!isAccepted}
      >
        Начать совместную работу
      </button>
    </div>
  );
}

export default AgreementForm;