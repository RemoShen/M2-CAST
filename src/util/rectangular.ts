import Util from "../app/core/util";
import { updateSelection } from "../redux/action/chartAction";
import { IBoundary, ICoord } from "../redux/global-interfaces";
import { store } from "../redux/store";
import { isMark } from "./appTool";
import { jsTool } from "./jsTool";

export default class Rectangular {
  svg: any;
  /**
   * create the dashed selection frame when mouse down
   * @param svg
   */
  public createSelectionFrame(svg: HTMLElement) {
    this.svg = svg;
    const selectionFrame: SVGRectElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    selectionFrame.setAttributeNS(null, "id", "rectSelectFrame");
    selectionFrame.setAttributeNS(null, "fill", "rgba(255, 255, 255, 0)");
    selectionFrame.setAttributeNS(null, "stroke", "#505050");
    selectionFrame.setAttributeNS(null, "stroke-dasharray", "2,2");
    svg.appendChild(selectionFrame);
  }
  /**
   * update the dashed selection frame when mouse move
   */
  public updateSelectionFrame(boundary: IBoundary) {
    const selectionFrame: SVGRectElement = <SVGRectElement>(
      (<unknown>document.getElementById("rectSelectFrame"))
    );
    selectionFrame.setAttributeNS(null, "x", boundary.x1.toString());
    selectionFrame.setAttributeNS(null, "y", boundary.y1.toString());
    selectionFrame.setAttributeNS(
      null,
      "width",
      Math.abs(boundary.x2 - boundary.x1).toString()
    );
    selectionFrame.setAttributeNS(
      null,
      "height",
      Math.abs(boundary.y2 - boundary.y1).toString()
    );
  }

  /**
   * remove the dashed selection frame when mouse up
   */
  public removeSelectionFrame() {
    if (document.getElementById("rectSelectFrame")) {
      document.getElementById("rectSelectFrame").remove();
    }
  }

  /**
   *
   * @param boundary
   * @param framedMarks
   * @param svgId
   */
  public rectangularSelect(
    boundary: IBoundary,
    framedMarks: string[]
  ): string[] {
    let result: string[] = [];
    //filter marks
    Array.from(document.getElementsByClassName("mark")).forEach(
      (m: HTMLElement) => {
        const markBBox = m.getBoundingClientRect();
        let coord1 = this.svg.createSVGPoint();
        coord1.x = markBBox.left;
        coord1.y = markBBox.top;
        const svgCoord1: ICoord = coord1.matrixTransform(
          this.svg.getScreenCTM().inverse()
        );
        let coord2 = this.svg.createSVGPoint();
        coord2.x = markBBox.left + markBBox.width;
        coord2.y = markBBox.top + markBBox.height;
        const svgCoord2: ICoord = coord2.matrixTransform(
          this.svg.getScreenCTM().inverse()
        );

        const framed: boolean = this.pointInRect(boundary, {
          x1: svgCoord1.x,
          y1: svgCoord1.y,
          x2: svgCoord2.x,
          y2: svgCoord2.y,
        });
        //update the appearance of marks
        if (
          (framedMarks.includes(m.id) && framed) ||
          (!framedMarks.includes(m.id) && !framed)
        ) {
          m.classList.add("non-framed-mark");
        } else if (
          (framedMarks.includes(m.id) && !framed) ||
          (!framedMarks.includes(m.id) && framed)
        ) {
          m.classList.remove("non-framed-mark");
          result.push(m.id);
        }
      }
    );

    return result;
  }
  public pointInRect(boundary: IBoundary, markBoundary: IBoundary): boolean {
    const [minX, maxX] =
      boundary.x1 < boundary.x2
        ? [boundary.x1, boundary.x2]
        : [boundary.x2, boundary.x1];
    const [minY, maxY] =
      boundary.y1 < boundary.y2
        ? [boundary.y1, boundary.y2]
        : [boundary.y2, boundary.y1];
    let framed = false;
    if (
      markBoundary.x1 >= minX &&
      markBoundary.x2 <= maxX &&
      markBoundary.y1 >= minY &&
      markBoundary.y2 <= maxY
    ) {
      framed = true;
    }
    return framed;
  }
}

export const initRectangularSelection = (containerId: string) => {
  const rectangularSelection = new Rectangular();
  document.getElementById(containerId).onmousedown = (downEvt) => {
    // Reducer.triger(action.UPDATE_MOUSE_MOVING, true);
    // store.dispatch(updateMouseMoving(true));
    downEvt.preventDefault();
    //get the scale of the chart since the size of the svg container is different from that of the chart
    // let scaleW: number = 1, scaleH: number = 1;
    const svg: any = document.getElementById("visChart");
    // if (svg) {
    //     scaleW = parseFloat(svg.getAttribute('width')) / document.getElementById('chartContainer').offsetWidth;
    //     scaleH = parseFloat(svg.getAttribute('height')) / document.getElementById('chartContainer').offsetHeight;
    // }

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
      if (svg) {
        const svgBBox = svg.getBoundingClientRect();
        const rectPosi1: ICoord = jsTool.screenToSvgCoords(
          svg,
          downEvt.pageX,
          downEvt.pageY
        );
        let lastMouseX = downEvt.pageX,
          lastMouseY = downEvt.pageY;
        let isDragging: boolean = true;
        //create the selection frame
        rectangularSelection.createSelectionFrame(svg);
        document.onmousemove = (moveEvt) => {
          if (isDragging) {
            const rectPosi2: ICoord = jsTool.screenToSvgCoords(
              svg,
              moveEvt.pageX,
              moveEvt.pageY
            );
            // // const possibleMarks: string[] = rectangularSelection.rectangularSelect({
            //     x1: rectPosi1.x,
            //     y1: rectPosi1.y,
            //     x2: rectPosi2.x,
            //     y2: rectPosi2.y
            // }, state.selection);

            //can't move outside the view
            if (
              moveEvt.pageX - svgBBox.x >= 0 &&
              moveEvt.pageX - svgBBox.x <=
                document.getElementById("chartContainer").offsetWidth &&
              moveEvt.pageY - svgBBox.y >= 0 &&
              moveEvt.pageY - svgBBox.y <=
                document.getElementById("chartContainer").offsetHeight
            ) {
              const tmpX =
                rectPosi2.x < rectPosi1.x ? rectPosi2.x : rectPosi1.x;
              const tmpY =
                rectPosi2.y < rectPosi1.y ? rectPosi2.y : rectPosi1.y;
              const tmpWidth = Math.abs(rectPosi1.x - rectPosi2.x);
              const tmpHeight = Math.abs(rectPosi1.y - rectPosi2.y);

              /* update the selection frame */
              rectangularSelection.updateSelectionFrame({
                x1: tmpX,
                y1: tmpY,
                x2: tmpX + tmpWidth,
                y2: tmpY + tmpHeight,
              });
            }
          }
        };
        document.onmouseup = (upEvt) => {
          // Reducer.triger(action.UPDATE_MOUSE_MOVING, false);
          // store.dispatch(updateMouseMoving(false));
          isDragging = false;
          const mouseMoveThsh: number = 3; //mouse move less than 3px -> single selection; bigger than 3px -> rect selection
          //save histroy before update state
          if (
            jsTool.pointDist(
              { x: lastMouseX, y: lastMouseY },
              { x: upEvt.pageX, y: upEvt.pageY }
            ) > mouseMoveThsh
          ) {
            //doing rect selection
            const rectPosi2: ICoord = jsTool.screenToSvgCoords(
              svg,
              upEvt.pageX,
              upEvt.pageY
            );
            const selectedMarks: string[] =
              rectangularSelection.rectangularSelect(
                {
                  x1: rectPosi1.x,
                  y1: rectPosi1.y,
                  x2: rectPosi2.x,
                  y2: rectPosi2.y,
                },
                store.getState().selection
              );
            // Reducer.triger(action.UPDATE_SELECTION, state.suggestion ? Util.suggestSelection(selectedMarks) : selectedMarks);
            store.dispatch(
              updateSelection(Util.suggestSelection(selectedMarks))
            );
          } else {
            //single selection
            const clickedItem: HTMLElement = <HTMLElement>upEvt.target;
            if (isMark(clickedItem)) {
              //clicked on a mark
              const clickedMarkId: string = clickedItem.id;
              const selectedMarks: string[] = store
                .getState()
                .selection.includes(clickedMarkId)
                ? [...store.getState().selection].splice(
                    store.getState().selection.indexOf(clickedMarkId),
                    1
                  )
                : [...store.getState().selection, clickedMarkId];
              // Reducer.triger(action.UPDATE_SELECTION, state.suggestion ? Util.suggestSelection(selectedMarks) : selectedMarks);
              store.dispatch(
                updateSelection(Util.suggestSelection(selectedMarks))
              );
            } else {
              //didnt select any mark
              // Reducer.triger(action.UPDATE_SELECTION, []);
              store.dispatch(updateSelection([]));
            }
          }
          rectangularSelection.removeSelectionFrame();
          document.onmousemove = null;
          document.onmouseup = null;
        };
      }
    }
  };
};
