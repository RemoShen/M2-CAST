import AttrRecognizer from "../recognizers/attribute";
import {
  DIRECTION_HORIZONTAL,
  DIRECTION_VERTICAL,
  INPUT_END,
} from "../../input/input-consts";
import PanRecognizer from "./pan";
import { directionStr } from "../recognizer-consts";
import { IRecognizerOptions } from "../Recognizer";

/**
 * Swipe
 * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
 */
export default class SwipeRecognizer extends AttrRecognizer {
  constructor(recognizerOptions: IRecognizerOptions) {
    super(recognizerOptions);
    this.defaults = {
      event: "swipe",
      threshold: 10,
      velocity: 0.3,
      direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
      pointers: 1,
    };
    this.assignOptions(recognizerOptions);
  }

  getTouchAction() {
    return PanRecognizer.prototype.getTouchAction.call(this);
  }

  attrTest(input: any): any {
    let { direction } = this.options;
    let velocity;

    if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
      velocity = input.overallVelocity;
    } else if (direction & DIRECTION_HORIZONTAL) {
      velocity = input.overallVelocityX;
    } else if (direction & DIRECTION_VERTICAL) {
      velocity = input.overallVelocityY;
    }

    return (
      super.attrTest(input) &&
      direction & input.offsetDirection &&
      input.distance > this.options.threshold &&
      input.maxPointers === this.options.pointers &&
      Math.abs(velocity) > this.options.velocity &&
      input.eventType & INPUT_END
    );
  }

  emit(input: any) {
    let direction = directionStr(input.offsetDirection);
    if (direction) {
      this.manager.emit(this.options.event + direction, input);
    }

    this.manager.emit(this.options.event, input);
  }
}
