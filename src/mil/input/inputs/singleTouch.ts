import {
  INPUT_START,
  INPUT_MOVE,
  INPUT_END,
  INPUT_CANCEL,
  INPUT_TYPE_TOUCH,
} from "../input-consts";
import Input from "../input";
import * as util from "../../utils/util";
import Manager from "../../manager";

const SINGLE_TOUCH_INPUT_MAP: any = {
  touchstart: INPUT_START,
  touchmove: INPUT_MOVE,
  touchend: INPUT_END,
  touchcancel: INPUT_CANCEL,
};

const SINGLE_TOUCH_TARGET_EVENTS = "touchstart";
const SINGLE_TOUCH_WINDOW_EVENTS = "touchstart touchmove touchend touchcancel";

/**
 * @private
 * Touch events input
 * @constructor
 * @extends Input
 */
export default class SingleTouchInput extends Input {
  started: boolean;
  constructor(manager: Manager, callback: any) {
    super(...arguments);
    // super(manager, callback);
    this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
    this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
    this.started = false;

    Input.apply(this, arguments);
  }

  handler(ev: any) {
    let type = SINGLE_TOUCH_INPUT_MAP[ev.type];

    // should we handle the touch events?
    if (type === INPUT_START) {
      this.started = true;
    }

    if (!this.started) {
      return;
    }

    let touches = normalizeSingleTouches.call(this, ev, type);

    // when done, reset the started state
    if (
      type & (INPUT_END | INPUT_CANCEL) &&
      touches[0].length - touches[1].length === 0
    ) {
      this.started = false;
    }

    this.callback(this.manager, type, {
      pointers: touches[0],
      changedPointers: touches[1],
      pointerType: INPUT_TYPE_TOUCH,
      srcEvent: ev,
    });
  }
}

function normalizeSingleTouches(ev: any, type: number) {
  let all = util.toArray(ev.touches);
  let changed = util.toArray(ev.changedTouches);

  if (type & (INPUT_END | INPUT_CANCEL)) {
    all = util.uniqueArray(all.concat(changed), "identifier", true);
  }

  return [all, changed];
}
