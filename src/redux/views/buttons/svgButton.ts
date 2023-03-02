import { svgPathBbox } from "svg-path-bbox";
import { Animation } from "canis_toolkit";
import {
  BTN_CLS,
  BTN_CONTENT_TYPE_ICON,
  BTN_CONTENT_TYPE_STR,
  BTN_HEIGHT,
  BTN_RX,
  BTN_TYPE_DATA,
  BTN_TYPE_EFFECT,
  BTN_TYPE_PREVIEW,
  BTN_WIDTH,
  CIRCLE_BTN,
  IEvent,
  ISVGBtn,
  LETTER_WIDTH,
  PNT_DOWN_SIZE,
  RECT_BTN,
  RECT_BTN_PADDING,
  SHADOW_FILTER_ID,
  SHADOW_R,
  SHADOW_X,
  SHADOW_Y,
  STROKE_COLOR,
  STROKE_DASH_ARR,
} from "./button-consts";
import {
  callSysMenu,
  cancelDataSelection,
  CANCEL_DATA_SELECT,
} from "../menu/menu-interactions";
import SliderBubble from "../bubble/sliderBubble";
import { BUBBLE_FROM_LEFT } from "../bubble/bubble-consts";
import { ICanisSpec } from "../../../app/core/canisGenerator";
import TxtBubble from "../bubble/txtBubble";
import Suggest from "../../../app/core/suggest";
import { NON_SKETCH_CLS } from "../../global-consts";
import { IAttrAndSpec, IPath } from "../../global-interfaces";
import { CATEGORY_SLIDER } from "../slider/slider-consts";
import { store } from "../../store";
import { zoomChart, dragging, toggleSystemTouch } from "../panels/interactions";
import {
  createAnimatingEle,
  createSvgElement,
  pointerDownAni,
  pointerUpAni,
} from "../../../util/svgManager";
import { updatePreviewing } from "../../action/videoAction";
import { markSelection } from "../../../util/markSelection";
import AniMIL from "../../../mil/AniMIL";
import kfTrack from "../vl/kfTrack";
import { selector } from "d3";

export class SVGBtn {
  targetSVG: SVGElement;
  btnProps: ISVGBtn;
  container: SVGGElement;
  sliderBubble: SliderBubble;
  effectPanel: HTMLDivElement;
  addShadow: boolean;
  _btnDown: boolean;
  handler: () => void;

  constructor(svg: SVGElement, addShadow: boolean, btnProps: ISVGBtn) {
    this.targetSVG = svg;
    this.btnProps = btnProps;
    this.addShadow = addShadow;
    this._btnDown = false;
    this.init();
  }

  set btnDown(d: boolean) {
    !this._btnDown && d && pointerDownAni(this.container);
    this._btnDown && !d && pointerUpAni(this.container);
    this._btnDown = d;
  }

  get btnDown(): boolean {
    return this._btnDown;
  }

  init() {
    this.addShadow && this.appendShadow();
    this.createBtn();
  }

  appendShadow() {
    this.targetSVG.appendChild(this.createShadow());
  }

  createShadow(): SVGDefsElement {
    const defs: SVGDefsElement = <SVGDefsElement>(
      createSvgElement({ tag: "defs", para: {}, flag: true })
    );
    const shadowFilter: SVGFilterElement = <SVGFilterElement>createSvgElement({
      tag: "filter",
      para: {
        id: SHADOW_FILTER_ID,
      },
      flag: true,
    });
    const feGaussianBlur = createSvgElement({
      tag: "feGaussianBlur",
      para: {
        in: "SourceAlpha",
        stdDeviation: `${SHADOW_R}`,
      },
      flag: false,
    });
    shadowFilter.appendChild(feGaussianBlur);

    shadowFilter.appendChild(
      createSvgElement({
        tag: "feOffset",
        para: {
          dx: `${SHADOW_X}`,
          dy: `${SHADOW_Y}`,
        },
        flag: true,
      })
    );
    const feComponentTransfer: SVGFEComponentTransferElement = <
      SVGFEComponentTransferElement
    >createSvgElement({ tag: "feComponentTransfer", para: {}, flag: true });
    feComponentTransfer.appendChild(
      createSvgElement({
        tag: "feFuncA",
        para: {
          type: "linear",
          slope: "0.2",
        },
        flag: true,
      })
    );
    shadowFilter.appendChild(feComponentTransfer);
    const feMerge: SVGFEMergeElement = <SVGFEMergeElement>(
      createSvgElement({ tag: "feMerge", para: {}, flag: true })
    );
    feMerge.appendChild(
      createSvgElement({ tag: "feMergeNode", para: {}, flag: true })
    );
    feMerge.appendChild(
      createSvgElement({
        tag: "feMergeNode",
        para: {
          in: "SourceGraphic",
        },
        flag: true,
      })
    );
    shadowFilter.appendChild(feMerge);
    defs.appendChild(shadowFilter);
    return defs;
  }

  createRectBg(strokeProps: any) {
    //calculate size
    // const width: number = this.btnProps.innerContent.type === BTN_CONTENT_TYPE_ICON ? BTN_WIDTH : this.btnProps.innerContent.content.length * LETTER_WIDTH + RECT_BTN_PADDING*2;
    const width: number = this.btnProps.r;
    this.btnProps.width = width;
    const btnBgRectPara: { [key: string]: string | number } = {
      class: NON_SKETCH_CLS,
      x: `${this.btnProps.center.x}`,
      y: `${this.btnProps.center.y - BTN_HEIGHT / 2}`,
      width: width,
      height: BTN_HEIGHT,
      rx: BTN_RX,
      fill: this.btnProps.startFill,
      style:
        this.btnProps.innerContent.content !== ""
          ? `filter:url(#${SHADOW_FILTER_ID})`
          : "",
    };
    if (this.btnProps.innerContent.content === "") {
      Object.assign(btnBgRectPara, strokeProps);
    }
    const btn: SVGRectElement = <SVGRectElement>createAnimatingEle(
      {
        tag: "rect",
        para: btnBgRectPara,
        flag: true,
      },
      this.btnProps.appearAni,
      [
        {
          attrName: "fill",
          from: this.btnProps.startFill,
          to: this.btnProps.endFill,
          dur: "0.2s",
        },
        {
          attrName: "width",
          from: `${btnBgRectPara.width}`,
          to: `${<number>btnBgRectPara.width + PNT_DOWN_SIZE}`,
          dur: "0.2s",
        },
      ],
      [
        {
          attrName: "width",
          from: "0",
          to: `${btnBgRectPara.width}`,
          dur: "0.2s",
        },
      ]
    );
    this.container.appendChild(btn);
  }

  createCircleBg(strokeProps: any) {
    const btnBgCirclePara: { [key: string]: string } = {
      class: NON_SKETCH_CLS,
      cx: `${this.btnProps.center.x}`,
      cy: `${this.btnProps.center.y}`,
      r: this.btnProps.appearAni ? "0" : `${this.btnProps.r}`,
      fill: this.btnProps.startFill,
      style:
        this.btnProps.innerContent.content !== ""
          ? `filter:url(#${SHADOW_FILTER_ID})`
          : "",
    };
    if (this.btnProps.innerContent.content === "") {
      Object.assign(btnBgCirclePara, strokeProps);
    }
    const btn: SVGCircleElement = <SVGCircleElement>createAnimatingEle(
      {
        tag: "circle",
        para: btnBgCirclePara,
        flag: true,
      },
      this.btnProps.appearAni,
      [
        {
          attrName: "fill",
          from: this.btnProps.startFill,
          to: this.btnProps.endFill,
          dur: "0.2s",
        },
        {
          attrName: "r",
          from: `${this.btnProps.r}`,
          to: `${this.btnProps.r + PNT_DOWN_SIZE}`,
          dur: "0.2s",
        },
      ],
      [
        {
          attrName: "r",
          from: "0",
          to: `${this.btnProps.r}`,
          dur: "0.2s",
        },
      ]
    );
    this.container.appendChild(btn);
  }

  createBtn() {
    this.container = <SVGGElement>(
      createSvgElement({ tag: "g", para: {}, flag: true })
    );
    this.container.classList.add(BTN_CLS);
    const that = this;
    this.container.addEventListener(
      "pointerdown",
      (e: PointerEvent) => (that.btnDown = true)
    );
    this.container.addEventListener(
      "pointerup",
      (e: PointerEvent) => (that.btnDown = false)
    );
    document.addEventListener(
      'pointerup',
      (e: PointerEvent) => {that.btnDown = false}
    )

    const strokeProps: any = {
      stroke: STROKE_COLOR,
      strokeWidth: "1",
      strokeDasharray: STROKE_DASH_ARR,
    };
    switch (this.btnProps.type) {
      case CIRCLE_BTN:
        this.createCircleBg(strokeProps);
        break;
      case RECT_BTN:
        this.createRectBg(strokeProps);
        break;
    }

    if (this.btnProps.innerContent.type === BTN_CONTENT_TYPE_ICON) {
      const pathBBox: number[] = svgPathBbox(
        this.btnProps.innerContent.content
      );

      const iconW: number = pathBBox[2] - pathBBox[0];
      const iconH: number = pathBBox[3] - pathBBox[1];
      const maxLength = Math.max(
        0,
        ...this.btnProps.innerContent.content
          .trim()
          .split("M")
          .filter((d) => d)
          .map((d) => "M" + d)
          .map((d) => {
            const tempPath = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );
            tempPath.setAttribute("d", d);
            return tempPath;
          })
          .map((path) => path.getTotalLength())
      );

      const icon: SVGPathElement = createAnimatingEle(
        {
          tag: "path",
          para: {
            class: NON_SKETCH_CLS,
            d: this.btnProps.innerContent.content,
            transform: `translate(${this.btnProps.center.x - iconW / 2},${
              this.btnProps.center.y - iconH / 2
            })`,
            ...(this.btnProps.strokeWidth
              ? {
                  stroke: this.btnProps.endFill,
                  "stroke-dasharray": this.btnProps.appearAni ? maxLength : 0,
                  "stroke-dashoffset": this.btnProps.appearAni ? maxLength : 0,
                  "fill-opacity": 0,
                  "stroke-width": this.btnProps.strokeWidth,
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                }
              : { fill: this.btnProps.endFill, "stroke-width": 0 }),
          },
          flag: true,
        },
        this.btnProps.appearAni,
        [
          {
            attrName: "stroke",
            from: this.btnProps.endFill,
            to: this.btnProps.startFill,
            dur: "0.2s",
          },
          {
            attrName: "fill",
            from: this.btnProps.endFill,
            to: this.btnProps.startFill,
            dur: "0.2s",
          },
        ],
        [
          {
            attrName: "stroke-dashoffset",
            to: (0).toString(),
            from: maxLength.toString(),
            dur: "0.2s",
          },
        ]
      );
      this.container.appendChild(icon);
    } else if (
      this.btnProps.innerContent.type === BTN_CONTENT_TYPE_STR &&
      this.btnProps.innerContent.content !== ""
    ) {
      const txt: SVGTextElement = createAnimatingEle(
        {
          tag: "text",
          para: {
            class: NON_SKETCH_CLS,
            dominantBaseline: "middle",
            textAnchor: "middle",
            fontSize: this.btnProps.appearAni
              ? "0"
              : `${this.btnProps.innerContent.fontSize}`,
            x:
              this.btnProps.type === CIRCLE_BTN
                ? `${this.btnProps.center.x}`
                : `${this.btnProps.center.x + this.btnProps.width / 2}`,
            y: `${this.btnProps.center.y}`,
            fill: this.btnProps.endFill,
          },
          flag: true,
        },
        this.btnProps.appearAni,
        [
          {
            attrName: "fill",
            from: this.btnProps.endFill,
            to: this.btnProps.startFill,
            dur: "0.2s",
          },
        ],
        [
          {
            attrName: "font-size",
            from: "0",
            to: `${this.btnProps.innerContent.fontSize}`,
            dur: "0.2s",
          },
        ]
      );
      txt.innerHTML += this.btnProps.innerContent.content;
      this.container.appendChild(txt);
    }

    this.btnProps.events.forEach((btnEvent: IEvent) => {
      this.container.addEventListener(btnEvent.type, (e: PointerEvent) => {
        btnEvent.func(e);
      });
    });
    this.container.addEventListener("pointerdown", (e: PointerEvent) => {
      zoomChart.set({ enable: false });
      dragging.set({ enable: false });
    });
    this.container.addEventListener("pointerup", (e: PointerEvent) => {
      zoomChart.set({ enable: true });
      dragging.set({ enable: true });
    });
  }

  showBtn() {
    this.container.classList.remove("no-display-ele");
  }

  hideBtn() {
    this.container.classList.add("no-display-ele");
  }

  bindPressing(type: number) {
    type === BTN_TYPE_DATA && this.bindSliderSelector();
    type === BTN_TYPE_EFFECT && this.bindEffectPanel();
    type === BTN_TYPE_PREVIEW && this.bindPreview();
  }

  bindPreview() {
    this.container.addEventListener("pointerdown", () => {
      //set path
      let path = JSON.parse(JSON.stringify(store.getState().previewPath));
      //set spec
      let spec = JSON.parse(JSON.stringify(store.getState().spec));
      let pathSelect: string = "";
      store
        .getState()
        .highlightKf.currentHighlightKf.kfInfo.allCurrentMarks.forEach(
          (markId) => {
            if (path.firstKfMarks.indexOf(markId) === -1) {
              pathSelect += "#" + markId + ", ";
            }
          }
        );
      store
        .getState()
        .highlightKf.currentHighlightKf.kfInfo.marksThisKf.forEach((markId) => {
          if (path.firstKfMarks.indexOf(markId) === -1) {
            pathSelect += "#" + markId + ", ";
          }
        });
      if (pathSelect.length > 0) {
        pathSelect = pathSelect.slice(0, -1);
        pathSelect = pathSelect.slice(0, -1);
      }
      spec.animations[0].selector = pathSelect;
      store.dispatchSystem(updatePreviewing(path, spec, true, true));
    });
    this.container.addEventListener("pointerup", () => {
      store.dispatchSystem(
        updatePreviewing(store.getState().previewPath, null, false, true)
      ); //gai
      // store.getState().isPreviewing && store.dispatchSystem(updatePreviewing(null, null, false, Suggest.allPaths.length !== 1))
    });
  }

  bindEffectPanel() {}

  bindSliderSelector() {
    const cancelSelectTouch = new AniMIL(this.container);
    cancelSelectTouch.add(cancelDataSelection);
    // // slider.callbackFunc = this.renderFrame;

    cancelSelectTouch.on(CANCEL_DATA_SELECT, (e: any) => {
      if (e.direction === 8) {
        //up
        console.log("canceling data selection");
      } else {
        console.log("error recog");
      }
    });

    this.sliderBubble = new SliderBubble(
      this.container,
      BUBBLE_FROM_LEFT,
      false,
      {
        sliderType: CATEGORY_SLIDER,
        domain: <string[] | number[]>this.btnProps.values,
        default: (<string[] | number[]>this.btnProps.values)[0],
        hideSlider: false,
        sliderWidth: 200,
        trackWidth: 2,
        showTicks: true,
        showCurrentVal: true,
      }
    );
    this.sliderBubble.shown = false;
    this.container.addEventListener("pointerdown", (e: PointerEvent) => {
      this.container.setPointerCapture(e.pointerId);
      this.sliderBubble.shown = true;
      this.sliderBubble.slider.slided = false;
      document.addEventListener("pointerdown", (e: PointerEvent) => {
        this.sliderBubble.slider.sliderDown(e.pageX);
      });
      callSysMenu.set({ enable: false });
      toggleSystemTouch(true);
    });
    this.container.ondragstart = () => false;
    this.container.addEventListener("pointerup", () => {
      this.sliderBubble.shown = false;
      callSysMenu.set({ enable: true });
      toggleSystemTouch(false);
      if (this.sliderBubble.slider.slided) {
        markSelection.selectByData(
          `${this.sliderBubble.slider.currentValue}`,
          this.sliderBubble.slider.options.domain
        );
      }
    });
  }

  triggerBtn() {
    this.btnProps.events.forEach((btnEvent: IEvent) => {
      btnEvent.func();
    });
  }
}
