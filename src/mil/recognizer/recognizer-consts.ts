import { ActionSpec } from "canis_toolkit";
import {
  DIRECTION_LEFT,
  DIRECTION_RIGHT,
  DIRECTION_UP,
  DIRECTION_DOWN,
} from "../input/input-consts";

export const STATE_POSSIBLE = 1;
export const STATE_BEGAN = 2;
export const STATE_CHANGED = 4;
export const STATE_ENDED = 8;
export const STATE_RECOGNIZED = STATE_ENDED;
export const STATE_CANCELLED = 16;
export const STATE_FAILED = 32;

/**
 * get a usable string, used as event postfix
 */
export const stateStr = (state: number) => {
  if (state & STATE_CANCELLED) {
    return "cancel";
  } else if (state & STATE_ENDED) {
    return "end";
  } else if (state & STATE_CHANGED) {
    return "move";
  } else if (state & STATE_BEGAN) {
    return "start";
  }
  return "";
};

/**
 * @private
 * direction cons to string
 * @param {constant} direction
 * @returns {String}
 */
export const directionStr = (direction: number) => {
  if (direction === DIRECTION_DOWN) {
    return "down";
  } else if (direction === DIRECTION_UP) {
    return "up";
  } else if (direction === DIRECTION_LEFT) {
    return "left";
  } else if (direction === DIRECTION_RIGHT) {
    return "right";
  }
  return "";
};

const idxes: string[] = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];
export const idxMapping: Map<string, number> = new Map();
idxes.forEach((idxStr: string, count: number) => {
  idxMapping.set(idxStr, count);
});
export const shapes: string[] = [
  "mark",
  "marks",
  "circle",
  "circles",
  "dot",
  "dots",
  "rect",
  "rects",
  "rectangle",
  "rectangles",
  "line",
  "lines",
];
const minmaxShapeSelectionCmds: string[] = [
  "select minimum *",
  "select min *",
  "select maximum *",
  "select max *",
];
const colorSelectionCmds: string[] = [];
shapes.forEach((shape: string) => {
  minmaxShapeSelectionCmds.push(`select ${shape} with minimum *`);
  minmaxShapeSelectionCmds.push(`select ${shape} with min *`);
  minmaxShapeSelectionCmds.push(`select ${shape} with maximum *`);
  minmaxShapeSelectionCmds.push(`select ${shape} with max *`);
  colorSelectionCmds.push(`select * ${shape}`);
});
console.log("action types: ", ActionSpec.actionTypes);
const effectTimingCmds: string[] = [];
export const effectTypes: string[] = [];
Object.keys(ActionSpec.actionTypes).forEach((key: string) => {
  const typeName: string = ActionSpec.actionTypes[key];
  effectTimingCmds.push(`${typeName} for * millisecond`);
  effectTimingCmds.push(`${typeName} for * milliseconds`);
  effectTimingCmds.push(`${typeName} for * seconds`);
  effectTimingCmds.push(`${typeName} for * second`);
  effectTypes.push(typeName);
});
export const SPEECH_CMDS: string[] = [
  ...minmaxShapeSelectionCmds,
  ...colorSelectionCmds,
  "select * row", //position
  "select * column", //position
  "select *", //general
  ...effectTimingCmds,
  "* millisecond", //ms time
  "* milliseconds", //ms time
  "* second", //sec time
  "* seconds", //sec time
  "*", //effects
];
export const MINMAX_SHAPE_RANGE: number[] = [
  0,
  minmaxShapeSelectionCmds.length - 1,
];
export const COLOR_RANGE: number[] = [
  minmaxShapeSelectionCmds.length,
  minmaxShapeSelectionCmds.length + colorSelectionCmds.length - 1,
];
export const POSITION_RANGE: number[] = [
  COLOR_RANGE[1] + 1,
  COLOR_RANGE[1] + 2,
];
export const GENERAL_SELECT_RANGE: number[] = [POSITION_RANGE[1] + 1];
export const EFFECT_TIME_RANGE: number[] = [
  GENERAL_SELECT_RANGE[0] + 1,
  GENERAL_SELECT_RANGE[0] + effectTimingCmds.length,
];
export const MS_TIME_RANGE: number[] = [
  EFFECT_TIME_RANGE[1] + 1,
  EFFECT_TIME_RANGE[1] + 2,
];
export const S_TIME_RANGE: number[] = [
  MS_TIME_RANGE[1] + 1,
  MS_TIME_RANGE[1] + 2,
];
export const GENERAL_RANGE: number[] = [S_TIME_RANGE[1] + 1];
