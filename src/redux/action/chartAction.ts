import { IAction } from "./interfaces";
import { Animation, TimingSpec } from "canis_toolkit";
import { store } from "../store";
import { IDataItem, ISortDataAttr } from "../global-interfaces";
import { IOrderInfo } from "../../util/markSelection";
import { classifySelection, combineSelectStep } from "../../util/appTool";

export const UPDATE_DEFAULT_CHART_SCALE: string = "UPDATE_DEFAULT_CHART_SCALE";
export const updateDefaultChartScale = (ds: number) => {
  return {
    type: UPDATE_DEFAULT_CHART_SCALE,
    payload: {
      number: ds,
    },
  } as IAction;
};

export const UPDATE_CHART_SCALE: string = "UPDATE_CHART_SCALE";
export const updateChartScale = (cs: number) => {
  return {
    type: UPDATE_CHART_SCALE,
    payload: {
      number: cs,
    },
  } as IAction;
};

export const UPDATE_CHARTS: string = "UPDATE_CHARTS";
export const updateCharts = (c: string[]) => {
  return {
    type: UPDATE_CHARTS,
    payload: {
      array: c,
    },
  } as IAction;
};

export const UPDATE_SELECTION: string = "UPDATE_SELECTION";
export const updateSelection = (mIds: string[]) => {
  mIds = [...new Set(mIds)];
  return {
    type: UPDATE_SELECTION,
    payload: {
      array: mIds,
    },
  } as IAction;
};

export const UPDATE_SELECT_MARKS: string = "UPDATE_SELECT_MARKS";
export const updateSelectMarks = (mIds: string[]) => {
  return {
    type: UPDATE_SELECT_MARKS,
    payload: {
      map: classifySelection(mIds),
    },
  } as IAction;
};

export const UPDATE_SELECT_MARKS_STEP: string = "UPDATE_SELECT_MARKS_STEP";
export const updateSelectMarksStep = (mIds: string[]) => {
  // let allPreviousSelectedMark = store.getState().selectMarksStep;
  // const refSelect: string[][] = combineSelectStep(mIds);
  return {
    type: UPDATE_SELECT_MARKS_STEP,
    payload: {
      array: mIds,
    },
  } as IAction;
};

export const UPDATE_SUGGESTED_MARKS: string = "UPDATE_SUGGESTED_MARKS";
export const updateSuggestedMarks = (sm: string[]) => {
  return {
    type: UPDATE_SUGGESTED_MARKS,
    payload: {
      array: sm,
    },
  } as IAction;
};

export const UPDATE_SELECTION_ORDER: string = "UPDATE_SELECTION_ORDER";
export const updateSelectionOrder = (so: IOrderInfo) => {
  return {
    type: UPDATE_SELECTION_ORDER,
    payload: {
      infoObj: so,
    },
  } as IAction;
};

export const CLEAR_SELECT_MARKS: string = "CLEAR_SELECT_MARKS";
export const clearSelectMarks = () => {
  return {
    type: CLEAR_SELECT_MARKS,
    payload: {
      map: new Map(),
    },
  } as IAction;
};

export const UPDATE_MARKS_TO_CONFIRM: string = "UPDATE_MARKS_TO_CONFIRM";
export const updateMarksToConfirm = (mIds: string[][]) => {
  return {
    type: UPDATE_MARKS_TO_CONFIRM,
    payload: {
      array: mIds,
    },
  } as IAction;
}; //add

export const UPDATE_DATA_ORDER: string = "UPDATE_DATA_ORDER";
export const updateDataOrder = (d: string[]) => {
  return {
    type: UPDATE_DATA_ORDER,
    payload: {
      array: d,
    },
  } as IAction;
}; //add

export const UPDATE_DATA_SORT: string = "UPDATE_DATA_SORT";
export const updateDataSort = (ds: ISortDataAttr[]) => {
  return {
    type: UPDATE_DATA_SORT,
    payload: {
      array: ds,
    },
  } as IAction;
};

export const UPDATE_DATA_TABLE: string = "UPDATE_DATA_TABLE";
export const updateDataTable = (dt: Map<string, IDataItem>) => {
  return {
    type: UPDATE_DATA_TABLE,
    payload: {
      map: dt,
    },
  } as IAction;
};
