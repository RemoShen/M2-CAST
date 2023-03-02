import Reducer from "./reducer";
import {
  IInteractionRecord,
} from "../redux/global-interfaces";

export interface IState {
}

/**
 * re-render parts when the state changes
 */
export class State implements IState {
  public reset(changeChart: boolean): void {
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
