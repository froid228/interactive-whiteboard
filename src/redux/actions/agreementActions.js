export const TOGGLE_AGREEMENT = 'TOGGLE_AGREEMENT';
export const SUBMIT_AGREEMENT = 'SUBMIT_AGREEMENT';

export const toggleAgreement = (isChecked) => ({
  type: TOGGLE_AGREEMENT,
  payload: isChecked,
});

export const submitAgreement = () => ({
  type: SUBMIT_AGREEMENT,
});