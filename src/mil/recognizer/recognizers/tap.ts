import Recognizer, { IRecognizerOptions } from "../Recognizer";
import { TOUCH_ACTION_MANIPULATION } from "../../touchAction/touchaction-consts";
import { INPUT_START, INPUT_END } from "../../input/input-consts";
import {
  STATE_RECOGNIZED,
  STATE_BEGAN,
  STATE_FAILED,
} from "../recognizer-consts";
import { getDistance } from "../../input/input-util";
import * as util from "../../utils/util";

/**
 * @private
 * A tap is recognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
 * between the given interval and position. The delay option can be used to recognize multi-taps without firing
 * a single tap.
 *
 * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
 * multi-taps being recognized.
 * @constructor
 * @extends Recognizer
 */
export default class TapRecognizer extends Recognizer {
  pTime: number;
  pCenter: any;
  _timer: any;
  _input: any;
  count: number;
  defaults: any;

  constructor(recognizerOptions: IRecognizerOptions) {
    super(recognizerOptions);

    // previous time and center,
    // used for tap counting
    this.pTime = null;
    this.pCenter = false;

    this._timer = null;
    this._input = null;
    this.count = 0;

    this.defaults = {
      event: "tap",
      pointers: 1,
      taps: 1,
      interval: 200, // max time between the multi-tap taps
      time: 250, // max time of the pointer to be down (like finger on the screen)
      threshold: 9, // a minimal movement is ok, but keep it low
      posThreshold: 10, // a multi-tap can be a bit off the initial position
    };

    this.assignOptions(recognizerOptions);
  }

  getTouchAction() {
    return [TOUCH_ACTION_MANIPULATION];
  }

  process(input: any) {
    let { options } = this;

    let validPointers = input.pointers.length === options.pointers;
    let validMovement = input.distance < options.threshold;
    let validTouchTime = input.deltaTime < options.time;

    this.reset();

    if (input.eventType & INPUT_START && this.count === 0) {
      return this.failTimeout();
    }

    // we only allow little movement
    // and we've reached an end event, so a tap is possible
    // console.log('check valid tap: ', validPointers, validMovement, validTouchTime, options, input);
    if (validMovement && validTouchTime && validPointers) {
      if (input.eventType !== INPUT_END) {
        return this.failTimeout();
      }

      let validInterval =
        this.pTime === null
          ? input.timeStamp - this.pTime < options.interval
          : true;
      let validMultiTap =
        this.pCenter !== null ||
        getDistance(this.pCenter, input.center) < options.posThreshold;

      this.pTime = input.timeStamp;
      this.pCenter = input.center;

      if (!validMultiTap || !validInterval) {
        this.count = 1;
      } else {
        this.count += 1;
      }

      this._input = input;
      // console.log('processing tap: ', input.eventType);
      // if tap count matches we have recognized it,
      // else it has began recognizing...
      let tapCount = this.count % options.taps;
      // console.log('tap count: ', tapCount);
      if (tapCount === 0) {
        // no failing requirements, immediately trigger the tap event
        // or wait as long as the multitap interval to trigger
        if (!this.hasRequireFailures()) {
          // console.log('tap recognized');
          return STATE_RECOGNIZED;
        } else if (input.eventType & INPUT_END) {
          return STATE_RECOGNIZED;
        } else {
          this._timer = util.setTimeoutContext(
            () => {
              this.state = STATE_RECOGNIZED;
              this.tryEmit(input);
            },
            options.interval,
            this
          );
          // console.log('tap begin');
          return STATE_BEGAN;
        }
      }
    }
    return STATE_FAILED;
  }

  failTimeout() {
    this._timer = util.setTimeoutContext(
      () => {
        this.state = STATE_FAILED;
      },
      this.options.interval,
      this
    );
    return STATE_FAILED;
  }

  reset() {
    clearTimeout(this._timer);
  }

  emit(input: any) {
    // console.log('emit in tap: ', this.state, this.options.event, input);
    if (this.state === STATE_RECOGNIZED) {
      if (input && input.eventType & INPUT_END) {
        this.manager.emit(`${this.options.event}up`, input);
      } else {
        this._input.tapCount = this.count;
        this.manager.emit(this.options.event, this._input);
      }
    }
  }
}
