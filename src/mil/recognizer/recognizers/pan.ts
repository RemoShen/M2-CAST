import AttrRecognizer from "./attribute";
import {
  DIRECTION_ALL,
  DIRECTION_HORIZONTAL,
  DIRECTION_VERTICAL,
  DIRECTION_NONE,
  DIRECTION_UP,
  DIRECTION_DOWN,
  DIRECTION_LEFT,
  DIRECTION_RIGHT,
} from "../../input/input-consts";
import { STATE_BEGAN, directionStr } from "../recognizer-consts";
import {
  TOUCH_ACTION_NONE,
  TOUCH_ACTION_PAN_X,
  TOUCH_ACTION_PAN_Y,
} from "../../touchAction/touchaction-consts";
import { IRecognizerOptions } from "../Recognizer";

/**
 * @private
 * Pan
 * Recognized when the pointer is down and moved in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
export default class PanRecognizer extends AttrRecognizer {
  pX: number;
  pY: number;
  defaults: any;
  constructor(recognizerOptions: IRecognizerOptions) {
    super(recognizerOptions);
    this.pX = null;
    this.pY = null;
    this.defaults = {
      event: "pan",
      threshold: 10,
      pointers: 1,
      direction: DIRECTION_ALL,
    };
    this.assignOptions(recognizerOptions);
  }

  getTouchAction() {
    let {
      options: { direction },
    } = this;
    let actions = [];
    if (direction & DIRECTION_HORIZONTAL) {
      actions.push(TOUCH_ACTION_PAN_Y);
    }
    if (direction & DIRECTION_VERTICAL) {
      actions.push(TOUCH_ACTION_PAN_X);
    }
    return [TOUCH_ACTION_NONE];
    // return actions;
  }

  directionTest(input: any): boolean {
    let { options } = this;
    let hasMoved = true;
    let { distance } = input;
    let { direction } = input;
    let x = input.deltaX;
    let y = input.deltaY;

    // lock to axis?
    if (!(direction & options.direction)) {
      if (options.direction & DIRECTION_HORIZONTAL) {
        direction =
          x === 0 ? DIRECTION_NONE : x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
        hasMoved = x !== this.pX;
        distance = Math.abs(input.deltaX);
      } else {
        direction =
          y === 0 ? DIRECTION_NONE : y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
        hasMoved = y !== this.pY;
        distance = Math.abs(input.deltaY);
      }
    }
    input.direction = direction;
    return (
      hasMoved && distance > options.threshold && direction && options.direction
    );
  }

  attrTest(input: any): any {
    // console.log('pan attr test: ', input, AttrRecognizer.prototype.attrTest.call(this, input), this.state, this.directionTest(input))
    return (
      AttrRecognizer.prototype.attrTest.call(this, input) &&
      (this.state & STATE_BEGAN ||
        (!(this.state & STATE_BEGAN) && this.directionTest(input)))
    );
  }

  emit(input: any) {
    // console.log('pan emit: ', input);
    this.pX = input.deltaX;
    this.pY = input.deltaY;

    let direction = directionStr(input.direction);

    if (direction) {
      input.additionalEvent = this.options.event + direction;
    }
    super.emit(input);
  }
}
