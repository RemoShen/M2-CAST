import { IAction } from "../action/interfaces";
import { IState } from "../store";
import { appReducer } from "./appReducer";
import { canisReducer } from "./canisReducer";
import { chartReducer } from "./chartReducer";
import { videoReducer } from "./videoReducer";
import { vlReducer } from "./vlReducer";

const combineReducers = (reducers: {
  [key: string]: (state: IState, action: IAction) => {};
}) => {
  return (state: IState, action: IAction) => {
    let result: IState;
    Object.keys(reducers).forEach((key: string) => {
      result = { ...result, ...reducers[key](state, action) };
    });
    return result;
  };
};

export const reducer = combineReducers({
  app: appReducer,
  chart: chartReducer,
  canis: canisReducer,
  vl: vlReducer,
  video: videoReducer,
});
