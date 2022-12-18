import { IAction } from "../action/interfaces";
import { INIT } from "../action/appAction";
import { defaultState, IState, store } from "../store";

export const appReducer = (state: IState, action: IAction) => {
  switch (action.type) {
    case INIT:
      return {
        ...defaultState,
        spec: {
          charts: typeof state === "undefined" ? [] : state.spec.charts,
          animations: [],
        },
      } as IState;
    // case UPDATE_LOADING:
    //     return { ...state, loading: action.payload.infoObj };
    // case UPDATE_MOUSE_MOVING:
    //     return { ...state, mouseMoving: action.payload.flag };
    // case TOGGLE_SYS_TOUCH:
    //     return { ...state, systemTouch: action.payload.flag };
    // case UPDATE_SKETCHING:
    //     if (action.payload.infoObj.isSketching && !store.getState().isPreviewing) {
    //         return { ...state, sketching: action.payload.infoObj, showVideo: false };
    //     }
    //     return { ...state, sketching: action.payload.infoObj };
    // case UPDATE_ACTIVE_SLIDER:
    //     return { ...state, activeSlider: action.payload.infoObj };
  }
};
