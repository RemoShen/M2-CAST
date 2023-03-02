import { select, xml } from "d3";
import classifyPoint from "robust-point-in-polygon";
import Util from "../app/core/util";
import { updateSelection } from "../redux/action/chartAction";
import { ICoord } from "../redux/global-interfaces";
import { store } from "../redux/store";
import { isMark } from "./appTool";
import { jsTool } from "./jsTool";
import { Polygon, PolygonPoint } from "./polygon";

type Point = [number, number];

export default class Lasso {
  static CLOSE_DIS: number = 75;
  static CLOSE_THR: number = 26;
  static ORIGIN_RADIUS: number = 5;
  static LASSO_ORIGIN_ID = "lassoOrigin";
  static LASSO_PATH_ID = "lassoPath";
  static LASSO_CLOSEPATH_ID = "lassoClosePath";

  svg: HTMLElement;
  origin: ICoord;
  polygon: Point[];
  points: ICoord[];
  constructor() {
    this.polygon = [];
  }

  public createSelectionFrame(svg: HTMLElement, origin: ICoord) {
    this.svg = svg;
    this.origin = origin;
    this.svg.appendChild(this.createPath(origin));
    this.svg.appendChild(this.createOrigin(origin));
  }

  public createOrigin(origin: ICoord): SVGCircleElement {
    const originCircle: SVGCircleElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    originCircle.setAttributeNS(null, "id", Lasso.LASSO_ORIGIN_ID);
    originCircle.setAttributeNS(null, "cx", origin.x.toString());
    originCircle.setAttributeNS(null, "cy", origin.y.toString());
    originCircle.setAttributeNS(null, "r", Lasso.ORIGIN_RADIUS.toString());
    originCircle.setAttributeNS(null, "opacity", ".5");
    originCircle.setAttributeNS(null, "fill", "#3399FF");
    return originCircle;
  }

  public createPath(origin: ICoord): SVGPathElement {
    const lassoPath: SVGPathElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    lassoPath.setAttributeNS(null, "id", Lasso.LASSO_PATH_ID);
    lassoPath.setAttributeNS(null, "stroke", "#505050");
    lassoPath.setAttributeNS(null, "fill-opacity", ".05");
    lassoPath.setAttributeNS(null, "d", "M" + origin.x + "," + origin.y);
    this.polygon.push([origin.x, origin.y]);
    return lassoPath;
  }

  public updatePath(coord: ICoord): void {
    const oriPath: HTMLElement = document.getElementById(Lasso.LASSO_PATH_ID);
    (<SVGPathElement>(<unknown>oriPath)).setAttributeNS(
      null,
      "d",
      oriPath.getAttribute("d") + "L" + coord.x + "," + coord.y
    );
    this.polygon.push([coord.x, coord.y]);
    if (jsTool.pointDist(coord, this.origin) <= Lasso.CLOSE_DIS) {
      if (document.getElementById(Lasso.LASSO_CLOSEPATH_ID)) {
        this.updateClosePath(coord);
      } else {
        this.createClosePath(coord);
      }
    } else {
      this.removeClosePath();
    }
  }

  /**
   *
   * @param points : screen coords, need to trans to svg coords
   */
  public assignSvgAndPolygon(svg: any, points: ICoord[]) {
    this.polygon = [];
    this.svg = svg;
    this.points = points;
    if (typeof svg !== "undefined") {
      points.forEach((p) => {
        const svgP: ICoord = jsTool.screenToSvgCoords(this.svg, p.x, p.y);
        this.polygon.push([svgP.x, svgP.y]);
      });
    }
  }

  public createClosePath(coord: ICoord): void {
    const closePath: SVGLineElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    closePath.setAttributeNS(null, "id", Lasso.LASSO_CLOSEPATH_ID);
    closePath.setAttributeNS(null, "stroke", "#505050");
    closePath.setAttributeNS(null, "stroke-dasharray", "4,4");
    closePath.setAttributeNS(null, "x1", this.origin.x.toString());
    closePath.setAttributeNS(null, "y1", this.origin.y.toString());
    closePath.setAttributeNS(null, "x2", coord.x.toString());
    closePath.setAttributeNS(null, "y2", coord.y.toString());
    this.svg.appendChild(closePath);
  }

  public updateClosePath(coord: ICoord): void {
    const closePath: SVGLineElement = <SVGLineElement>(
      (<unknown>document.getElementById(Lasso.LASSO_CLOSEPATH_ID))
    );
    closePath.setAttributeNS(null, "x2", coord.x.toString());
    closePath.setAttributeNS(null, "y2", coord.y.toString());
  }

  public removeClosePath(): void {
    if (document.getElementById(Lasso.LASSO_CLOSEPATH_ID)) {
      document.getElementById(Lasso.LASSO_CLOSEPATH_ID).remove();
    }
  }

  public removeSelectionFrame(): void {
    if (document.getElementById(Lasso.LASSO_ORIGIN_ID)) {
      document.getElementById(Lasso.LASSO_ORIGIN_ID).remove();
    }
    if (document.getElementById(Lasso.LASSO_PATH_ID)) {
      document.getElementById(Lasso.LASSO_PATH_ID).remove();
    }
    this.removeClosePath();
  }

  public lassoSelect(framedMarks: string[]): string[] {
    const result: string[] = [];
    const maybeResult: string[] = [];
    /*
    //filter marks
    Array.from(document.getElementsByClassName("mark")).forEach(
      (m: HTMLElement) => {
        const markBBox = m.getBoundingClientRect();
        const coord1: ICoord = jsTool.screenToSvgCoords(
          this.svg,
          markBBox.left,
          markBBox.top
        );
        const coord2: ICoord = jsTool.screenToSvgCoords(
          this.svg,
          markBBox.left + markBBox.width,
          markBBox.top + markBBox.height
        );

        const pnt1 = <Point>[coord1.x, coord1.y],
          pnt2 = <Point>[coord1.x, coord2.y],
          pnt3 = <Point>[coord2.x, coord1.y],
          pnt4 = <Point>[coord2.x, coord2.y],
          pnt5 = <Point>[
            coord1.x + (coord2.x - coord1.x) / 2,
            coord1.y + (coord2.y - coord1.y) / 2,
          ];

        let framed: boolean = false;
        if (classifyPoint(this.polygon, pnt5) <= 0) {
          let framedPnt: number = 0;
          [pnt1, pnt2, pnt3, pnt4].forEach((pnt) => {
            if (classifyPoint(this.polygon, pnt) <= 0) {
              framedPnt++;
            }
          });
          framed = framedPnt >= 0;
        }

        if (framed) {
          result.push(m.id);
        }
      }
    );
    if (result.length == 0) {
      Array.from(document.getElementsByClassName("mark")).forEach(
        (m: HTMLElement) => {
          const markBBox = m.getBoundingClientRect();
          const coord1: ICoord = jsTool.screenToSvgCoords(
            this.svg,
            markBBox.left,
            markBBox.top
          );
          const coord2: ICoord = jsTool.screenToSvgCoords(
            this.svg,
            markBBox.left + markBBox.width,
            markBBox.top + markBBox.height
          );

          const pnt1 = <Point>[coord1.x, coord1.y],
            pnt2 = <Point>[coord1.x, coord2.y],
            pnt3 = <Point>[coord2.x, coord1.y],
            pnt4 = <Point>[coord2.x, coord2.y],
            pnt5 = <Point>[
              coord1.x + (coord2.x - coord1.x) / 2,
              coord1.y + (coord2.y - coord1.y) / 2,
            ];

          let framed: boolean = false;
          if (classifyPoint(this.polygon, pnt5) <= 0) {
            // let framedPnt: number = 0;
            // [pnt1, pnt2, pnt3, pnt4].forEach((pnt) => {
            //   if (classifyPoint(this.polygon, pnt) <= 0) {
            //     framedPnt++;
            //   }
            // });
            // framed = framedPnt >= 0;
            result.push(m.id);
          }

          //update the appearance of marks
          // if ((framedMarks.includes(m.id) && framed) || (!framedMarks.includes(m.id) && !framed)) {
          //     // m.classList.add('non-framed-mark');
          // } else if ((framedMarks.includes(m.id) && !framed) || (!framedMarks.includes(m.id) && framed)) {
          //     // m.classList.remove('non-framed-mark');
          //     result.push(m.id);
          // }
        }
      );
    }

    let selectedMarks = new Set(result);

    for (let i = 0, len = this.points.length; i < len; i += 2) {
      const currentPnt: ICoord = this.points[i];
      // for (let tx = currentPnt.x - 1; tx <= currentPnt.x + 1; tx++) {
      //   for (let ty = currentPnt.y - 1; ty <= currentPnt.y + 1; ty++) {
      let tx = currentPnt.x;
      let ty = currentPnt.y;
      const testDoms: HTMLElement[] = <HTMLElement[]>(
        document.elementsFromPoint(tx, ty)
      );
      Array.from(testDoms).forEach((testDom: HTMLElement) => {
        if (isMark(testDom)) {
          selectedMarks.add(testDom.id);
        }
      });
      //   }
      // }
    }
    return [...selectedMarks];
    */
    const svg = document.getElementById("visChart");
    const lassoVertices: PolygonPoint[] = [];
    for (let i of this.points) {
      lassoVertices.push(jsTool.screenToSvgCoords(svg, i.x, i.y) as PolygonPoint);
    }
    const lassoPolygon = new Polygon();
    lassoPolygon.fromVertices(lassoVertices);
    // svg.appendChild(lassoPolygon.display());

    const marks = Array.from(document.getElementsByClassName("mark"));
    const collections: Map<string, {
      rows: Map<string, Set<string>>,
      cols: Map<string, Set<string>>
    }> = new Map();
    const others: string[] = [];
    const areas: Map<string, {
      all: number;
      intersect: number;
    }> = new Map();

    for (let mark of marks) {
      const polygon = new Polygon();
      polygon.fromElement(mark as HTMLElement);

      const yMin = polygon.yMin;
      const yMax = polygon.yMax;

      const numberSamples = 50;

      if (polygon.closed) {
        let y = yMin;
        const yInc = (yMax - yMin) / (numberSamples + 1);

        let areaIntersect = 0;
        let areaElement = 0;

        for (let i = 0; i < numberSamples; i++) {
          y += yInc;
          const intersects = polygon.lineIntersect(y).map(x => [x, 0]).concat(
            lassoPolygon.lineIntersect(y).map(x => [x, 1])
          )
          intersects.sort((a, b) => a[0] - b[0]);
          let lastPoint = 0;
          let inPolygon = false;
          let inLasso = false;
          for (let j of intersects) {
            if (inPolygon) {
              areaElement += j[0] - lastPoint;
              if (inLasso) {
                areaIntersect += j[0] - lastPoint;
              }
            }
            lastPoint = j[0];
            if (j[1]) {
              inLasso = !inLasso;
            } else {
              inPolygon = !inPolygon;
            }
          }
        }
        areas.set(mark.id, { all: areaElement * yInc, intersect: areaIntersect * yInc })
        if (areaIntersect > 0) {
          maybeResult.push(mark.id);
        }
      } else {
        let numberInside = 0;
        let length = polygon.length;
        let resampled = polygon.resample(numberSamples);
        for (let p of resampled) {
          let Intersects = lassoPolygon.lineIntersect(p.y).filter(x => x > p.x);
          if (Intersects.length % 2 === 1) {
            numberInside++;
          }
        }
        areas.set(mark.id, { all: length, intersect: numberInside / numberSamples * length });
        if (numberInside > 0) {
          maybeResult.push(mark.id);
        }
      }
      const collectionAttr = mark.getAttribute("collection");
      if (collectionAttr == null || collectionAttr == "") {
        others.push(mark.id);
        continue;
      }
      const collection = JSON.parse(collectionAttr);
      if (!collections.has(collection.id)) {
        collections.set(collection.id, { rows: new Map(), cols: new Map() });
      }
      const thisCollection = collections.get(collection.id);
      if (!thisCollection.rows.has(collection.row)) {
        thisCollection.rows.set(collection.row, new Set());
      }
      if (!thisCollection.cols.has(collection.col)) {
        thisCollection.cols.set(collection.col, new Set())
      }
      thisCollection.rows.get(collection.row).add(mark.id);
      thisCollection.cols.get(collection.col).add(mark.id);
    }

    // const betterSet = function (setA: Set<string>, setB: Set<string>): Set<string> {
    //   let sa = 0;
    //   let sb = 0;
    //   let a1 = 0;
    //   let a2 = 0;
    //   let b1 = 0;
    //   let b2 = 0;
    //   const setTotal = new Set([...setA, ...setB]);
    //   for (let id of setTotal) {
    //     const inA = setA.has(id);
    //     const inB = setB.has(id);
    //     let area = areas.get(id);
    //     if (inA) {
    //       sa += area.all;
    //     }
    //     if (inB) {
    //       sb += area.all;
    //     }
    //     if (inA && !inB) {
    //       a1 += area.intersect;
    //       a2 += area.all - area.intersect;
    //     } else if (inB && !inA) {
    //       b1 += area.intersect;
    //       b2 += area.all - area.intersect;
    //     }
    //   }
    //   const factor = 1;
    //   if ((a1 - a2 * factor) > (b1 - b2 * factor)) {
    //     return setA;
    //   } else {
    //     return setB;
    //   }
    // }

    const factor = 0.3;

    const getScore = (set: Set<string>) => {
      let si = 0;
      let st = 0;
      for (let i of set) {
        const area = areas.get(i);
        si += area.intersect;
        st += area.all - area.intersect;
      }
      console.warn(set, si, st);
      return si * (1 - factor) - st * (factor);
    }

    // for (let [collectionId, { rows, cols }] of collections) {
    //   let bestSet: Set<string> = new Set();
    //   for (let [rowId, row] of rows) {
    //     for (let id of row) {
    //       bestSet.add(id);
    //     }
    //   }
    //   let bestScore = getScore(bestSet);

    //   // console.warn(bestSet);

    //   for (let [rowId, row] of rows) {
    //     const score = getScore(row);
    //     if (score > bestScore) {
    //       bestScore = score;
    //       bestSet = row;
    //     }
    //   }

    //   for (let [colId, col] of cols) {
    //     const score = getScore(col);
    //     if (score > bestScore) {
    //       bestScore = score;
    //       bestSet = col;
    //     }
    //   }

    //   for (let [rowId, row] of rows) {
    //     for (let id of row) {
    //       const score = getScore(new Set([id]));
    //       if (score > bestScore) {
    //         bestScore = score;
    //         bestSet = new Set([id]);
    //       }
    //     }
    //   }

    //   let totalArea = 0;
    //   let totalIntersect = 0;
    //   let collectionTotalArea = 0;
    //   for (let id of bestSet) {
    //     const area = areas.get(id);
    //     totalArea += area.all;
    //     totalIntersect += area.intersect;
    //   }
    //   for (let [rowId, row] of rows) {
    //     for (let id of row) {
    //       collectionTotalArea += areas.get(id).intersect;
    //     }
    //   }
    //   // console.warn(bestSet);
    //   if (totalIntersect / totalArea >= factor
    //     // && collectionTotalArea / totalIntersect < 3
    //   ) {
    //     for (let id of bestSet) {
    //       result.push(id);
    //     }
    //   } else {
    //     for (let [rowId, row] of rows) {
    //       for (let id of row) {
    //         let area = areas.get(id).intersect;
    //         if (area > 0) {
    //           result.push(id);
    //         }
    //       }
    //     }
    //   }
    // }
    for (let [collectionId, { rows, cols }] of collections) {
      let maxArea = 0;
      for (let [rowId, row] of rows) {
        for (let id of row) {
          maxArea = Math.max(maxArea, areas.get(id).intersect)
        }
      }
      const areaThreshold = maxArea * 0.15;
      const areaThreshold2 = 0.8;
      for (let [rowId, row] of rows) {
        for (let id of row) {
          let area = areas.get(id);
          if (area.intersect > areaThreshold
            || area.intersect / area.all >= areaThreshold2) {
            result.push(id);
          }
        }
      }
    }
    for(let mark of others){
      let area = areas.get(mark);
      if(area.intersect){
        result.push(mark);
      }
    }

    // for (let i of others) {
    //   const area = areas.get(i);
    //   if (area.intersect / area.intersect > 0.5) {
    //     result.push(i);
    //   }
    // }

    // // if (result.length == 0 && maybeResult.length == 1) {
    // //   return maybeResult;
    // // }

    // Array.from(document.getElementsByClassName("mark")).forEach(element => {
    //   const polygon = new Polygon();
    //   polygon.fromElement(element as HTMLElement);
    //   // svg.append(polygon.display());
    //   const yMin = polygon.yMin;
    //   const yMax = polygon.yMax;
    //   if (yMin >= yMax) {
    //     return;
    //   }
    //   const numberSamples = 50;

    //   if (polygon.closed) {
    //     let y = yMin;
    //     const yInc = (yMax - yMin) / (numberSamples + 1);

    //     let areaIntersect = 0;
    //     let areaElement = 0;

    //     for (let i = 0; i < numberSamples; i++) {
    //       y += yInc;
    //       const intersects = polygon.lineIntersect(y).map(x => [x, 0]).concat(
    //         lassoPolygon.lineIntersect(y).map(x => [x, 1])
    //       )
    //       intersects.sort((a, b) => a[0] - b[0]);
    //       let lastPoint = 0;
    //       let inPolygon = false;
    //       let inLasso = false;
    //       for (let j of intersects) {
    //         if (inPolygon) {
    //           areaElement += j[0] - lastPoint;
    //           {
    //             // let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    //             // line.setAttribute("x1", lastPoint.toString());
    //             // line.setAttribute("x2", j[0].toString());
    //             // line.setAttribute("y1", y.toString());
    //             // line.setAttribute("y2", y.toString());
    //             // line.setAttribute("stroke", "green");
    //             // svg.appendChild(line);
    //           }
    //           if (inLasso) {
    //             areaIntersect += j[0] - lastPoint;
    //             // let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    //             // line.setAttribute("x1", lastPoint.toString());
    //             // line.setAttribute("x2", j[0].toString());
    //             // line.setAttribute("y1", y.toString());
    //             // line.setAttribute("y2", y.toString());
    //             // line.setAttribute("stroke", "black");
    //             // svg.appendChild(line);
    //           }
    //         }
    //         lastPoint = j[0];
    //         if (j[1]) {
    //           inLasso = !inLasso;
    //         } else {
    //           inPolygon = !inPolygon;
    //         }
    //       }
    //     }
    //     if (areaIntersect > 0) {
    //       console.warn(`ratio = ${areaIntersect / areaElement}`);
    //       maybeResult.push(element.id);
    //     }
    //     if (areaIntersect / areaElement >= 0.5 ||
    //       (areaIntersect / areaElement >= 0.2 && areaIntersect * yInc >= 1000)) {
    //       result.push(element.id);
    //     }
    //   } else {
    //     let numberInside = 0;
    //     let resampled = polygon.resample(numberSamples);
    //     for (let p of resampled) {
    //       let Intersects = lassoPolygon.lineIntersect(p.y).filter(x => x > p.x);
    //       if (Intersects.length % 2 === 1) {
    //         numberInside++;
    //         // let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    //         // circle.setAttribute("cx", p.x.toString());
    //         // circle.setAttribute("cy", p.y.toString());
    //         // circle.setAttribute("r", "2");
    //         // circle.setAttribute("fill", "green");
    //         // svg.appendChild(circle);
    //       }
    //     }
    //     if (numberInside) {
    //       maybeResult.push(element.id);
    //     }
    //     if (numberInside / numberSamples >= 0.4) {
    //       result.push(element.id);
    //     }
    //   }
    // })
    // if (result.length === 0 && maybeResult.length === 1) {
    //   return maybeResult;
    // }
    return result;
    // return maybeResult;
  }
}

//TODO: coord problem
export const initLassoSelection = (containerId: string) => {
  document.getElementById(containerId).onmousedown = (downEvt) => {
    // Reducer.triger(action.UPDATE_MOUSE_MOVING, true);
    // store.dispatch(updateMouseMoving(true));
    const lassoSelection = new Lasso();
    const evtTarget: HTMLElement = <HTMLElement>downEvt.target;
    if (
      evtTarget.classList.contains("highlight-selection-frame") ||
      (isMark(evtTarget) &&
        store.getState().selection.includes(evtTarget.id) &&
        store.getState().selection.length > 0)
    ) {
      //clicked within the selection frame
      // dragableCanvas.createCanvas(document.querySelector('#' + containerId + ' > svg:first-of-type'), { x: downEvt.pageX, y: downEvt.pageY });
    } else {
      //doing selection
      const svg: HTMLElement = document.getElementById("visChart");
      if (svg) {
        const svgBBox = svg.getBoundingClientRect();
        const startPoint: ICoord = jsTool.screenToSvgCoords(
          svg,
          downEvt.pageX,
          downEvt.pageY
        );
        const originX = downEvt.pageX - svgBBox.x,
          originY = downEvt.pageY - svgBBox.y;
        let isDragging: boolean = true;
        //create selection frame
        lassoSelection.createSelectionFrame(svg, {
          x: startPoint.x,
          y: startPoint.y,
        });
        // lassoSelection.createSelectionFrame(svg, { x: originX, y: originY });
        document.onmousemove = (moveEvt) => {
          if (isDragging) {
            const pathCoord: ICoord = jsTool.screenToSvgCoords(
              svg,
              moveEvt.pageX,
              moveEvt.pageY
            );
            const boundaryCheck: ICoord = {
              x: moveEvt.pageX - svgBBox.x,
              y: moveEvt.pageY - svgBBox.y,
            };
            const possibleMarks: string[] = lassoSelection.lassoSelect(
              store.getState().selection
            );
            //can't move outside the view
            if (
              boundaryCheck.x >= 0 &&
              boundaryCheck.x <=
              document.getElementById("chartContainer").offsetWidth &&
              boundaryCheck.y >= 0 &&
              boundaryCheck.y <=
              document.getElementById("chartContainer").offsetHeight
            ) {
              lassoSelection.updatePath(pathCoord);
            }
          }
        };
        document.onmouseup = (upEvt) => {
          // Reducer.triger(action.UPDATE_MOUSE_MOVING, false);
          // store.dispatch(updateMouseMoving(false));
          isDragging = false;
          const selectedMarks: string[] = lassoSelection.lassoSelect(
            store.getState().selection
          );
          //save histroy before update state
          if (
            jsTool.identicalArrays(selectedMarks, store.getState().selection)
          ) {
            // Reducer.triger(action.UPDATE_SELECTION, []);
            store.dispatch(updateSelection([]));
          } else {
            // Reducer.triger(action.UPDATE_SELECTION, state.suggestion ? Util.suggestSelection(selectedMarks) : selectedMarks);
            store.dispatch(
              updateSelection(Util.suggestSelection(selectedMarks))
            );
          }

          lassoSelection.removeSelectionFrame();
          document.onmousemove = null;
          document.onmouseup = null;
        };
      }
    }
  };
};
