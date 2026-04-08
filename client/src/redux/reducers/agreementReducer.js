import { TOGGLE_AGREEMENT, SUBMIT_AGREEMENT } from '../actions/agreementActions';

const initialState = {
  isAccepted: false,
  isSubmitted: false,
};

const agreementReducer = (state = initialState, action) => {
  switch (action.type) {
    case TOGGLE_AGREEMENT:
      return { ...state, isAccepted: action.payload };
    
    case SUBMIT_AGREEMENT:
      if (state.isAccepted) {
        return { ...state, isSubmitted: true };
      }
      return state;
    
    default:
      return state;
  }
};

export default agreementReducer;