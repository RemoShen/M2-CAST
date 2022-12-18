import { ChartSpec, Animation } from "canis_toolkit";
import {
  colorNameHex,
  EXCLUDED_DATA_ATTR,
  IVisualMapping,
  NUMERIC_CATEGORICAL_ATTR,
  VC_COLOR,
  VC_POSITION_X,
  VC_POSITION_Y,
} from "../app/consts";
import Util from "../app/core/util";
import {
  BTN_CONTENT_TYPE_STR,
  BTN_TYPE_DATA,
  BTN_TYPE_MAIN,
} from "../redux/views/buttons/button-consts";
import { ListMenu } from "../redux/views/menu/listMenu";
import {
  FIRST_LEVEL_BTN_SIZE_BIG,
  ISubMenuItem,
  IMenuItem,
  LIGHT_THEME,
} from "../redux/views/menu/menu-consts";
import { NAV_HEIGHT } from "../redux/views/nav/nav-consts";
import {
  updateMarksToConfirm,
  updateSelection,
  updateSelectionOrder,
  updateSelectMarksStep,
  updateSuggestedMarks,
} from "../redux/action/chartAction";
import {
  IActivatePlusBtn,
  ICoord,
  IDataItem,
  IPath,
} from "../redux/global-interfaces";
import { store } from "../redux/store";
import {
  DATA_MENU_ID,
  CHART_VIEW_CONTENT_ID,
} from "../redux/views/panels/panel-consts";
import { isMark } from "./appTool";
import { jsTool } from "./jsTool";
import Suggest from "../app/core/suggest";
import { updatePreviewing } from "../redux/action/videoAction";
import { updateActivatePlusBtn } from "../redux/action/vlAction";
import { SUGGESTION_FRAME_CLS } from "../redux/global-consts";
import KfGroup from "../redux/views/vl/kfGroup";
import {
  OptionItem,
  suggestBox,
  SuggestBox,
} from "../redux/views/vl/suggestBox";
import { createKf, findTargetAni } from "../redux/views/vl/vl-util";
import { tip } from "../redux/views/widgets/tip";
import KfItem from "../redux/views/vl/kfItem";
import { REMOVE_SPEC_GROUPING } from "../redux/action/canisAction";
import { toggleLoading } from "../redux/renderers/renderer-tools";
import { Loading } from "../redux/views/widgets/loading";

export interface IOrderInfo {
  correspondSelection: string[];
  attrName?: string;
  type: number;
}
export const ASSCENDING_ORDER: number = 0;
export const DESCENDING_ORDER: number = 2;
export const RANDOM_ORDER: number = 4;
export default class MarkSelection {
  dataSelectionMenu: ListMenu;
  initDataSeletionMenu() {
    const attrNames: string[] = store
      .getState()
      .sortDataAttrs.map((da) => da.attr);

    const dataMenu = document.getElementById(DATA_MENU_ID);
    if (dataMenu !== null) {
      dataMenu.remove();
    }

    const dataMenuCenter: ICoord = {
      x: FIRST_LEVEL_BTN_SIZE_BIG + 10,
      y: FIRST_LEVEL_BTN_SIZE_BIG + 40 + NAV_HEIGHT,
    };
    const menuList: ISubMenuItem[] = attrNames.map((a: string, idx: number) => {
      const dataVals = new Set();
      store.getState().dataTable.forEach((val: IDataItem, mId: string) => {
        a === "markId" ? dataVals.add(<never>mId) : dataVals.add(<never>val[a]);
      });
      return {
        type: BTN_CONTENT_TYPE_STR,
        content: a,
        strokeWidth: 0,
        value: <string[] | number[]>[...dataVals],
        buttonActionType: BTN_TYPE_DATA,
        evts: [
          {
            type: "pointerdown",
            func: () => {
              console.log("test button");
            },
          },
        ],
      };
    });
    const dataMenuStruct: IMenuItem = {
      type: BTN_CONTENT_TYPE_STR,
      content: "",
      theme: LIGHT_THEME,
      buttonActionType: BTN_TYPE_MAIN,
      subMenu: menuList,
    };
    this.dataSelectionMenu = new ListMenu({
      menuCenter: dataMenuCenter,
      menuStruct: dataMenuStruct,
      showSubMenu: true,
      floating: true,
    });
    this.dataSelectionMenu.container.setAttributeNS(null, "id", DATA_MENU_ID);
    this.dataSelectionMenu.toggleMenu(false);
    document
      .getElementById(CHART_VIEW_CONTENT_ID)
      .parentNode.appendChild(this.dataSelectionMenu.options.targetSVG);
  }
  tappingChart(target: SVGElement, posi: ICoord) {
    let suggesting: boolean = false,
      confirmSuggestion: boolean = false;
    if (typeof store.getState().suggestedMarks !== "undefined") {
      suggesting = store.getState().suggestedMarks.length > 0;
    }

    if (suggesting) {
      //suggesting hilight box
      const bbox: DOMRect = document
        .getElementsByClassName(SUGGESTION_FRAME_CLS)[0]
        .getBoundingClientRect();
      confirmSuggestion = jsTool.inBoundary(bbox, posi);
    }

    // if (isMark(target)) {
    //if touch the suggesting box
    if (suggesting && confirmSuggestion) {
      toggleLoading({
        isLoading: true,
        targetEle: document.body,
        content: Loading.SUGGESTING,
      });
      store.getState().suggestedMarks.forEach((marksId) => {
        document.getElementById(marksId).setAttribute("opacity", "1");
      }); //setting opacity for those confirm suggested
      let tmpTime = 1000;
      const doing = setInterval(() => {
        tmpTime -= 100;
        if (tmpTime === 0) {
          clearInterval(doing);
          markSelection.checking([
            [...store.getState().selection, ...store.getState().suggestedMarks],
          ]);
          store.dispatchSystem(updateSelectMarksStep([]));
        }
      }, 100);
    } else if (suggesting && !confirmSuggestion) {
      toggleLoading({
        isLoading: true,
        targetEle: document.body,
        content: Loading.SUGGESTING,
      });
      let tmpTime = 100;
      const doing = setInterval(() => {
        tmpTime -= 100;
        if (tmpTime === 0) {
          clearInterval(doing);
          markSelection.checking([store.getState().selection], true);
          // store.dispatchSystem(updateSelectMarksStep([]));
        }
      }, 100);
    }
  }
  selectByData(attrVal: string, order: string[] | number[]) {
    //TODO: maybe change order to auto detection
    const isNum: boolean = jsTool.isNumber(attrVal);
    const selection: string[] = [];
    let orderInfo: IOrderInfo = { type: RANDOM_ORDER, correspondSelection: [] };
    let stop: boolean = false;
    ChartSpec.dataMarkDatum.forEach((datum: any, markId: string) => {
      !stop &&
        Object.keys(datum).forEach((tmpAttrName: string) => {
          if (!EXCLUDED_DATA_ATTR.includes(tmpAttrName)) {
            if (isNum && !NUMERIC_CATEGORICAL_ATTR.includes(tmpAttrName)) {
              if (parseFloat(datum[tmpAttrName]) === parseFloat(attrVal)) {
                orderInfo.attrName = tmpAttrName;
                selection.push(markId);
                stop = true;
              }
            } else {
              if (
                `${datum[tmpAttrName]}`.toLowerCase() === attrVal.toLowerCase()
              ) {
                orderInfo.attrName = tmpAttrName;
                selection.push(markId);
              }
            }
          }
        });
    });
    if (selection.length > 0) {
      this.checking([selection]);
      if (order.length > 0) {
        for (let i = 0, len = order.length; i < len; i++) {
          if (
            (!isNum && `${order[i]}`.toLowerCase() === attrVal.toLowerCase()) ||
            (isNum && parseFloat(`${order[i]}`) === parseFloat(attrVal))
          ) {
            if (i === 0) {
              orderInfo.type = ASSCENDING_ORDER;
            } else if (i === len - 1) {
              orderInfo.type = DESCENDING_ORDER;
            }
          }
        }
      }
      store.dispatchSystem(updateSelectionOrder(orderInfo));
    }
  }
  selectByVisualChannel(visualChannel: string, cmdValue: string | number) {
    if (visualChannel === VC_POSITION_X || visualChannel === VC_POSITION_Y) {
      let tmpVisualVal: number = -1,
        dataVal: string = "";
      for (let i = 0, len = Util.visualMappings.length; i < len; i++) {
        if (Util.visualMappings[i].visualChannel === visualChannel) {
          if (
            cmdValue !== "last" &&
            Util.visualMappings[i].visualVal === cmdValue
          ) {
            dataVal = Util.visualMappings[i].dataVal;
            break;
          } else if (
            cmdValue === "last" &&
            tmpVisualVal < Util.visualMappings[i].visualVal
          ) {
            dataVal = Util.visualMappings[i].dataVal;
            tmpVisualVal = <number>Util.visualMappings[i].visualVal;
          }
        }
      }
      this.selectByData(dataVal, []);
    } else if (visualChannel === VC_COLOR) {
      const rgb: number[] = jsTool.toRGB(
        `#${colorNameHex.get((<string>cmdValue).toLowerCase())}`
      );
      let dataVal: string = "",
        minDiff: number = 1000000;
      Util.visualMappings.forEach((vm: IVisualMapping) => {
        if (vm.visualChannel === VC_COLOR) {
          const diff: number =
            Math.pow((<number[]>vm.visualVal)[0] - rgb[0], 2) +
            Math.pow((<number[]>vm.visualVal)[1] - rgb[1], 2) +
            Math.pow((<number[]>vm.visualVal)[2] - rgb[2], 2);
          if (diff < minDiff) {
            minDiff = diff;
            dataVal = vm.dataVal;
          }
        }
      });
      this.selectByData(dataVal, []);
    }
  }
  /**
   * user is drawing check mark, he might wants to:
   * 1. confirm mark selection
   * 2. confirm keyframe suggestion
   */
  checking(marksToConfirm: string[][], dontSuggest = false) {
    if (!store.getState().previewSpec) {
      //confirming mark selection
      Array.from(document.getElementsByClassName(SUGGESTION_FRAME_CLS)).forEach(
        (sf: HTMLElement) => {
          sf.remove();
        }
      );
      if (marksToConfirm.length === 1) {
        //noMulti Select
        if (marksToConfirm[0].length > 0) {
          store.dispatch(updateSelection(marksToConfirm[0]));
          //do mark suggestion
          const suggestedAndSelected: string[] = [
            ...new Set(Util.suggestSelection(store.getState().selection)),
          ];
          const suggested: string[] = jsTool.excludeArray(
            suggestedAndSelected,
            store.getState().selection
          ); //mark suggest

          const axis: string[] = [
            "axis-label",
            "Title",
            "legend-text",
            "legend-value",
            "title",
            "axis-tick",
            "axis-domain",
            "legend-symbol",
          ];
          if (suggested.length > 0 && !dontSuggest) {
            toggleLoading({
              isLoading: false,
            });
            store.dispatchSystem(updateSuggestedMarks(suggested));
          } else {
            //auto competition
            store.dispatchSystem(updateSuggestedMarks([]));
            const selectMarksValue: { dataMarks: string[]; nonDataMarks: string[] } =
            Util.separateDataAndNonDataMarks(store.getState().selection);
            if(selectMarksValue.dataMarks.length > 0){
              store.dispatchSystem(
                updateSelectMarksStep(selectMarksValue.dataMarks)
              );
            }


            let keylist: string = "";
            store.getState().selectMarks.forEach((key, value) => {
              keylist = value;
            }); //current select

            const suggestContain: boolean = jsTool.suggestContain(
              Suggest.allPaths
            );
            console.log("allpaths", Suggest.allPaths);
            const validPath = marksToConfirm[0].every((mid) =>
              Suggest.allPaths.find((path) => path.lastKfMarks.includes(mid))
            );

            if (
              Suggest.allPaths.length > 0 &&
              // axis.indexOf(keylist) == -1 &&
              !suggestContain &&
              validPath
            ) {
              for (let i = 0; i < suggestBox.options.length; i++) {
                if (
                  jsTool.identicalArrays(
                    suggestBox.options[i].marksThisOption,
                    marksToConfirm[0]
                  )
                ) {
                  suggestBox.currentSelection = i;
                  setTimeout(() => {
                    suggestBox.options[i].clickItem();
                  }, 10);
                  break;
                } else {
                  // createKf([])
                  toggleLoading({
                    isLoading: false,
                  });
                }
              }
            } else {
              createKf([]);
            }
          }
        } else {
          if (dontSuggest === false) {
            tip.show("No mark selected.");
            toggleLoading({
              isLoading: false,
            });
          }
        }
      } else if (marksToConfirm.length > 1) {
        //Multi Select
        //confirm mark selection (multi kfs)
        const previousKfs: string[][] = [...marksToConfirm];
        // Reducer.saveAndTriger(action.UPDATE_SELECTION, state.selection, state.marksToConfirm[0]);
        store.dispatch(updateSelection(marksToConfirm[0]));
        createKf(previousKfs);
      }
    } else if (store.getState().previewSpec) {
      //confirming keyframe suggestion
      if (KfGroup.groupToInsert !== "") {
        Suggest.filterPathsWithSelection(
          SuggestBox.currentUniqueIdx,
          store.getState().previewPath.kfMarks[SuggestBox.currentUniqueIdx]
        );
        let currentSelectedMarksEachStep: Map<number, string[]> =
          typeof store.getState().activatePlusBtn.selectedMarksEachStep ===
          "undefined"
            ? new Map()
            : new Map(store.getState().activatePlusBtn.selectedMarksEachStep);
        const currentActionInfo: IActivatePlusBtn = {
          aniId: store.getState().activatePlusBtn.aniId,
          selection: store.getState().activatePlusBtn.selection,
          selectedMarksEachStep: currentSelectedMarksEachStep.set(
            SuggestBox.currentUniqueIdx,
            store.getState().previewPath.kfMarks[SuggestBox.currentUniqueIdx]
          ),
          renderedUniqueIdx: SuggestBox.currentUniqueIdx,
          orderInfo: { type: RANDOM_ORDER, correspondSelection: [] },
          previousKfs: [],
        };
        store.dispatch(updateActivatePlusBtn(currentActionInfo));
        store.dispatchSystem(
          updatePreviewing(null, null, false, Suggest.allPaths.length !== 1)
        );
      }
    }
    // marksToConfirm[0].forEach((mark) => {
    //     document.getElementById(mark).style.opacity = '0.3';
    // })
    store.getState().selectMarks?.forEach((value, key) => {
      value.forEach((markId) => {
        // document.getElementById(markId).style.opacity = "0.3";
        document.getElementById(markId).setAttribute("opacity", "0.3");
      });
    });
  }
}

export const markSelection = new MarkSelection();
