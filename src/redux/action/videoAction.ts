import { AnimationItem } from "lottie-web";
import { ICanisSpec } from "../../app/core/canisGenerator";
import { IAttrAndSpec, IPath } from "../global-interfaces";
import { IAction } from "./interfaces";

export const TOGGLE_VIDEO_MODE: string = "TOGGLE_VIDEO_MODE";
export const toggleVideoMode = (p: boolean) => {
  return {
    type: TOGGLE_VIDEO_MODE,
    payload: {
      flag: p,
    },
  } as IAction;
};

export const UPDATE_LOTTIE_ANI: string = "UPDATE_LOTTIE_ANI";
export const updateLottieAni = (la: AnimationItem) => {
  return {
    type: UPDATE_LOTTIE_ANI,
    payload: {
      infoObj: la,
    },
  } as IAction;
};

export const UPDATE_LOTTIE_SPEC: string = "UPDATE_LOTTIE_SPEC";
export const updateLottieSpec = (ls: any) => {
  return {
    type: UPDATE_LOTTIE_SPEC,
    payload: {
      infoObj: ls,
    },
  } as IAction;
};

export const UPDATE_PREVIEWING: string = "UPDATE_PREVIEWING";
export const updatePreviewing = (
  previewPath: IPath,
  previewSpec: ICanisSpec,
  preview: boolean,
  switchSpec: boolean
) => {
  console.trace("dispathcing update previewing: ", preview);
  return {
    type: UPDATE_PREVIEWING,
    payload: {
      infoObj: {
        previewPath: previewPath,
        previewSpec: previewSpec,
        preview: preview,
        switchSpec: switchSpec,
      },
    },
  } as IAction;
};

export const UPDATE_PREVIEW_PATH: string = "UPDATE_PREVIEW_PATH";
export const updatePreviewPath = (p: IPath) => {
  return {
    type: UPDATE_PREVIEW_PATH,
    payload: {
      infoObj: p,
    },
  } as IAction;
};

export const UPDATE_PREVIEW_SPEC: string = "UPDATE_PREVIEW_SPEC";
export const updatePreviewSpec = (s: ICanisSpec) => {
  return {
    type: UPDATE_PREVIEW_SPEC,
    payload: {
      infoObj: s,
    },
  } as IAction;
};

export const UPDATE_SUGGEST_SPECS: string = "UPDATE_SUGGEST_SPECS";
export const updateSuggestSpecs = (ss: IAttrAndSpec[]) => {
  return {
    type: UPDATE_SUGGEST_SPECS,
    payload: {
      array: ss,
    },
  } as IAction;
};
