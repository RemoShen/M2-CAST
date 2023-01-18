import "../../assets/style/vl/keyframeContainer.scss";
import {
  KF_BG_LAYER,
  KF_FG_LAYER,
  KF_HINT_LAYER,
  KF_MENU_LAYER,
  KF_OMIT_LAYER,
  KF_POPCOVER_LAYER,
  KF_POPUP_LAYER,
  TRACK_HEIGHT,
  TRACK_WIDTH,
} from "./vl-consts";
import { ICoord, ISize } from "../../global-interfaces";
import { store } from "../../store";
import { createSvgElement } from "../../../util/svgManager";
import ScrollablePanel from "../scroller/scrollTarget";

export class KfContainer extends ScrollablePanel {
  static KF_CONTAINER: string = "kfTracksContainer";
  static KF_SCALE_ID: string = "kfScaleWrapper";
  static KF_LIST_ID: string = "kfList";
  static DURATION_GRADIENT: string = "durationGradient";
  static KF_HINT: string = "kfHintG";
  static SLIDER_W: number = 10;
  static WHEEL_STEP: number = 20;
  public kfWidgetContainer: HTMLDivElement;
  public kfTrackScaleContainer: SVGGElement;
  public kfTrackContainer: SVGGElement;
  public isDragging: boolean = false;
  public static showPopCover() {
    document.getElementById(KF_POPCOVER_LAYER).setAttribute("display", "");
  }
  public static hidePopCover() {
    document.getElementById(KF_POPCOVER_LAYER).setAttribute("display", "none");
  }
  public createKfContainer() {
    this.kfWidgetContainer = document.createElement("div");
    this.kfWidgetContainer.setAttribute("class", "kf-widget-container");

    //create kf container
    const keyframeTrackSVG: SVGElement = createSvgElement({
      tag: "svg",
      para: {
        id: KfContainer.KF_CONTAINER,
        class: "kf-tracks-container",
      },
      flag: true,
    });

    //add gradient
    const defs: SVGDefsElement = <SVGDefsElement>(
      createSvgElement({ tag: "defs", para: {}, flag: true })
    );
    const linearGradient: SVGLinearGradientElement = <SVGLinearGradientElement>(
      createSvgElement({
        tag: "linearGradient",
        para: {
          id: KfContainer.DURATION_GRADIENT,
        },
        flag: true,
      })
    );
    linearGradient.appendChild(
      createSvgElement({
        tag: "stop",
        para: {
          offset: "0%",
          stopColor: "rgba(119, 168, 214, 0)",
        },
        flag: true,
      })
    );
    linearGradient.appendChild(
      createSvgElement({
        tag: "stop",
        para: {
          offset: "100%",
          stopColor: "rgba(119, 168, 214, 255)",
        },
        flag: true,
      })
    );
    defs.appendChild(linearGradient);

    this.kfTrackScaleContainer = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        id: KfContainer.KF_SCALE_ID,
        transform: `scale(${store.getState().kfZoomLevel}, ${
          store.getState().kfZoomLevel
        })`,
      },
      flag: true,
    });

    this.kfTrackContainer = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        id: KfContainer.KF_LIST_ID,
        class: "kf-tracks-inner-container",
      },
      flag: true,
    });

    this.kfTrackContainer.appendChild(
      createSvgElement({
        tag: "g",
        para: {
          id: KF_BG_LAYER,
        },
        flag: true,
      })
    );

    const kfFgG: SVGGElement = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        id: KF_FG_LAYER,
      },
      flag: true,
    });
    kfFgG.appendChild(
      createSvgElement({
        tag: "rect",
        para: {
          width: "1",
          height: "18",
          fill: "#00000000",
        },
        flag: true,
      })
    );
    this.kfTrackContainer.appendChild(kfFgG);

    this.kfTrackContainer.appendChild(
      createSvgElement({
        tag: "g",
        para: {
          id: KF_OMIT_LAYER,
        },
        flag: true,
      })
    );

    const kfPopCoverG: SVGGElement = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        id: KF_POPCOVER_LAYER,
        display: "none",
      },
      flag: true,
    });
    const coverRect: SVGRectElement = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        x: "0",
        y: "0",
        fill: "rgba(0,0,0,0)",
        width: `${TRACK_WIDTH}`,
        height: `${TRACK_HEIGHT * 20}`,
      },
      flag: true,
    });
    kfPopCoverG.appendChild(coverRect);
    this.kfTrackContainer.appendChild(kfPopCoverG);

    const kfPopupG: SVGGElement = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        id: KF_POPUP_LAYER,
      },
      flag: true,
    });
    this.kfTrackContainer.appendChild(kfPopupG);

    const hintG: SVGGElement = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        id: KF_HINT_LAYER,
      },
      flag: true,
    });
    this.kfTrackContainer.appendChild(hintG);

    const menuG: SVGGElement = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        id: KF_MENU_LAYER,
      },
      flag: true,
    });
    this.kfTrackContainer.appendChild(menuG);

    this.kfTrackScaleContainer.appendChild(this.kfTrackContainer);
    keyframeTrackSVG.appendChild(this.kfTrackScaleContainer);
    this.kfWidgetContainer.appendChild(keyframeTrackSVG);
    // create y slider
    this.createYScroller();
    this.kfWidgetContainer.appendChild(this.yScroller.container);
    //create x slider
    this.createXScroller();
    this.kfWidgetContainer.appendChild(this.xScroller.container);
    this.scrollTarget = this.kfTrackContainer;
  }

  public updateKfSlider(kfGroupSize: ISize) {
    this.xScroller.update(
      kfGroupSize.width,
      this.kfWidgetContainer.clientWidth
    );
    this.yScroller.update(
      kfGroupSize.height,
      this.kfWidgetContainer.clientHeight
    );

  }
}

export let kfContainer: KfContainer = new KfContainer();
