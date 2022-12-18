import { IAction } from "../action/interfaces";
import {
  toggleVideoMode,
  TOGGLE_VIDEO_MODE,
  UPDATE_LOTTIE_ANI,
  UPDATE_LOTTIE_SPEC,
  UPDATE_PREVIEWING,
  UPDATE_PREVIEW_PATH,
  UPDATE_PREVIEW_SPEC,
  UPDATE_SUGGEST_SPECS,
} from "../action/videoAction";
import { IState, store } from "../store";

export const videoReducer = (state: IState, action: IAction) => {
  switch (action.type) {
    case TOGGLE_VIDEO_MODE:
      return { ...state, showVideo: action.payload.flag };
    case UPDATE_LOTTIE_ANI:
      return { ...state, lottieAni: action.payload.infoObj };
    case UPDATE_LOTTIE_SPEC:
      return { ...state, lottieSpec: action.payload.infoObj };
    case UPDATE_PREVIEW_PATH:
      return { ...state, previewPath: action.payload.infoObj };
    case UPDATE_PREVIEW_SPEC:
      return { ...state, previewSpec: action.payload.infoObj };
    case UPDATE_PREVIEWING:
      const actionInfo: any = action.payload.infoObj;
      // if (store.getState().isPreviewing !== actionInfo.preview) {
      if (actionInfo.switchSpec) {
        return {
          ...state,
          isPreviewing: actionInfo.preview,
          previewPath: actionInfo.previewPath,
          previewSpec: actionInfo.previewSpec,
        };
      }
      !actionInfo.preview &&
        state.showVideo &&
        store.dispatchSystem(toggleVideoMode(false));
      // console.log('going to toggle video mode: ', actionInfo.preview)
      // store.dispatchSystem(toggleVideoMode(actionInfo.preview))
      // }
      return state;
    case UPDATE_SUGGEST_SPECS:
      return { ...state, suggestSpecs: action.payload.array };
  }
};
