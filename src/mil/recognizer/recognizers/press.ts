import Recognizer, { IRecognizerOptions } from "../Recognizer";
import { STATE_RECOGNIZED, STATE_FAILED } from "../recognizer-consts";
import { TOUCH_ACTION_AUTO } from "../../touchAction/touchaction-consts";
import { INPUT_START, INPUT_END, INPUT_CANCEL } from "../../input/input-consts";
import * as util from "../../utils/util";

/**
 * Press
 * Recognized when the pointer is down for x ms without any movement.
 */
export default class PressRecognizer extends Recognizer {
  _timer: any;
  _input: any;
  constructor(recognizerOptions: IRecognizerOptions) {
    super(recognizerOptions);
    this._timer = null;
    this._input = null;

    this.defaults = {
      event: "press",
      pointers: 1,
      time: 1000, // minimal time of the pointer to be pressed
      threshold: 9, // a minimal movement is ok, but keep it low
    };
    this.assignOptions(recognizerOptions);
  }

  getTouchAction() {
    return [TOUCH_ACTION_AUTO];
  }

  process(input: any) {
    let { options } = this;
    let validPointers = input.pointers.length === options.pointers;
    let validMovement = input.distance < options.threshold;
    let validTime = input.deltaTime > options.time;

    this._input = input;

    // console.log('processing press: ', input.eventType);
    // we only allow little movement
    // and we've reached an end event, so a tap is possible
    if (
      !validMovement ||
      !validPointers ||
      (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)
    ) {
      this.reset();
    } else if (input.eventType & INPUT_START) {
      this.reset();
      this._timer = util.setTimeoutContext(
        () => {
          this.state = STATE_RECOGNIZED;
          this.tryEmit(input);
        },
        options.time,
        this
      );
    } else if (input.eventType & INPUT_END) {
      return STATE_RECOGNIZED;
    }
    return STATE_FAILED;
  }

  reset() {
    clearTimeout(this._timer);
  }

  emit(input: any) {
    if (this.state !== STATE_RECOGNIZED) {
      return;
    }

    if (input && input.eventType & INPUT_END) {
      this.manager.emit(`${this.options.event}up`, input);
    } else {
      this._input.timeStamp = Date.now();
      this.manager.emit(this.options.event, this._input);
    }
  }
}
