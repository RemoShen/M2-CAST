import AniMIL from "../../../mil/AniMIL";

export const CALL_SYS_MENU: string = "callSysMenu";
export const SELECT_SYS_MENU: string = "selectSysMenu";
export const CANCEL_DATA_SELECT: string = "cancelDataSelect";
export const callSysMenu = new AniMIL.Press({
  time: 500,
  event: CALL_SYS_MENU,
});
export const selectSysMenu = new AniMIL.Pan({
  event: SELECT_SYS_MENU,
  enable: false,
});
export const cancelDataSelection = new AniMIL.Pan({
  event: CANCEL_DATA_SELECT,
  // enable: false
});
