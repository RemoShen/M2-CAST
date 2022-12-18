import Renderer from "./renderer";
import Reducer from "./reducer";
import * as action from "./action";
import { AnimationItem } from "../../node_modules/lottie-web/build/player/lottie";
import CanisGenerator, { ICanisSpec } from "./core/canisGenerator";
import KfItem from "../redux/views/vl/kfItem";
import { Animation } from "canis_toolkit";
import Slider from "../redux/views/slider/slider";
import { IOrderInfo, RANDOM_ORDER } from "../util/markSelection";
import {
  IAttrAndSpec,
  IPath,
  IActivatePlusBtn,
  ISize,
  IKeyframeGroup,
  IStraightModifier,
  IInteractionRecord,
} from "../redux/global-interfaces";

export interface IState {
  // sortDataAttrs: ISortDataAttr[]
  // dataTable: Map<string, IDataItem>
  // dataOrder: string[]
  //chart status
  // charts: string[]
  // selection: string[]
  // marksInNewCreateKFG: string[]
  // selectionOrder: IOrderInfo//order to suggest path based on selection
  // marksToConfirm: string[][]
  // suggestedMarks: string[]
  // suggestion: boolean
  // isLoading: boolean
  // selectedMarks: Map<string, string[]>//all marks that has been selected: key: class name, value: selected marks of this class
  // spec: ICanisSpec
  // suggestSpecs: IAttrAndSpec[]
  // previewPath: IPath
  // previewSpec: ICanisSpec
  // activatePlusBtn: IActivatePlusBtn
  // allPaths: IPath[]//for kf suggestion
  //keyframe status
  // kfGroupSize: ISize // size of all kf groups
  // currentKf: KfItem
  //video
  // lottieAni: AnimationItem
  // lottieSpec: any
  // keyframeGroups: IKeyframeGroup[]//each keyframe group correspond to one root from one aniunit
  // staticMarks: string[]
  //status
  // highlightKf: KfItem
  // voiceAwake: boolean
  // activeSlider: Slider
  // chartScaleRatio: number
  // sketching: boolean
  // mousemoving: boolean
  // zoomLevel: number
  // chartThumbNailZoomLevels: number
  // touchType: number
  // straightModifier: IStraightModifier
  // isPlaying: boolean
  // isPreviewing: boolean
  // systemTouch: boolean//true: can trigger events like system menu pan; false: can trigger chart or kf events like chart pan
}

/**
 * re-render parts when the state changes
 */
export class State implements IState {
  // _sortDataAttrs: ISortDataAttr[] = [];
  // _dataTable: Map<string, IDataItem> = new Map();
  // _dataOrder: string[]

  // _charts: string[]
  // _selection: string[] = []
  // selectionOrder: IOrderInfo = { type: RANDOM_ORDER, correspondSelection: [] }
  // _marksToConfirm: string[][] = []
  // _suggestedMarks: string[] = []
  // _suggestion: boolean
  // _isLoading: boolean
  // _spec: ICanisSpec
  // _suggestSpecs: IAttrAndSpec[]
  // _activatePlusBtn: IActivatePlusBtn
  // _allPaths: IPath[]
  // _kfGroupSize: ISize
  // _currentKf: KfItem

  // _lottieAni: AnimationItem
  // _lottieSpec: any
  // _keyframeGroups: IKeyframeGroup[]
  // _staticMarks: string[]
  // _chartScaleRatio: number = 1
  // _sketching: boolean = false
  // _isPlaying: boolean = false
  // _isPreviewing: boolean = false
  // _mousemoving: boolean = false
  // _zoomLevel: number = 1;
  // _touchType: number = TOUCH_NULL;
  // _straightModifier: IStraightModifier = { startPnt: { x: -1, y: -1 }, direction: -1 };
  // _systemTouch: boolean = false;
  // _activeSlider: Slider;
  // previewPath: IPath = null;
  // previewSpec: ICanisSpec = null;
  // selectedMarks = new Map();
  // _voiceAwake = false;
  // chartThumbNailZoomLevels: number = 4;
  // _highlightKf: KfItem
  // marksInNewCreateKFG: string[] = [];

  // set sortDataAttrs(sda: ISortDataAttr[]) {
  //     //compare incoming
  //     let sameAttrs: boolean = true;
  //     if (this._sortDataAttrs.length !== 0) {
  //         if (sda.length !== this._sortDataAttrs.length) {
  //             sameAttrs = false;
  //         } else {
  //             let oriAttrs: string[] = this._sortDataAttrs.map(a => { return a.attr });
  //             let newAttrs: string[] = sda.map(a => { return a.attr });
  //             sameAttrs = Tool.identicalArrays(oriAttrs, newAttrs);
  //         }
  //     }
  //     if (!sameAttrs) {
  //         // Renderer.renderDataAttrs(sda);//for data binding
  //     } else {
  //         //find sort reference
  //         const [found, attrAndOrder] = Util.findUpdatedAttrOrder(sda);
  //         //reorder data items
  //         if (found) {
  //             this._sortDataAttrs = sda;
  //             store.dispatch(updateDataOrder(Util.sortDataTable(attrAndOrder)));
  //         }
  //     }
  //     this._sortDataAttrs = sda;

  //     //update data attributes
  //     const attrNames: string[] = sda.map(da => da.attr);
  //     Renderer.renderDataMenu(attrNames);

  // }
  // get sortDataAttrs(): ISortDataAttr[] {
  //     return this._sortDataAttrs;
  // }
  // set dataTable(dt: Map<string, IDataItem>) {
  //     //State.saveHistory(action.UPDATE_DATA_TABLE, this._dataTable);
  //     this._dataTable = dt;
  // }
  // get dataTable(): Map<string, IDataItem> {
  //     return this._dataTable;
  // }
  // set dataOrder(dord: string[]) {
  //     this._dataOrder = dord;
  // }
  // get dataOrder(): string[] {
  //     return this._dataOrder;
  // }
  // set charts(cs: string[]) {
  //     this._charts = cs;
  //     Reducer.triger(action.UPDATE_SPEC_CHARTS, this.charts);
  // }
  // get charts(): string[] {
  //     return this._charts;
  // }

  // set selection(sel: string[]) {
  //     this._selection = sel;
  //     Reducer.triger(action.UPDATE_SELECTED_MARKS, sel);
  //     console.log('selected marks: ', Animation.markClass, this.selection);
  // }
  // get selection(): string[] {
  //     return this._selection;
  // }
  // set marksToConfirm(mc: string[][]) {
  //     this._marksToConfirm = mc;
  //     Renderer.renderMarksToConfirm();
  // }
  // get marksToConfirm(): string[][] {
  //     return this._marksToConfirm;
  // }
  // set suggestedMarks(sm: string[]) {
  //     this._suggestedMarks = sm;
  //     Renderer.renderSuggestedMarks();
  // }
  // get suggestedMarks(): string[] {
  //     return this._suggestedMarks;
  // }
  // set suggestion(sug: boolean) {
  //     //State.saveHistory(action.TOGGLE_SUGGESTION, this._suggestion);
  //     this._suggestion = sug;
  //     // Renderer.renderSuggestionCheckbox(this.suggestion);
  // }
  // get suggestion(): boolean {
  //     return this._suggestion;
  // }
  // set straightModifier(sm: IStraightModifier) {
  //     this._straightModifier = sm;
  // }
  // get straightModifier(): IStraightModifier {
  //     return this._straightModifier;
  // }
  // set touchType(t: number) {
  //     this._touchType = t;
  // }
  // get touchType(): number {
  //     return this._touchType;
  // }
  // set kfGroupSize(kfgSize: ISize) {
  //     this._kfGroupSize = kfgSize;
  //     Renderer.renderKfContainerSliders(this.kfGroupSize);
  // }
  // get kfGroupSize(): ISize {
  //     return this._kfGroupSize;
  // }
  // set lottieAni(lai: AnimationItem) {
  //     this._lottieAni = lai;
  // }
  // get lottieAni(): AnimationItem {
  //     return this._lottieAni;
  // }
  // set lottieSpec(ls: any) {
  //     this._lottieSpec = ls;
  //     Renderer.renderVideo(false);
  //     const staticMarks: string[] = [];
  //     console.log('rendering kf view: ', Animation.animations);
  //     // Reducer.triger(action.UPDATE_STATIC_KEYFRAME, staticMarks);
  //     Reducer.triger(action.UPDATE_KEYFRAME_TRACKS, Animation.animations);
  // }
  // get lottieSpec(): any {
  //     return this._lottieSpec;
  // }
  // set keyframeGroups(kfts: IKeyframeGroup[]) {
  //     if (kfts) {
  //         this._keyframeGroups = kfts;
  //         //render keyframes
  //         Renderer.renderKeyframeTracks(this.keyframeGroups);
  //     }
  // }
  // get keyframeGroups(): IKeyframeGroup[] {
  //     return this._keyframeGroups;
  // }
  // set staticMarks(sm: string[]) {
  //     this._staticMarks = sm;
  //     Renderer.renderStaticKf(this.staticMarks);
  // }
  // get staticMarks(): string[] {
  //     return this._staticMarks;
  // }
  // set isLoading(il: boolean) {
  //     this._isLoading = il;
  // }
  // get isLoading(): boolean {
  //     return this._isLoading;
  // }
  // set spec(canisSpec: ICanisSpec) {
  //     //add loading
  //     console.log('going to validate spec: ', canisSpec);
  //     //validate spec before render
  //     const validSpec: boolean = CanisGenerator.validate(canisSpec);
  //     if (validSpec) {
  //         this._spec = canisSpec;
  //         // Renderer.renderSpec(this.spec, Renderer.resizeVideoLayer);
  //     }
  // }
  // get spec(): ICanisSpec {
  //     return this._spec;
  // }
  // set activatePlusBtn(plusBtnInfo: IActivatePlusBtn) {
  //     this._activatePlusBtn = plusBtnInfo;
  //     Renderer.renderActivatedPlusBtn(plusBtnInfo.aniId, plusBtnInfo.selection, plusBtnInfo.orderInfo, plusBtnInfo.previousKfs);
  // }
  // get activatePlusBtn(): IActivatePlusBtn {
  //     return this._activatePlusBtn;
  // }
  // set allPaths(ap: IPath[]) {
  //     this._allPaths = ap;
  // }
  // get allPaths(): IPath[] {
  //     return this._allPaths;
  // }
  // set chartScaleRatio(scale: number) {
  //     this._chartScaleRatio = scale;
  //     Renderer.scaleChartContent();
  // }
  // get chartScaleRatio(): number {
  //     return this._chartScaleRatio;
  // }
  // set sketching(s: boolean) {
  //     this._sketching = s;
  // }
  // get sketching(): boolean {
  //     return this._sketching;
  // }
  // set isPlaying(p: boolean) {
  //     console.log('update is playering:', p);
  //     let needSwitchMode: boolean = ((this._isPlaying || p) && !(this._isPlaying && p));
  //     this._isPlaying = p;
  //     if (needSwitchMode) {
  //         Renderer.switchMode();
  //     }
  // }
  // get isPlaying(): boolean {
  //     return this._isPlaying;
  // }
  // set mousemoving(mm: boolean) {
  //     this._mousemoving = mm;
  // }
  // get mousemoving(): boolean {
  //     return this._mousemoving;
  // }
  // set zoomLevel(zl: number) {
  //     this._zoomLevel = zl;
  //     Renderer.zoomKfContainer(zl);
  // }
  // get zoomLevel(): number {
  //     return this._zoomLevel;
  // }
  // set currentKf(ck: KfItem) {
  //     this._currentKf = ck;
  // }
  // get currentKf(): KfItem {
  //     return this._currentKf;
  // }
  // set systemTouch(st: boolean) {
  //     this._systemTouch = st;
  //     Renderer.toggleSystemTouch();
  // }
  // get systemTouch(): boolean {
  //     return this._systemTouch;
  // }
  // set activeSlider(as: Slider) {
  //     this._activeSlider = as;
  // }
  // get activeSlider(): Slider {
  //     return this._activeSlider;
  // }
  // set suggestSpecs(ssp: IAttrAndSpec[]) {
  //     this._suggestSpecs = ssp;
  //     (ssp.length > 1) && Renderer.renderPreviewBtns();
  // }
  // get suggestSpecs(): IAttrAndSpec[] {
  //     return this._suggestSpecs;
  // }
  // set isPreviewing(ip: boolean) {
  //     this._isPreviewing = ip;
  // }
  // get isPreviewing() {
  //     return this._isPreviewing;
  // }
  // set voiceAwake(va: boolean) {
  //     this._voiceAwake = va;
  //     va ? Renderer.voiceListening() : Renderer.resetVoice();
  // }

  // get voiceAwake(): boolean {
  //     return this._voiceAwake;
  // }

  // set highlightKf(kf: KfItem) {
  //     Renderer.renderHighlightKf(state.highlightKf, kf);
  //     this._highlightKf = kf;
  // }

  // get highlightKf(): KfItem {
  //     return this._highlightKf;
  // }

  public reset(changeChart: boolean): void {
    // if (changeChart) {
    //     // this.sortDataAttrs = [];
    //     // this.dataTable.clear();
    //     // this.dataOrder = [];
    //     // this.charts = [];
    // } else {
    //     this.spec = { charts: state.spec.charts, animations: [] };
    // }
    // this.keyframeGroups = null;
    // this.selection = [];
    // this.marksInNewCreateKFG = [];
    // this.selectionOrder = { type: RANDOM_ORDER, correspondSelection: [] }
    // this.marksToConfirm = [];
    // this.suggestedMarks = [];
    // this.suggestion = true;
    // this.isLoading = false;
    // this.selectedMarks.clear();
    // this.suggestSpecs = [];
    // this.systemTouch = false;
    // this.previewPath = null;
    // this.previewSpec = null;
    // this.allPaths = [];
    // this.currentKf = null;
    // this.voiceAwake = false;
    // this.activeSlider = null;
    // this.chartThumbNailZoomLevels = 4;
    // this.isPlaying = false;
    // this.isPreviewing = false;
  }

  /*
   * each interaction node is an array of interaction records, each record contains the history value and current value,
   * revert: rerender the history value in the record where the pointer points at then move the pointer to the previous record
   * redo: move the pointer back to the next record and render the current value in the record
   */
  static stateHistory: IInteractionRecord[][] = []; //each step might triger multiple actions, thus each step correspond to one Array<[actionType, stateAttrValue]>
  static stateHistoryIdx: number = -1;
  static tmpStateBusket: IInteractionRecord[] = [];
  public static saveHistory(insertHistory: boolean = false) {
    if (insertHistory) {
      this.stateHistory[this.stateHistoryIdx] = [
        ...this.stateHistory[this.stateHistoryIdx],
        ...this.tmpStateBusket,
      ];
    } else {
      this.stateHistoryIdx++;
      this.stateHistory = this.stateHistory.slice(0, this.stateHistoryIdx);
      this.stateHistory.push(this.tmpStateBusket);
      console.log(
        "saving history: ",
        this.stateHistory,
        this.tmpStateBusket,
        this.stateHistoryIdx
      );
    }
    this.tmpStateBusket = [];
  }

  public static revertHistory() {
    if (this.stateHistoryIdx >= 0) {
      const actionAndValues: IInteractionRecord[] =
        this.stateHistory[this.stateHistoryIdx];
      let i = actionAndValues.length - 1;
      this.runRevertHistory(actionAndValues, i);
      this.stateHistoryIdx--;
    }
  }

  public static runRevertHistory(
    actionAndValues: IInteractionRecord[],
    i: number
  ) {
    if (i >= 0) {
      new Promise((resolve, reject) => {
        Reducer.triger(
          actionAndValues[i].historyAction.actionType,
          actionAndValues[i].historyAction.actionVal
        );
        setTimeout(() => {
          resolve(0);
        }, 1);
      }).then(() => {
        i--;
        this.runRevertHistory(actionAndValues, i);
      });
    }
  }

  public static redoHistory() {
    if (this.stateHistoryIdx < this.stateHistory.length - 1) {
      this.stateHistoryIdx++;
      const actionAndValues: IInteractionRecord[] =
        this.stateHistory[this.stateHistoryIdx];
      let i = 0;
      this.runRedoHistory(actionAndValues, i);
    }
  }

  public static runRedoHistory(
    actionAndValues: IInteractionRecord[],
    i: number
  ) {
    if (i < actionAndValues.length) {
      new Promise((resolve, reject) => {
        Reducer.triger(
          actionAndValues[i].currentAction.actionType,
          actionAndValues[i].currentAction.actionVal
        );
        setTimeout(() => {
          resolve(0);
        }, 1);
      }).then(() => {
        i++;
        this.runRedoHistory(actionAndValues, i);
      });
    }
  }
}

export let state = new State();
