import { canis, ICanisSpec } from "../../app/core/canisGenerator";
import { ChartSpec, Animation } from "canis_toolkit";
import { store } from "../store";
import Util from "../../app/core/util";
import { IDataItem, ISortDataAttr } from "../global-interfaces";
import AttrSort from "../views/widgets/attrSort";
import { SELECTION_FRAME, SUGGESTION_FRAME } from "../global-consts";
import { player } from "../views/slider/player";
import { SuggestBox } from "../views/vl/suggestBox";
import {
  updateDataSort,
  updateDataTable,
  updateSelection,
} from "../action/chartAction";
import { createSvgElement } from "../../util/svgManager";
import ViewWindow from "../views/panels/viewWindow";
import { updateLottieSpec, updatePreviewing } from "../action/videoAction";

export const canisRenderer = {
  //need to subscribe
  renderSpec: async () => {
    const spec: ICanisSpec = store.getState().spec;
    if(spec.animations.length === 0) return;
    SuggestBox.reset();
    //render video widgets first
    //render video
    const lottieSpec = await canis.renderSpec(spec, () => {
      const stateSpec: ICanisSpec = store.getState().spec;
      if (spec.animations[0].selector === ".mark") {
        //special triger, can not triger action
        stateSpec.animations[0].selector = `#${Animation.allMarks.join(", #")}`;
      }
      if (Util.nonDataTable.size <= 0) {
        Util.extractAttrValueAndDeterminType(ChartSpec.dataMarkDatum);
        Util.extractNonDataAttrValue(ChartSpec.nonDataMarkDatum);
      }

      // const dataOrder: string[] = Array.from(Util.filteredDataTable.keys());
      const dataTable: Map<string, IDataItem> = Util.filteredDataTable;
      const sortDataAttrs: ISortDataAttr[] = [
        "markId",
        ...Object.keys(Util.attrType),
      ].map((attrName) => {
        const sortType: string =
          attrName === "markId"
            ? AttrSort.ASSCENDING_ORDER
            : AttrSort.INDEX_ORDER;
        return {
          attr: attrName,
          sort: sortType,
        };
      });
      //these actions are coupling with others, so they are not recorded in history
      store.dispatchSystem(updateDataTable(dataTable));
      store.dispatchSystem(updateDataSort(sortDataAttrs));
    });

    const svg: HTMLElement = document.getElementById("visChart");
    if (svg) {
      //translate chart content
      Util.transformSVG();
      Util.extractVisualEncoding();

      const selectionBox: SVGRectElement = <SVGRectElement>createSvgElement({
        tag: "rect",
        para: {
          id: SELECTION_FRAME,
          fill: "none",
          stroke: "#2196f3",
          strokeWidth: "2",
        },
        flag: true,
      });
      svg.appendChild(selectionBox);

      const suggestionBox: SVGRectElement = <SVGRectElement>createSvgElement({
        tag: "rect",
        para: {
          id: SUGGESTION_FRAME,
          fill: "none",
          stroke: "#676767",
          strokeWidth: "1",
          strokeDasharray: "2 2",
        },
        flag: true,
      });
      svg.appendChild(suggestionBox);
      store.dispatchSystem(updateSelection([]));
      store.dispatchSystem(updatePreviewing(null, null, false, false));
    }
    //render video view

    store.dispatchSystem(updateLottieSpec(lottieSpec));
    player.resetPlayer({
      frameRate: canis.frameRate,
      currentTime: 0,
      totalTime: canis.duration(),
    });
    ViewWindow.resizeVideoLayer();
    // callback();
  },
};
