import Recognizer, { IRecognizerOptions } from "../Recognizer";
import {
  STATE_BEGAN,
  STATE_CHANGED,
  STATE_CANCELLED,
  STATE_ENDED,
  STATE_FAILED,
} from "../recognizer-consts";
import { INPUT_CANCEL, INPUT_END } from "../../input/input-consts";

/**
 * @private
 * This recognizer is just used as a base for the simple attribute recognizers.
 * @constructor
 * @extends Recognizer
 */
export default class AttrRecognizer extends Recognizer {
  constructor(recognizerOptions: IRecognizerOptions) {
    super(recognizerOptions);
    this.defaults = {
      pointers: 1,
    };
    this.assignOptions(recognizerOptions);
  }

  /**
   * @private
   * Used to check if it the recognizer receives valid input, like input.distance > 10.
   * @memberof AttrRecognizer
   * @param {Object} input
   * @returns {Boolean} recognized
   */
  attrTest(input: any) {
    let optionPointers = this.options.pointers;
    return optionPointers === 0 || input.pointers.length === optionPointers;
  }

  /**
   * @private
   * Process the input and return the state for the recognizer
   * @memberof AttrRecognizer
   * @param {Object} input
   * @returns {*} State
   */
  process(input: any) {
    let { state } = this;
    let { eventType } = input;

    let isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
    let isValid = this.attrTest(input);
    // console.log('processing', this, isValid);

    // on cancel input and we've recognized before, return STATE_CANCELLED
    if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
      return state | STATE_CANCELLED;
    } else if (isRecognized || isValid) {
      if (eventType & INPUT_END) {
        return state | STATE_ENDED;
      } else if (!(state & STATE_BEGAN)) {
        return STATE_BEGAN;
      }
      return state | STATE_CHANGED;
    }
    return STATE_FAILED;
  }
}
