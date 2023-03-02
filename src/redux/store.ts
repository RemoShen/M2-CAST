import { IAction, ManualStep } from "./action/interfaces";
import { initState } from "./action/appAction";
import { reducer } from "./reducers/reducer";
import {
  IActivatePlusBtn,
  IAttrAndSpec,
  ICoord,
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

// const LOADING: string = 'loading'
const SHOW_VIDEO: string = "showVideo";
const SELECTION: string = "selection";
const SELECT_MARKS: string = "selectMarks";
const SELECT_MARKS_STEP: string = "selectMarksStep";
// const MARKS_TO_CONFIRM: string = "marksToConfirm";
const SPEC: string = "spec";
const SORT_DATA_ATTRS: string = "sortDataAttrs";
// const SYSTEM_TOUCH: string = 'systemTouch'
const LOTTIE_SPEC: string = "lottieSpec";
// const STATIC_MARKS: string = 'staticMarks'
const KEYFRAME_GROUPS: string = "keyframeGroups";
const ACTIVATE_PLUS_BTN: string = "activatePlusBtn";
const HIGHLIGHT_KF: string = "highlightKf";
const KF_ZOOM_LEVEL: string = "kfZoomLevel";
const KF_GROUP_SIZE: string = "kfGroupSize";
// const SKETCHING: string = 'sketching'
const IS_PREVIEWING: string = "isPreviewing";
const SUGGESTED_MARKS: string = "suggestedMarks";
const SUGGEST_SPECS: string = "suggestSpecs";
const CLICK_TIME: string = 'clicktime';
const SELECT_MODE: string = 'selectmode';
const MANUAL_SELECT: string = 'manualSelect';
const TRACE: string = 'trace'; 
export interface IState {
  defaultChartScaleRatio: number;
  chartScaleRatio: number;
  // dataOrder?: string[]
  dataTable?: Map<string, IDataItem>;
  lottieAni?: AnimationItem;
  isMouseMoving: boolean;
  previewPath?: IPath;
  previewSpec?: ICanisSpec;
  selectionOrder: IOrderInfo;
  // marksInNewCreateKFG?: string[]
  // activeSlider?: Slider
  suggestSpecs?: IAttrAndSpec[];

  //need listeners
  voiceAwake: boolean;
  // loading: ILoading
  showVideo: boolean;
  charts?: string[];
  selection?: string[]; //marks already selected
  selectMarks?: Map<string, string[]>;
  selectMarksStep: string[][];
  suggestedMarks?: string[];
  marksToConfirm: string[][];
  spec: ICanisSpec;
  sortDataAttrs?: ISortDataAttr[];
  // systemTouch: boolean
  lottieSpec?: any;
  // staticMarks?: string[]
  // currentKf?: KfItem

  keyframeGroups?: IKeyframeGroup[]; //each keyframe group correspond to one root from one aniunit
  activatePlusBtn?: IActivatePlusBtn;
  highlightKf?: {
    previousHighlightKf: KfItem;
    currentHighlightKf: KfItem;
  };
  kfZoomLevel?: number;
  kfGroupSize?: ISize;
  //click time
  clicktime?: number;
  selectMode: string;
  // sketching?: {
  //     isSketching: boolean
  //     startCoord: ICoord
  // }
  isPreviewing?: boolean;
  manualSelect: ManualStep;
  trace?: ICoord[][]; //trace of the user's selection
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
  voiceAwake: false,
  selectMarksStep: [], //
  // loading: { isLoading: false },
  showVideo: false,
  isMouseMoving: false,
  // charts: [],
  marksToConfirm: [],
  spec: { charts: [], animations: [] },
  // systemTouch: false,
  selectionOrder: { type: RANDOM_ORDER, correspondSelection: [] },
  kfZoomLevel: 1,
  selectMode: 'intelligent',
  manualSelect: {marks: new Set(), steps:[]},
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
    // Object.keys(defaultState).forEach((key: string) => {
    //     Object.defineProperty(this.state, key, {
    //         writable: false,
    //         value: defaultState[key as keyof IState]
    //     });
    // })

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
    if (this.history.currentStateIdx >= 0) {
      if (!this.continiousUndo) {
        this.saveState();
      }
      //change the opacity of the selected marks 

      this.systemChanging = true;
      this.history.currentStateIdx -= 1;
      if (this.history.currentStateIdx >= 0) {
        const targetState =
          this.history.historyStates[this.history.currentStateIdx];
        console.log("undo state: ", targetState, this.history, this.history.currentStateIdx);
        //target state, do 1 then +3
        for (let [className, cls] of this.additionalStaticMapping) {
          const statics = targetState[className];
          Object.entries<any>(statics).forEach(([k, v]) => {
            (cls as any)[k] = jsTool.deepClone(v, false, true);
          });
        }
        this.systemChanging = false;
        this.renderState(targetState.state);
      } else {
        this.systemChanging = false;
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

          renderer.updateLottieSpec();
          renderer.scaleChartContent();
          targetState.state.selectMarks?.forEach((value, key) => {
            value.forEach((markId) => {
              document.getElementById(markId).setAttribute("opacity", "0.3");
            });
          });
          targetState.state.selection?.forEach((markId: string) => {
            document.getElementById(markId).setAttribute("opacity", "1");
          })
          // renderer.renderKeyframeTracks();
        }, 1000);
    }

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
      targetState.state.selection?.forEach((markId: string) => {
        document.getElementById(markId).setAttribute("opacity", "1");
      })
      // renderer.renderKeyframeTracks();
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
    console.log("history stack: ", this.history, this.history.currentStateIdx);
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
      // this.continiousUndo=false;
      // this.saveState(true);
    } else {
      // const targetState =
      //   this.history.historyStates[this.history.currentStateIdx];
      // for (let [className, cls] of this.additionalStaticMapping) {
      //   const statics = targetState[className];
      //   Object.entries<any>(statics).forEach(([k, v]) => {
      //     (cls as any)[k] = jsTool.deepClone(v, false, true);
      //   });
      // }
      // force unchange anything
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
    // const diffState: any = jsTool.diff(this.state, targetState);
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
    // this.subscribe(LOADING, renderer.toggleLoading);
    // this.subscribe(CHART_SCALE_RATIO, renderer.scaleChartContent);
    this.subscribe(SHOW_VIDEO, renderer.toggleVideoMode);
    // this.subscribe(VOICE_AWAKE, renderer.toggleVoice);
    this.subscribe(SELECTION, renderer.renderSelectionFrame);
    this.subscribe(SELECT_MARKS, renderer.renderSelectMarks);
    // this.subscribe(MARKS_TO_CONFIRM, renderer.renderMarksToConfirm);
    this.subscribe(SPEC, renderer.renderSpec);
    this.subscribe(SORT_DATA_ATTRS, renderer.renderDataMenu);
    // this.subscribe(SYSTEM_TOUCH, renderer.toggleSystemTouch);
    this.subscribe(LOTTIE_SPEC, renderer.updateLottieSpec);
    // this.subscribe(STATIC_MARKS, renderer.renderStaticKf);
    this.subscribe(KEYFRAME_GROUPS, renderer.renderKeyframeTracks);
    this.subscribe(ACTIVATE_PLUS_BTN, renderer.renderActivatedPlusBtn);
    this.subscribe(HIGHLIGHT_KF, renderer.renderHighlightKf);
    this.subscribe(KF_ZOOM_LEVEL, renderer.zoomKfContainer);
    this.subscribe(KF_GROUP_SIZE, renderer.renderKfContainerSliders);
    // this.subscribe(SKETCHING, renderer.renderSketchCanvas);
    this.subscribe(IS_PREVIEWING, renderer.renderSuggestSpec);
    this.subscribe(SUGGESTED_MARKS, renderer.renderSuggestedMarks);
    this.subscribe(SUGGEST_SPECS, renderer.renderPreviewBtns);
    this.subscribe(SELECT_MARKS_STEP, renderer.renderSelectionStep);
    this.subscribe(CLICK_TIME, renderer.logClickTime);
    this.subscribe(SELECT_MODE, renderer.renderSelectMode);
    this.subscribe(MANUAL_SELECT, renderer.manualSelect);
    this.subscribe(TRACE, renderer.updateTrace);

  }
}

export const store = new Store(reducer);

if (process.env.NODE_ENV === "development") {
  (window as any).Gedux = store;
}
