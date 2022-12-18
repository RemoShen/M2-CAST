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
  // public xSliderContainer: SVGElement;
  // public xSliderBg: SVGRectElement;
  // public xSlider: SVGRectElement;
  // public xSliderContainerW: number = 1000;
  // public xSliderPercent: number = 1.0;
  // public ySliderContainer: SVGElement;
  // public ySliderBg: SVGRectElement;
  // public ySlider: SVGRectElement;
  // public ySliderContainerH: number = 200;
  // public ySliderPercent: number = 1.0;

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
    // this.kfWidgetContainer.onpointerenter = (enterEvt) => {
    //     // this.kfWidgetContainer.onmouseenter = (enterEvt) => {
    //     enterEvt.stopPropagation();
    //     if (!store.getState().isMouseMoving) {
    //         this.updateKfSlider({});
    //         this.showScroller();
    //     }
    // }
    // this.kfWidgetContainer.onpointerleave = (leaveEvt) => {
    //     // this.kfWidgetContainer.onmouseleave = (leaveEvt) => {
    //     leaveEvt.stopPropagation();
    //     this.hideScroller();
    // }

    // this.kfWidgetContainer.onwheel = (wheelEvt) => {
    //     if (parseFloat(this.ySlider.getAttributeNS(null, 'height')) < parseFloat(this.ySliderBg.getAttributeNS(null, 'height'))) {
    //         let diffY: number = wheelEvt.deltaY < 0 ? -KfContainer.WHEEL_STEP : KfContainer.WHEEL_STEP;
    //         const currentSliderY: number = parseFloat(this.ySlider.getAttributeNS(null, 'y'));
    //         const currentSliderH: number = parseFloat(this.ySlider.getAttributeNS(null, 'height'));
    //         if (0 - currentSliderY > diffY && diffY < 0) {
    //             diffY = 0 - currentSliderY;
    //         }
    //         if (this.ySliderContainerH - currentSliderY - currentSliderH < diffY && diffY > 0) {
    //             diffY = this.ySliderContainerH - currentSliderY - currentSliderH;
    //         }
    //         if (currentSliderY + diffY >= 0 && currentSliderY + diffY + currentSliderH <= this.ySliderContainerH) {
    //             this.ySlider.setAttributeNS(null, 'y', `${currentSliderY + diffY}`);

    //             //update translate of keyframe
    //             if (this.kfTrackContainer.getAttributeNS(null, 'transform')) {
    //                 let oriTrans: ICoord = Tool.extractTransNums(this.kfTrackContainer.getAttributeNS(null, 'transform'));
    //                 this.transDistance.height = oriTrans.y - diffY * this.ySliderPercent;
    //                 this.kfTrackContainer.setAttributeNS(null, 'transform', `translate(${oriTrans.x}, ${oriTrans.y - diffY * this.ySliderPercent})`);
    //             }
    //         }
    //     }
    // }
  }

  // /**
  //  * return whether the kfcontainer is translated
  //  * @param diffX
  //  */
  // public kfContainerTransX(diffX: number): boolean {
  //     let translated: boolean = false;
  //     const currentSliderX: number = parseFloat(this.xSlider.getAttributeNS(null, 'x'));
  //     const currentSliderW: number = parseFloat(this.xSlider.getAttributeNS(null, 'width'));
  //     if (currentSliderX + diffX >= 0 && currentSliderX + diffX + currentSliderW <= this.xSliderContainerW) {
  //         this.xSlider.setAttributeNS(null, 'x', `${currentSliderX + diffX}`);

  //         //update viewBox of keyframe
  //         if (this.kfTrackContainer.getAttributeNS(null, 'transform')) {
  //             let oriTrans: ICoord = Tool.extractTransNums(this.kfTrackContainer.getAttributeNS(null, 'transform'));
  //             this.transDistance.width = oriTrans.x - diffX * this.xSliderPercent;
  //             this.kfTrackContainer.setAttributeNS(null, 'transform', `translate(${oriTrans.x - diffX * this.xSliderPercent}, ${oriTrans.y})`);
  //         }
  //         translated = true;
  //     }
  //     return translated;
  // }

  // public kfContainerTransXStep(downEvtX: number) {
  //     const clickX: number = downEvtX - this.xSliderContainer.getBoundingClientRect().x;
  //     const currentSliderX: number = parseFloat(this.xSlider.getAttributeNS(null, 'x'));
  //     const currentSliderW: number = parseFloat(this.xSlider.getAttributeNS(null, 'width'));
  //     let transDist: number = 0;
  //     if (clickX > currentSliderX) {
  //         const diffX: number = clickX - currentSliderX - currentSliderW;
  //         transDist = diffX > KfContainer.WHEEL_STEP ? KfContainer.WHEEL_STEP : diffX;
  //     } else {
  //         const diffX: number = clickX - currentSliderX;
  //         transDist = diffX < -KfContainer.WHEEL_STEP ? -KfContainer.WHEEL_STEP : diffX;
  //     }
  //     this.kfContainerTransX(transDist);
  // }

  /**
   * return whether the kfcontainer is translated
   * @param diffY
   */
  // public kfContainerTransY(diffY: number): boolean {
  //     let translated: boolean = false;
  //     const currentSliderY: number = parseFloat(this.ySlider.getAttributeNS(null, 'y'));
  //     const currentSliderH: number = parseFloat(this.ySlider.getAttributeNS(null, 'height'));
  //     if (currentSliderY + diffY >= 0 && currentSliderY + diffY + currentSliderH <= this.ySliderContainerH) {
  //         this.ySlider.setAttributeNS(null, 'y', `${currentSliderY + diffY}`);

  //         //update translate of keyframe tracks
  //         if (this.kfTrackContainer.getAttributeNS(null, 'transform')) {
  //             let oriTrans: ICoord = Tool.extractTransNums(this.kfTrackContainer.getAttributeNS(null, 'transform'));
  //             this.transDistance.height = oriTrans.y - diffY * this.ySliderPercent;
  //             this.kfTrackContainer.setAttributeNS(null, 'transform', `translate(${oriTrans.x}, ${this.transDistance.height})`);
  //         }
  //         translated = true;
  //     }
  //     return translated;
  // }

  // public kfContainerTransYStep(downEvtY: number) {
  //     const clickY: number = downEvtY - this.ySliderContainer.getBoundingClientRect().y;
  //     const currentSliderY: number = parseFloat(this.xSlider.getAttributeNS(null, 'y'));
  //     const currentSliderH: number = parseFloat(this.xSlider.getAttributeNS(null, 'height'));
  //     let transDist: number = 0;
  //     if (clickY > currentSliderY) {
  //         const diffY: number = clickY - currentSliderY - currentSliderH;
  //         transDist = diffY > KfContainer.WHEEL_STEP ? KfContainer.WHEEL_STEP : diffY;
  //     } else {
  //         const diffY: number = clickY - currentSliderY;
  //         transDist = diffY < -KfContainer.WHEEL_STEP ? -KfContainer.WHEEL_STEP : diffY;
  //     }
  //     this.kfContainerTransY(transDist);
  // }

  // public createYSlider() {
  //     this.ySliderContainer = createSvgElement({
  //         tag: 'svg', para: {
  //             class: `kf-y-slider-container ${NON_SKETCH_CLS}`,
  //             style: `width:${KfContainer.SLIDER_W + 4}px; margin-top:${-this.ySliderContainerH}px; margin-right:${-KfContainer.SLIDER_W - 7}`
  //         }, flag: true
  //     });
  //     this.ySliderBg = createSvgElement({
  //         tag: 'rect', para: {
  //             class: 'sliderContainerBg',
  //             x: '0',
  //             y: '0',
  //             width: `${KfContainer.SLIDER_W + 4}`,
  //             height: '200',
  //             fill: '#cdcdcd'
  //         }, flag: true
  //     });
  //     this.ySliderContainer.appendChild(this.ySliderBg);
  //     this.ySlider = createSvgElement({
  //         tag: 'rect', para: {
  //             class: 'kf-slider',
  //             x: '0',
  //             y: '0',
  //             width: `${KfContainer.SLIDER_W + 4}`,
  //             height: '10000',
  //             fill: '#f2f2f2',
  //             rx: `${KfContainer.SLIDER_W / 2}`
  //         }, flag: true
  //     });
  //     this.ySlider.onmousedown = (downEvt) => {
  //         Reducer.triger(action.UPDATE_MOUSE_MOVING, true);
  //         let preY: number = downEvt.pageY;
  //         document.onmousemove = (moveEvt) => {
  //             const currentY: number = moveEvt.pageY;
  //             const diffY: number = currentY - preY;
  //             if (this.kfContainerTransY(diffY)) {
  //                 preY = currentY;
  //             }
  //         }
  //         document.onmouseup = (upEvt) => {
  //             document.onmousemove = null;
  //             document.onmouseup = null;
  //             Reducer.triger(action.UPDATE_MOUSE_MOVING, false);
  //         }
  //     }
  //     this.ySliderContainer.appendChild(this.ySlider);
  //     let yTransInterval: NodeJS.Timeout;
  //     this.ySliderContainer.onmousedown = (downEvt) => {
  //         if ((<SVGElement>downEvt.target).classList.contains('sliderContainerBg')) {
  //             this.kfContainerTransYStep(downEvt.pageY);
  //             yTransInterval = setInterval(() => {
  //                 this.kfContainerTransYStep(downEvt.pageY);
  //             }, 200)
  //         }
  //     }
  //     this.ySliderContainer.onmouseup = (upEvt) => {
  //         if (typeof yTransInterval !== 'undefined') {
  //             clearInterval(yTransInterval);
  //         }
  //     }
  //     this.kfWidgetContainer.appendChild(this.ySliderContainer);
  // }

  // public createXSlider() {
  //     this.xSliderContainer = createSvgElement({
  //         tag: 'svg', para: {
  //             class: `kf-x-slider-container ${NON_SKETCH_CLS}`,
  //             style: `height:${KfContainer.SLIDER_W + 4}px; margin-top:3px;`
  //         }, flag: true
  //     });
  //     this.xSliderBg = createSvgElement({
  //         tag: 'rect', para: {
  //             class: 'sliderContainerBg',
  //             x: '0',
  //             y: '0',
  //             width: '10000',
  //             height: `${KfContainer.SLIDER_W}`,
  //             fill: '#cdcdcd',
  //         }, flag: true
  //     });
  //     this.xSliderContainer.appendChild(this.xSliderBg);
  //     this.xSlider = createSvgElement({
  //         tag: 'rect', para: {
  //             class: 'kf-slider',
  //             x: '0',
  //             y: '0',
  //             width: '10100',
  //             height: `${KfContainer.SLIDER_W}`,
  //             fill: '#f2f2f2',
  //             rx: `${KfContainer.SLIDER_W / 2}`
  //         }, flag: true
  //     });
  //     this.xSlider.onmousedown = (downEvt) => {
  //         Reducer.triger(action.UPDATE_MOUSE_MOVING, true);
  //         let preX: number = downEvt.pageX;
  //         document.onmousemove = (moveEvt) => {
  //             moveEvt.stopPropagation();
  //             const currentX: number = moveEvt.pageX;
  //             const diffX: number = currentX - preX;
  //             if (this.kfContainerTransX(diffX)) {
  //                 preX = currentX;
  //             }
  //         }
  //         document.onmouseup = (upEvt) => {
  //             document.onmousemove = null;
  //             document.onmouseup = null;
  //             Reducer.triger(action.UPDATE_MOUSE_MOVING, false);
  //         }
  //     }
  //     this.xSliderContainer.appendChild(this.xSlider);

  //     let xTransInterval: NodeJS.Timeout;
  //     this.xSliderContainer.onmousedown = (downEvt) => {
  //         if ((<SVGElement>downEvt.target).classList.contains('sliderContainerBg')) {
  //             this.kfContainerTransXStep(downEvt.pageX);
  //             xTransInterval = setInterval(() => {
  //                 this.kfContainerTransXStep(downEvt.pageX);
  //             }, 200)
  //         }
  //     }
  //     this.xSliderContainer.onmouseup = (upEvt) => {
  //         if (typeof xTransInterval !== 'undefined') {
  //             clearInterval(xTransInterval);
  //         }
  //     }

  //     this.kfWidgetContainer.appendChild(this.xSliderContainer);
  // }

  // public resetContainerTrans(): void {
  //     this.kfTrackContainer.setAttributeNS(null, 'transform', 'translate(0, 0)');
  //     this.transDistance = { width: 0, height: 0 };
  //     this.ySlider.setAttributeNS(null, 'y', '0');
  //     this.xSlider.setAttributeNS(null, 'x', '0');
  // }

  public updateKfSlider(kfGroupSize: ISize) {
    this.xScroller.update(
      kfGroupSize.width,
      this.kfWidgetContainer.clientWidth
    );
    this.yScroller.update(
      kfGroupSize.height,
      this.kfWidgetContainer.clientHeight
    );

    // //update xslider and xslider track width
    // this.xSliderContainerW = this.kfWidgetContainer.clientWidth;
    // this.xSliderBg.setAttributeNS(null, 'width', `${this.xSliderContainerW}`);
    // if (typeof kfGroupSize.width !== 'undefined') {
    //     const widthWithExtra: number = this.xSliderContainerW - 100;
    //     this.xSliderPercent = (kfGroupSize.width) / widthWithExtra;
    //     this.xSlider.setAttributeNS(null, 'width', `${widthWithExtra * (widthWithExtra / kfGroupSize.width)}`);
    // }

    // //update yslider and yslider track height
    // this.ySliderContainerH = this.kfWidgetContainer.clientHeight;
    // this.ySliderContainer.setAttribute('style', `width:${KfContainer.SLIDER_W + 4}px; margin-top:${-this.ySliderContainerH}px; margin-right:${-KfContainer.SLIDER_W - 7}`)
    // this.ySliderBg.setAttributeNS(null, 'height', `${this.ySliderContainerH}`);
    // if (typeof kfGroupSize.height !== 'undefined') {
    //     const heightWithExtra: number = this.ySliderContainerH - 60;
    //     this.ySliderPercent = (kfGroupSize.height) / heightWithExtra;
    //     this.ySlider.setAttributeNS(null, 'height', `${heightWithExtra * (heightWithExtra / kfGroupSize.height)}`);
    // }
  }
}

export let kfContainer: KfContainer = new KfContainer();
