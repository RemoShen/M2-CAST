import Recognizer from "./recognizer/Recognizer";
import TouchAction from "./touchAction/touchaction";
import * as util from "./utils/util";
import {
  STATE_RECOGNIZED,
  STATE_BEGAN,
  STATE_CHANGED,
  STATE_ENDED,
} from "./recognizer/recognizer-consts";
import AniMIL from "./AniMIL";
import { prefixed } from "./utils/prefix";

export interface IEvtStyle {
  [key: string]: string | number;
}

export interface IManagerOptions {
  enable?: boolean;
  inputTarget?: any;
  recognizers?: any[];
  inputClass?: any;
  touchAction?: string;
  cssProps?: any;
  eventStyle?: IEvtStyle;
  domEvents?: any;
}

const STOP = 1;
const FORCED_STOP = 2;

export default class Manager {
  options: IManagerOptions = {};
  handlers: any;
  session: any;
  recognizers: Recognizer[];
  oldCssProps: { [key: string]: string | number };
  ele: any;
  input: any;
  touchAction: TouchAction;

  constructor(ele: any, options: IManagerOptions) {
    util.assign(this.options, AniMIL.default, options || {});
    this.options.inputTarget = this.options.inputTarget || ele;

    this.handlers = {};
    this.session = {};
    this.recognizers = [];
    this.oldCssProps = {};

    this.ele = ele;
    this.input = util.createInputInstance(this);
    this.touchAction = new TouchAction(this, this.options.touchAction);

    this.toggleCssProps(true);

    util.each(
      this.options.recognizers,
      (item: any) => {
        let recognizer: Recognizer = <Recognizer>this.add(new item[0](item[1]));
        item[2] && recognizer.recognizeWith(item[2]);
        item[3] && recognizer.requireFailure(item[3]);
      },
      this
    );
  }

  on(events: string, handler: any) {
    if (events === undefined) {
      return;
    }
    if (handler === undefined) {
      return;
    }

    let { handlers } = this;
    util.splitStr(events).forEach((evt: string) => {
      handlers[evt] = handlers[evt] || [];
      handlers[evt].push(handler);
    });
    return this;
  }

  off(events: string, handler: any) {
    if (events === undefined) {
      return;
    }

    let { handlers } = this;
    util.splitStr(events).forEach((evt: string) => {
      if (!handler) {
        delete handlers[evt];
      } else {
        handlers[evt] &&
          handlers[evt].splice(util.inArray(handlers[evt], handler), 1);
      }
    });
    return this;
  }

  /**
   * get a recognizer by its event name.
   */
  get(recognizer: any) {
    if (recognizer instanceof Recognizer) {
      return recognizer;
    }

    let { recognizers } = this;
    for (let i = 0; i < recognizers.length; i++) {
      if (recognizers[i].options.event === recognizer) {
        return recognizers[i];
      }
    }
    return null;
  }

  /**
   * existing recognizers with the same event name will be removed
   */
  add(recognizer: Recognizer) {
    if (util.invokeArrayArg(recognizer, "add", this)) {
      return this;
    }

    // remove existing
    let existing = this.get(recognizer.options.event);
    if (existing) {
      this.remove(existing);
    }
    this.recognizers.push(recognizer);
    recognizer.manager = this;

    this.touchAction.update();
    return recognizer;
  }

  /**
   * remove a recognizer by name or instance
   */
  remove(recognizer: Recognizer) {
    if (util.invokeArrayArg(recognizer, "remove", this)) {
      return this;
    }

    recognizer = this.get(recognizer);

    // let's make sure this recognizer exists
    if (recognizer) {
      let { recognizers } = this;
      let index = util.inArray(recognizers, recognizer);

      if (index !== -1) {
        recognizers.splice(index, 1);
        this.touchAction.update();
      }
    }

    return this;
  }

  /**
   * add/remove the css properties as defined in manager.options.cssProps
   */
  private toggleCssProps(add: boolean) {
    let { ele } = this;
    if (!ele.style) {
      return;
    }
    let prop;

    const that = this;
    Object.keys(this.options.cssProps).forEach((name: string) => {
      const value: string = this.options.cssProps[name];
      const prop: string = prefixed(ele.style, name);
      if (add) {
        that.oldCssProps[prop] = ele.style[prop];
        ele.style[prop] = value;
      } else {
        ele.style[prop] = this.oldCssProps[prop] || "";
      }
    });

    if (!add) {
      this.oldCssProps = {};
    }
  }

  /**
   * trigger dom event
   */
  private triggerDomEvent = (event: string, data: any) => {
    // console.log('trigering dom event: ', event, data);
    let gestureEvent = document.createEvent("Event");
    gestureEvent.initEvent(event, true, true);
    (<any>gestureEvent).gesture = data;
    data.target.dispatchEvent(gestureEvent);
  };

  /**
   * emit event to the listeners
   */
  emit(event: string, data: any) {
    // we also want to trigger dom events
    if (this.options.domEvents) {
      this.triggerDomEvent(event, data);
    }

    // no handlers, so skip it all
    let handlers = this.handlers[event] && this.handlers[event].slice();
    if (!handlers || !handlers.length) {
      return;
    }

    data.type = event;
    data.preventDefault = function () {
      data.srcEvent.preventDefault();
    };

    let i = 0;
    while (i < handlers.length) {
      handlers[i](data);
      i++;
    }
  }

  /**
   * run the recognizers!
   * called by the inputHandler function on every movement of the pointers (touches)
   * it walks through all the recognizers and tries to detect the gesture that is being made
   */
  recognize(inputData: any) {
    let { session } = this;
    if (session.stopped) {
      return;
    }

    // run the touch-action polyfill
    this.touchAction.preventDefaults(inputData);

    let recognizer;
    let { recognizers } = this;

    // this holds the recognizer that is being recognized.
    // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
    // if no recognizer is detecting a thing, it is set to `null`
    let { curRecognizer } = session;

    // reset when the last recognizer is recognized
    // or when we're in a new session
    if (
      !curRecognizer ||
      (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)
    ) {
      curRecognizer = session.curRecognizer = null;
    }

    let i = 0;
    while (i < recognizers.length) {
      recognizer = recognizers[i];

      // find out if we are allowed try to recognize the input for this one.
      // 1.   allow if the session is NOT forced stopped (see the .stop() method)
      // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
      //      that is being recognized.
      // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
      //      this can be setup with the `recognizeWith()` method on the recognizer.
      if (
        session.stopped !== FORCED_STOP && // 1
        (!curRecognizer ||
          recognizer === curRecognizer || // 2
          recognizer.canRecognizeWith(curRecognizer))
      ) {
        // 3
        recognizer.recognize(inputData);
      } else {
        recognizer.reset();
      }

      // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
      // current active recognizer. but only if we don't already have an active recognizer
      if (
        !curRecognizer &&
        recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)
      ) {
        curRecognizer = session.curRecognizer = recognizer;
      }
      i++;
    }
  }

  destroy() {
    this.ele && this.toggleCssProps(false);

    this.handlers = {};
    this.session = {};
    this.input.destroy();
    this.ele = null;
  }
}
