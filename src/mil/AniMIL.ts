import { DIRECTION_HORIZONTAL } from "./input/input-consts";
import Manager, { IManagerOptions } from "./manager";
import PanRecognizer from "./recognizer/recognizers/pan";
import PinchRecognizer from "./recognizer/recognizers/pinch";
import PressRecognizer from "./recognizer/recognizers/press";
import SwipeRecognizer from "./recognizer/recognizers/swipe";
import TapRecognizer from "./recognizer/recognizers/tap";
import { TOUCH_ACTION_COMPUTE } from "./touchAction/touchaction-consts";
import * as util from "./utils/util";

class AniMIL {
  static default: any = {
    /**
     * set if DOM events are being triggered.
     * But this is slower and unused by simple implementations, so disabled by default.
     */
    domEvents: false,

    /**
     * The value for the touchAction property/fallback.
     * When set to `compute` it will magically set the correct value based on the added recognizers.
     */
    touchAction: TOUCH_ACTION_COMPUTE,

    enable: true,

    /**
     * EXPERIMENTAL FEATURE -- can be removed/changed
     * Change the parent input target element.
     * If Null, then it is being set the to main element.
     */
    inputTarget: null,

    /**
     * force an input class
     */
    inputClass: null,

    /**
     * Default recognizer setup when calling `Hammer()`
     * When creating a new Manager these will be skipped.
     */
    preset: [
      // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
      [PinchRecognizer, { enable: false }],
      // [SwipeRecognizer, { direction: DIRECTION_HORIZONTAL }],
      // [PanRecognizer, { direction: DIRECTION_HORIZONTAL }, ['swipe']],
      // [TapRecognizer],
      // [TapRecognizer, { event: 'doubletap', taps: 2 }, ['tap']],
      // [PressRecognizer]
    ],
    /**
     * Add them to this method and they will be set when creating a new Manager.
     */
    cssProps: {
      /**
       * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
       */
      userSelect: "none",

      /**
       * Disable the Windows Phone grippers when pressing an element.
       */
      touchSelect: "none",

      /**
       * Disables the default callout shown when you touch and hold a touch target.
       * On iOS, when you touch and hold a touch target such as a link, Safari displays
       * a callout containing information about the link. This property allows you to disable that callout.
       */
      touchCallout: "none",

      /**
       * Specifies whether zooming is enabled. Used by IE10>
       */
      contentZooming: "none",

      /**
       * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
       */
      userDrag: "none",

      /**
       * Overrides the highlight color shown when the user taps a link or a JavaScript
       * clickable element in iOS. This property obeys the alpha value, if specified.
       */
      tapHighlightColor: "rgba(0,0,0,0)",
    },
  };

  constructor(ele: any, options?: IManagerOptions) {
    options = options || <IManagerOptions>{};
    console.log("creating manager: ", ele, options);
    options.recognizers = util.ifUndefined(
      options.recognizers,
      AniMIL.default.preset
    );
    return new Manager(ele, options);
  }
}

export default util.assign(AniMIL, {
  on: util.addEventListeners,
  off: util.removeEventListeners,
  Pan: PanRecognizer,
  Tap: TapRecognizer,
  Pinch: PinchRecognizer,
  Press: PressRecognizer,
  Swipe: SwipeRecognizer,
  mode: util.updateMode,
});
