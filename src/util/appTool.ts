import { Animation } from "canis_toolkit";
import { store } from "../redux/store";

export const isMark = (target: SVGElement | HTMLElement) => {
  return target.classList.contains("mark");
};

/**
 * classify selected marks by class
 * @param mIds
 * @returns
 */

export const classifySelection = (mIds: string[]) => {
  mIds = [...new Set(mIds)];
  const currentSelectedMarks: Map<string, string[]> = new Map(); //
  if (typeof store.getState().selectMarks !== "undefined") {
    store.getState().selectMarks.forEach((value: string[], key: string) => {
      currentSelectedMarks.set(key, value);
    });
  }
  mIds.forEach((mId: string) => {
    const className: string = Animation.markClass.get(mId);
    if (typeof className !== "undefined") {
      if (typeof currentSelectedMarks.get(className) === "undefined") {
        currentSelectedMarks.set(className, []);
      }
      const tmpSet: Set<string> = new Set(currentSelectedMarks.get(className)); //remove redundant
      tmpSet.add(mId);
      currentSelectedMarks.set(className, [...tmpSet]);
    }
  });
  return currentSelectedMarks;
};

/**
 * immutable
 * @param allPreviousSelectedMark 
 * @param mIds 
 * @returns 
 */
export const combineSelectStep = (allPreviousSelectedMark: string[][], mIds: string[]) => {
  const currentSelectedMarks: string[] = [...new Set(mIds)];
  // allPreviousSelectedMark.push(currentSelectedMarks);
  return [...allPreviousSelectedMark, currentSelectedMarks];
};
