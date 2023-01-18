import classifyPoint from "robust-point-in-polygon";
import Util from "../app/core/util";
import { updateSelection } from "../redux/action/chartAction";
import { ICoord } from "../redux/global-interfaces";
import { store } from "../redux/store";
import { isMark } from "./appTool";
import { jsTool } from "./jsTool";

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
    let result: string[] = [];
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
        //update the appearance of marks
        // if ((framedMarks.includes(m.id) && framed) || (!framedMarks.includes(m.id) && !framed)) {
        //     // m.classList.add('non-framed-mark');
        // } else if ((framedMarks.includes(m.id) && !framed) || (!framedMarks.includes(m.id) && framed)) {
        //     // m.classList.remove('non-framed-mark');
        //     result.push(m.id);
        // }
      }
    );
    return result;
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
