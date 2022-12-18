import PlusBtn from "../redux/views/vl/plusBtn";
import KfItem from "../redux/views/vl/kfItem";
import {
  CHART_VIEW_CONTENT_ID,
  KF_VIEW_CONTENT_ID,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  ZOOM_PANEL_ID,
} from "../redux/views/panels/panel-consts";
import { ICoord } from "../redux/global-interfaces";
import { updateChartScale } from "../redux/action/chartAction";
import { store } from "../redux/store";
import { jsTool } from "./jsTool";
import {
  CHART_THUMBNAIL_ZOOM_LEVEL,
  GROPU_TITLE_COMP,
  KF_BG_LAYER,
} from "../redux/views/vl/vl-consts";
import {
  TARGET_CHART,
  TARGET_HTML,
  TARGET_KEYFRAME,
} from "../redux/global-consts";

export const updateTranslate = (node: any, targetTrans: ICoord) => {
  if (
    node.getAttributeNS(null, "transform") &&
    typeof node.getAttributeNS(null, "transform") !== "undefined"
  ) {
    const trans: ICoord = jsTool.extractTransNums(
      node.getAttributeNS(null, "transform")
    );
    node.setAttributeNS(
      null,
      "transform",
      `translate(${trans.x + targetTrans.x}, ${trans.y + targetTrans.y})`
    );
  } else {
    node.setAttributeNS(
      null,
      "transform",
      `translate(${targetTrans.x}, ${targetTrans.y})`
    );
  }
};

export const clearDragOver = () => {
  PlusBtn.dragoverBtn = undefined;
  KfItem.dragoverKf = undefined;
};

/**
 * translate the elements in kf or kfgroup
 * @param rootNode : root dom node
 * @param transX
 * @param transOffset : whether this is called when dragging offset
 */
export const transNodeElements = (
  rootNode: any,
  transX: number,
  transOffset: boolean = false
) => {
  const allNodeElements: any[] = transOffset
    ? Array.from(rootNode.childNodes).slice(1)
    : Array.from(rootNode.childNodes);
  allNodeElements.forEach((c: any) => {
    let isEasingNode: boolean = false;
    if (c.classList.contains("ease-transform")) {
      isEasingNode = true;
      c.classList.remove("ease-transform");
    }
    if (c.getAttributeNS(null, "transform")) {
      const oriTrans: ICoord = jsTool.extractTransNums(
        c.getAttributeNS(null, "transform")
      );
      c.setAttributeNS(
        null,
        "transform",
        `translate(${oriTrans.x + transX}, ${oriTrans.y})`
      );
    } else {
      c.setAttributeNS(null, "transform", `translate(${transX}, 0)`);
    }
    if (isEasingNode) {
      c.classList.add("ease-transform");
    }
  });
};

/**
 * enlarge those marks with the given classname
 * @param svg
 * @param clsName
 */
export const enlargeMarks = (
  svg: HTMLElement,
  clsName: string,
  scale: number,
  includeCls: boolean
) => {
  const targetMarks: Element[] = includeCls
    ? Array.from(svg.getElementsByClassName(clsName))
    : Array.from(svg.querySelectorAll(`.mark:not(.${clsName})`));
  targetMarks.forEach((m: HTMLElement) => {
    const oriStrokeWidth: string = m.getAttributeNS(null, "stroke-width");
    const strokeWidthRecord: string = m.getAttributeNS(
      null,
      "tmp-stroke-width"
    );
    let strokeWidthToScale: number = 0;
    if (
      typeof m.getAttributeNS(null, "stroke") === "undefined" ||
      !m.getAttributeNS(null, "stroke") ||
      m.getAttributeNS(null, "stroke") === "none"
    ) {
      m.setAttributeNS(
        null,
        "stroke",
        typeof m.getAttributeNS(null, "fill") === "undefined"
          ? "#fff"
          : m.getAttributeNS(null, "fill")
      );
    }
    if (typeof strokeWidthRecord !== "undefined" && strokeWidthRecord) {
      strokeWidthToScale = parseFloat(strokeWidthRecord);
    } else {
      if (typeof oriStrokeWidth !== "undefined" && oriStrokeWidth) {
        m.setAttributeNS(null, "tmp-stroke-width", `${oriStrokeWidth}`);
        strokeWidthToScale = parseFloat(oriStrokeWidth);
      } else {
        m.setAttributeNS(null, "tmp-stroke-width", "0");
        strokeWidthToScale = 0;
      }
    }

    if (m.tagName === "text" && scale >= CHART_THUMBNAIL_ZOOM_LEVEL / 2) {
      const txtBBox: DOMRect = m.getBoundingClientRect();
      const txtCover: SVGRectElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      txtCover.setAttributeNS(null, "class", "txt-cover");
      txtCover.setAttributeNS(null, "x", m.getAttributeNS(null, "x"));
      txtCover.setAttributeNS(
        null,
        "y",
        `${
          parseFloat(m.getAttributeNS(null, "y")) -
          txtBBox.height / store.getState().kfZoomLevel
        }`
      );
      txtCover.setAttributeNS(
        null,
        "width",
        `${(txtBBox.width * 1.4) / store.getState().kfZoomLevel}`
      );
      txtCover.setAttributeNS(
        null,
        "height",
        `${(txtBBox.height * 1.4) / store.getState().kfZoomLevel}`
      );
      txtCover.setAttributeNS(null, "opacity", "0.7");
      txtCover.setAttributeNS(null, "fill", m.getAttributeNS(null, "fill"));
      if (m.getAttributeNS(null, "transform")) {
        txtCover.setAttributeNS(
          null,
          "transform",
          m.getAttributeNS(null, "transform")
        );
      }
      m.parentElement.appendChild(txtCover);
      m.classList.add("fadeout-text");
      m.setAttributeNS(null, "opacity", "0");
    } else {
      m.setAttributeNS(
        null,
        "stroke-width",
        `${scale * 2 + strokeWidthToScale}`
      );
    }
  });
};

export const resetTxtCover = (svg: HTMLElement) => {
  //remove all text covers
  Array.from(svg.getElementsByClassName("txt-cover")).forEach(
    (txtCover: HTMLElement) => {
      txtCover.remove();
    }
  );
  Array.from(svg.getElementsByClassName("fadeout-text")).forEach(
    (txt: HTMLElement) => {
      txt.classList.remove("fadeout-text");
      txt.setAttributeNS(null, "opacity", null);
    }
  );
};

export const resetMarkSize = (
  svg: HTMLElement,
  clsName: string,
  includeCls: boolean
) => {
  const targetMarks: Element[] = includeCls
    ? Array.from(svg.getElementsByClassName(clsName))
    : Array.from(svg.querySelectorAll(`.mark:not(.${clsName})`));
  targetMarks.forEach((m: HTMLElement) => {
    if (typeof m.getAttributeNS(null, "tmp-stroke-width") !== "undefined") {
      m.setAttributeNS(
        null,
        "stroke-width",
        m.getAttributeNS(null, "tmp-stroke-width")
      );
    }
  });
};

export const calKfZoomLevel = () => {
  let currentZoomNum: number = store.getState().kfZoomLevel;
  if (currentZoomNum === MAX_ZOOM_LEVEL) {
    currentZoomNum -= 0.001;
  }
  return Math.floor(
    (currentZoomNum - MIN_ZOOM_LEVEL) /
      ((MAX_ZOOM_LEVEL - MIN_ZOOM_LEVEL) / CHART_THUMBNAIL_ZOOM_LEVEL)
  );
};

/**
 * cant trigger events if dom or its ancestors have the given class
 * @param dom
 * @returns
 */
export const detectCanTrigger = (dom: any, className: string) => {
  let canSketch: boolean = true;
  while (dom.tagName.toLowerCase() !== "body") {
    if (typeof dom.classList !== "undefined") {
      if (dom.classList.contains(className)) {
        canSketch = false;
        break;
      }
    }
    dom = dom.parentNode;
  }
  return canSketch;
};

/**
 * detect whether the given position is within chart view or kf view, possible targets: chart, keyframe, html
 */
export const detectDownArea = (pnt: ICoord) => {
  let result: number = 0; //html
  const chartBBox: DOMRect = document
    .getElementById(CHART_VIEW_CONTENT_ID)
    .getBoundingClientRect();
  const kfBBox: DOMRect = document
    .getElementById(KF_VIEW_CONTENT_ID)
    .getBoundingClientRect();
  const kflist: DOMRect = document
    .getElementById(KF_BG_LAYER)
    .getBoundingClientRect();
  const grouptitle = document.getElementsByClassName(GROPU_TITLE_COMP);
  // if (jsTool.inBoundary({ x1: chartBBox.left, y1: chartBBox.top, x2: chartBBox.right, y2: chartBBox.bottom }, pnt)) {
  if (jsTool.inBoundary(kfBBox, pnt)) {
    for (let i = 0; i < grouptitle.length; i++) {
      //remove drag group title
      const titlebox: DOMRect = grouptitle[i].getBoundingClientRect();
      if (jsTool.inBoundary(titlebox, pnt)) {
        result = TARGET_HTML;
        return TARGET_HTML;
      }
    }
    result = TARGET_KEYFRAME;
  } else if (jsTool.inBoundary(chartBBox, pnt)) {
    result = TARGET_CHART;
  } else {
    result = TARGET_HTML;
  }
  return result;
};

export const scaleChartContent = (chartScale: number) => {
  // const chartScale: number = store.getState().chartScaleRatio;
  const defaultChartScale: number = store.getState().defaultChartScaleRatio;
  const chartG = document
    .getElementById(CHART_VIEW_CONTENT_ID)
    .querySelector("#chartContent");
  const transform: string = chartG.getAttributeNS(null, "transform");
  if (transform.indexOf("scale") >= 0) {
    const transformStrs: string[] = transform.split("scale");
    chartG.setAttributeNS(
      null,
      "transform",
      `${transformStrs[0]}scale(${chartScale})`
    );
  } else {
    chartG.setAttributeNS(
      null,
      "transform",
      `${transform} scale(${chartScale})`
    );
  }
  document.getElementById(ZOOM_PANEL_ID).innerHTML = `${
    Math.floor((chartScale / defaultChartScale) * 10000) / 100
  } % `;
};

export const translateChart = (posi: ICoord, isDiff: boolean) => {
  const chartG: HTMLElement = document.getElementById("chartContent");
  if (chartG) {
    let targetTransX: number = posi.x;
    let targetTransY: number = posi.y;
    const transformStr: string = chartG.getAttributeNS(null, "transform");
    if (
      transformStr &&
      typeof transformStr !== "undefined" &&
      transformStr !== ""
    ) {
      const values = transformStr.match(/\(([^)]*)\)/g);
      const transValue: string = values[0].replace(/[\(\)]/g, "");
      const initTrans: string = chartG.getAttributeNS(null, "init_transform");
      if (!initTrans) {
        chartG.setAttributeNS(null, "init_transform", transValue);
      }
      const transBlocks: string[] = transValue.split(",");
      targetTransX = isDiff ? parseFloat(transBlocks[0]) + posi.x : posi.x;
      targetTransY = isDiff ? parseFloat(transBlocks[1]) + posi.y : posi.y;
      chartG.setAttributeNS(
        null,
        "transform",
        `translate(${targetTransX}, ${targetTransY}) scale${values[1]}`
      );
    } else {
      chartG.setAttributeNS(
        null,
        "transform",
        `translate(${targetTransX}, ${targetTransY})`
      );
    }
  }
};

export const scaleChart = (scaleNum: number, touchPnt: ICoord) => {
  const chartG: HTMLElement = document.getElementById("chartContent");
  if (chartG) {
    //calculate translate number
    const transValue: ICoord = {
      x: touchPnt.x * (0 - scaleNum),
      y: touchPnt.y * (0 - scaleNum),
    };

    //do translate and scale
    translateChart(transValue, true);
    store.dispatch(
      updateChartScale(scaleNum + store.getState().chartScaleRatio)
    );
  }
};

export const resetChartScaleAndTrans = () => {
  const chartG: HTMLElement = document.getElementById("chartContent");
  if (chartG) {
    const transformStr: string = chartG.getAttributeNS(null, "transform");
    const values = transformStr.match(/\(([^)]*)\)/g);
    let transValue: string = values[0].replace(/[\(\)]/g, "");
    const initTrans: string = chartG.getAttributeNS(null, "init_transform");
    if (initTrans) {
      chartG.removeAttributeNS(null, "init_transform");
      transValue = initTrans;
    }
    chartG.setAttributeNS(
      null,
      "transform",
      `translate(${transValue}) scale(${
        store.getState().defaultChartScaleRatio
      })`
    );
    store.dispatch(updateChartScale(store.getState().defaultChartScaleRatio));
  }
};
