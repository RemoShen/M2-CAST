import { IAction } from "../action/interfaces";
import { INIT } from "../action/appAction";
import { defaultState, IState, } from "../store";

export const appReducer = (state: IState, action: IAction) => {
  switch (action.type) {
    case INIT:
      return {
        ...defaultState,
        spec: {
          charts: typeof state === "undefined" ? [] : state.spec.charts,
          animations: [],
        },
      } as IState;
  }
};
