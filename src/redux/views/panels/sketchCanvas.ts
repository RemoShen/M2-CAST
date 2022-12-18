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
import { ICoord } from "../../global-interfaces";
import { sketchRecognizer } from "../../../app/core/sketchRecognizer";
import { store } from "../../store";
import { toggleVideoMode } from "../../action/videoAction";
import { isMark } from "../../../util/appTool";
import { jsTool } from "../../../util/jsTool";
import { update } from "lodash";
import { updateEffectType } from "../../action/canisAction";
import { updateSelection } from "../../action/chartAction";
import Suggest from "../../../app/core/suggest";
import { suggestBox } from "../vl/suggestBox";
import { confirmBtn } from "./viewWindow";
import Axis from "../../../util/axis";
import { toggleLoading } from "../../renderers/renderer-tools";
import { Loading } from "../widgets/loading";
import Util from "../../../app/core/util";

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
  tracePoints: ICoord[][][]; //跟踪点的轨迹
  tracePointsOneStroke: ICoord[]; //跟踪点连接
  traceGrouping: number[][];
  pathInterval: NodeJS.Timeout;
  selectionInterval: NodeJS.Timeout;
  // recordingPath = false;
  // recognizeResult: { score: number, name: string }
  // lassoSelection: Lasso
  // crossOverSelection: CrossOver
  sketchResult: string[][];
  // resultCache: Set<string>
  clearCache: boolean;
  sketchTarget: string;
  // _touchType: number

  // set touchType(t: number) {
  //     this._touchType = t;
  //     Reducer.triger(action.UPDATE_TOUCH_TYPE, t);
  // }

  // get touchType(): number {
  //     return this._touchType;
  // }

  constructor() {
    this.isDown = false;
    this.traceGrouping = [];
    this.tracePoints = [];
    this.tracePointsOneStroke = [];
    // this.resultCache = new Set();
    this.clearCache = false;
    // this.recordingPath = false;
    // this.lassoSelection = new Lasso();
    // this.crossOverSelection = new CrossOver();
    this.sketchTarget = "";
    this.sketching = false;
    // this.initCanvas();

    // const that = this;
    // document.addEventListener('touchstart', (e: TouchEvent) => {
    //     if (e.touches.length === 3 && e.targetTouches.length === 2) {
    //         that.touchType = TOUCH_MULTI;
    //     } else if (e.touches.length === 2 && e.targetTouches.length === 1) {
    //         // that.touchType = TOUCH_STRAIGHT;
    //     }
    // });
    // document.addEventListener('touchend', (e: TouchEvent) => {
    //     if (that.touchType & TOUCH_MULTI && !state.sketching) {
    //         createKf();
    //     }
    //     that.touchType = TOUCH_NULL;
    // });

    // //for test
    // document.addEventListener('keydown', (e) => {
    //     if (e.shiftKey) {//multi select
    //         that.touchType = TOUCH_MULTI;
    //     } else if (e.ctrlKey) {//straight line
    //         // that.touchType = TOUCH_STRAIGHT;
    //     }
    // })
    // document.addEventListener('keyup', (e) => {
    //     if (that.touchType & TOUCH_MULTI && !state.sketching) {
    //         createKf();
    //     }
    //     that.touchType = TOUCH_NULL;
    // })
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
    // if (!this.recordingPath) {
    //     this.recordingPath = true;
    //     //reset paras
    //     this.tracePoints = [];
    // } else {
    //     clearInterval(this.pathInterval);
    // }
    // if (this.touchType === TOUCH_MULTI) {
    // console.log('clear multi interval');

    clearInterval(this.selectionInterval);
    // }
  }

  drawing(e: PointerEvent) {
    let x = e.clientX,
      y = e.clientY;

    if (this.isDown) {
      x -= 0 - window.scrollX;
      y -= 0 - window.scrollY;

      //check modifier status
      // if (state.touchType === TOUCH_STRAIGHT) {
      //     if (state.straightModifier.startPnt.x === -1 && state.straightModifier.startPnt.y === -1) {
      //         Reducer.triger(action.STRAIGHT_MODIFIER_START, this.tracePointsOneStroke[this.tracePointsOneStroke.length - 1]);
      //     } else {
      //         let direction: number = state.straightModifier.direction;
      //         if (direction === -1) {//need to calculate direction
      //             if (Math.abs(y - state.straightModifier.startPnt.y) / Math.abs(x - state.straightModifier.startPnt.x) < 1) {//x direction
      //                 direction = 0;
      //             } else {//y direction
      //                 direction = 1;
      //             }
      //             Reducer.triger(action.STRAIGHT_MODIFIER_DIRECT, direction);
      //         }
      //         switch (direction) {
      //             case 0:
      //                 y = state.straightModifier.startPnt.y;
      //                 break;
      //             case 1:
      //                 x = state.straightModifier.startPnt.x;
      //                 break;
      //         }
      //     }
      // }
      this.tracePointsOneStroke.push({ x: x, y: y }); // append
      this.drawConnectedPoint(
        this.tracePointsOneStroke[this.tracePointsOneStroke.length - 2],
        this.tracePointsOneStroke[this.tracePointsOneStroke.length - 1]
      );
    }
  }

  drawConnectedPoint(from: ICoord, to: ICoord): void {
    // switch (state.touchType) {
    //     case TOUCH_SINGLE:
    //         this.ctx.strokeStyle = '#000';
    //         break;
    //     case TOUCH_MULTI:
    //         this.ctx.strokeStyle = '#aaa';
    //         break;
    // }
    this.ctx.strokeStyle = "#000";
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  recordTracePnts(pnts: ICoord[]): boolean {
    let combineFirst: boolean = false; //whether to add the first selection into state.selection
    // switch (state.touchType) {
    //     case TOUCH_SINGLE:
    //         this.tracePoints.push([pnts]);
    //         break;
    //     case TOUCH_MULTI:
    //         if (this.tracePoints.length === 0) {
    //             this.tracePoints[0] = [];
    //             combineFirst = true;
    //         }
    //         this.tracePoints[this.tracePoints.length - 1].push(pnts);
    //         break;
    // }
    if (this.tracePoints.length === 0) {
      this.tracePoints[0] = [];
      combineFirst = true;
    }
    this.tracePoints[this.tracePoints.length - 1].push(pnts);
    return combineFirst;
  }
  endDrawingBtn() {
    // if (this.isDown) {
    this.isDown = false;
    const combineFirst: boolean = this.recordTracePnts(
      this.tracePointsOneStroke
    );
    let tmpTime = SketchCanvas.TIME_DELIMITER;
    const that = this;
    const judgepoints = that.tracePoints[0];
    const chartArea: DOMRect = document
      .getElementById(CHART_VIEW_CONTENT_ID)
      .getBoundingClientRect();
    const judgePoints: ICoord[][] = [];
    judgepoints.forEach((item) => {
      if (item.length != 0) {
        judgePoints.push(item);
      }
    });
    if (confirmBtn === false && judgePoints.length != 0) {
      toggleLoading({
        isLoading: true,
        targetEle: document.body,
        content: Loading.EXPORTING,
      });
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
              for (let j = 0, len2 = judgePoints.length - 1; j < len2; j++) {
                const tps: ICoord[] = judgePoints[j];
                //recog paths
                // const pathRecog: { name: string, score: number } = that.recognizePath(tps);

                const choseByPath: { isL: boolean; selection: string[] } =
                  that.chooseMarks(tps);
                tmpSelection = [...tmpSelection, ...choseByPath.selection];
              }
              if (that.sketchResult.length === 0 && combineFirst) {
                // that.sketchResult.push([...store.getState().selection, ...tmpSelection]);
                that.sketchResult.push([...tmpSelection]);
              } else {
                that.sketchResult.push(tmpSelection);
              }

              if (hitCheck || hitCancel) {
                break;
              }
            }
            markSelection.checking(that.sketchResult);
          }
          //clear strokes
          that.tracePoints = [];
          this.traceGrouping = [];
          that.sketchResult = [];
          that.clearCanvas();
        }
      }, 100);
    }

    // }
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
      if (confirmBtn === false) {
        toggleLoading({
          isLoading: true,
          targetEle: document.body,
          content: Loading.SUGGESTING,
        });
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
                  // that.sketchResult.push([...store.getState().selection, ...tmpSelection]);
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
  }

  recognizePath(pnts: ICoord[]): { score: number; name: string } {
    let result = sketchRecognizer.pRecognizer.recognize(pnts, true);
    return { score: jsTool.round(result.score, 2), name: result.name };
  }

  chooseMarks(pnts: ICoord[]): { isL: boolean; selection: string[] } {
    const isL: boolean = jsTool.isLasso(pnts, Lasso.CLOSE_THR);
    const Axis_domain: string = jsTool.isAxis(pnts);
    // const isSketch: boolean = (jsTool.is)
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
      selection = lassoSelection.lassoSelect(store.getState().selection);
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
        store.getState().selection
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
      } catch {
        // just ignore some cases don't have length (such as text)
      }
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

  /**
   * user is drawing cancel mark
   */
  // canceling() {
  //     Reducer.saveAndTriger(action.UPDATE_MARKS_TO_CONFIRM, state.marksToConfirm, []);
  //     Reducer.saveAndTriger(action.UPDATE_SUGGESTED_MARKS, state.suggestedMarks, []);
  //     console.log('after cancel: ', state.suggestedMarks, state.marksToConfirm);
  // }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.tracePoints = [];
  }

  /**
   * where the user is sketching in chart view 判断用户进行交互操作的位置
   *维护进sketchTarget 到底是 chart部分还是kf部分？
   */
  judgeSketchTarget(startSketchPnt: ICoord) {
    const chartArea: DOMRect = document
      .getElementById(CHART_VIEW_CONTENT_ID)
      .getBoundingClientRect();
    const kfArea: DOMRect = document
      .getElementById(KF_VIEW_CONTENT_ID)
      .getBoundingClientRect();
    if (jsTool.inBoundary(chartArea, startSketchPnt)) {
      // if (jsTool.inBoundary({ x1: chartArea.x, y1: chartArea.y, x2: chartArea.x + chartArea.width, y2: chartArea.y + chartArea.height }, startSketchPnt)) {
      this.sketchTarget = SketchCanvas.CHART_SKETCH;
    } else if (jsTool.inBoundary(kfArea, startSketchPnt)) {
      this.sketchTarget = SketchCanvas.KF_SKETCH;
    }
  }
}

export const sketchCanvas: SketchCanvas = new SketchCanvas();
