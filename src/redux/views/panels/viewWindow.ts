import "../../assets/style/panels/view-window.scss";
import { player } from "../slider/player";
import ResizablePanel from "./resizablePanel";
import {
  BIG_BTN_SIZE,
  BTN_CONTENT_TYPE_ICON,
  CIRCLE_BTN,
  ISVGBtn,
  PNT_DOWN_SIZE,
  VOICE_ICON,
} from "../buttons/button-consts";
import { DARK_COLOR, LIGHT_COLOR } from "../menu/menu-consts";
import { SVGBtn } from "../buttons/svgButton";
import { store } from "../../store";
import { toggleVoice } from "../../action/voiceAction";
import {
  CHART_VIEW_TITLE,
  CONFIRM_BTN,
  KF_VIEW_TITLE,
  VIDEO_VIEW_CONTENT_ID,
  VIDEO_VIEW_TITLE,
  VIEW_CONTENT_CLS,
  ZOOM,
  ZOOM_PANEL_ID,
} from "./panel-consts";
import ViewContent from "./viewContent";
import ViewToolBtn from "./viewToolBtn";
import { IViewBtnProp } from "./interfaces";
import { ICoord } from "../../global-interfaces";
import { NON_SKETCH_CLS } from "../../global-consts";
import { jsTool } from "../../../util/jsTool";
import { update } from "lodash";
import { sketchCanvas } from "./sketchCanvas";

export var confirmBtn: boolean = false;
export default class ViewWindow {
  viewTitle: string;
  showTitle: boolean;
  view: HTMLDivElement;
  parentPanel: ResizablePanel;
  constructor(title: string, showTitle: boolean) {
    this.viewTitle = title;
    this.showTitle = showTitle;
  }

  public static resizeVideoLayer() {
    const videoSVG: SVGSVGElement = document
      .getElementById(VIDEO_VIEW_CONTENT_ID)
      .querySelector("svg");
    if (videoSVG) {
      videoSVG.removeAttributeNS(null, "viewBox");
      videoSVG.removeAttributeNS(null, "width");
      videoSVG.removeAttributeNS(null, "height");
    }
    const videoLayer: HTMLElement = document
      .getElementById(VIDEO_VIEW_CONTENT_ID)
      .querySelector("svg > g");
    const chartLayer: HTMLElement = document.getElementById("chartContent");
    if (videoLayer && chartLayer) {
      const chartBBox: DOMRect = chartLayer.getBoundingClientRect();
      const videoBBox: DOMRect = videoLayer.getBoundingClientRect();
      const chartTrans: ICoord = jsTool.extractTransNums(
        chartLayer.getAttributeNS(null, "transform")
      );
      const sizeRatio: number = chartBBox.width / videoBBox.width;
      videoLayer.setAttributeNS(
        null,
        "transform",
        `translate(${chartTrans.x}, ${chartTrans.y}) scale(${sizeRatio})`
      );
    }
  }

  public createView(): void {
    this.view = document.createElement("div");
    this.view.className = "view";

    const viewTitleContainer: HTMLDivElement = document.createElement("div");
    if (this.showTitle) {
      viewTitleContainer.className = "view-title-container";
      if (this.viewTitle !== "") {
        const viewTitleText: HTMLSpanElement = document.createElement("span");
        viewTitleText.className = "view-title-text";
        let titleText: string = this.viewTitle;
        switch (titleText) {
          case KF_VIEW_TITLE:
            titleText = "Animation Specification"; //keyframe list
            break;
          case VIDEO_VIEW_TITLE:
            titleText = "Animation Preview";
            break;
          default:
            break;
        }
        viewTitleText.innerHTML = jsTool.firstLetterUppercase(titleText);
        viewTitleContainer.appendChild(viewTitleText);
      }

      this.view.appendChild(viewTitleContainer);

      const that = this;

      viewTitleContainer.onpointerdown = (e) => {
        e.stopPropagation();
        switch (e.pointerType) {
          case "pen":
          case "mouse":
          case "touch":
            that.parentPanel.resizerDown(e);
            break;
        }
      };
    }

    const viewContent = new ViewContent();
    viewContent.createViewContent(this.viewTitle);
    this.view.appendChild(viewContent.container);

    //create tools on the title
    switch (this.viewTitle) {
      case CHART_VIEW_TITLE:
        this.createChartUpperLayers();
        break;
      case VIDEO_VIEW_TITLE:
        break;
      case KF_VIEW_TITLE:
        viewTitleContainer.classList.add("keyframe-title-container");
        break;
    }
  }

  public createChartUpperLayers(): void {
    this.createVideoLayer();
    this.createPlayerWidget();
    // this.createVoiceBtn(); //创建左下角语音图标
    this.createZoomPanel();
    this.createConfirmBtn();
  }
  public createConfirmBtn() {
    const r: number = BIG_BTN_SIZE;
    const container = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    container.classList.add("confirm-btn-container", NON_SKETCH_CLS);
    this.view.appendChild(container);
    const buttonProps: ISVGBtn = {
      type: CIRCLE_BTN,
      center: { x: r + PNT_DOWN_SIZE, y: PNT_DOWN_SIZE + r },
      r: r,
      appearAni: false,
      startFill: LIGHT_COLOR,
      endFill: DARK_COLOR,
      innerContent: {
        type: BTN_CONTENT_TYPE_ICON,
        content: VOICE_ICON,
      },
      values: [],
      events: [
        {
          type: "pointerdown",
          func: () => {
            //muti s
            // Reducer.triger(action.VOICE_AWAKE, true);
            confirmBtn = true;
          },
        },
        {
          type: "pointerup",
          func: () => {
            // Reducer.triger(action.VOICE_AWAKE, false);
            confirmBtn = false;
            sketchCanvas.endDrawingBtn();
          },
        },
      ],
    };
    const btn: SVGBtn = new SVGBtn(container, true, buttonProps);
    container.appendChild(btn.container);
  }

  public createZoomPanel() {
    //缩放右下角
    const zoomPanel: HTMLDivElement = document.createElement("div");
    zoomPanel.innerHTML = "100%";
    zoomPanel.id = ZOOM_PANEL_ID;
    zoomPanel.className = `zoom-panel ${NON_SKETCH_CLS}`;
    zoomPanel.hidden = true; //hidden 
    this.view.appendChild(zoomPanel);
  }
  public createPlayerWidget(): void {
    //播放进度条组件
    const container: HTMLDivElement = document.createElement("div");
    container.className = "player-widget";
    container.appendChild(player.widget);
    this.view.appendChild(container);
  }

  public createVideoLayer(): void {
    const container: HTMLDivElement = document.createElement("div");
    container.id = VIDEO_VIEW_CONTENT_ID;
    // container.className = `${ViewContent.VIEW_CONTENT_CLS} hide-ele`;
    container.className = `${VIEW_CONTENT_CLS} ele-under`;
    this.view.appendChild(container);
  }

  public createKfTools(): HTMLDivElement {
    const toolContainer = document.createElement("div");
    toolContainer.className = "view-tool-container";
    toolContainer.appendChild(
      this.createBtn({
        clickEvtType: ZOOM,
        iconClass: "zoom-icon",
      })
    );
    //create zooming slider

    // const slider: Slider = new Slider([ViewWindow.MIN_ZOOM_LEVEL, ViewWindow.MAX_ZOOM_LEVEL], ViewWindow.MAX_ZOOM_LEVEL);
    // slider.createSlider()
    // slider.callbackFunc = (zl: number) => {
    //     Reducer.triger(action.KEYFRAME_ZOOM_LEVEL, zl);
    // };
    // toolContainer.appendChild(this.createBtn({
    //     title: 'Zoom Out',
    //     clickEvtType: ViewToolBtn.CUSTOM,
    //     clickEvt: () => {
    //         if (store.getState().kfZoomLevel - ViewWindow.ZOOM_STEP >= ViewWindow.MIN_ZOOM_LEVEL) {
    //             slider.moveSlider(store.getState().kfZoomLevel - ViewWindow.ZOOM_STEP);
    //         } else {
    //             slider.moveSlider(ViewWindow.MIN_ZOOM_LEVEL);
    //         }
    //     },
    //     iconClass: 'zoom-out-icon'
    // }));
    // toolContainer.appendChild(slider.sliderContainer);
    // toolContainer.appendChild(this.createBtn({
    //     title: 'Zoom In',
    //     clickEvtType: ViewToolBtn.CUSTOM,
    //     clickEvt: () => {
    //         if (store.getState().kfZoomLevel + ViewWindow.ZOOM_STEP <= ViewWindow.MAX_ZOOM_LEVEL) {
    //             slider.moveSlider(store.getState().kfZoomLevel + ViewWindow.ZOOM_STEP);
    //         } else {
    //             slider.moveSlider(ViewWindow.MAX_ZOOM_LEVEL);
    //         }
    //     },
    //     iconClass: 'zoom-in-icon'
    // }));
    return toolContainer;
  }

  public createSeparator(): HTMLSpanElement {
    const separator: HTMLSpanElement = document.createElement("span");
    separator.className = "tool-separator";
    return separator;
  }

  public createBtn(props: IViewBtnProp): HTMLSpanElement {
    const btn: HTMLSpanElement = new ViewToolBtn().btn(props);
    return btn;
  }
}
