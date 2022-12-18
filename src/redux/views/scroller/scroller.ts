import { jsTool } from "../../../util/jsTool";
import { createSvgElement } from "../../../util/svgManager";
import { NON_SKETCH_CLS } from "../../global-consts";
import { ICoord } from "../../global-interfaces";
import {
  SCROLLER_DIRECT_X,
  SCROLLER_DIRECT_Y,
  SCROLLER_PERCENT,
  SCROLLER_W,
  STEP_LEN,
} from "./scroller-consts";
import ScrollablePanel from "./scrollTarget";

export default class Scroller {
  target: ScrollablePanel;
  direct: number;
  container: SVGElement;
  scrollerBg: SVGRectElement;
  scrollerBlock: SVGRectElement;
  scrollerRange: number = 1000;
  scrollPercent: number = SCROLLER_PERCENT;
  constructor(target: ScrollablePanel, direct: number) {
    this.target = target;
    this.direct = direct;
    this.container = createSvgElement({
      tag: "svg",
      para: {
        class: `${
          this.direct === SCROLLER_DIRECT_X
            ? "x-scroller-container"
            : "y-scroller-container"
        } ${NON_SKETCH_CLS}`,
        style: `${
          this.direct === SCROLLER_DIRECT_X
            ? "height:" + (SCROLLER_W + 4)
            : "width:" + (SCROLLER_W + 4)
        }px; margin-top:3px;`,
      },
      flag: true,
    });
    this.scrollerBg = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        class: "sliderContainerBg",
        x: "0",
        y: "0",
        width: `${this.direct === SCROLLER_DIRECT_X ? 1000 : SCROLLER_W + 4}`,
        height: `${this.direct === SCROLLER_DIRECT_X ? SCROLLER_W : 200}`,
        fill: "#cdcdcd",
      },
      flag: true,
    });
    this.container.appendChild(this.scrollerBg);
    this.scrollerBlock = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        class: "scroller",
        x: "0",
        y: "0",
        width: `${this.direct === SCROLLER_DIRECT_X ? 10100 : SCROLLER_W + 4}`,
        height: `${this.direct === SCROLLER_DIRECT_X ? SCROLLER_W : 10100}`,
        fill: "#f2f2f2",
        rx: `${SCROLLER_W / 2}`,
      },
      flag: true,
    });
    this.container.appendChild(this.scrollerBlock);
    this.bindScrollerEvents();
  }
  bindScrollerEvents() {
    let prePosi: number = 0;
    const documentPointerMove = (moveEvt: PointerEvent) => {
      console.log("scrollerpoint");

      moveEvt.stopPropagation();
      const currentPosi: number =
        this.direct === SCROLLER_DIRECT_X ? moveEvt.pageX : moveEvt.pageY;
      const diffPosi: number = currentPosi - prePosi;
      if (this.translateTarget(diffPosi)) {
        prePosi = currentPosi;
      }
    };
    const documentPointerUp = () => {
      document.removeEventListener("pointermove", documentPointerMove);
      document.removeEventListener("pointerup", documentPointerUp);
      // Reducer.triger(UPDATE_MOUSE_MOVING, false);
      // store.dispatch(updateMouseMoving(false));
    };
    this.scrollerBlock.addEventListener(
      "pointerdown",
      (downEvt: PointerEvent) => {
        // Reducer.triger(UPDATE_MOUSE_MOVING, true);
        // store.dispatch(updateMouseMoving(true));
        prePosi =
          this.direct === SCROLLER_DIRECT_X ? downEvt.pageX : downEvt.pageY;
        document.addEventListener("pointermove", documentPointerMove);
        document.addEventListener("pointerup", documentPointerUp);
      }
    );
  }

  translateTarget(dist: number) {
    let translated: boolean = false;
    const currentSliderX: number = parseFloat(
      this.scrollerBlock.getAttributeNS(null, "x")
    );
    const currentSliderW: number = parseFloat(
      this.scrollerBlock.getAttributeNS(null, "width")
    );
    const currentSliderY: number = parseFloat(
      this.scrollerBlock.getAttributeNS(null, "y")
    );
    const currentSliderH: number = parseFloat(
      this.scrollerBlock.getAttributeNS(null, "height")
    );
    if (
      this.direct === SCROLLER_DIRECT_X &&
      // currentSliderX + dist >= 0 &&
      currentSliderX + dist + currentSliderW <= this.scrollerRange
    ) {
      this.scrollerBlock.setAttributeNS(null, "x", `${currentSliderX + dist}`);
      //update viewBox of keyframe
      if (this.target.scrollTarget.getAttributeNS(null, "transform")) {
        let oriTrans: ICoord = jsTool.extractTransNums(
          this.target.scrollTarget.getAttributeNS(null, "transform")
        );
        this.target.transDistance.width = Math.min(
          0,
          oriTrans.x - dist * this.scrollPercent
        );
        this.target.scrollTarget.setAttributeNS(
          null,
          "transform",
          `translate(${this.target.transDistance.width}, ${oriTrans.y})`
        );
      }
      translated = true;
    } else if (
      this.direct === SCROLLER_DIRECT_Y &&
      // currentSliderY + dist >= 0 &&
      currentSliderY + dist + currentSliderH <= this.scrollerRange
    ) {
      this.scrollerBlock.setAttributeNS(null, "y", `${currentSliderY + dist}`);
      //update translate of keyframe tracks
      if (this.target.scrollTarget.getAttributeNS(null, "transform")) {
        let oriTrans: ICoord = jsTool.extractTransNums(
          this.target.scrollTarget.getAttributeNS(null, "transform")
        );
        this.target.transDistance.height = Math.min(
          0,
          oriTrans.y - dist * this.scrollPercent
        );
        this.target.scrollTarget.setAttributeNS(
          null,
          "transform",
          `translate(${oriTrans.x}, ${this.target.transDistance.height})`
        );
      }
      translated = true;
    }
    return translated;
  }

  translateTargetStep(downEvt: PointerEvent) {
    const clickPosi: number =
      this.direct === SCROLLER_DIRECT_X
        ? downEvt.pageX - this.container.getBoundingClientRect().x
        : downEvt.pageY - this.container.getBoundingClientRect().y;
    const currentSliderX: number = parseFloat(
      this.scrollerBlock.getAttributeNS(null, "x")
    );
    const currentSliderW: number = parseFloat(
      this.scrollerBlock.getAttributeNS(null, "width")
    );
    const currentSliderY: number = parseFloat(
      this.scrollerBlock.getAttributeNS(null, "y")
    );
    const currentSliderH: number = parseFloat(
      this.scrollerBlock.getAttributeNS(null, "height")
    );
    let transDist: number = 0;
    if (this.direct === SCROLLER_DIRECT_X) {
      if (clickPosi > currentSliderX) {
        const diffX: number = clickPosi - currentSliderX - currentSliderW;
        transDist = diffX > STEP_LEN ? STEP_LEN : diffX;
      } else {
        const diffX: number = clickPosi - currentSliderX;
        transDist = diffX < -STEP_LEN ? -STEP_LEN : diffX;
      }
    } else if (this.direct === SCROLLER_DIRECT_Y) {
      if (clickPosi > currentSliderY) {
        const diffY: number = clickPosi - currentSliderY - currentSliderH;
        transDist = diffY > STEP_LEN ? STEP_LEN : diffY;
      } else {
        const diffY: number = clickPosi - currentSliderY;
        transDist = diffY < -STEP_LEN ? -STEP_LEN : diffY;
      }
    }
    this.translateTarget(transDist);
  }

  update(contentSize: number, range: number) {
    this.scrollerRange = range;
    if (this.direct === SCROLLER_DIRECT_Y) {
      this.container.setAttribute(
        "style",
        `width:${SCROLLER_W + 4}px; margin-top:${-this
          .scrollerRange}px; margin-right:${-SCROLLER_W - 7}`
      );
      this.scrollerBg.setAttributeNS(null, "height", `${this.scrollerRange}`);
      if (contentSize && typeof contentSize !== "undefined") {
        const heightWithExtra: number = this.scrollerRange - 60;
        this.scrollPercent = contentSize / heightWithExtra;
        this.scrollerBlock.setAttributeNS(
          null,
          "height",
          `${heightWithExtra * (heightWithExtra / contentSize)}`
        );
      }
    } else if (this.direct === SCROLLER_DIRECT_X) {
      this.scrollerBg.setAttributeNS(null, "width", `${this.scrollerRange}`);
      if (contentSize && typeof contentSize !== "undefined") {
        const widthWithExtra: number = this.scrollerRange - 100;
        this.scrollPercent = contentSize / widthWithExtra;
        this.scrollerBlock.setAttributeNS(
          null,
          "width",
          `${widthWithExtra * (widthWithExtra / contentSize)}`
        );
      }
    }
  }

  reset() {
    this.scrollerBlock.setAttributeNS(
      null,
      this.direct === SCROLLER_DIRECT_X ? "x" : "y",
      "0"
    );
  }
}
