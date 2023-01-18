import Util from "../../app/core/util";
import { classifySelection, combineSelectStep } from "../../util/appTool";
import { scaleChartContent } from "../../util/tool";
import {
  UPDATE_CHARTS,
  UPDATE_CHART_SCALE,
  UPDATE_DEFAULT_CHART_SCALE,
  UPDATE_SELECT_MARKS,
  UPDATE_SELECTION,
  UPDATE_DATA_SORT,
  UPDATE_DATA_TABLE,
  CLEAR_SELECT_MARKS,
  UPDATE_SUGGESTED_MARKS,
  UPDATE_SELECTION_ORDER,
  UPDATE_DATA_ORDER,
  UPDATE_MARKS_TO_CONFIRM,
  UPDATE_SELECT_MARKS_STEP,
  UPDATE_SELECTION_FAKE,
  UPDATE_SELECT_MARKS_STEP_FAKE,
} from "../action/chartAction";
import { IAction } from "../action/interfaces";
import { IState } from "../store";

export const chartReducer = (state: IState, action: IAction) => {
  switch (action.type) {
    case UPDATE_DEFAULT_CHART_SCALE:
      return { ...state, defaultChartScaleRatio: action.payload.number };
    case UPDATE_CHART_SCALE:
      scaleChartContent(action.payload.number);
      return { ...state, chartScaleRatio: action.payload.number };
    case UPDATE_CHARTS:
      return { ...state, charts: action.payload.array };
    case UPDATE_SELECTION:
      return {
        ...state,
        selection: action.payload.array,
        selectMarks: classifySelection(action.payload.array),
      };
    case UPDATE_SELECTION_FAKE:
      return {
        ...state,
        selectionfake: action.payload.array,
        selectMarksfake: classifySelection(action.payload.array),
      };
    case UPDATE_SELECT_MARKS:
    case CLEAR_SELECT_MARKS:
      return { ...state, selectMarks: action.payload.map };
    case UPDATE_SELECTION_ORDER:
      return { ...state, selectionOrder: action.payload.infoObj };
    case UPDATE_SUGGESTED_MARKS:
      return { ...state, suggestedMarks: action.payload.array };
    case UPDATE_MARKS_TO_CONFIRM:
      return { ...state, marksToConfirm: action.payload.array };
    case UPDATE_DATA_ORDER:
      return { ...state, dataOrder: action.payload.array };
    case UPDATE_DATA_SORT:
      return {
        ...state,
        sortDataAttrs: Util.filterDataSort(action.payload.array),
      };
    case UPDATE_DATA_TABLE:
      return { ...state, dataTable: action.payload.map };
    case UPDATE_SELECT_MARKS_STEP:
      const newSelectMarksStep = combineSelectStep(
        state.selectMarksStep,
        action.payload.array
      );
      return { ...state, selectMarksStep: newSelectMarksStep };
    case UPDATE_SELECT_MARKS_STEP_FAKE:
      const newSelectMarksStepFake = combineSelectStep(
        state.selectMarksStepFake,
        action.payload.array
      );
      return { ...state, selectMarksStepFake: newSelectMarksStepFake };
  }
};
