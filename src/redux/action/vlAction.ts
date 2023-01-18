import KfItem from "../views/vl/kfItem";
import { IActivatePlusBtn, ISize } from "../global-interfaces";
import { IAction } from "./interfaces";


export const UPDATE_KEYFRAME_TRACKS: string = "UPDATE_KEYFRAME_TRACKS";
export const updateKfTracks = (kt: Map<string, any>) => {
  return {
    type: UPDATE_KEYFRAME_TRACKS,
    payload: {
      map: kt,
    },
  } as IAction;
};

export const UPDATE_ACTIVATE_PLUS_BTN: string = "UPDATE_ACTIVATE_PLUS_BTN";
export const updateActivatePlusBtn = (apb: IActivatePlusBtn) => {
  return {
    type: UPDATE_ACTIVATE_PLUS_BTN,
    payload: {
      infoObj: apb,
    },
  } as IAction;
};

export const UPDATE_HIGHLIGHT_KF: string = "UPDATE_HIGHLIGHT_KF";
export const updateHighlightKf = (hkf: KfItem) => {
  return {
    type: UPDATE_HIGHLIGHT_KF,
    payload: {
      infoObj: hkf,
    },
  } as IAction;
};

export const UPDATE_KF_ZOOM_LEVEL: string = "UPDATE_KF_ZOOM_LEVEL";
export const updateKfZoomLevel = (zl: number) => {
  return {
    type: UPDATE_KF_ZOOM_LEVEL,
    payload: {
      number: zl,
    },
  } as IAction;
};

export const UPDATE_KFGROUP_SIZE: string = "UPDATE_KFGROUP_SIZE";
export const updateKfGroupSize = (s: ISize) => {
  return {
    type: UPDATE_KFGROUP_SIZE,
    payload: {
      infoObj: s,
    },
  } as IAction;
};
