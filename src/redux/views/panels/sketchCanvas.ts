import "../../assets/style/panels/sketch-canvas.scss";
import Lasso from "../../../util/lasso";
import CrossOver from "../../../util/crossOver";
import { Animation } from "canis_toolkit";
import { markSelection } from "../../../util/markSelection";
import {
  CHART_VIEW_CONTENT_ID,
  KF_VIEW_CONTENT_ID,
  LASSO,
} from "./panel-consts";
import { ICoord, IPath } from "../../global-interfaces";
import { sketchRecognizer } from "../../../app/core/sketchRecognizer";
import { store } from "../../store";
import { toggleVideoMode } from "../../action/videoAction";
import { isMark } from "../../../util/appTool";
import { jsTool } from "../../../util/jsTool";
import { updateEffectType } from "../../action/canisAction";
import Axis from "../../../util/axis";
import Util from "../../../app/core/util";
import {
  updateSelectionFake,
  updateSelectMarksStepFake,
} from "../../action/chartAction";
import { tip } from "../widgets/tip";
import { tipSuggest } from "../vl/vl-util";

export const TOUCH_NULL: number = 0;
export const TOUCH_STRAIGHT: number = 1;
export const TOUCH_SINGLE: number = 2;
export const TOUCH_MULTI: number = 3;

class SketchCanvas {
  static CHART_SKETCH: string = "sketchOnChart";
  static KF_SKETCH: string = "sketchOnKf";
  static EFFECT_SKETCH: string = "sketchOnEffect";
  static LINE_WIDTH: number = 2;
  static TIME_DELIMITER: number = 1000;
  static CANVAS_ID: string = "sketchCanvas";

  // static validWord = /.*/;
  static validWord = /^[0-9A-Za-z\s\$\-\>]+$/;

  canvas: HTMLCanvasElement;
  sketching: boolean;
  ctx: CanvasRenderingContext2D;
  isDown: boolean;
  width: number;
  height: number;
  tracePoints: ICoord[][][];
  tracePointsOneStroke: ICoord[];
  traceGrouping: number[][];
  pathInterval: NodeJS.Timeout;
  selectionInterval: NodeJS.Timeout;
  sketchResult: string[][];
  clearCache: boolean;
  sketchTarget: string;

  constructor() {
    this.isDown = false;
    this.traceGrouping = [];
    this.tracePoints = [];
    this.tracePointsOneStroke = [];
    this.clearCache = false;
    this.sketchTarget = "";
    this.sketching = false;
  }

  initCanvas() {
    let canvasTest = document.getElementById(SketchCanvas.CANVAS_ID);
    if (canvasTest) {
      canvasTest.parentNode.removeChild(canvasTest);
    }
    this.canvas = document.createElement("canvas");
    this.canvas.id = SketchCanvas.CANVAS_ID;
    this.canvas.classList.add("sketch-canvas");
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.ctx.strokeStyle = "#FF0000";
    this.updateCanvasSize();
    this.hideCanvas();
  }

  updateCanvasSize() {
    this.canvas.width = document.body.clientWidth;
    this.canvas.height = document.body.clientHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  hideCanvas() {
    this.canvas.style.display = "none";
  }

  showCanvas() {
    this.canvas.style.display = "";
  }

  toggleSketching(sketching: boolean, startCoord: ICoord) {
    this.sketching = sketching;
    if (
      this.sketching &&
      !store.getState().isPreviewing &&
      store.getState().showVideo
    ) {
      store.dispatchSystem(toggleVideoMode(false));
    }

    this.sketching ? this.startDrawing(startCoord) : this.hideCanvas();
  }

  startDrawing(pointerCoord: ICoord) {
    this.judgeSketchTarget(pointerCoord);
    this.showCanvas();
    let x = pointerCoord.x,
      y = pointerCoord.y;
    this.isDown = true;
    x -= 0 - window.scrollX;
    y -= 0 - window.scrollY;

    this.tracePointsOneStroke = [{ x: x, y: y }];
    this.ctx.fillRect(
      x - SketchCanvas.LINE_WIDTH / 2,
      y - SketchCanvas.LINE_WIDTH / 2,
      SketchCanvas.LINE_WIDTH,
      SketchCanvas.LINE_WIDTH
    );

    clearInterval(this.selectionInterval);
  }

  drawing(e: PointerEvent) {
    let x = e.clientX,
      y = e.clientY;

    if (this.isDown) {
      x -= 0 - window.scrollX;
      y -= 0 - window.scrollY;

      this.tracePointsOneStroke.push({ x: x, y: y });
      this.drawConnectedPoint(
        this.tracePointsOneStroke[this.tracePointsOneStroke.length - 2],
        this.tracePointsOneStroke[this.tracePointsOneStroke.length - 1]
      );
    }
  }

  drawConnectedPoint(from: ICoord, to: ICoord): void {
    this.ctx.strokeStyle = "#000";
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  recordTracePnts(pnts: ICoord[]): boolean {
    let combineFirst: boolean = false; //whether to add the first selection into state.selection
    if (this.tracePoints.length === 0) {
      this.tracePoints[0] = [];
      combineFirst = true;
    }
    this.tracePoints[this.tracePoints.length - 1].push(pnts);
    return combineFirst;
  }
  endSketch() {
    if (this.isDown) {
      this.isDown = false;
      const combineFirst: boolean = this.recordTracePnts(
        this.tracePointsOneStroke
      );
      const that = this;
      const judgePoints = that.tracePoints[0];
      const chartArea: DOMRect = document
        .getElementById(CHART_VIEW_CONTENT_ID)
        .getBoundingClientRect();
      this.hideCanvas();
      that.sketchResult = [];
      let hitCheck: boolean = false,
        hitCancel: boolean = false;
      //recog circle path
      if (jsTool.inBoundary(chartArea, judgePoints[0][0])) {
        //trace in chart view
        for (let i = 0, len = that.tracePoints.length; i < len; i++) {
          let tmpSelection: string[] = [];
          for (let j = 0, len2 = that.tracePoints[i].length; j < len2; j++) {
            const tps: ICoord[] = that.tracePoints[i][j];
            //recog paths
            const pathRecog: { name: string; score: number } =
              that.recognizePath(tps); //path recog info
            const choseByPath: { isL: boolean; selection: string[] } =
              that.chooseMarks(tps);
            tmpSelection = [...tmpSelection, ...choseByPath.selection];
          }
          if (that.sketchResult.length === 0 && combineFirst) {
            that.sketchResult.push([...tmpSelection]);
          } else {
            that.sketchResult.push(tmpSelection);
          }
          if (hitCheck || hitCancel) {
            break;
          }
        }
        if (that.sketchResult[0].length > 0) {
          store.dispatch(updateSelectionFake(that.sketchResult[0]));

          const selectMarksValue: {
            dataMarks: string[];
            nonDataMarks: string[];
          } = Util.separateDataAndNonDataMarks(store.getState().selectionfake);

          if (selectMarksValue.dataMarks.length > 0) {
            store.dispatchSystem(
              updateSelectMarksStepFake(selectMarksValue.dataMarks)
            );
          }

          store.getState().selectMarksfake?.forEach((value, key) => {
            value.forEach((markId) => {
              document.getElementById(markId).style.opacity = '0.3';
            });
          });

          //if can suggest one frame? Then set opacity from 1 to 0.3
          const suggestPath: IPath[] = tipSuggest([]);
          if (suggestPath.length > 0) {
            suggestPath[0].lastKfMarks.forEach((mark) => {
              document.getElementById(mark).style.opacity = '0.3';
            });
          }
        } else {
          tip.show("No mark selected.");
          setTimeout(() => {
            tip.hide();
          }, 1000);
        }
        // markSelection.afterDrawing(that.sketchResult)
      }
      that.tracePoints = [];
      that.traceGrouping = [];
      that.sketchResult = [];
      that.clearCanvas();
    }
  }
  endDrawing() {
    if (this.isDown) {
      this.isDown = false;
      const combineFirst: boolean = this.recordTracePnts(
        this.tracePointsOneStroke
      );
      let tmpTime = SketchCanvas.TIME_DELIMITER;
      const that = this;
      const judgePoints = that.tracePoints[0];
      const chartArea: DOMRect = document
        .getElementById(CHART_VIEW_CONTENT_ID)
        .getBoundingClientRect();
      const effectSketchTypes = jsTool.judgeEffectTypes(that.tracePoints);
      this.selectionInterval = setInterval(() => {
        tmpTime -= 100;
        if (tmpTime === 0) {
          this.hideCanvas();
          clearInterval(that.selectionInterval);
          that.sketchResult = [];
          let hitCheck: boolean = false,
            hitCancel: boolean = false;
          //recog circle path
          if (jsTool.inBoundary(chartArea, judgePoints[0][0])) {
            //trace in chart view
            for (let i = 0, len = that.tracePoints.length; i < len; i++) {
              let tmpSelection: string[] = [];
              for (
                let j = 0, len2 = that.tracePoints[i].length;
                j < len2;
                j++
              ) {
                const tps: ICoord[] = that.tracePoints[i][j];
                //recog paths
                const pathRecog: { name: string; score: number } =
                  that.recognizePath(tps); //path recog info
                const choseByPath: { isL: boolean; selection: string[] } =
                  that.chooseMarks(tps);
                tmpSelection = [...tmpSelection, ...choseByPath.selection];
              }
              if (that.sketchResult.length === 0 && combineFirst) {
                that.sketchResult.push([...tmpSelection]);
              } else {
                that.sketchResult.push(tmpSelection);
              }
              if (hitCheck || hitCancel) {
                break;
              }
            }
            markSelection.checking(that.sketchResult);
          } else {
            switch (effectSketchTypes) {
              case "FADE":
                store.dispatch(
                  updateEffectType(
                    [store.getState().highlightKf.currentHighlightKf.aniId],
                    "fade"
                  )
                );
                break;
              case "FADE OUT":
                store.dispatch(
                  updateEffectType(
                    [store.getState().highlightKf.currentHighlightKf.aniId],
                    "fade out"
                  )
                );
                break;
              case "CIRCLE":
                store.dispatch(
                  updateEffectType(
                    [store.getState().highlightKf.currentHighlightKf.aniId],
                    "circle"
                  )
                );
                break;
              case "GROW":
                store.dispatch(
                  updateEffectType(
                    [store.getState().highlightKf.currentHighlightKf.aniId],
                    "grow"
                  )
                );
                break;
              case "WIPE TOP":
                store.dispatch(
                  updateEffectType(
                    [store.getState().highlightKf.currentHighlightKf.aniId],
                    "wipe top"
                  )
                );
                break;
              case "WIPE BOTTOM":
                store.dispatch(
                  updateEffectType(
                    [store.getState().highlightKf.currentHighlightKf.aniId],
                    "wipe bottom"
                  )
                );
                break;
              case "WIPE LEFT":
                store.dispatch(
                  updateEffectType(
                    [store.getState().highlightKf.currentHighlightKf.aniId],
                    "wipe left"
                  )
                );
                break;
              case "WIPE RIGHT":
                store.dispatch(
                  updateEffectType(
                    [store.getState().highlightKf.currentHighlightKf.aniId],
                    "wipe right"
                  )
                );
                break;
              case "WHEEL":
                store.dispatch(
                  updateEffectType(
                    [store.getState().highlightKf.currentHighlightKf.aniId],
                    "wheel"
                  )
                );
                break;
            }
          }

          that.tracePoints = [];
          that.traceGrouping = [];
          that.sketchResult = [];
          that.clearCanvas();
        }
      }, 100);
    }
  }

  recognizePath(pnts: ICoord[]): { score: number; name: string } {
    let result = sketchRecognizer.pRecognizer.recognize(pnts, true);
    return { score: jsTool.round(result.score, 2), name: result.name };
  }

  chooseMarks(pnts: ICoord[]): { isL: boolean; selection: string[] } {
    const isL: boolean = jsTool.isLasso(pnts, Lasso.CLOSE_THR);
    const Axis_domain: string = jsTool.isAxis(pnts);
    let selection: string[] = [];
    const sketchMarks = this.findBySketch(pnts);
    if (sketchMarks.length) {
      selection = sketchMarks;
    } else if (isL) {
      const lassoSelection = new Lasso();
      lassoSelection.assignSvgAndPolygon(
        document.getElementById("visChart"),
        pnts
      );
      selection = lassoSelection.lassoSelect(store.getState().selectionfake);
    } else if (Axis_domain === "axis_domain" || "axis_left") {
      const axisSelection = new Axis();
      for (let i = 0, len = pnts.length; i < len; i += 2) {
        const currentPnt: ICoord = pnts[i];
        for (let tx = currentPnt.x - 1; tx <= currentPnt.x + 1; tx++) {
          for (let ty = currentPnt.y - 1; ty <= currentPnt.y + 1; ty++) {
            const testDoms: HTMLElement[] = <HTMLElement[]>(
              document.elementsFromPoint(tx, ty)
            );
            Array.from(testDoms).forEach((testDom: HTMLElement) => {
              if (isMark(testDom)) {
                axisSelection.axisMarks.add(testDom.id);
              }
            });
          }
        }
      }
      selection = axisSelection.axisSelect(Axis_domain);
    } else {
      //cross over selection
      const crossOverSelection = new CrossOver();
      for (let i = 0, len = pnts.length; i < len; i += 2) {
        const currentPnt: ICoord = pnts[i];
        for (let tx = currentPnt.x - 1; tx <= currentPnt.x + 1; tx++) {
          for (let ty = currentPnt.y - 1; ty <= currentPnt.y + 1; ty++) {
            const testDoms: HTMLElement[] = <HTMLElement[]>(
              document.elementsFromPoint(tx, ty)
            );
            Array.from(testDoms).forEach((testDom: HTMLElement) => {
              if (isMark(testDom)) {
                crossOverSelection.crossOverMarks.add(testDom.id);
              }
            });
          }
        }
      }
      selection = crossOverSelection.crossOverSelect(
        store.getState().selectionfake
      );
    }
    return { isL: isL, selection: selection };
  }

  findBySketch(pnts: ICoord[]) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const polyLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polyline"
    );
    polyLine.setAttribute(
      "points",
      `${pnts.map((pnt) => `${pnt.x},${pnt.y}`).join(" ")}`
    );
    polyLine.setAttribute("opacity", "0");
    polyLine.setAttribute("stroke", "black");
    polyLine.setAttribute("fill", "none");
    svg.setAttribute("style", "position: fixed; left:0; top:0;");
    svg.appendChild(polyLine);
    document.body.append(svg);
    const sketchBBox = polyLine.getBoundingClientRect();
    const sketchLength = polyLine.getTotalLength();
    document.body.removeChild(svg);

    const bboxThreshold = 40;
    const pathThreshold = 50;

    let maybeMark = null;
    let minimumCost = Number.MAX_VALUE;

    for (let mid of Util.filteredDataTable.keys()) {
      const mark = document.getElementById(
        mid
      ) as unknown as SVGGeometryElement;
      const markBBox = mark.getBoundingClientRect();
      let markLength = -1;
      try {
        markLength = mark.getTotalLength() * store.getState().chartScaleRatio;
      } catch {}
      if (
        Math.abs(markBBox.left - sketchBBox.left) <= bboxThreshold &&
        Math.abs(markBBox.top - sketchBBox.top) <= bboxThreshold &&
        Math.abs(
          markBBox.left + markBBox.width - (sketchBBox.left + sketchBBox.width)
        ) <= bboxThreshold &&
        Math.abs(
          markBBox.top + markBBox.height - (sketchBBox.top + sketchBBox.height)
        ) <= bboxThreshold &&
        (markLength < 0 || Math.abs(markLength - sketchLength) <= pathThreshold)
      ) {
        const summaryCost =
          Math.abs(markBBox.left - sketchBBox.left) +
          Math.abs(markBBox.top - sketchBBox.top) +
          Math.abs(
            markBBox.left +
              markBBox.width -
              (sketchBBox.left + sketchBBox.width)
          ) +
          Math.abs(
            markBBox.top +
              markBBox.height -
              (sketchBBox.top + sketchBBox.height)
          ) +
          (markLength < 0 ? 0 : Math.abs(markLength - sketchLength));
        if (summaryCost < minimumCost) {
          maybeMark = mid;
          minimumCost = summaryCost;
        }
      }
    }

    if (maybeMark) {
      return [maybeMark];
    } else {
      return [];
    }
  }

  nonDataSelect(selection: string[]) {
    let result: Set<string> = new Set();
    selection.forEach((mId: string) => {
      const cls: string = Animation.markClass.get(mId);
      if (cls.includes("axis")) {
        const siblings: HTMLElement[] = <HTMLElement[]>(
          Array.from(
            document.getElementById(mId).parentElement.querySelectorAll(".mark")
          )
        );
        siblings.forEach((s: HTMLElement) => {
          result.add(s.id);
        });
      }
    });
    return result.size > 0 ? [...result] : selection;
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.tracePoints = [];
  }

  judgeSketchTarget(startSketchPnt: ICoord) {
    const chartArea: DOMRect = document
      .getElementById(CHART_VIEW_CONTENT_ID)
      .getBoundingClientRect();
    const kfArea: DOMRect = document
      .getElementById(KF_VIEW_CONTENT_ID)
      .getBoundingClientRect();
    if (jsTool.inBoundary(chartArea, startSketchPnt)) {
      this.sketchTarget = SketchCanvas.CHART_SKETCH;
    } else if (jsTool.inBoundary(kfArea, startSketchPnt)) {
      this.sketchTarget = SketchCanvas.KF_SKETCH;
    }
  }
}

export const sketchCanvas: SketchCanvas = new SketchCanvas();
