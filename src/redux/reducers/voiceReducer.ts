import { IAction } from "../action/interfaces";
import { TOGGLE_VOICE } from "../action/voiceAction";
import { IState } from "../store";

export const voiceReducer = (state: IState, action: IAction) => {
  switch (action.type) {
    case TOGGLE_VOICE:
      return { ...state, voiceAwake: action.payload.flag };
  }
};
