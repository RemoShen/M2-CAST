import { ICanisSpec } from "../app/core/canisGenerator";
import { IOrderInfo } from "../util/markSelection";

export interface ICoord {
  x: number;
  y: number;
  z?: number;
}

export interface ISize {
  width?: number;
  height?: number;
}

export interface IBoundary {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ILoading {
  isLoading: boolean;
  targetEle?: HTMLElement;
  content?: string;
}

export interface IAttrAndSpec {
  attrComb: string[];
  spec: ICanisSpec;
  path: IPath;
}

/**
 * direction: -1 -> null, 0 -> x, 1 -> y
 */
export interface IStraightModifier {
  startPnt: ICoord;
  direction: number;
}

export interface ISortDataAttr {
  attr: string;
  sort: string;
}

export interface IDataItem {
  [propName: string]: string | number;
}

export interface IKeyframe {
  id: number;
  timingRef: string;
  groupRef: string;
  refValue?: string;
  isGhost: boolean;
  // parentObj: IKeyframeGroup //keyframe group id
  durationIcon: boolean;
  hiddenDurationIcon: boolean;
  duration: number;
  delayIcon: boolean;
  delay: number;
  allCurrentMarks: string[]; // marks until this kf
  allGroupMarks: string[];
  marksThisKf: string[]; //markid array
  alignWith?: string[]; //array of aniIds which are aligned to this kf
  alignWithKfs?: number[]; // array of keyframeIds which are aligned to this kf
  alignTo?: number; //align to keyframeid
  thumbnail?: any;
}

export interface IKeyframeGroup {
  groupRef: string;
  refValue?: string;
  id: number;
  aniId: string;
  // parentObj: IKeyframeGroup | {} //keyframe group id
  children?: IKeyframeGroup[];
  keyframes?: IKeyframe[];
  // numKf: number
  // numGroup: number
  marks: string[];
  timingRef: string;
  delayIcon: boolean;
  delay: number;
  offsetIcon?: boolean;
  offset?: number; // for aniunit only
  alignId?: string;
  alignType?: string;
  alignTarget?: string; //target at an animation id
  merge?: boolean;
  newTrack: boolean;
}

export interface IDataDatumType {
  [key: string]: string | number;
}

export interface IPath {
  attrComb: string[];
  sortedAttrValueComb: string[];
  kfMarks: string[][];
  firstKfMarks: string[];
  lastKfMarks: string[];
  ordering?: {
    attr: string;
    order: string;
  };
}

export interface IInteractionRecord {
  historyAction: {
    actionType: string;
    actionVal: any;
  };
  currentAction: {
    actionType: string;
    actionVal: any;
  };
}

export interface IActivatePlusBtn {
  aniId: string;
  selection: string[];
  selectedMarksEachStep: Map<number, string[]>;
  renderedUniqueIdx: number;
  orderInfo: IOrderInfo;
  previousKfs: string[][];
}

export interface IOmitPattern {
  merge: boolean;
  timing: string;
  hasOffset: boolean;
  hasDuration: boolean;
}
