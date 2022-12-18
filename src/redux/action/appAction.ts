import { ICoord, ILoading } from "../global-interfaces";
import Slider from "../views/slider/slider";
import { IAction } from "./interfaces";

export const INIT: string = "INIT";
export const initState = () => {
  return {
    type: INIT,
    payload: {},
  } as IAction;
};

export const UPDATE_LOADING: string = "UPDATE_LOADING";
export const updateLoading = (loadingInfo: ILoading) => {
  return {
    type: UPDATE_LOADING,
    payload: {
      infoObj: loadingInfo,
    },
  } as IAction;
};

export const UPDATE_MOUSE_MOVING: string = "UPDATE_MOUSE_MOVING";
export const updateMouseMoving = (m: boolean) => {
  return {
    type: UPDATE_MOUSE_MOVING,
    payload: {
      flag: m,
    },
  } as IAction;
};

export const TOGGLE_SYS_TOUCH: string = "TOGGLE_SYS_TOUCH";
export const toggleSystemTouch = (st: boolean) => {
  return {
    type: TOGGLE_SYS_TOUCH,
    payload: {
      flag: st,
    },
  } as IAction;
};

export const UPDATE_SKETCHING: string = "UPDATE_SKETCHING";
export const updateSketching = (s: {
  isSketching: boolean;
  startCoord: ICoord;
}) => {
  return {
    type: UPDATE_SKETCHING,
    payload: {
      infoObj: s,
    },
  } as IAction;
};

export const UPDATE_ACTIVE_SLIDER: string = "UPDATE_ACTIVE_SLIDER";
export const updateActiveSlider = (s: Slider) => {
  return {
    type: UPDATE_ACTIVE_SLIDER,
    payload: {
      infoObj: s,
    },
  } as IAction;
};
