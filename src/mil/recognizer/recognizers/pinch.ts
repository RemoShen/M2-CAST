import AttrRecognizer from "./attribute";
import { TOUCH_ACTION_NONE } from "../../touchAction/touchaction-consts";
import { STATE_BEGAN } from "../../recognizer/recognizer-consts";
import { IRecognizerOptions } from "../Recognizer";

/**
 * Pinch
 * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
 */
export default class PinchRecognizer extends AttrRecognizer {
  constructor(recognizerOptions: IRecognizerOptions) {
    super(recognizerOptions);
    this.defaults = {
      event: "pinch",
      threshold: 0,
      pointers: 2,
    };
    this.assignOptions(recognizerOptions);
  }

  getTouchAction() {
    return [TOUCH_ACTION_NONE];
  }

  attrTest(input: any): any {
    return (
      super.attrTest(input) &&
      (Math.abs(input.scale - 1) > this.options.threshold ||
        this.state & STATE_BEGAN)
    );
  }

  emit(input: any) {
    if (input.scale !== 1) {
      let inOut = input.scale < 1 ? "in" : "out";
      input.additionalEvent = this.options.event + inOut;
    }
    super.emit(input);
  }
}
