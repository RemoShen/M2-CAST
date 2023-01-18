import { IAction } from "./action/interfaces";
import { initState } from "./action/appAction";
import { reducer } from "./reducers/reducer";
import {
  IActivatePlusBtn,
  IAttrAndSpec,
  IDataItem,
  IKeyframeGroup,
  IPath,
  ISize,
  ISortDataAttr,
} from "./global-interfaces";
import { renderer } from "./renderers/renderer";
import { jsTool } from "../util/jsTool";
import { ICanisSpec } from "../app/core/canisGenerator";
import { AnimationItem } from "lottie-web";
import Util from "../app/core/util";
import KfItem from "./views/vl/kfItem";
import KfGroup from "./views/vl/kfGroup";
import KfTrack from "./views/vl/kfTrack";
import PlusBtn from "./views/vl/plusBtn";
import IntelliRefLine from "./views/vl/intelliRefLine";
import Slider from "./views/slider/slider";
import SuggestAniFrame from "./views/panels/suggestAniFrame";
import { Animation, ChartSpec, ActionSpec, TimingSpec } from "canis_toolkit";
import Suggest from "../app/core/suggest";
import { IOrderInfo, RANDOM_ORDER } from "../util/markSelection";

const SHOW_VIDEO: string = "showVideo";
const SELECTION: string = "selection";
const SELECT_MARKS: string = "selectMarks";
const SELECTION_FAKE: string = "selectionFake";
const SELECT_MARKS_FAKE: string = "selectMarksFake";
const SELECT_MARKS_STEP: string = "selectMarksStep";
const SELECT_MARKS_STEP_FAKE: string = "selectMarksStepFake";
const SPEC: string = "spec";
const SORT_DATA_ATTRS: string = "sortDataAttrs";
const LOTTIE_SPEC: string = "lottieSpec";
const KEYFRAME_GROUPS: string = "keyframeGroups";
const ACTIVATE_PLUS_BTN: string = "activatePlusBtn";
const HIGHLIGHT_KF: string = "highlightKf";
const KF_ZOOM_LEVEL: string = "kfZoomLevel";
const KF_GROUP_SIZE: string = "kfGroupSize";
const IS_PREVIEWING: string = "isPreviewing";
const SUGGESTED_MARKS: string = "suggestedMarks";
const SUGGEST_SPECS: string = "suggestSpecs";
export interface IState {
  defaultChartScaleRatio: number;
  chartScaleRatio: number;
  dataTable?: Map<string, IDataItem>;
  lottieAni?: AnimationItem;
  isMouseMoving: boolean;
  previewPath?: IPath;
  previewSpec?: ICanisSpec;
  selectionOrder: IOrderInfo;
  suggestSpecs?: IAttrAndSpec[];

  //need listeners
  showVideo: boolean;
  charts?: string[];
  selection?: string[]; //marks already selected
  selectionfake?: string[]
  selectMarks?: Map<string, string[]>;
  selectMarksfake?: Map<string, string[]>;
  selectMarksStep: string[][];
  selectMarksStepFake: string[][];
  suggestedMarks?: string[];
  marksToConfirm: string[][];
  spec: ICanisSpec;
  sortDataAttrs?: ISortDataAttr[];
  lottieSpec?: any;

  keyframeGroups?: IKeyframeGroup[]; //each keyframe group correspond to one root from one aniunit
  activatePlusBtn?: IActivatePlusBtn;
  highlightKf?: {
    previousHighlightKf: KfItem;
    currentHighlightKf: KfItem;
  };
  kfZoomLevel?: number;
  kfGroupSize?: ISize;

  isPreviewing?: boolean;
}

interface IHistory {
  currentStateIdx: number;
  historyStates: {
    state: IState;
    [additionalStaticInformation: string]: any;
  }[];
}

export const defaultState: IState = {
  defaultChartScaleRatio: 1,
  chartScaleRatio: 1,
  selectMarksStep: [], //
  selectMarksStepFake: [],
  showVideo: false,
  isMouseMoving: false,
  marksToConfirm: [],
  spec: { charts: [], animations: [] },
  selectionOrder: { type: RANDOM_ORDER, correspondSelection: [] },
  kfZoomLevel: 1,
};

let initHistory: any;

class Store {
  systemChanging: boolean = false;
  private state: IState;
  private continiousUndo: boolean = false;
  private history: IHistory;
  private reducer: any;
  private listeners: Map<string, any>;

  private additionalStaticMapping = Object.entries({
    KfItem,
    KfGroup,
    Suggest,
    KfTrack,
    PlusBtn,
    IntelliRefLine,
    SuggestAniFrame,
    Animation,
    ChartSpec,
    ActionSpec,
    TimingSpec,
    Slider,
    Util,
  });

  constructor(reducer: any) {

    this.history = {
      currentStateIdx: -1, //always correspond to the current state (current view)
      historyStates: [],
    };
    this.reducer = reducer;
    this.listeners = new Map();
    this.dispatch(initState());
    this.subscribeAttrs();
  }

  public getState(): IState {
    return this.state;
  }

  public undoState(): void {
    if (!this.continiousUndo) {
      this.saveState();
    }
    this.systemChanging = true;
    this.history.currentStateIdx -= 1;
    if (this.history.currentStateIdx >= 0) {
      const targetState =
        this.history.historyStates[this.history.currentStateIdx];
      console.log("undo state: ", targetState);
      for (let [className, cls] of this.additionalStaticMapping) {
        const statics = targetState[className];
        Object.entries<any>(statics).forEach(([k, v]) => {
          (cls as any)[k] = jsTool.deepClone(v, false, true);
        });
      }
      this.renderState(targetState.state);
    } else {
      this.history.currentStateIdx++;
    }

    this.continiousUndo = true;
    console.log("history stack: ", this.history);

    setTimeout(() => {
      const targetState =
        this.history.historyStates[this.history.currentStateIdx];
      for (let [className, cls] of this.additionalStaticMapping) {
        const statics = targetState[className];
        Object.entries<any>(statics).forEach(([k, v]) => {
          (cls as any)[k] = jsTool.deepClone(v);
        });
      }
      this.systemChanging = false;
      renderer.updateLottieSpec();
      renderer.scaleChartContent();
      targetState.state.selectMarks?.forEach((value, key) => {
        value.forEach((markId) => {
          document.getElementById(markId).setAttribute("opacity", "0.3");
        });
      });
    }, 0);
  }

  public redoState(): void {
    this.systemChanging = true;
    this.history.currentStateIdx += 1;
    const targetState =
      this.history.historyStates[this.history.currentStateIdx];
    if (typeof targetState !== "undefined") {
      console.log("redo state: ", targetState);
      for (let [className, cls] of this.additionalStaticMapping) {
        const statics = targetState[className];
        Object.entries<any>(statics).forEach(([k, v]) => {
          (cls as any)[k] = jsTool.deepClone(v, false, true);
        });
      }
      this.renderState(targetState.state);
    } else {
      this.history.currentStateIdx--;
    }
    console.log("history stack: ", this.history);

    setTimeout(() => {
      for (let [className, cls] of this.additionalStaticMapping) {
        const statics = targetState[className];
        Object.entries<any>(statics).forEach(([k, v]) => {
          (cls as any)[k] = jsTool.deepClone(v);
        });
      }
      this.systemChanging = false;
      renderer.updateLottieSpec();
      renderer.scaleChartContent();
      targetState.state.selectMarks?.forEach((value, key) => {
        value.forEach((markId) => {
          document.getElementById(markId).setAttribute("opacity", "0.3");
        });
      });
    }, 0);
  }

  public saveState(replace = false): void {
    if (this.getState() === undefined) {
      return;
    }
    this.history.currentStateIdx += replace ? 0 : 1;
    this.history.historyStates[this.history.currentStateIdx] = {
      state: jsTool.deepClone(this.getState()),
      ...Object.fromEntries(
        this.additionalStaticMapping.map(([className, cls]) => {
          const statics: any = {};
          for (let key in cls) {
            if (!((cls as any)[key] instanceof Function)) {
              statics[key] = jsTool.deepClone((cls as any)[key]);
            }
          }
          return [className, statics];
        })
      ),
    };
    this.history.historyStates.splice(this.history.currentStateIdx + 1); //remove the origional record
    console.log("history stack: ", this.history);
  }

  public dispatch(action: IAction): void {
    console.trace("dispatching action: ", action);
    if (action.type !== "INIT") {
      if (action.type === "UPDATE_SPEC_CHARTS") {
        if (initHistory === undefined) {
          this.history = {
            currentStateIdx: -1, //always correspond to the current state (current view)
            historyStates: [],
          };
          this.saveState();
          initHistory = this.history.historyStates[0];
        } else {
          const targetState = initHistory;
          for (let [className, cls] of this.additionalStaticMapping) {
            const statics = targetState[className];
            Object.entries<any>(statics).forEach(([k, v]) => {
              (cls as any)[k] = jsTool.deepClone(v);
            });
          }
          this.renderState(targetState.state);
        }
        this.history = {
          currentStateIdx: -1, //always correspond to the current state (current view)
          historyStates: [],
        };
      } else {
        this.saveState(this.continiousUndo);
      }
    }
    this.continiousUndo = false;
    const newState: IState = this.reducer(this.state, action);
    this.renderState(newState);
  }

  /**
   * dispatch action from system, no need to save
   * @param action
   */
  public dispatchSystem(action: IAction): void {
    if (!this.systemChanging) {
      console.trace("dispatching system action: ", action);
      const newState: IState = this.reducer(this.state, action);
      this.renderState(newState);
    } else {
    }
  }
  public renderState(targetState: IState) {
    console.log("going to render state: ", targetState);
    if (typeof targetState === "undefined") {
      return;
    }

    let diffState: any;
    if (typeof this.state === "undefined") {
      diffState = targetState;
    } else {
      diffState = jsTool.diff(this.state, targetState, 0);
    }
    console.log("diff state: ", this.state, targetState, diffState);
    this.state = targetState;
    Object.keys(diffState).forEach((key: string) => {
      console.log("diffkeys", key);

      try {
        const listener = this.listeners.get(key);
        typeof listener !== "undefined" && listener();
      } catch (e) {
        console.error(e);
      }
    });
  }

  public subscribe(stateKey: string, listener: any): void {
    this.listeners.set(stateKey, listener);
  }

  public subscribeAttrs() {
    this.subscribe(SHOW_VIDEO, renderer.toggleVideoMode);
    this.subscribe(SELECTION, renderer.renderSelectionFrame);
    this.subscribe(SELECT_MARKS, renderer.renderSelectMarks);
    this.subscribe(SPEC, renderer.renderSpec);
    this.subscribe(SORT_DATA_ATTRS, renderer.renderDataMenu);
    this.subscribe(LOTTIE_SPEC, renderer.updateLottieSpec);
    this.subscribe(KEYFRAME_GROUPS, renderer.renderKeyframeTracks);
    this.subscribe(ACTIVATE_PLUS_BTN, renderer.renderActivatedPlusBtn);
    this.subscribe(HIGHLIGHT_KF, renderer.renderHighlightKf);
    this.subscribe(KF_ZOOM_LEVEL, renderer.zoomKfContainer);
    this.subscribe(KF_GROUP_SIZE, renderer.renderKfContainerSliders);
    this.subscribe(IS_PREVIEWING, renderer.renderSuggestSpec);
    this.subscribe(SUGGESTED_MARKS, renderer.renderSuggestedMarks);
    this.subscribe(SUGGEST_SPECS, renderer.renderPreviewBtns);
    this.subscribe(SELECT_MARKS_STEP, renderer.renderSelectionStep);
    this.subscribe(SELECTION_FAKE, renderer.renderSelectionStep);
    this.subscribe(SELECT_MARKS_FAKE, renderer.renderSelectionStep);
    this.subscribe(SELECT_MARKS_STEP_FAKE, renderer.renderSelectionStep);

  }
}

export const store = new Store(reducer);

if (process.env.NODE_ENV === "development") {
  (window as any).Gedux = store;
}
