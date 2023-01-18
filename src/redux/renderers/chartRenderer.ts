import Util from "../../app/core/util";
import { markSelection } from "../../util/markSelection";
import { createDashBox, updateProps } from "../../util/svgManager";
import { updateSelectMarks } from "../action/chartAction";
import { SELECTION_FRAME, SUGGESTION_FRAME_CLS } from "../global-consts";
import { ICoord } from "../global-interfaces";
import { store } from "../store";
import {
  CHART_VIEW_CONTENT_ID,
  ZOOM_PANEL_ID,
} from "../views/panels/panel-consts";

const CONFIRM_BTN: string = "confirm";
const CANCEL_BTN: string = "cancel";

export const chartRenderer = {
  //need to subscribe
  scaleChartContent: () => {
    const chartScale: number = store.getState().chartScaleRatio;
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
  },

  updateSelection: () => {
    console.log("current selection is: ", store.getState().selection);
    store.dispatch(updateSelectMarks(store.getState().selection));
  },
  updateSelectionFake: () => {
    console.log("current selection is: ", store.getState().selection);
    store.dispatch(updateSelectMarks(store.getState().selection));
  },

  renderSelectionFrame: () => {
    let minX = 10000,
      minY = 10000,
      maxX = -10000,
      maxY = -10000;
    store.getState().selection.forEach((markId: string) => {
      const tmpBBox = (<SVGGraphicsElement>(
        (<unknown>document.getElementById(markId))
      )).getBBox();
      minX = tmpBBox.x < minX ? tmpBBox.x : minX;
      minY = tmpBBox.y < minY ? tmpBBox.y : minY;
      maxX =
        tmpBBox.x + tmpBBox.width > maxX ? tmpBBox.x + tmpBBox.width : maxX;
      maxY =
        tmpBBox.y + tmpBBox.height > maxY ? tmpBBox.y + tmpBBox.height : maxY;
    });
    let selectionBox: HTMLElement = document.getElementById(SELECTION_FRAME);
    if (store.getState().selection.length === 0) {
      //no mark is selected
      if (selectionBox) {
        // console.log('selectionbox',selectionBox)
        //reset highlightselectionbox
        updateProps(selectionBox, {
          x: "0",
          y: "0",
          width: "0",
          height: "0",
        });
      }
    } else {
      if (selectionBox) {
        console.log("selectionbox", selectionBox);
        const chartContent: HTMLElement =
          document.getElementById("chartContent");
        const chartContentTrans: ICoord = Util.extractTransNums(
          chartContent.getAttributeNS(null, "transform")
        );
      }
    }
  },

  renderSelectMarks: () => {
    if (typeof store.getState().selectMarks !== "undefined") {
      let allSelectedMarks: string[] = [];
      store
        .getState()
        .selectMarks.forEach((mIds: string[], className: string) => {
          allSelectedMarks = [...allSelectedMarks, ...mIds];
        });

      //find the boundary of the selected marks
      Array.from(document.getElementsByClassName("mark")).forEach(
        (m: HTMLElement) => {
          const markId: string = m.id;
          allSelectedMarks.includes(markId)
            ? m.classList.remove("non-framed-mark")
            : m.classList.add("non-framed-mark");
        }
      );
    }
  },

  renderMarksToConfirm: () => {
    let allMarksToConfirm: string[] = [];
    store.getState().marksToConfirm.forEach((markGroup: string[]) => {
      allMarksToConfirm = [...allMarksToConfirm, ...markGroup];
    });
    if (store.getState().marksToConfirm.length === 0) {
      Array.from(document.getElementsByClassName(SUGGESTION_FRAME_CLS)).forEach(
        (sf: HTMLElement) => {
          sf.remove();
        }
      );
    } else {
      const that = this;
      store.getState().marksToConfirm.forEach((markGroup: string[]) => {
        const confirmBox: SVGRectElement = createDashBox();
        let minX = 10000,
          minY = 10000,
          maxX = -10000,
          maxY = -10000;
        Array.from(document.getElementsByClassName("mark")).forEach(
          (m: HTMLElement) => {
            if (markGroup.includes(m.id)) {
              m.classList.add("suggest-mark");
              const tmpBBox = (<SVGGraphicsElement>(<unknown>m)).getBBox();
              minX = tmpBBox.x < minX ? tmpBBox.x : minX;
              minY = tmpBBox.y < minY ? tmpBBox.y : minY;
              maxX =
                tmpBBox.x + tmpBBox.width > maxX
                  ? tmpBBox.x + tmpBBox.width
                  : maxX;
              maxY =
                tmpBBox.y + tmpBBox.height > maxY
                  ? tmpBBox.y + tmpBBox.height
                  : maxY;
            }
            if (!allMarksToConfirm.includes(m.id)) {
              //this is not a selected mark
              m.classList.remove("suggest-mark");
            }
          }
        );
        const chartContent: HTMLElement =
          document.getElementById("chartContent");
        const chartContentTrans: ICoord = Util.extractTransNums(
          chartContent.getAttributeNS(null, "transform")
        );

        //set the highlightSelectionFrame
        updateProps(confirmBox, {
          x: `${
            minX * store.getState().chartScaleRatio - 5 + chartContentTrans.x
          }`,
          y: `${
            minY * store.getState().chartScaleRatio - 5 + chartContentTrans.y
          }`,
          width: `${(maxX - minX) * store.getState().chartScaleRatio + 10}`,
          height: `${(maxY - minY) * store.getState().chartScaleRatio + 10}`,
        });
      });
    }
  },

  renderSuggestedMarks: () => {
    if (store.getState().suggestedMarks.length === 0) {
      //there are no marks to be confirmed
      Array.from(document.getElementsByClassName(SUGGESTION_FRAME_CLS)).forEach(
        (sf: HTMLElement) => {
          sf.remove();
        }
      );
    } else {
      chartRenderer.createSuggestionFrame(); //创建推荐keyframe list
    }
  },

  createSuggestionFrame: () => {
    const suggestionBox: SVGRectElement = createDashBox();
    let minX = 10000,
      minY = 10000,
      maxX = -10000,
      maxY = -10000;
    Array.from(document.getElementsByClassName("mark")).forEach(
      (m: HTMLElement) => {
        if (store.getState().suggestedMarks.includes(m.id)) {
          m.classList.add("suggest-mark");
          const tmpBBox = (<SVGGraphicsElement>(<unknown>m)).getBBox();
          minX = tmpBBox.x < minX ? tmpBBox.x : minX;
          minY = tmpBBox.y < minY ? tmpBBox.y : minY;
          maxX =
            tmpBBox.x + tmpBBox.width > maxX ? tmpBBox.x + tmpBBox.width : maxX;
          maxY =
            tmpBBox.y + tmpBBox.height > maxY
              ? tmpBBox.y + tmpBBox.height
              : maxY;
        } else {
          //this is not a selected mark
          m.classList.remove("suggest-mark");
        }
      }
    );
    const chartContent: HTMLElement = document.getElementById("chartContent");
    const chartContentTrans: ICoord = Util.extractTransNums(
      chartContent.getAttributeNS(null, "transform")
    );

    updateProps(suggestionBox, {
      x: `${minX * store.getState().chartScaleRatio - 5 + chartContentTrans.x}`,
      y: `${minY * store.getState().chartScaleRatio - 5 + chartContentTrans.y}`,
      width: `${(maxX - minX) * store.getState().chartScaleRatio + 10}`,
      height: `${(maxY - minY) * store.getState().chartScaleRatio + 10}`,
    });
  },

  createBtn: (btnType: string) => {},

  renderDataMenu: () => {
    markSelection.initDataSeletionMenu();
  },
};
