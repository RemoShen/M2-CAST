import { ISize } from "../../global-interfaces";
import Scroller from "./scroller";
import {
  SCROLLER_DIRECT_X,
  SCROLLER_DIRECT_Y,
  SCROLLER_W,
} from "./scroller-consts";

export default class ScrollablePanel {
  scrollTarget: SVGGElement;
  transDistance: ISize = { width: 0, height: 0 };
  xScroller: Scroller;
  yScroller: Scroller;

  createXScroller() {
    this.xScroller = new Scroller(this, SCROLLER_DIRECT_X);
  }

  createYScroller() {
    this.yScroller = new Scroller(this, SCROLLER_DIRECT_Y);
  }

  showScroller() {
    if (
      parseFloat(this.xScroller.scrollerBlock.getAttributeNS(null, "width")) <
      parseFloat(this.xScroller.scrollerBg.getAttributeNS(null, "width"))
    ) {
      this.xScroller.container.setAttribute(
        "style",
        `height:${SCROLLER_W + 4}px; margin-top:${-SCROLLER_W}px`
      );
    }
    if (
      parseFloat(this.yScroller.scrollerBlock.getAttributeNS(null, "height")) <
      parseFloat(this.yScroller.scrollerBg.getAttributeNS(null, "height"))
    ) {
      this.yScroller.container.setAttribute(
        "style",
        `width:${SCROLLER_W + 4}px; margin-top:${-this.yScroller
          .scrollerRange}px;`
      );
    }
  }

  hideScroller() {
    this.xScroller.container.setAttribute(
      "style",
      `height:${SCROLLER_W + 4}px; margin-top:3px;`
    );
    this.yScroller.container.setAttribute(
      "style",
      `width:${SCROLLER_W + 4}px; margin-top:${-this.yScroller
        .scrollerRange}px; margin-right:${-SCROLLER_W - 7}`
    );
  }

  scroll(dist: { w?: number; h?: number }) {
    dist.w && this.xScroller.translateTarget(dist.w);
    dist.h && this.yScroller.translateTarget(dist.h);
  }

  resetScroll() {
    this.scrollTarget.setAttributeNS(null, "transform", `translate(0, 0)`);
    this.transDistance = { width: 0, height: 0 };
    this.xScroller.reset();
    this.yScroller.reset();
  }
}
