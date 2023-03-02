import "../../assets/style/vl/kfTimingIllus.scss";
import KfTrack from "./kfTrack";
import KfItem from "./kfItem";
import KfOmit from "./kfOmit";
import SliderBubble from "../bubble/sliderBubble";
import { BUBBLE_FROM_BOTTOM } from "../bubble/bubble-consts";
import { callSysMenu } from "../menu/menu-interactions";
import { TIMING_DURATION, TIMING_OFFSET } from "./vl-consts";
import { NON_SKETCH_CLS } from "../../global-consts";
import { ICoord } from "../../global-interfaces";
import { store } from "../../store";
import { NUMERIC_SLIDER } from "../slider/slider-consts";
import { transNodeElements } from "../../../util/tool";
import { createSvgElement } from "../../../util/svgManager";
import { updateHighlightKf } from "../../action/vlAction";
import {
  updateAniOffset,
  updateDuration,
  UPDATE_DELAY_BETWEEN_GROUP,
  UPDATE_DELAY_BETWEEN_KF,
} from "../../action/canisAction";
import { toggleSystemTouch } from "../panels/interactions";

export default class KfTimingIllus {
  static SCALE_DOWN: string = "scaleDown";
  static SCALE_UP: string = "scaleUp";

  static BASIC_OFFSET_DURATION_W: number = 20;
  static OFFSET_COLOR: string = "#ff9246";
  static OFFSET_STRETCH_COLOR: string = "#ea5514";
  static DURATION_COLOR: string = "#71b1ed";
  static DURATION_STRETCH_COLOR: string = "#358bcb";
  static TIMING_TYPE_OFFSET: string = "offset";
  static TIMING_TYPE_DURATION: string = "duration";
  static EXTRA_HEIGHT: number = 7; //for hidden duration
  static minDuration: number = 300;
  static maxDuration: number = 0;
  static minOffset: number = 300;
  static maxOffset: number = 0;

  public isDragging: boolean = false;
  public aniId: string;
  public parentObj: any;
  public id: number;
  public groupRef: string;
  public timingType: string;

  public mouseIsOver: boolean = false;

  public hasOffset: boolean = false;
  public offsetType: string = "";
  public offsetNum: number = 0;
  public _offsetDiff: number = 0;
  public offsetIllus: SVGGElement;
  public offsetBg: SVGRectElement;
  public offsetWidth: number = 0;
  public groupRx: number = 0;
  public offsetIcon: SVGGElement;

  public hasHiddenDuration: boolean = false; //previous start + delay
  public hasDuration: boolean = false;
  public durationNum: number = 0;
  public _durationDiff: number = 0;
  public durationIllus: SVGGElement;
  public durationBg: SVGRectElement;
  public durationIcon: SVGGElement;
  public textWrapper: SVGGElement;
  public textInput: HTMLInputElement;
  public durationWidth: number = 0;

  public documentPointerDown: (e: PointerEvent) => void;
  public documentPointerMove: (e: PointerEvent) => void;
  public documentPointerUp: (e: PointerEvent) => void;

  public container: SVGGElement;
  // public stretchBar: SVGRectElement;

  set offsetDiff(od: number) {
    this._offsetDiff = od;
    transNodeElements(this.container, od, true);
  }
  get offsetDiff(): number {
    return this._offsetDiff;
  }

  set durationDiff(dd: number) {
    this._durationDiff = dd;
  }

  get durationDiff(): number {
    return this._durationDiff;
  }

  public addEasingTransform() {}
  public removeEasingTransform() {}

  // public bindOffsetHover(type: string, groupRef: string) {
  //     this.offsetIllus.onmouseenter = (enterEvt) => {
  //         if (!state.mousemoving && !this.mouseIsOver) {
  //             hintTag.removeTimingHint();
  //             const timingBBox: DOMRect = this.offsetBg.getBoundingClientRect();//fixed
  //             let actionType: string = '';
  //             let actionInfo: any = {};
  //             switch (type) {
  //                 case 'offset-animation':
  //                     actionType = action.UPDATE_ANI_OFFSET;
  //                     actionInfo = { aniId: this.aniId }
  //                     break;
  //                 case 'offset-group':
  //                     actionType = action.UPDATE_DELAY_BETWEEN_GROUP;
  //                     actionInfo = { aniId: this.aniId, groupRef: groupRef }
  //                     break;
  //                 case 'offset-kf':
  //                     actionType = action.UPDATE_DELAY_BETWEEN_KF;
  //                     actionInfo = { aniId: this.aniId }
  //                     break;
  //             }
  //             hintTag.createTimingHint({ x: timingBBox.left + timingBBox.width / 2, y: timingBBox.top }, `delay:${this.offsetNum}ms`, actionType, actionInfo);
  //         }
  //         this.mouseIsOver = true;
  //     }
  //     this.offsetIllus.onmouseleave = (leaveEvt: any) => {
  //         if (!hintTag.container.contains(leaveEvt.toElement)) {
  //             hintTag.removeTimingHint();
  //         }
  //         this.mouseIsOver = false;
  //     }
  // }

  // public unbindOffsetHover() {
  //     this.offsetIllus.onmouseenter = null;
  //     this.offsetIllus.onmouseleave = null;
  // }

  public drawOffset(
    offset: number,
    widgetHeight: number,
    groupRx: number,
    fake: boolean = false
  ): void {
    this.timingType = KfTimingIllus.TIMING_TYPE_OFFSET;
    this.offsetNum = offset;
    this.groupRx = groupRx;
    if (KfTimingIllus.minOffset === 0) {
      this.offsetWidth = KfTimingIllus.BASIC_OFFSET_DURATION_W;
    } else {
      this.offsetWidth =
        (KfTimingIllus.BASIC_OFFSET_DURATION_W * this.offsetNum) /
        KfTimingIllus.minOffset;
    }
    this.offsetIllus = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        class: NON_SKETCH_CLS,
      },
      flag: true,
    });
    this.offsetBg = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        y: "0",
        width: `${this.offsetWidth + this.groupRx}`,
        height: `${widgetHeight}`,
        fill: KfTimingIllus.OFFSET_COLOR,
      },
      flag: true,
    });
    if (fake) {
      this.offsetBg.setAttributeNS(
        null,
        "x",
        `${-KfTimingIllus.BASIC_OFFSET_DURATION_W}`
      );
    } else {
      this.offsetBg.setAttributeNS(null, "x", "0");
    }
    this.offsetIllus.appendChild(this.offsetBg);
    if (this.offsetWidth / 2 - 6 >= 0 && !fake) {
      this.drawArrowIcon(
        { x: this.offsetWidth / 2 - 6, y: widgetHeight / 2 - 6 },
        KfTimingIllus.TIMING_TYPE_OFFSET
      );
      this.offsetIllus.appendChild(this.offsetIcon);
    }

    //create stretchable bar
    this.offsetType = "offset";
    let actionInfo: any = {};
    if (this.parentObj instanceof KfTrack) {
      this.offsetType += "-animation";
    } else {
      if (typeof this.groupRef !== "undefined") {
        //this is kfgroup
        this.offsetType += "-group";
        actionInfo.groupRef = this.groupRef;
      } else {
        //this is kfitem
        this.offsetType += "-kf";
      }
    }
    // this.stretchBar = this.createStretchBar(widgetHeight, offsetType, false, actionInfo);
    // this.offsetIllus.appendChild(this.stretchBar);
    // this.bindOffsetHover(offsetType, actionInfo.groupRef);
  }

  public updateOffset(widgetHeight: number): void {
    this.offsetBg.setAttributeNS(null, "height", `${widgetHeight}`);
    // this.stretchBar.setAttributeNS(null, 'height', `${widgetHeight}`);
    if (typeof this.offsetIcon !== "undefined") {
      this.offsetIcon.setAttributeNS(
        null,
        "transform",
        `translate(${this.offsetWidth / 2 - 6}, ${widgetHeight / 2 - 6})`
      );
    }
  }

  // public bindDurationHover() {
  //     this.durationIllus.onmouseenter = (enterEvt) => {
  //         if (!state.mousemoving && !this.mouseIsOver) {
  //             hintTag.removeTimingHint();
  //             const timingBBox: DOMRect = this.durationBg.getBoundingClientRect();//fixed
  //             hintTag.createTimingHint({ x: timingBBox.left + timingBBox.width / 2, y: timingBBox.top }, `duration:${this.durationNum}ms`, action.UPDATE_DURATION, { aniId: this.aniId });
  //         }
  //         this.mouseIsOver = true;
  //     }
  //     this.durationIllus.onmouseleave = (leaveEvt: any) => {
  //         if (typeof hintTag.container !== 'undefined') {
  //             if (!hintTag.container.contains(leaveEvt.toElement)) {
  //                 hintTag.removeTimingHint();
  //             }
  //         }
  //         this.mouseIsOver = false;
  //     }
  // }

  // public unbindDurationHover() {
  //     this.durationIllus.onmouseenter = null;
  //     this.durationIllus.onmouseleave = null;
  // }

  public drawDuration(
    duration: number,
    widgetX: number,
    widgetHeight: number,
    hiddenDuration: boolean
  ): void {
    this.timingType = KfTimingIllus.TIMING_TYPE_DURATION;
    this.durationNum = duration;
    if (KfTimingIllus.minDuration === 0) {
      this.durationWidth = KfTimingIllus.BASIC_OFFSET_DURATION_W;
    } else {
      this.durationWidth =
        (KfTimingIllus.BASIC_OFFSET_DURATION_W * this.durationNum) /
        KfTimingIllus.minDuration;
    }
    const transX: number =
      typeof this.offsetIllus === "undefined"
        ? widgetX
        : widgetX + this.offsetWidth;
    this.durationIllus = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        class: NON_SKETCH_CLS,
        transform: `translate(${transX}, 0)`,
      },
      flag: true,
    });
    this.durationBg = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        x: "0",
        y: hiddenDuration ? `${-KfTimingIllus.EXTRA_HEIGHT}` : "0",
        fill: KfTimingIllus.DURATION_COLOR,
        width: `${this.durationWidth}`,
        height: `${
          hiddenDuration
            ? widgetHeight + KfTimingIllus.EXTRA_HEIGHT
            : widgetHeight
        }`,
      },
      flag: true,
    });
    this.durationIllus.appendChild(this.durationBg);
    if (this.durationWidth / 2 - 6 >= 0) {
      this.drawArrowIcon(
        { x: this.durationWidth / 2 - 6, y: widgetHeight / 2 - 6 },
        KfTimingIllus.TIMING_TYPE_DURATION
      );
      this.durationIllus.appendChild(this.durationIcon);
    }

    // this.createTimeText({ x: this.durationWidth / 2 - 6, y: widgetHeight / 2 - 26 });
    // this.durationIllus.appendChild(this.textWrapper);

    // this.stretchBar = this.createStretchBar(widgetHeight, 'duration', hiddenDuration);
    // this.durationIllus.appendChild(this.stretchBar);

    // this.bindDurationHover();
    this.bindDurationPointerEvt();
  }

  public bindOffsetPointerEvt() {
    let sliderBubble: SliderBubble;
    this.offsetIllus.addEventListener("pointerdown", (e: PointerEvent) => {
      const timingBBox: DOMRect = this.offsetBg.getBoundingClientRect();
      sliderBubble = new SliderBubble(
        this.offsetBg,
        BUBBLE_FROM_BOTTOM,
        false,
        {
          sliderType: NUMERIC_SLIDER,
          domain: [100, 2000],
          default: this.offsetNum,
          hideSlider: false,
          sliderWidth: 260,
          trackWidth: 2,
          showTicks: true,
          showCurrentVal: true,
        }
      );
      sliderBubble.shown = true;
      sliderBubble.slider.slided = false;
      this.bindDocumentPointerSlide(TIMING_OFFSET, sliderBubble);
      callSysMenu.set({ enable: false });
      toggleSystemTouch(true);
    });
    this.durationIllus.addEventListener("pointerup", (e: PointerEvent) => {
      sliderBubble.removeBubble();
      this.unbindDocumentPointerSlide();
      callSysMenu.set({ enable: true });
      toggleSystemTouch(false);
      if (sliderBubble.slider.slided) {
        const delayTime: number = <number>sliderBubble.slider.currentValue;
        switch (this.offsetType) {
          case "offset-animation":
            store.dispatch(updateAniOffset(this.aniId, delayTime));
            break;
          case "offset-group":
            store.dispatch({
              type: UPDATE_DELAY_BETWEEN_GROUP,
              payload: {
                infoObj: {
                  aniId: this.aniId,
                  groupRef: this.groupRef,
                  delay: delayTime,
                },
              },
            });
            break;
          case "offset-kf":
            store.dispatch({
              type: UPDATE_DELAY_BETWEEN_KF,
              payload: {
                infoObj: {
                  aniId: this.aniId,
                  delay: delayTime,
                },
              },
            });
            break;
        }
      }
    });
  }

  public bindDurationPointerEvt() {
    let sliderBubble: SliderBubble;
    const that = this;
    this.durationIllus.addEventListener("pointerdown", (e: PointerEvent) => {
      //highlight this kf
      e.preventDefault();
      this.durationIllus.setPointerCapture(e.pointerId);
      if (that instanceof KfItem) {
        store.dispatchSystem(updateHighlightKf(that));
      }
      // Reducer.triger(action.VOICE_AWAKE, true);
      // store.dispatchSystem(toggleVoice(true));

      sliderBubble = new SliderBubble(
        this.durationBg,
        BUBBLE_FROM_BOTTOM,
        false,
        {
          sliderType: NUMERIC_SLIDER,
          domain: [100, 2000],
          default: this.durationNum,
          hideSlider: false,
          sliderWidth: 260,
          trackWidth: 2,
          showTicks: true,
          showCurrentVal: true,
        }
      );

      sliderBubble.shown = true;
      sliderBubble.slider.slided = false;
      this.bindDocumentPointerSlide(TIMING_DURATION, sliderBubble);
      callSysMenu.set({ enable: false }); //阻止长按弹出sys menu
      toggleSystemTouch(true);
    });
    this.durationIllus.addEventListener("pointerup", (e: PointerEvent) => {
      // Reducer.triger(action.VOICE_AWAKE, false);
      // store.dispatchSystem(toggleVoice(false));
      sliderBubble.removeBubble();
      this.unbindDocumentPointerSlide();
      callSysMenu.set({ enable: true });
      toggleSystemTouch(false);
      if (sliderBubble.slider.slided) {
        const durationTime: number = <number>sliderBubble.slider.currentValue;
        that instanceof KfItem
          ? store.dispatchSystem(updateDuration(this.aniId, durationTime))
          : store.dispatch(updateDuration(this.aniId, durationTime));
      }
    });
    this.durationIllus.ondragstart = () => false;
    this.durationIllus.ontouchstart = () => false;
    this.durationIllus.addEventListener(
      "pointercancel",
      (e: PointerEvent) => {}
    );
  }

  public bindDocumentPointerSlide(type: string, sliderBubble: SliderBubble) {
    let oriPosiX: number = 0;
    this.documentPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      sliderBubble.slider.sliderDown(e.pageX);
      oriPosiX = e.pageX;
    };
    this.documentPointerMove = (e: PointerEvent) => {
      e.preventDefault();
      const currentPosiX: number = e.pageX;
      const diffX: number =
        (currentPosiX - oriPosiX) / store.getState().kfZoomLevel;
      const timingWidth: number =
        type === TIMING_DURATION
          ? parseFloat(this.durationBg.getAttributeNS(null, "width"))
          : parseFloat(this.offsetBg.getAttributeNS(null, "width"));
      if (timingWidth + diffX > 0) {
        type === TIMING_DURATION
          ? this.durationBg.setAttributeNS(
              null,
              "width",
              `${timingWidth + diffX}`
            )
          : this.offsetBg.setAttributeNS(
              null,
              "width",
              `${timingWidth + diffX}`
            );
        oriPosiX = currentPosiX;
      }
    };

    this.documentPointerUp = (e: PointerEvent) => {
      e.preventDefault();
      document.removeEventListener("pointermove", this.documentPointerMove);
      document.removeEventListener("pointerup", this.documentPointerUp);
    };
    document.addEventListener("pointerdown", (e: PointerEvent) => {
      e.preventDefault();
      this.documentPointerDown(e);
      document.addEventListener("pointermove", this.documentPointerMove);
      document.addEventListener("pointerup", this.documentPointerUp);
    });
    this.durationIllus.ondragstart = () => false;
  }

  unbindDocumentPointerSlide() {
    document.removeEventListener("pointerdown", this.documentPointerDown);
    document.removeEventListener("pointermove", this.documentPointerMove);
    document.removeEventListener("pointerup", this.documentPointerUp);
  }

  public startAdjustingTime() {}
  public findNextSibling(): KfItem | KfOmit {
    return;
  }
  public bindHoverBtn() {}
  public unbindHoverBtn() {}

  // public hideArrow() {
  //     switch (this.timingType) {
  //         case KfTimingIllus.TIMING_TYPE_OFFSET:
  //             if (typeof this.offsetIcon !== 'undefined') {
  //                 this.offsetIcon.setAttributeNS(null, 'opacity', '0');
  //             }
  //             break;
  //         case KfTimingIllus.TIMING_TYPE_DURATION:
  //             if (typeof this.durationIcon !== 'undefined') {
  //                 this.durationIcon.setAttributeNS(null, 'opacity', '0');
  //             }
  //             break;
  //     }
  // }

  // public showArrow() {
  //     switch (this.timingType) {
  //         case KfTimingIllus.TIMING_TYPE_OFFSET:
  //             if (typeof this.offsetIcon !== 'undefined') {
  //                 this.offsetIcon.setAttributeNS(null, 'opacity', '1');
  //             }
  //             break;
  //         case KfTimingIllus.TIMING_TYPE_DURATION:
  //             if (typeof this.durationIcon !== 'undefined') {
  //                 this.durationIcon.setAttributeNS(null, 'opacity', '1');
  //             }
  //             break;
  //     }
  // }

  // public createStretchBar(barHeight: number, type: string, hiddenDuration: boolean, actionInfo: any = {}): SVGRectElement {
  //     //create stretchable bar
  //     const stretchBar: SVGRectElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  //     stretchBar.setAttributeNS(null, 'x', type === 'duration' ? `${this.durationWidth - 4}` : `${this.offsetWidth - 4}`);
  //     stretchBar.setAttributeNS(null, 'y', hiddenDuration ? `${-KfTimingIllus.EXTRA_HEIGHT}` : '0');
  //     stretchBar.setAttributeNS(null, 'width', '4');
  //     stretchBar.setAttributeNS(null, 'height', hiddenDuration ? `${barHeight + KfTimingIllus.EXTRA_HEIGHT}` : `${barHeight}`);
  //     stretchBar.setAttributeNS(null, 'fill', type === 'duration' ? KfTimingIllus.DURATION_STRETCH_COLOR : KfTimingIllus.OFFSET_STRETCH_COLOR);
  //     stretchBar.classList.add('ease-fade', 'stretchable-component', 'fadein-ele');

  //     stretchBar.onmousedown = (downEvt) => {
  //         Reducer.triger(action.UPDATE_MOUSE_MOVING, true);
  //         hintTag.removeHint();
  //         this.startAdjustingTime();
  //         this.removeEasingTransform();//eg: groupTitle
  //         this.unbindHoverBtn();
  //         this.hideArrow();//hide the arrow
  //         const strectchBarBBox: DOMRect = stretchBar.getBoundingClientRect();//fixed
  //         const timingBBox: DOMRect = type === 'duration' ? this.durationBg.getBoundingClientRect() : this.offsetBg.getBoundingClientRect();//fixed
  //         const timingWidth: number = timingBBox.width;
  //         let currentTiming: number = this.widthToTiming(timingWidth);
  //         if (type === 'duration') {
  //             hintTag.createTimingHint({ x: timingBBox.left + timingBBox.width / 2, y: strectchBarBBox.top }, `duration:${this.durationNum}ms`, action.UPDATE_DURATION, { aniId: this.aniId });
  //             // this.unbindDurationHover();
  //         } else {
  //             let actionType: string = '';
  //             let aInfo: any = {};
  //             switch (type) {
  //                 case 'offset-animation':
  //                     actionType = action.UPDATE_ANI_OFFSET;
  //                     aInfo = { aniId: this.aniId }
  //                     break;
  //                 case 'offset-group':
  //                     actionType = action.UPDATE_DELAY_BETWEEN_GROUP;
  //                     aInfo = { aniId: this.aniId, groupRef: actionInfo.groupRef }
  //                     break;
  //                 case 'offset-kf':
  //                     actionType = action.UPDATE_DELAY_BETWEEN_KF;
  //                     aInfo = { aniId: this.aniId }
  //                     break;
  //             }
  //             hintTag.createTimingHint({ x: timingBBox.left + timingBBox.width / 2, y: strectchBarBBox.top }, `delay:${this.offsetNum}ms`, actionType, aInfo);
  //             // this.unbindOffsetHover();
  //             //remove the extra width of the offset
  //             this.offsetBg.setAttributeNS(null, 'width', `${this.offsetWidth}`);
  //         }
  //         downEvt.stopPropagation();
  //         let oriPosiX: number = downEvt.pageX;
  //         document.onmousemove = (moveEvt) => {
  //             moveEvt.stopPropagation();
  //             const currentPosiX: number = moveEvt.pageX;
  //             const diffX: number = (currentPosiX - oriPosiX) / store.getState().kfZoomLevel;
  //             const barX: number = parseFloat(stretchBar.getAttributeNS(null, 'x'));

  //             const timingWidth: number = type === 'duration' ? parseFloat(this.durationBg.getAttributeNS(null, 'width')) : parseFloat(this.offsetBg.getAttributeNS(null, 'width'));
  //             if (timingWidth + diffX > 0) {
  //                 if (type === 'duration') {
  //                     currentTiming = this.widthToTiming(timingWidth + diffX);
  //                     hintTag.updateTimingHint(diffX / 2, `duration:${currentTiming}ms`)
  //                     this.durationBg.setAttributeNS(null, 'width', `${timingWidth + diffX}`);
  //                     this.durationDiff = diffX;
  //                 } else {
  //                     currentTiming = this.widthToTiming(timingWidth + diffX);
  //                     hintTag.updateTimingHint(diffX / 2, `delay:${currentTiming}ms`)
  //                     this.offsetBg.setAttributeNS(null, 'width', `${timingWidth + diffX}`);
  //                     //translate corresponding group or item
  //                     this.offsetDiff = diffX;
  //                 }
  //                 stretchBar.setAttributeNS(null, 'x', `${diffX + barX}`);
  //                 oriPosiX = currentPosiX;
  //             }
  //         }
  //         document.onmouseup = () => {
  //             Reducer.triger(action.UPDATE_MOUSE_MOVING, false);
  //             hintTag.removeTimingHint();
  //             document.onmousemove = null;
  //             document.onmouseup = null;
  //             this.addEasingTransform();
  //             this.bindHoverBtn();
  //             this.showArrow();//show the arrow
  //             //triger action to update spec
  //             if (type === 'duration') {
  //                 // this.bindDurationHover();
  //                 const durationTime: number = this.widthToTiming(parseFloat(this.durationBg.getAttributeNS(null, 'width')));
  //                 State.tmpStateBusket.push({
  //                     historyAction: { actionType: action.UPDATE_SPEC_ANIMATIONS, actionVal: JSON.stringify(state.spec.animations) },
  //                     currentAction: { actionType: action.UPDATE_DURATION, actionVal: { aniId: this.aniId, duration: durationTime } }
  //                 })
  //                 State.saveHistory();
  //                 Reducer.triger(action.UPDATE_DURATION, { aniId: this.aniId, duration: durationTime });
  //             } else {
  //                 // this.bindOffsetHover(type, actionInfo.groupRef);
  //                 const delayTime: number = this.widthToTiming(parseFloat(this.offsetBg.getAttributeNS(null, 'width')));
  //                 switch (type) {
  //                     case 'offset-animation':
  //                         State.tmpStateBusket.push({
  //                             historyAction: { actionType: action.UPDATE_SPEC_ANIMATIONS, actionVal: JSON.stringify(state.spec.animations) },
  //                             currentAction: { actionType: action.UPDATE_ANI_OFFSET, actionVal: { aniId: this.aniId, offset: delayTime } }
  //                         })
  //                         State.saveHistory();
  //                         Reducer.triger(action.UPDATE_ANI_OFFSET, { aniId: this.aniId, offset: delayTime });
  //                         break;
  //                     case 'offset-group':
  //                         State.tmpStateBusket.push({
  //                             historyAction: { actionType: action.UPDATE_SPEC_ANIMATIONS, actionVal: JSON.stringify(state.spec.animations) },
  //                             currentAction: { actionType: action.UPDATE_DELAY_BETWEEN_GROUP, actionVal: { aniId: this.aniId, groupRef: actionInfo.groupRef, delay: delayTime } }
  //                         })
  //                         State.saveHistory();
  //                         Reducer.triger(action.UPDATE_DELAY_BETWEEN_GROUP, { aniId: this.aniId, groupRef: actionInfo.groupRef, delay: delayTime });
  //                         break;
  //                     case 'offset-kf':
  //                         State.tmpStateBusket.push({
  //                             historyAction: { actionType: action.UPDATE_SPEC_ANIMATIONS, actionVal: JSON.stringify(state.spec.animations) },
  //                             currentAction: { actionType: action.UPDATE_DELAY_BETWEEN_KF, actionVal: { aniId: this.aniId, delay: delayTime } }
  //                         })
  //                         State.saveHistory();
  //                         Reducer.triger(action.UPDATE_DELAY_BETWEEN_KF, { aniId: this.aniId, delay: delayTime });
  //                         break;
  //                 }
  //             }
  //         }
  //     }
  //     return stretchBar;
  // }

  // public widthToTiming(w: number): number {
  //     return Tool.toFixed(KfTimingIllus.minDuration * 100 * w / KfTimingIllus.BASIC_OFFSET_DURATION_W, 2);
  // }

  public drawArrowIcon(trans: ICoord, type: string): void {
    const iconPolygon: SVGPolygonElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    iconPolygon.setAttributeNS(null, "fill", "#fff");
    iconPolygon.setAttributeNS(
      null,
      "points",
      "10.1,0 10.1,4.1 5.6,0.1 4.3,1.5 8.3,5.1 0,5.1 0,6.9 8.3,6.9 4.3,10.5 5.6,11.9 10.1,7.9 10.1,12 12,12 12,0 "
    );

    switch (type) {
      case KfTimingIllus.TIMING_TYPE_OFFSET:
        this.offsetIcon = <SVGGElement>createSvgElement({
          tag: "g",
          para: {
            class: "ease-fade",
            transform: `translate(${trans.x}, ${trans.y})`,
          },
          flag: true,
        });
        this.offsetIcon.appendChild(iconPolygon);
        break;
      case KfTimingIllus.TIMING_TYPE_DURATION:
        this.durationIcon = <SVGGElement>createSvgElement({
          tag: "g",
          para: {
            class: "ease-fade",
            transform: `translate(${trans.x}, ${trans.y})`,
          },
          flag: true,
        });
        this.durationIcon.appendChild(iconPolygon);
        break;
    }
  }
}
