import { IAnimationSpec } from "../../app/core/canisGenerator";
import { store } from "../store";
import { IAction } from "./interfaces";

export const UPDATE_SPEC_CHARTS: string = "UPDATE_SPEC_CHARTS";
export const updateSpecCharts = (cs: string[]) => {
  return {
    type: UPDATE_SPEC_CHARTS,
    payload: {
      array: cs,
    },
  } as IAction;
};

export const UPDATE_SPEC_ANIMATIONS: string = "UPDATE_SPEC_ANIMATIONS";
export const updateSpecAnimations = (
  animationSpec: IAnimationSpec[] | string
) => {
  return {
    type: UPDATE_SPEC_ANIMATIONS,
    payload: {
      array:
        typeof animationSpec === "string"
          ? JSON.parse(animationSpec)
          : animationSpec,
    },
  } as IAction;
};

export const RESET_SPEC: string = "RESET_SPEC";
export const resetSpec = () => {
  return {
    type: RESET_SPEC,
    payload: {
      infoObj: {
        charts:
          typeof store.getState().spec === "undefined"
            ? []
            : store.getState().spec.charts,
        animations: [],
      },
    },
  } as IAction;
};

export const UPDATE_ANI_OFFSET: string = "UPDATE_ANI_OFFSET";
export const updateAniOffset = (aniId: string, offset: number) => {
  return {
    type: UPDATE_ANI_OFFSET,
    payload: {
      infoObj: {
        aniId: aniId,
        offset: offset,
      },
    },
  } as IAction;
};

export const UPDATE_EFFECT_TYPE: string = "UPDATE_EFFECT_TYPE";
export const updateEffectType = (aniIds: string[], effectPropValue: string) => {
  return {
    type: UPDATE_EFFECT_TYPE,
    payload: {
      infoObj: {
        aniIds: aniIds,
        effectPropValue: effectPropValue,
      },
    },
  } as IAction;
};

export const UPDATE_DURATION: string = "UPDATE_DURATION";
export const updateDuration = (aniId: string, duration: number) => {
  return {
    type: UPDATE_DURATION,
    payload: {
      infoObj: {
        aniId: aniId,
        duration: duration,
      },
    },
  } as IAction;
};

export const UPDATE_EFFECT_AND_DURATION: string = "UPDATE_EFFECT_AND_DURATION";
export const updateEffectAndDuration = (
  aniIds: string[],
  effect: string,
  duration: number
) => {
  return {
    type: UPDATE_EFFECT_AND_DURATION,
    payload: {
      infoObj: {
        aniIds: aniIds,
        effect: effect,
        duration: duration,
      },
    },
  } as IAction;
};

export const UPDATE_DELAY_BETWEEN_KF: string = "UPDATE_DELAY_BETWEEN_KF";
export const REMOVE_DELAY_BETWEEN_KF: string = "REMOVE_DELAY_BETWEEN_KF";
export const UPDATE_KF_TIMING_REF: string = "UPDATE_KF_TIMING_REF";
export const UPDATE_TIMING_REF_DELAY_KF: string = "UPDATE_TIMING_REF_DELAY_KF";
export const REMOVE_LOWESTGROUP: string = "REMOVE_LOWESTGROUP";
export const UPDATE_ALIGN_MERGE: string = "UPDATE_ALIGN_MERGE";

export const UPDATE_DELAY_BETWEEN_GROUP: string = "UPDATE_DELAY_BETWEEN_GROUP";
export const UPDATE_DELAY_TIMING_REF_BETWEEN_GROUP: string =
  "UPDATE_DELAY_TIMING_REF_BETWEEN_GROUP";
export const UPDATE_TIMEING_REF_BETWEEN_GROUP: string =
  "UPDATE_TIMEING_REF_BETWEEN_GROUP";
export const REMOVE_DELAY_BETWEEN_GROUP: string = "REMOVE_DELAY_BETWEEN_GROUP";
export const REMOVE_DELAY_UPDATE_TIMING_REF_GROUP: string =
  "REMOVE_DELAY_UPDATE_TIMING_REF_GROUP";
export const MERGE_GROUP: string = "MERGE_GROUP";

export const SPLIT_CREATE_ONE_ANI: string = "SPLIT_CREATE_ONE_ANI";
export const REMOVE_CREATE_MULTI_ANI: string = "REMOVE_CREATE_MULTI_ANI";
export const UPDATE_SPEC_GROUPING: string = "UPDATE_SPEC_GROUPING";
export const REMOVE_SPEC_GROUPING: string = "REMOVE_SPEC_GROUPING";
export const SPLIT_CREATE_MULTI_ANI: string = "SPLIT_CREATE_MULTI_ANI";
export const SPLIT_DATA_NONDATA_ANI: string = "SPLIT_DATA_NONDATA_ANI";
export const APPEND_SPEC_GROUPING: string = "APPEND_SPEC_GROUPING";

export const UPDATE_ANI_ALIGN_AFTER_ANI_WITH_DELAY: string =
  "UPDATE_ANI_ALIGN_AFTER_ANI_WITH_DELAY";
export const UPDATE_ANI_ALIGN_AFTER_ANI: string = "UPDATE_ANI_ALIGN_AFTER_ANI";
export const UPDATE_ANI_ALIGN_WITH_ANI: string = "UPDATE_ANI_ALIGN_WITH_ANI";
export const UPDATE_ANI_ALIGN_AFTER_KF: string = "UPDATE_ANI_ALIGN_AFTER_KF";
export const UPDATE_ANI_ALIGN_WITH_KF: string = "UPDATE_ANI_ALIGN_WITH_KF";
