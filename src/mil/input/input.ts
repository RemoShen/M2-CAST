import { ICoord } from "../../redux/global-interfaces";
import Manager from "../manager";
import * as util from "../utils/util";

export default class Input {
  manager: Manager;
  callback: any;
  ele: any;
  target: any;
  domHandler: any;
  evtActiveStyleHandler: any;
  evtInactiveStyleHandler: any;
  oldEvtCssProps: { [key: string]: string | number };
  eventType: number;
  isFirst: boolean;
  isFinal: boolean;
  pointers: any[];
  center: ICoord;
  angle: number;
  distance: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
  velocityX: number;
  velocityY: number;
  direction: number;
  overallVelocityX: number;
  overallVelocityY: number;
  overallVelocity: number;
  offsetDirection: number;
  changedPointers: any[];
  timeStamp: number;
  deltaTime: number;
  scale: number;
  rotation: number;
  maxPointers: number;
  additionalEvent: string;
  evEl: any;
  evTarget: any;
  evWin: any;
  srcEvent: Event;

  constructor(manager?: Manager, callback?: any) {
    const that = this;
    this.manager = manager;
    this.callback = callback;
    this.ele = this.manager.ele;
    this.target = this.manager.options.inputTarget;
    this.oldEvtCssProps = {};

    // smaller wrapper around the handler, for the scope and the enabled state of the manager,
    // so when disabled the input events are completely bypassed.
    this.domHandler = (evt: Event) => {
      if (util.boolOrFn(that.manager.options.enable, [that.manager])) {
        that.handler(evt);
      }
    };

    this.init();
  }

  /**
   * bind the events
   */
  private init() {
    //init the css props used in the evt
    if (
      this.manager.options.eventStyle &&
      typeof this.manager.options.eventStyle !== "undefined"
    ) {
      this.evtActiveStyleHandler = this.generateEvtStyleHandler(true);
      this.evtInactiveStyleHandler = this.generateEvtStyleHandler(false);
      util.createTransitionStyleCss(
        this.ele,
        Object.keys(this.manager.options.eventStyle)
      );
    }
    if (this.evEl) {
      util.addEventListeners(this.ele, this.evEl, this.domHandler);
      util.addEventListeners(this.ele, this.evEl, this.evtActiveStyleHandler);
    }

    this.evTarget &&
      util.addEventListeners(this.target, this.evTarget, this.domHandler);
    if (this.evWin) {
      util.addEventListeners(
        util.getWindowForElement(this.ele),
        this.evWin,
        this.domHandler
      );
      util.addEventListeners(
        util.getWindowForElement(this.ele),
        this.evWin
          .split(" ")
          .filter((evStr: string) => !evStr.includes("move"))
          .join(" "),
        this.evtInactiveStyleHandler
      );
    }
  }

  /**
   * unbind the events
   */
  destroy() {
    if (this.evEl) {
      util.removeEventListeners(this.ele, this.evEl, this.domHandler);
      util.removeEventListeners(
        this.ele,
        this.evEl,
        this.evtActiveStyleHandler
      );
    }
    this.evTarget &&
      util.removeEventListeners(this.target, this.evTarget, this.domHandler);
    if (this.evWin) {
      util.removeEventListeners(
        util.getWindowForElement(this.ele),
        this.evWin,
        this.domHandler
      );
      util.removeEventListeners(
        util.getWindowForElement(this.ele),
        this.evWin
          .split(" ")
          .filter((evStr: string) => !evStr.includes("move"))
          .join(" "),
        this.evtInactiveStyleHandler
      );
    }
  }

  /**
   * should handle the inputEvent data and trigger the callback
   */
  handler(evt: Event) {}

  /**
   * specify the css style to each event
   * @param active : true-> down, move;  false -> up, end, cancel
   * @returns
   */
  generateEvtStyleHandler(active: boolean): () => void {
    const that = this;
    return () => {
      Object.keys(this.manager.options.eventStyle).forEach((key: string) => {
        const value: string | number = this.manager.options.eventStyle[key];
        if (active) {
          that.oldEvtCssProps[key] = that.ele.style[key];
          that.ele.style[key] = value;
        } else {
          that.ele.style[key] = this.oldEvtCssProps[key] || "";
        }
      });
    };
  }
}
