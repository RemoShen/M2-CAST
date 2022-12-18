/**
 * @private
 * Recognizer flow explained; *
 * All recognizers have the initial state of POSSIBLE when a input session starts.
 * The definition of a input session is from the first input until the last input, with all it's movement in it. *
 * Example session for mouse-input: mousedown -> mousemove -> mouseup
 *
 * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
 * which determines with state it should be.
 *
 * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
 * POSSIBLE to give it another change on the next cycle.
 *
 *               Possible
 *                  |
 *            +-----+---------------+
 *            |                     |
 *      +-----+-----+               |
 *      |           |               |
 *   Failed      Cancelled          |
 *                          +-------+------+
 *                          |              |
 *                      Recognized       Began
 *                                         |
 *                                      Changed
 *                                         |
 *                                  Ended/Recognized
 */

import Input from "../input/input";
import Manager from "../manager";
import * as util from "../utils/util";
import * as recognizerState from "./recognizer-consts";

export interface IRecognizerOptions {
  enable?: boolean;
  event?: string;
  pointers?: number;
  direction?: any;
  threshold?: number;
  time?: number;
  interval?: number;
  posThreshold?: number;
  taps?: number;
  velocity?: number;
}

export default class Recognizer {
  options: IRecognizerOptions = {};
  id: number;
  manager: Manager;
  state: number;
  simultaneous: any;
  requireFail: any[];
  defaults: any;

  constructor(options: IRecognizerOptions) {
    // util.assign(this.options, this.defaults, options || {});
    this.assignOptions(options);
    this.id = util.uniqueId();
    this.manager = null;
    this.options.enable = util.ifUndefined(this.options.enable, true); // default is enable true
    this.state = recognizerState.STATE_POSSIBLE;
    this.simultaneous = {};
    this.requireFail = [];
  }

  assignOptions(options: any) {
    util.assign(this.options, this.defaults, options || {});
  }

  set(options: IRecognizerOptions) {
    Object.assign(this.options, options);
  }

  /**
   * return the preferred touch-action
   */
  getTouchAction(): string[] {
    return [];
  }

  /**
   * get a recognizer by name if it is bound to a manager
   */
  getRecognizerByNameIfManager(
    otherRecognizer: Recognizer,
    recognizer: Recognizer
  ) {
    let { manager } = recognizer;
    if (manager) {
      return manager.get(otherRecognizer);
    }
    return otherRecognizer;
  }

  /**
   * recognize simultaneous with an other recognizer.
   */
  recognizeWith(otherRecognizer: Recognizer): Recognizer {
    if (util.invokeArrayArg(otherRecognizer, "recognizeWith", this)) {
      return this;
    }

    let { simultaneous } = this;
    // console.log('otherRecognizer:', otherRecognizer);
    otherRecognizer = this.getRecognizerByNameIfManager(otherRecognizer, this);
    if (!simultaneous[otherRecognizer.id]) {
      simultaneous[otherRecognizer.id] = otherRecognizer;
      otherRecognizer.recognizeWith(this);
    }
    return this;
  }

  /**
   * if the recognizer can recognize simultaneous with an other recognizer
   */
  canRecognizeWith(otherRecognizer: Recognizer) {
    return !!this.simultaneous[otherRecognizer.id];
  }

  /**
   * update the recognizer
   */
  recognize(inputData: any) {
    // make a new copy of the inputData
    // so we can change the inputData without messing up the other recognizers
    let inputDataClone = Object.assign({}, inputData);

    // is is enabled and allow recognizing?
    if (!util.boolOrFn(this.options.enable, [this, inputDataClone])) {
      this.reset();
      this.state = recognizerState.STATE_FAILED;
      return;
    }
    // reset when we've reached the end
    if (
      this.state &
      (recognizerState.STATE_RECOGNIZED |
        recognizerState.STATE_CANCELLED |
        recognizerState.STATE_FAILED)
    ) {
      this.state = recognizerState.STATE_POSSIBLE;
    }

    this.state = this.process(inputDataClone);

    // console.log('recognizing in recognizer: ', this.state, (!util.boolOrFn(this.options.enable, [this, inputDataClone])), inputData);
    // the recognizer has recognized a gesture
    // so trigger an event
    if (
      this.state &
      (recognizerState.STATE_BEGAN |
        recognizerState.STATE_CHANGED |
        recognizerState.STATE_ENDED |
        recognizerState.STATE_CANCELLED)
    ) {
      this.tryEmit(inputDataClone);
    }
  }

  /**
   * recognizer can only run when an other is failing
   */
  requireFailure(otherRecognizer: Recognizer): Recognizer {
    if (util.invokeArrayArg(otherRecognizer, "requireFailure", this)) {
      return this;
    }

    let { requireFail } = this;
    otherRecognizer = this.getRecognizerByNameIfManager(otherRecognizer, this);
    if (util.inArray(requireFail, otherRecognizer) === -1) {
      requireFail.push(otherRecognizer);
      otherRecognizer.requireFailure(this);
    }
    return this;
  }

  /**
   * has require failures boolean
   */
  hasRequireFailures() {
    return this.requireFail.length > 0;
  }

  /**
   * return the state of the recognizer
   * the actual recognizing happens in this method
   */
  process(inputData: any): number {
    return -1;
  }

  /**
   * You should use `tryEmit` instead of `emit` directly to check
   * that all the needed recognizers has failed before emitting.
   */
  emit(input: Input) {
    let that = this;
    let { state } = this;

    function emit(event: string) {
      that.manager.emit(event, input);
    }

    // 'panstart' and 'panmove'
    if (state < recognizerState.STATE_ENDED) {
      emit(that.options.event + recognizerState.stateStr(state));
    }

    emit(that.options.event); // simple 'eventName' events

    if (input.additionalEvent) {
      // additional event(panleft, panright, pinchin, pinchout...)
      emit(input.additionalEvent);
    }

    // panend and pancancel
    if (state >= recognizerState.STATE_ENDED) {
      emit(that.options.event + recognizerState.stateStr(state));
    }
  }

  /**
   * Check that all the require failure recognizers has failed,
   * if true, it emits a gesture event,
   * otherwise, setup the state to FAILED.
   */
  tryEmit(input: Input) {
    if (this.canEmit()) {
      return this.emit(input);
    }
    // it's failing anyway
    this.state = recognizerState.STATE_FAILED;
  }

  /**
   * can we emit?
   */
  canEmit() {
    let i = 0;
    while (i < this.requireFail.length) {
      if (
        !(
          this.requireFail[i].state &
          (recognizerState.STATE_FAILED | recognizerState.STATE_POSSIBLE)
        )
      ) {
        return false;
      }
      i++;
    }
    return true;
  }

  /**
   * called when the gesture isn't allowed to recognize
   * like when another is being recognized or it is disabled
   */
  reset() {}
}
