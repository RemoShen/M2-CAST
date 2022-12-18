import { prefixed } from "../utils/prefix";

const getTouchActionProps = () => {
  if (!NATIVE_TOUCH_ACTION) {
    return false;
  }
  let touchMap: any = {};
  let cssSupports = window.CSS && window.CSS.supports;
  ["auto", "manipulation", "pan-y", "pan-x", "pan-x pan-y", "none"].forEach(
    (val: string) => {
      // If css.supports is not supported but there is native touch-action assume it supports
      // all values. This is the case for IE 10 and 11.
      return (touchMap[val] = cssSupports
        ? window.CSS.supports("touch-action", val)
        : true);
    }
  );
  return touchMap;
};

export const PREFIXED_TOUCH_ACTION = prefixed(
  document.createElement("div").style,
  "touchAction"
);
export const NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;

// magical touchAction value
export const TOUCH_ACTION_COMPUTE = "compute";
export const TOUCH_ACTION_AUTO = "auto";
export const TOUCH_ACTION_MANIPULATION = "manipulation"; // not implemented
export const TOUCH_ACTION_NONE = "none";
export const TOUCH_ACTION_PAN_X = "pan-x";
export const TOUCH_ACTION_PAN_Y = "pan-y";
export const TOUCH_ACTION_MAP = getTouchActionProps();
