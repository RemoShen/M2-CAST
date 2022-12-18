import Manager from "../manager";
import Recognizer from "../recognizer/Recognizer";
import * as touchActionConsts from "./touchaction-consts";
import * as util from "../utils/util";
import {
  DIRECTION_HORIZONTAL,
  DIRECTION_VERTICAL,
} from "../input/input-consts";

export default class TouchAction {
  manager: Manager;
  actions: string;

  constructor(manager: Manager, value: string) {
    this.manager = manager;
    this.set(value);
  }

  set(value: string) {
    // console.log('set touch action');
    // find out the touch-action by the event handlers
    if (value === touchActionConsts.TOUCH_ACTION_COMPUTE) {
      value = this.compute();
    }

    if (
      touchActionConsts.NATIVE_TOUCH_ACTION &&
      this.manager.ele.style &&
      touchActionConsts.TOUCH_ACTION_MAP[value]
    ) {
      this.manager.ele.style[touchActionConsts.PREFIXED_TOUCH_ACTION] = value;
    }
    this.actions = value.toLowerCase().trim();
  }

  /**
   * compute the value for the touchAction property based on the recognizer's settings
   */
  private compute() {
    let actions: string[] = [];

    this.manager.recognizers.forEach((recognizer: Recognizer) => {
      if (util.boolOrFn(recognizer.options.enable, [recognizer])) {
        actions = [...actions, ...recognizer.getTouchAction()];
        actions.concat(recognizer.getTouchAction());
      }
    });

    return this.cleanTouchActions(actions.join(" "));
  }

  private cleanTouchActions = (actions: string) => {
    // console.log('clean touch actions');
    // none
    if (util.inStr(actions, touchActionConsts.TOUCH_ACTION_NONE)) {
      return touchActionConsts.TOUCH_ACTION_NONE;
    }

    let hasPanX = util.inStr(actions, touchActionConsts.TOUCH_ACTION_PAN_X);
    let hasPanY = util.inStr(actions, touchActionConsts.TOUCH_ACTION_PAN_Y);

    // if both pan-x and pan-y are set (different recognizers
    // for different directions, e.g. horizontal pan but vertical swipe?)
    // we need none (as otherwise with pan-x pan-y combined none of these
    // recognizers will work, since the browser would handle all panning
    if (hasPanX && hasPanY) {
      return touchActionConsts.TOUCH_ACTION_NONE;
    }

    // pan-x OR pan-y
    if (hasPanX || hasPanY) {
      return hasPanX
        ? touchActionConsts.TOUCH_ACTION_PAN_X
        : touchActionConsts.TOUCH_ACTION_PAN_Y;
    }

    // manipulation
    if (util.inStr(actions, touchActionConsts.TOUCH_ACTION_MANIPULATION)) {
      return touchActionConsts.TOUCH_ACTION_MANIPULATION;
    }

    return touchActionConsts.TOUCH_ACTION_AUTO;
  };

  /**
   * just re-set the touchAction value
   */
  update() {
    // console.log('update touch action');
    this.set(this.manager.options.touchAction);
  }

  /**
   * this method is called on each input cycle and provides the preventing of the browser behavior
   */
  preventDefaults(input: any) {
    // console.log('prevent default touch actions');
    let { srcEvent } = input;
    let direction = input.offsetDirection;

    // if the touch action did prevented once this session
    if (this.manager.session.prevented) {
      srcEvent.preventDefault();
      return;
    }

    let { actions } = this;
    let hasNone =
      util.inStr(actions, touchActionConsts.TOUCH_ACTION_NONE) &&
      !touchActionConsts.TOUCH_ACTION_MAP[touchActionConsts.TOUCH_ACTION_NONE];
    let hasPanY =
      util.inStr(actions, touchActionConsts.TOUCH_ACTION_PAN_Y) &&
      !touchActionConsts.TOUCH_ACTION_MAP[touchActionConsts.TOUCH_ACTION_PAN_Y];
    let hasPanX =
      util.inStr(actions, touchActionConsts.TOUCH_ACTION_PAN_X) &&
      !touchActionConsts.TOUCH_ACTION_MAP[touchActionConsts.TOUCH_ACTION_PAN_X];

    if (hasNone) {
      // do not prevent defaults if this is a tap gesture
      let isTapPointer = input.pointers.length === 1;
      let isTapMovement = input.distance < 2;
      let isTapTouchTime = input.deltaTime < 250;

      if (isTapPointer && isTapMovement && isTapTouchTime) {
        return;
      }
    }

    if (hasPanX && hasPanY) {
      // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
      return;
    }

    if (
      hasNone ||
      (hasPanY && direction & DIRECTION_HORIZONTAL) ||
      (hasPanX && direction & DIRECTION_VERTICAL)
    ) {
      return this.preventSrc(srcEvent);
    }
  }

  /**
   * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
   */
  preventSrc(srcEvent: Event) {
    this.manager.session.prevented = true;
    srcEvent.preventDefault();
  }
}
