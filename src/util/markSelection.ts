import { ChartSpec } from "canis_toolkit";
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
import { formatDefaultLocale, tsvFormatValue } from "d3";
import { addHighlight, removeHighlight } from "./appTool";
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
          // store.dispatchSystem(updateSelectMarksStep([]));
        }
      }, 100);
    } else if (suggesting && !confirmSuggestion) {
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

  complete(marksToConfirm: string[][]) {
    console.warn(marksToConfirm);
    const marks = Array.from(document.getElementsByClassName("mark"));

    const tables: Map<string, { rows: Map<string, string[]>, cols: Map<string, string[]> }> = new Map();
    const select: Set<string> = new Set();


    for (let i of marksToConfirm[0]) {
      select.add(i);
    }
    console.warn(select);

    const nonRepeatElements: string[] = [];
    for (let mark of marks) {
      const collectionAttr = mark.getAttribute("collection");
      if (collectionAttr == "" || collectionAttr == null) {
        nonRepeatElements.push(mark.id);
        continue;
      }
      const collection = JSON.parse(collectionAttr);
      const id = collection["id"];
      const row = collection["row"];
      const col = collection["col"];

      if (!tables.has(id)) {
        tables.set(id, { rows: new Map(), cols: new Map() });
      }
      const table = tables.get(id);
      if (!table.rows.has(row)) {
        table.rows.set(row, []);
      }
      if (!table.cols.has(col)) {
        table.cols.set(col, []);
      }
      table.rows.get(row).push(mark.id);
      table.cols.get(col).push(mark.id);
    }

    let selectAll = false;
    const fullRows = new Set<string>();
    const fullCols = new Set<string>();

    for (let i of nonRepeatElements) {
      if (select.has(i)) {
        selectAll = true;
        break;
      }
    }
    let modifyed = false;

    function addNewSelect(ids: string[]) {
      for (let id of ids) {
        if (select.has(id)) {
          continue;
        }
        modifyed = true;
        select.add(id);
      }
    }

    function allSelected(ids: string[]): boolean {
      for (let id of ids) {
        if (!select.has(id)) {
          return false;
        }
      }
      return true;
    }

    function anySelected(ids: string[]): boolean {
      for (let id of ids) {
        if (select.has(id)) {
          return true;
        }
      }
      return false;
    }

    function shouldSelect(ids: string[]): boolean {
      let numberSelected = 0;
      for (let id of ids) {
        if (select.has(id)) {
          numberSelected++;
          if (numberSelected == 2) {
            return true;
          }
        }
      }
      if (ids.length === 1 && numberSelected) {
        return true;
      }
      return false;
    }

    if (selectAll) {
      for (let [tableid, table] of tables) {
        if (Array.from(table.rows.values()).some(anySelected)) {
          for (let [rowid, row] of table.rows) {
            addNewSelect(row);
          }
        }
      }
    } else {
      for (let [tableid, table] of tables) {
        let rowSelected = 0;
        let colSelected = 0;
        for (let [rowid, row] of table.rows) {
          if (anySelected(row)) {
            rowSelected += 1;
          }
        }
        for (let [colid, col] of table.cols) {
          if (anySelected(col)) {
            colSelected += 1;
          }
        }
        if (rowSelected > 1 && colSelected == 1) {
          for (let [colid, col] of table.cols) {
            if (anySelected(col)) {
              addNewSelect(col);
            }
          }
        } else if (rowSelected == 1 && colSelected > 1) {
          for (let [rowid, row] of table.rows) {
            if (anySelected(row)) {
              addNewSelect(row);
            }
          }
        }
      }
    }

    // let iteration = 1;

    // do {
    //   console.warn(iteration++)
    //   modifyed = false;
    //   for (let i = 0; i < 2; i++)
    //     tables.forEach(v => {
    //       let selectedAllRows = true;
    //       let selectedAllCols = true;
    //       let selectedAnyRows = false;
    //       let selectedAnyCols = false;
    //       v.cols.forEach((v, k) => {
    //         if (anySelected(v) && (selectAll || fullCols.has(k) || shouldSelect(v))) {
    //           // addNewSelect(v);
    //           fullCols.add(k);
    //           selectedAnyCols = true;
    //         } else {
    //           selectedAllCols = false;
    //         }
    //       });
    //       v.rows.forEach((v, k) => {
    //         // console.warn(v);
    //         // console.warn(select);
    //         if (anySelected(v) && (selectAll || fullRows.has(k) || shouldSelect(v))) {
    //           // addNewSelect(v);
    //           fullRows.add(k);
    //           selectedAnyRows = true;
    //         } else {
    //           selectedAllRows = false;
    //         }
    //       });
    //       if (selectedAllCols || selectedAllRows) {
    //         selectAll = true;
    //       }
    //       if(selectedAnyCols && selectedAnyRows){
    //         return;
    //       }

    //     })
    // } while (modifyed)
    return [...select].sort();
    // TODO: sort by category, not by id
  }
  beginSuggest(marksToConfirm: string[][], dontSuggest = false) {
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

          //do mark suggestion

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
          {
            //auto competition
            store.dispatchSystem(updateSuggestedMarks([]));
            store.dispatch(
              updateSelectMarksStep(marksToConfirm[0])
            );
            const selectMarksValue: { dataMarks: string[]; nonDataMarks: string[] } =
              Util.separateDataAndNonDataMarks(marksToConfirm[0]);
            if (selectMarksValue.nonDataMarks.length > 0) {
              store.dispatchSystem(
                updateSelectMarksStep([])
              );
            }
            store.dispatchSystem(updateSelection(marksToConfirm[0]));
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
            const notAllAttr: boolean = Util.notAllAttr(marksToConfirm[0]
            );
            if (
              Suggest.allPaths.length > 0 &&
              // axis.indexOf(keylist) == -1 &&
              !suggestContain &&
              notAllAttr &&
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
                }
              }
            } else {
              createKf([]);
            }
          }
        } else {
          if (dontSuggest === false) {
            tip.show("No mark selected.");
            setTimeout(() => {
              tip.hide();
            }, 3000);
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
    store.getState().selectMarks?.forEach((value, key) => {
      value.forEach((markId) => {
        document.getElementById(markId).setAttribute("opacity", "0.3");
      });
    });
  }

  sleep(delay: number) { return new Promise((resolve) => setTimeout(resolve, delay)) }

  /**
   * user is drawing check mark, he might wants to:
   * 1. confirm mark selection
   * 2. confirm keyframe suggestion
   * 
   */
  checking(marksToConfirm: string[][], dontSuggest = false) {
    if (tip.container != undefined) {
      tip.hide();
    }
    let visChart = document.getElementById("visChart");
    let parent = visChart.parentNode;
    const completed = this.complete(marksToConfirm);
    // if (!jsTool.identicalArrays(completed, marksToConfirm[0])) {
    //   console.error("not good");
    // }
    marksToConfirm[0] = completed;
    store.getState().selectMarks.forEach((value: string[]) => {
      marksToConfirm[0] = marksToConfirm[0].filter(function (v) { return value.indexOf(v) == -1 })
    });
    if (marksToConfirm[0].length === 1) {
      this.beginSuggest(marksToConfirm);
    } else {
      marksToConfirm[0].forEach(id => {
        const element = document.getElementById(id);
        // const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        // animate.setAttribute("attributeName", "opacity");
        // let opacityAttr = element.getAttribute("opacity");
        // let originalOpacity: number = 0;
        // if (opacityAttr) {
        //   originalOpacity = Number(opacityAttr);
        // }
        // animate.setAttribute("from", (.3 * originalOpacity).toString());
        // animate.setAttribute("to", originalOpacity.toString());
        // animate.setAttribute("dur", ".3");
        // animate.setAttribute("begin", "0");
        // animate.setAttribute("repeatCount", "indefinite");
        // element.appendChild(animate);
        addHighlight(element);
      });
      parent.removeChild(visChart);
      parent.appendChild(visChart.cloneNode(true));
      this.sleep(300).then(() => {
        marksToConfirm[0].forEach(id => {
          const element = document.getElementById(id);
          removeHighlight(element);
          // let children = Array.from(element.children);
          // for (let i of children) {
          //   if (i.tagName == "animate") {
          //     element.removeChild(i);
          //   }
          // }
        });
        this.beginSuggest(marksToConfirm)
      })
    }
  }
}

export const markSelection = new MarkSelection();
