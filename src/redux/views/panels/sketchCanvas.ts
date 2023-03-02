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
import { updateEffectType } from "../../action/canisAction";
import { Polygon, PolygonPoint } from "../../../util/polygon";
import { multiSelectBtn } from "./viewWindow";
import { select } from "d3";
import { updateManualSelect } from "../../action/chartAction";
import { min } from "lodash";

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
  endDrawingBtn() {
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
    if (multiSelectBtn === false && judgePoints.length != 0) {
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
      }
      //clear strokes
      that.tracePoints = [];
      this.traceGrouping = [];
      that.sketchResult = [];
      that.clearCanvas();
    }
  }
  endDrawingChart() {
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
      if (multiSelectBtn === false) {
        // this.selectionInterval = setInterval(() => {
        tmpTime -= 100;
        // if (tmpTime === 0) {
        this.hideCanvas();
        // clearInterval(that.selectionInterval);
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
              // that.sketchResult.push([...store.getState().selection, ...tmpSelection]);
              that.sketchResult.push([...tmpSelection]);
            } else {
              that.sketchResult.push(tmpSelection);
            }
            if (hitCheck || hitCancel) {
              break;
            }
          }
          store.getState().selectMarks.forEach((value: string[]) => {
            that.sketchResult[0] = that.sketchResult[0].filter(function (v) { return value.indexOf(v) == -1 })
          })
          const sktResult: string[][] = [that.sketchResult[0].sort()];
          if (store.getState().selectMode === 'manual') {
            const newSelect: Set<string> = new Set(sktResult[0]);
            store.dispatchSystem(updateManualSelect(newSelect, true));
          } else {
            markSelection.checking(sktResult);
          }
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
        // }
        // }, 100);
      }
    }
  }
  endDrawingKeyframe() {
    if (this.isDown) {
      this.isDown = false;
      const combineFirst: boolean = this.recordTracePnts(
        this.tracePointsOneStroke
      );
      let tmpTime = SketchCanvas.TIME_DELIMITER;
      const that = this;
      const effectSketchTypes = jsTool.judgeEffectTypes(that.tracePoints);
      if (multiSelectBtn === false) {
        this.selectionInterval = setInterval(() => {
          tmpTime -= 100;
          if (tmpTime === 0) {
            this.hideCanvas();
            clearInterval(that.selectionInterval);
            that.sketchResult = [];
            //recog circle path
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
    if (store.getState().clicktime < 100) {
      console.warn("click");
      const marks = document.elementsFromPoint(pnts[0].x, pnts[0].y).filter(isMark);
      if (marks.length == 1) {
        selection.push(marks[0].id);
      } else {
        for (let mark of marks) {
          if (mark.tagName == "line") {
            continue;
          }
          if (mark.tagName == "path" && mark.getAttribute("fill").toLowerCase() == "none") {
            continue;
          }
          selection.push(mark.id);
          break;
        }
      }
    } else if (sketchMarks.length) {
      // tip.show('sketch')
      selection = sketchMarks;
      console.warn("is sketch");
    } else
      if (isL) {
        console.warn("is lasso");
        const lassoSelection = new Lasso();
        lassoSelection.assignSvgAndPolygon(
          document.getElementById("visChart"),
          pnts
        );
        selection = lassoSelection.lassoSelect(store.getState().selection);
      }
      // else if (Axis_domain === "axis_domain" || "axis_left") {
      //   const axisSelection = new Axis();
      //   for (let i = 0, len = pnts.length; i < len; i += 2) {
      //     const currentPnt: ICoord = pnts[i];
      //     for (let tx = currentPnt.x - 1; tx <= currentPnt.x + 1; tx++) {
      //       for (let ty = currentPnt.y - 1; ty <= currentPnt.y + 1; ty++) {
      //         const testDoms: HTMLElement[] = <HTMLElement[]>(
      //           document.elementsFromPoint(tx, ty)
      //         );
      //         Array.from(testDoms).forEach((testDom: HTMLElement) => {
      //           if (isMark(testDom)) {
      //             axisSelection.axisMarks.add(testDom.id);
      //           }
      //         });
      //       }
      //     }
      //   }
      //   selection = axisSelection.axisSelect(Axis_domain);
      // }
      else {
        //cross over selection
        const crossOverSelection = new CrossOver();
        let totalLength = 0;
        for (let i = 0, len = pnts.length; i < len - 1; i++) {
          totalLength += Math.hypot(pnts[i].x - pnts[i + 1].x, pnts[i].y - pnts[i + 1].y);
        }
        const minLength = 10;
        const cut = Math.min((totalLength - minLength) / 2, 5);

        if (totalLength > minLength) {
          let start = 0;
          let startLength = 0;
          while (startLength < cut) {
            startLength += Math.hypot(pnts[start].x - pnts[start + 1].x, pnts[start].y - pnts[start + 1].y)
            start++;
          }
          let end = pnts.length - 1;
          let endLength = 0;
          while (endLength < cut) {
            endLength += Math.hypot(pnts[end].x - pnts[end - 1].x, pnts[end].y - pnts[end - 1].y)
            end--;
          }
          if (start < end) pnts = pnts.slice(start, end);
        }

        for (let i = 0, len = pnts.length; i < len; i += 2) {
          const currentPnt: ICoord = pnts[i];
          for (let tx = currentPnt.x - 1; tx <= currentPnt.x + 1; tx++) {
            for (let ty = currentPnt.y - 1; ty <= currentPnt.y + 1; ty++) {
              let tx = currentPnt.x;
              let ty = currentPnt.y;
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

  findBySketch(pnts: ICoord[]): string[] {
    // let bboxThreshold: number = 40;
    // let pathThreshold: number = 50;
    // if (window.innerHeight < 1000 && window.innerWidth < 1700) {
    //   bboxThreshold = 30 * Math.pow(Math.min(window.innerWidth / 2203, window.innerHeight / 1157), 2);
    //   pathThreshold = 42 * Math.pow(Math.min(window.innerWidth / 2203, window.innerHeight / 1157), 2);
    // } else {
    //   bboxThreshold = 40 * Math.pow(Math.min(window.innerWidth / 2203, window.innerHeight / 1157), 1);
    //   pathThreshold = 50 * Math.pow(Math.min(window.innerWidth / 2203, window.innerHeight / 1157), 1);
    // }
    // let maybeMark = null;
    // let minimumCost = Number.MAX_VALUE;

    // for (let mid of Util.filteredDataTable.keys()) {
    //   const mark = document.getElementById(
    //     mid
    //   ) as unknown as SVGGeometryElement;
    //   const markBBox = mark.getBoundingClientRect();
    //   let markLength = -1;
    //   try {
    //     markLength = mark.getTotalLength() * store.getState().chartScaleRatio;
    //   } catch {
    //     // just ignore some cases don't have length (such as text)
    //   }
    //   if (
    //     Math.abs(markBBox.left - sketchBBox.left) <= bboxThreshold &&
    //     Math.abs(markBBox.top - sketchBBox.top) <= bboxThreshold &&
    //     Math.abs(
    //       markBBox.left + markBBox.width - (sketchBBox.left + sketchBBox.width)
    //     ) <= bboxThreshold &&
    //     Math.abs(
    //       markBBox.top + markBBox.height - (sketchBBox.top + sketchBBox.height)
    //     ) <= bboxThreshold &&
    //     (markLength < 0 || Math.abs(markLength - sketchLength) <= pathThreshold)
    //   ) {
    //     const summaryCost =
    //       Math.pow(Math.abs(markBBox.left - sketchBBox.left) +
    //         Math.abs(markBBox.top - sketchBBox.top) +
    //         Math.abs(
    //           markBBox.left +
    //           markBBox.width -
    //           (sketchBBox.left + sketchBBox.width)
    //         ) +
    //         Math.abs(
    //           markBBox.top +
    //           markBBox.height -
    //           (sketchBBox.top + sketchBBox.height)
    //         ), 3) +
    //       (markLength < 0 ? 0 : Math.abs(markLength - sketchLength));
    //     if (summaryCost < minimumCost) {
    //       maybeMark = mid;
    //       minimumCost = summaryCost;
    //     }
    //   }
    // }
    const sketchVertices: PolygonPoint[] = [];
    const svg = document.getElementById("visChart");
    for (let i of pnts) {
      sketchVertices.push(jsTool.screenToSvgCoords(svg, i.x, i.y) as PolygonPoint);
    }
    const sketchPolygon = new Polygon();
    sketchPolygon.fromVertices(sketchVertices);
    // let display = sketchPolygon.display();
    // display.setAttribute("fill", "green");
    // display.setAttribute("opacity", ".1");
    // svg.appendChild(display);

    let maybeMark = null;
    let bestCost = Infinity;
    // console.warn(document.getElementsByClassName("mark"));
    Array.from(document.getElementsByClassName("mark")).forEach(element => {
      const markPolygon = new Polygon;
      markPolygon.fromElement(element as HTMLElement);

      // const massCenterDiffX = markPolygon.massCenter.x - sketchPolygon.massCenter.x;
      // const massCenterDiffY = markPolygon.massCenter.y - sketchPolygon.massCenter.y;
      // const massCenterDis = Math.hypot(massCenterDiffX, massCenterDiffY);

      // if (massCenterDis > 40) {
      //   return;
      // }

      const thresholdRatio = 0.1;

      let threshold = Math.max(0, Math.min(
        sketchPolygon.length * thresholdRatio,
        markPolygon.closed ? markPolygon.length * thresholdRatio : markPolygon.length * Math.PI * thresholdRatio
      ));
      if (!markPolygon.closed) {
        threshold = Math.max(threshold, 20);
      }
      if(element.tagName == "circle"){
        threshold = Math.max(threshold, 30);
      }

      const maxBoundingBoxDis = Math.max(
        Math.abs(markPolygon.xMin - sketchPolygon.xMin),
        Math.abs(markPolygon.xMax - sketchPolygon.xMax),
        Math.abs(markPolygon.yMin - sketchPolygon.yMin),
        Math.abs(markPolygon.yMax - sketchPolygon.yMax),
      )

      if (maxBoundingBoxDis > threshold) {
        return;
      }

      // svg.appendChild(sketchPolygon.display());

      const numberSamples = 50;
      const step = Math.ceil(sketchVertices.length / numberSamples);

      let distanceMean = 0;
      let maxDis = -Infinity;
      let maxOriginalDis = -Infinity;


      for (let i = 0; i < sketchVertices.length; i += step) {
        let dis = markPolygon.distance({
          x: sketchVertices[i].x,
          y: sketchVertices[i].y
        });
        distanceMean += dis;
        maxDis = Math.max(maxDis, dis);
        maxOriginalDis = Math.max(maxOriginalDis, markPolygon.distance(sketchVertices[i]));
        // const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        // circle.setAttribute("cx", sketchVertices[i].x.toString());
        // circle.setAttribute("cy", sketchVertices[i].y.toString());
        // circle.setAttribute("r", "2");
        // circle.setAttribute("fill", "green");
        // svg.appendChild(circle);
      }
      distanceMean /= numberSamples;
      if (maxDis > threshold) {
        return;
      }

      let markPolygonVertices = markPolygon.vertices;
      for (let i = 0; i < markPolygonVertices.length; i++) {
        let dis = sketchPolygon.distance(markPolygonVertices[i]);
        maxDis = Math.max(maxDis, dis);
      }
      if (maxDis > threshold) {
        return;
      }

      // if (maxOriginalDis > 40) {
      //   return;
      // }
      // if (distanceMean > 40) {
      //   return;
      // }
      // console.log(distanceMean)
      // console.warn(`${maxOriginalDis} ${maxBoundingBoxDis}`)
      // const cost = maxDis + maxBoundingBoxDis;
      // const cost = maxOriginalDis + maxBoundingBoxDis;
      // const cost = massCenterDis + maxDis;
      // const cost = massCenterDis + distanceMean;
      // console.warn(markPolygon);
      const cost = maxDis;
      if (cost < bestCost) {
        maybeMark = element.id;
        bestCost = cost;
      }
    });
    console.warn(bestCost);
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
