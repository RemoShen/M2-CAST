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

const TOUCH_INPUT_MAP: any = {
  touchstart: INPUT_START,
  touchmove: INPUT_MOVE,
  touchend: INPUT_END,
  touchcancel: INPUT_CANCEL,
};

const TOUCH_TARGET_EVENTS = "touchstart touchmove touchend touchcancel";

/**
 * @private
 * Multi-user touch events input
 * @constructor
 * @extends Input
 */
export default class TouchInput extends Input {
  targetIds: any;
  constructor(manager: Manager, callback: any) {
    super(manager, callback);
    this.evTarget = TOUCH_TARGET_EVENTS;
    this.targetIds = {};

    this.evTarget = TOUCH_TARGET_EVENTS;
    this.targetIds = {};
    Input.apply(this, arguments);
  }

  handler(ev: any) {
    // console.log('touch type: ', ev.type);
    let type = TOUCH_INPUT_MAP[ev.type];
    let touches = getTouches.call(this, ev, type);
    if (!touches) {
      return;
    }

    this.callback(this.manager, type, {
      pointers: touches[0],
      changedPointers: touches[1],
      pointerType: INPUT_TYPE_TOUCH,
      srcEvent: ev,
    });
  }
}

/**
 * @private
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function getTouches(ev: any, type: number) {
  let allTouches = util.toArray(ev.touches);
  let { targetIds } = this;

  // when there is only one touch, the process can be simplified
  if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
    targetIds[allTouches[0].identifier] = true;
    return [allTouches, allTouches];
  }

  let i;
  let targetTouches;
  let changedTouches = util.toArray(ev.changedTouches);
  let changedTargetTouches = [];
  let { target } = this;

  // get target touches from touches
  targetTouches = allTouches.filter((touch: any) => {
    return util.hasParent(touch.target, target);
  });

  // collect touches
  if (type === INPUT_START) {
    i = 0;
    while (i < targetTouches.length) {
      targetIds[targetTouches[i].identifier] = true;
      i++;
    }
  }

  // filter changed touches to only contain touches that exist in the collected target ids
  i = 0;
  while (i < changedTouches.length) {
    if (targetIds[changedTouches[i].identifier]) {
      changedTargetTouches.push(changedTouches[i]);
    }

    // cleanup removed touches
    if (type & (INPUT_END | INPUT_CANCEL)) {
      delete targetIds[changedTouches[i].identifier];
    }
    i++;
  }

  if (!changedTargetTouches.length) {
    return;
  }

  return [
    // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
    util.uniqueArray(
      targetTouches.concat(changedTargetTouches),
      "identifier",
      true
    ),
    changedTargetTouches,
  ];
}
