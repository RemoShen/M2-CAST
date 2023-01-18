import KfGroup from "./kfGroup";
import { Animation } from "canis_toolkit";
import KfItem from "./kfItem";
import { KF_POPUP_LAYER } from "./vl-consts";
import { IOrderInfo, RANDOM_ORDER } from "../../../util/markSelection";
import { store } from "../../store";
import {
  updateSelection,
  updateSelectionOrder,
  updateSelectMarksStepFake,
  updateSuggestedMarks,
} from "../../action/chartAction";
import { jsTool } from "../../../util/jsTool";
import { updateActivatePlusBtn } from "../../action/vlAction";
import {
  IActivatePlusBtn,
  IDataItem,
  IKeyframe,
  IPath,
} from "../../global-interfaces";
import Suggest from "../../../app/core/suggest";
import Util from "../../../app/core/util";

export const createKf = (
  previousKfs: string[][],
  orderInfo: IOrderInfo = { type: RANDOM_ORDER, correspondSelection: [] }
) => {
  if (
    jsTool.identicalArrays(
      store.getState().selection,
      store.getState().selectionOrder.correspondSelection
    )
  ) {
    orderInfo = store.getState().selectionOrder;
  }

  findTargetAni(orderInfo, previousKfs);
  store.dispatchSystem(updateSelection([]));
  store.dispatchSystem(updateSuggestedMarks([]));
  store.dispatchSystem(
    updateSelectionOrder({ type: RANDOM_ORDER, correspondSelection: [] })
  );
};

export const findTargetAni = (
  orderInfo: IOrderInfo,
  previousKfs: string[][]
) => {
  const selectedCls: string[] = store
    .getState()
    .selection.map((mId: string) => Animation.markClass.get(mId)); //find the classes of selected marks
  KfGroup.selectAvailableGroup([...new Set(selectedCls)]);
  if (KfGroup.groupToInsert !== "") {
    const previousKfMarks: Map<number, string[]> = new Map();
    previousKfs.forEach((marks, i) => {
      if (i > 0) previousKfMarks.set(i - 1, marks);
    });

    store.dispatchSystem(
      updateActivatePlusBtn({
        aniId: KfGroup.groupToInsert,
        selection: store.getState().selection,
        selectedMarksEachStep:
          previousKfs.length > 0 ? previousKfMarks : undefined,
        renderedUniqueIdx: previousKfs.length - 1,
        orderInfo: orderInfo,
        previousKfs,
      })
    );
  }
};

export const createPopupComponent = (target: KfGroup | KfItem) => {
  //move the entire group
  target.container.setAttributeNS(
    null,
    "_transform",
    target.container.getAttributeNS(null, "transform")
  );
  const tmpContainerBBox: DOMRect = target.container.getBoundingClientRect(); //fixed
  const containerBBox: any = {
    top:
      target instanceof KfItem
        ? target.kfBg.getBoundingClientRect().top
        : tmpContainerBBox.top,
    left: tmpContainerBBox.left,
    right: tmpContainerBBox.right,
    width: tmpContainerBBox.width,
    height: tmpContainerBBox.height,
    x: tmpContainerBBox.x,
    y: tmpContainerBBox.y,
  };
  if (target.parentObj.container.contains(target.container)) {
    target.parentObj.container.removeChild(target.container);
  }
  const popKfContainer: HTMLElement = document.getElementById(KF_POPUP_LAYER);
  // const popKfContainerBbox: DOMRect = popKfContainer.getBoundingClientRect();//fixed
  popKfContainer.appendChild(target.container);
  return containerBBox;
  // return [containerBBox, popKfContainer, popKfContainerBbox];
};
export const ifComplete = () => {
  const aniGroupToInsert: string = KfGroup.groupToInsert;
  const selectedMarks: string[] = store.getState().selection;

  let orderInfo: IOrderInfo = store.getState().selectionOrder;
  if (
    jsTool.identicalArrays(
      store.getState().selection,
      store.getState().selectionOrder.correspondSelection
    )
  ) {
    orderInfo = store.getState().selectionOrder;
  }
  const selectedCls: string[] = store
    .getState()
    .selection.map((mId: string) => Animation.markClass.get(mId)); //find the classes of selected marks
  KfGroup.selectAvailableGroup([...new Set(selectedCls)]);
  let firstKfInfoInParent: IKeyframe = KfItem.allKfInfo.get(
    KfGroup.allAniGroups.get(aniGroupToInsert).fetchFirstKf().id
  );
  const suggestOnFirstKf: boolean = Suggest.generateSuggestionPath(
    selectedMarks,
    firstKfInfoInParent,
    KfGroup.allAniGroups.get(aniGroupToInsert),
    orderInfo
  );
  console.log("ifcomplete", suggestOnFirstKf);
};
export const tipSuggest = (
  previousKfs: string[][],
  orderInfo: IOrderInfo = { type: RANDOM_ORDER, correspondSelection: [] }
) => {
  if (
    jsTool.identicalArrays(
      store.getState().selectionfake,
      store.getState().selectionOrder.correspondSelection
    )
  ) {
    orderInfo = store.getState().selectionOrder;
  }
  const selectedCls: string[] = store
    .getState()
    .selectionfake.map((mId: string) => Animation.markClass.get(mId)); //find the classes of selected marks
  KfGroup.selectAvailableGroup([...new Set(selectedCls)]);
  if (KfGroup.groupToInsert !== "") {
    const previousKfMarks: Map<number, string[]> = new Map();
    previousKfs.forEach((marks, i) => {
      if (i > 0) previousKfMarks.set(i - 1, marks);
    });
  }
  //run suggest alogrithm to get suggest result
  const selectedMarks: string[] = store.getState().selectionfake;
  const marksThisAni: string[] = KfGroup.allAniGroups
    .get(KfGroup.groupToInsert)
    .marksThisAni();
  const suggestPath: IPath[] = pathSuggest(
    selectedMarks,
    marksThisAni,
    orderInfo
  );
  return suggestPath
};
export const pathSuggest = (
  firstKfMarks: string[],
  lastKfMarks: string[],
  orderInfo: IOrderInfo
) => {
  let allPaths: IPath[] = [];
  const sepFirstKfMarks: { dataMarks: string[]; nonDataMarks: string[] } =
    Util.separateDataAndNonDataMarks(firstKfMarks);
  const sepLastKfMarks: { dataMarks: string[]; nonDataMarks: string[] } =
    Util.separateDataAndNonDataMarks([...Util.filteredDataTable.keys()]);
  const allCls: string[] = Util.extractClsFromMarks(lastKfMarks)[0];
  let allShapeInc: string[] = [];
  let colorAttrInc: string = "";
  sepLastKfMarks.dataMarks.forEach((mark: string) => {
    allShapeInc.push(Util.filteredDataTable.get(mark)["mShape"] as string);
    if (Util.filteredDataTable.get(mark)["OS"] != undefined) {
      colorAttrInc = "OS";
    } else if (Util.filteredDataTable.get(mark)["Country"] != undefined) {
      colorAttrInc = "Country";
    } else if (Util.filteredDataTable.get(mark)["Cause"] != undefined) {
      colorAttrInc = "Cause";
    } else if (Util.filteredDataTable.get(mark)["City"] != undefined) {
      colorAttrInc = "City";
    } else if (Util.filteredDataTable.get(mark)["Male"] != undefined) {
      colorAttrInc = "Male";
    }
  });
  allShapeInc = [...new Set(allShapeInc)];

  if (
    sepFirstKfMarks.dataMarks.length > 0 &&
    sepFirstKfMarks.nonDataMarks.length > 0
  ) {
    //suggest based on data attrs
    const firstKfMixedMarks: string[] = sepFirstKfMarks.dataMarks.concat(
      sepFirstKfMarks.nonDataMarks
    );
    const nodataClsType: number | string = Util.nonDataTable.get(
      sepFirstKfMarks.nonDataMarks[0]
    )._TYPE_IDX;

    // const nodataClsType: number =
    const lastKfMixedMarks: string[] = sepLastKfMarks.dataMarks.concat(
      sepLastKfMarks.nonDataMarks.filter((mId) => {
        if (firstKfMixedMarks.includes(mId)) {
          return true;
        }
        const clsType: number | string = Util.nonDataTable.get(mId)._TYPE_IDX;

        if (
          firstKfMixedMarks.find(
            (refId) =>
              refId.length >= 8 &&
              refId.startsWith(mId.slice(0, mId.length - 3)) &&
              clsType === nodataClsType
          )
        ) {
          return true;
        }
        return false;
      })
    );

    if (jsTool.identicalArrays(firstKfMixedMarks, lastKfMixedMarks)) {
      //refresh current spec
    } else {
      let attrWithDiffValues: string[] = Suggest.findAttrWithMixedDiffValue(
        firstKfMixedMarks,
        lastKfMixedMarks
      );
      const [sameAttrs, diffAttrs] =
        Suggest.findSameMixedDiffAttrs(firstKfMixedMarks);
      let flag: boolean = false;
      if (attrWithDiffValues.length === 0) {
        flag = true;
        const filteredDiffAttrs: string[] = Util.filterAttrs(diffAttrs);
        attrWithDiffValues = [...sameAttrs, ...filteredDiffAttrs];
      }

      //remove empty cell problem
      attrWithDiffValues = Suggest.removeMixedEmptyCell(
        firstKfMarks,
        attrWithDiffValues,
        sameAttrs,
        diffAttrs
      );
      let valueIdx: Map<string, number> = new Map(); //key: attr name, value: index of the value in all values
      attrWithDiffValues.forEach((aName: string) => {
        const targetValue: string | number = Util.filteredDataTable.get(
          sepFirstKfMarks.dataMarks[0]
        )[aName];
        const tmpIdx: number = Util.dataValues
          .get(aName)
          .indexOf(<never>targetValue);
        if (tmpIdx === 0) {
          valueIdx.set(aName, 0); //this value is the 1st in all values
        } else if (tmpIdx === Util.dataValues.get(aName).length - 1) {
          valueIdx.set(aName, 1); //this value is the last in all values
        } else {
          valueIdx.set(aName, 2); //this value is in the middle of all values
        }
      });

      //sortedAttrs: key: channel, value: attr array
      const sortedAttrs: Map<string, string[]> = flag
        ? Suggest.assignChannelName(attrWithDiffValues)
        : Suggest.sortAttrs(attrWithDiffValues);
      const oneMarkInFirstKf: boolean = firstKfMixedMarks.length === 1;

      let allPossibleKfs = Suggest.generateRepeatKfs(
        sortedAttrs,
        valueIdx,
        firstKfMixedMarks,
        lastKfMixedMarks,
        oneMarkInFirstKf
      );
      let repeatKfRecord: any[] = [];
      let filterAllPaths: number[] = [],
        count = 0; //record the index of the path that should be removed: not all selected & not one mark in 1st kf
      allPossibleKfs.forEach((possiblePath: any[]) => {
        let attrComb: string[] = possiblePath[0];
        let sections: Map<string, string[]> = possiblePath[1];
        let orderedSectionIds: string[] = possiblePath[2];
        let repeatKfs = [];
        let allSelected = false;
        let oneMarkFromEachSec = false,
          oneMarkEachSecRecorder: Set<string> = new Set();
        let numberMostMarksInSec = 0,
          selectedMarks: Map<string, string[]> = new Map(); //in case of one mark from each sec

        orderedSectionIds.forEach((sectionId: string) => {
          let tmpSecMarks = sections.get(sectionId);
          if (tmpSecMarks.length > numberMostMarksInSec) {
            numberMostMarksInSec = tmpSecMarks.length;
          }

          //check if marks in 1st kf are one from each sec
          firstKfMarks.forEach((mId: string) => {
            if (tmpSecMarks.includes(mId)) {
              selectedMarks.set(sectionId, [mId]);
              oneMarkEachSecRecorder.add(sectionId);
            }
          });
        });

        if (
          oneMarkEachSecRecorder.size === sections.size &&
          firstKfMarks.length === sections.size
        ) {
          oneMarkFromEachSec = true;
        }

        if (oneMarkFromEachSec) {
          //if the mark is from one section
          for (let i = 0; i < numberMostMarksInSec - 1; i++) {
            let tmpKfMarks = [];
            for (let j = 0; j < orderedSectionIds.length; j++) {
              let tmpSecMarks = sections.get(orderedSectionIds[j]);
              let tmpSelected = selectedMarks.get(orderedSectionIds[j]);
              for (let z = 0; z < tmpSecMarks.length; z++) {
                if (!tmpSelected.includes(tmpSecMarks[z])) {
                  tmpKfMarks.push(tmpSecMarks[z]);
                  selectedMarks.get(orderedSectionIds[j]).push(tmpSecMarks[z]);
                  break;
                }
              }
            }
            repeatKfs.push(tmpKfMarks);
          }
        } else {
          for (let i = 0, len = orderedSectionIds.length; i < len; i++) {
            let tmpSecMarks = sections.get(orderedSectionIds[i]);
            let judgeSame = jsTool.identicalArrays(firstKfMarks, tmpSecMarks);
            if (!allSelected && judgeSame && !oneMarkInFirstKf) {
              allSelected = true;
            }
            if (!judgeSame) {
              //dont show the 1st kf twice
              repeatKfs.push(tmpSecMarks);
            }
          }
        }

        let samePath = false;
        for (let i = 0; i < allPaths.length; i++) {
          if (jsTool.identicalArrays(repeatKfs, allPaths[i].kfMarks)) {
            samePath = true;
            break;
          }
        }
        allPaths.push({
          attrComb: attrComb,
          sortedAttrValueComb: orderedSectionIds,
          kfMarks: repeatKfs,
          firstKfMarks: firstKfMixedMarks,
          lastKfMarks: lastKfMixedMarks,
        });
        //check if the selection is one mark from each sec
        if (
          (!allSelected && !oneMarkInFirstKf && !oneMarkFromEachSec) ||
          samePath
        ) {
          filterAllPaths.push(count);
        }
        count++;
      });

      //filter all paths
      filterAllPaths.sort(function (a, b) {
        return b - a;
      });
      for (let i = 0; i < filterAllPaths.length; i++) {
        allPaths.splice(filterAllPaths[i], 1);
      }

      //check numeric ordering
      let hasNumericOrder: boolean = false;
      let numericOrders: { attr: string; order: number; marks: string[] }[];
      if (firstKfMixedMarks.length === 1) {
        [hasNumericOrder, numericOrders] = Suggest.checkNumbericOrder(
          firstKfMixedMarks[0]
        );
      }

      if (hasNumericOrder) {
        //generate path according to the order of values of numeric attributes
        numericOrders.forEach(
          (ordering: { attr: string; order: number; marks: string[] }) => {
            let orderedMarks: string[] =
              ordering.order === 0 ? ordering.marks : ordering.marks.reverse();
            let orderedKfMarks: string[][] = orderedMarks.map((a: string) => [
              a,
            ]);
            allPaths.push({
              attrComb: ["id"],
              sortedAttrValueComb: orderedMarks,
              kfMarks: orderedKfMarks,
              firstKfMarks: firstKfMixedMarks,
              lastKfMarks: lastKfMixedMarks,
              ordering: {
                attr: ordering.attr,
                order: ordering.order === 0 ? "asscending" : "descending",
              },
            });
          }
        );
      }

      console.log("all paths", allPaths);
    }
  } else if (
    sepFirstKfMarks.dataMarks.length > 0 &&
    sepFirstKfMarks.nonDataMarks.length === 0
  ) {
    if (
      (colorAttrInc.length > 0 || allShapeInc.length > 1) &&
      colorAttrInc != "Male"
    ) {
      const sepSelectKfMarks: {
        dataMarks: string[];
        nonDataMarks: string[];
      } = Util.separateDataAndNonDataMarks(firstKfMarks);
      const sepAllKfMarks: { dataMarks: string[]; nonDataMarks: string[] } =
        Util.separateDataAndNonDataMarks([...Util.filteredDataTable.keys()]);

      //suggest based on data attrs
      const selectKfDataMarks: string[] = sepSelectKfMarks.dataMarks;
      const allKfDataMarks: string[] = sepAllKfMarks.dataMarks;
      let lastKfDataMarks: string[] = [];
      let possibleKfs: Array<[string[], Map<string, string[]>, string[]]> = [];
      let allShape: string[] = [];
      let allColor: string[] = [];
      let colorAttr: string = "";
      const AllselectStepMark = store.getState().selectMarksStepFake;
      const currentSelect: string[] = store.getState().selectionfake;
      let currentUsedMarks: string[][] = [];
      if (
        store
          .getState()
          .selectMarksStepFake.find((s) => s instanceof Array && s.length === 0)
      ) {
        let posi: number;
        for (let i = AllselectStepMark.length - 1; i >= 0; i--) {
          if (AllselectStepMark[i].length === 0) {
            posi = i;
            break;
          }
        }
        currentUsedMarks = AllselectStepMark.slice(posi + 1);
      } else {
        currentUsedMarks = AllselectStepMark;
      }

      currentUsedMarks.forEach((selectOneStep: string[]) => {
        selectOneStep.forEach((mark: string) => {
          allShape.push(Util.filteredDataTable.get(mark)["mShape"] as string);
          if (Util.filteredDataTable.get(mark)["OS"] != undefined) {
            allColor.push(Util.filteredDataTable.get(mark)["OS"] as string);
            colorAttr = "OS";
          } else if (Util.filteredDataTable.get(mark)["Country"] != undefined) {
            allColor.push(
              Util.filteredDataTable.get(mark)["Country"] as string
            );
            colorAttr = "Country";
          } else if (Util.filteredDataTable.get(mark)["Cause"] != undefined) {
            allColor.push(Util.filteredDataTable.get(mark)["Cause"] as string);
            colorAttr = "Cause";
          } else if (Util.filteredDataTable.get(mark)["City"] != undefined) {
            allColor.push(Util.filteredDataTable.get(mark)["City"] as string);
            colorAttr = "City";
          }
        });
      });

      allShape = [...new Set(allShape)];
      allColor = [...new Set(allColor)];

      allKfDataMarks.forEach((mark: string) => {
        if (
          allShape.includes(
            Util.filteredDataTable.get(mark)["mShape"] as string
          )
        ) {
          if (
            colorAttr.length > 0 &&
            allColor.includes(
              Util.filteredDataTable.get(mark)[colorAttr] as string
            )
          ) {
            lastKfDataMarks.push(mark);
          } else if (colorAttr.length === 0) {
            lastKfDataMarks.push(mark);
          }
        }
      });

      if (currentUsedMarks.length > 1) {
        let flag: boolean;
        let diffAttr = [];
        const sameAttrs: string[] = Suggest.findSameAttrs(
          currentUsedMarks[0],
          currentSelect
        );

        const combineSelect: string[] = currentSelect.concat(
          currentUsedMarks[0]
        );
        if (sameAttrs.indexOf("mShape") > -1 && colorAttr.length === 0) {
          const allColorShape: boolean = true;
          possibleKfs = Suggest.generateMultikfs(
            currentUsedMarks,
            lastKfDataMarks,
            allColorShape,
            colorAttr
          );
          store.dispatchSystem(updateSelectMarksStepFake([]));
        } else if (sameAttrs.indexOf(colorAttr) > -1 && colorAttr.length > 0) {
          const allColorShape: boolean = false;
          possibleKfs = Suggest.generateMultikfs(
            currentUsedMarks,
            lastKfDataMarks,
            allColorShape,
            colorAttr
          );
          store.dispatchSystem(updateSelectMarksStepFake([]));
        }
      }

      const firstSelectMarks: string[] = currentUsedMarks[0];
      const oneMarkInFirstKf: boolean = firstSelectMarks.length === 1;
      possibleKfs.forEach((possiblePath: any[]) => {
        let attrComb: string[] = possiblePath[0];
        let sections: Map<string, string[]> = possiblePath[1];
        let orderedSectionIds: string[] = possiblePath[2];
        let repeatKfs = [];
        let allSelected = false;
        let oneMarkFromEachSec = false,
          oneMarkEachSecRecorder: Set<string> = new Set();
        let numberMostMarksInSec = 0,
          selectedMarks: Map<string, string[]> = new Map();

        orderedSectionIds.forEach((sectionId: string) => {
          let tmpSecMarks = sections.get(sectionId);
          if (tmpSecMarks.length > numberMostMarksInSec) {
            numberMostMarksInSec = tmpSecMarks.length;
          }
          firstSelectMarks.forEach((mId: string) => {
            if (tmpSecMarks.includes(mId)) {
              selectedMarks.set(sectionId, [mId]);
              oneMarkEachSecRecorder.add(sectionId);
            }
          });
        });
        if (
          oneMarkEachSecRecorder.size === sections.size &&
          firstSelectMarks.length === sections.size
        ) {
          oneMarkFromEachSec = true;
        }
        if (oneMarkFromEachSec) {
          //if the mark is from one section
          for (let i = 0; i < numberMostMarksInSec - 1; i++) {
            let tmpKfMarks = [];
            for (let j = 0; j < orderedSectionIds.length; j++) {
              let tmpSecMarks = sections.get(orderedSectionIds[j]);
              let tmpSelected = selectedMarks.get(orderedSectionIds[j]);
              for (let z = 0; z < tmpSecMarks.length; z++) {
                if (!tmpSelected.includes(tmpSecMarks[z])) {
                  tmpKfMarks.push(tmpSecMarks[z]);
                  selectedMarks.get(orderedSectionIds[j]).push(tmpSecMarks[z]);
                  break;
                }
              }
            }
            repeatKfs.push(tmpKfMarks);
          }
        } else {
          for (let i = 0, len = orderedSectionIds.length; i < len; i++) {
            let tmpSecMarks = sections.get(orderedSectionIds[i]);
            let judgeSame = jsTool.identicalArrays(
              firstSelectMarks,
              tmpSecMarks
            );
            if (!allSelected && judgeSame && !oneMarkInFirstKf) {
              allSelected = true;
            }
            if (!judgeSame) {
              //dont show the 1st kf twice
              repeatKfs.push(tmpSecMarks);
            }
          }
        }
        allPaths.push({
          attrComb: attrComb,
          sortedAttrValueComb: orderedSectionIds,
          kfMarks: repeatKfs,
          firstKfMarks: firstSelectMarks,
          lastKfMarks: lastKfDataMarks,
        });
      });
      console.log("syc suggest12", allPaths);
    } else {
      //suggest based on data attrs
      const firstKfDataMarks: string[] = sepFirstKfMarks.dataMarks;
      const lastKfDataMarks: string[] = sepLastKfMarks.dataMarks;

      if (jsTool.identicalArrays(firstKfDataMarks, lastKfDataMarks)) {
        //refresh current spec
      } else {
        let attrWithDiffValues: string[] = Suggest.findAttrWithDiffValue(
          firstKfDataMarks,
          lastKfDataMarks,
          true
        );
        const [sameAttrs, diffAttrs] = Suggest.findSameDiffAttrs(
          firstKfDataMarks,
          true
        );
        let flag: boolean = false;
        if (attrWithDiffValues.length === 0) {
          flag = true;
          const filteredDiffAttrs: string[] = Util.filterAttrs(diffAttrs);
          attrWithDiffValues = [...sameAttrs, ...filteredDiffAttrs];
        }

        //remove empty cell problem
        attrWithDiffValues = Suggest.removeEmptyCell(
          firstKfMarks,
          attrWithDiffValues,
          sameAttrs,
          diffAttrs,
          true
        );
        let valueIdx: Map<string, number> = new Map(); //key: attr name, value: index of the value in all values
        attrWithDiffValues.forEach((aName: string) => {
          const targetValue: string | number = Util.filteredDataTable.get(
            firstKfDataMarks[0]
          )[aName];
          const tmpIdx: number = Util.dataValues
            .get(aName)
            .indexOf(<never>targetValue);
          if (tmpIdx === 0) {
            valueIdx.set(aName, 0); //this value is the 1st in all values
          } else if (tmpIdx === Util.dataValues.get(aName).length - 1) {
            valueIdx.set(aName, 1); //this value is the last in all values
          } else {
            valueIdx.set(aName, 2); //this value is in the middle of all values
          }
        });

        //sortedAttrs: key: channel, value: attr array
        const sortedAttrs: Map<string, string[]> = flag
          ? Suggest.assignChannelName(attrWithDiffValues)
          : Suggest.sortAttrs(attrWithDiffValues);
        const oneMarkInFirstKf: boolean = firstKfDataMarks.length === 1;

        let allPossibleKfs = Suggest.generateRepeatKfs(
          sortedAttrs,
          valueIdx,
          firstKfDataMarks,
          lastKfDataMarks,
          oneMarkInFirstKf
        );
        let repeatKfRecord: any[] = [];
        let filterAllPaths: number[] = [],
          count = 0; //record the index of the path that should be removed: not all selected & not one mark in 1st kf
        allPossibleKfs.forEach((possiblePath: any[]) => {
          let attrComb: string[] = possiblePath[0];
          let sections: Map<string, string[]> = possiblePath[1];
          let orderedSectionIds: string[] = possiblePath[2];
          let repeatKfs = [];
          let allSelected = false;
          let oneMarkFromEachSec = false,
            oneMarkEachSecRecorder: Set<string> = new Set();
          let numberMostMarksInSec = 0,
            selectedMarks: Map<string, string[]> = new Map(); //in case of one mark from each sec

          orderedSectionIds.forEach((sectionId: string) => {
            let tmpSecMarks = sections.get(sectionId);
            if (tmpSecMarks.length > numberMostMarksInSec) {
              numberMostMarksInSec = tmpSecMarks.length;
            }

            //check if marks in 1st kf are one from each sec
            firstKfMarks.forEach((mId: string) => {
              if (tmpSecMarks.includes(mId)) {
                selectedMarks.set(sectionId, [mId]);
                oneMarkEachSecRecorder.add(sectionId);
              }
            });
          });

          if (
            oneMarkEachSecRecorder.size === sections.size &&
            firstKfMarks.length === sections.size
          ) {
            oneMarkFromEachSec = true;
          }

          if (oneMarkFromEachSec) {
            //if the mark is from one section
            for (let i = 0; i < numberMostMarksInSec - 1; i++) {
              let tmpKfMarks = [];
              for (let j = 0; j < orderedSectionIds.length; j++) {
                let tmpSecMarks = sections.get(orderedSectionIds[j]);
                let tmpSelected = selectedMarks.get(orderedSectionIds[j]);
                for (let z = 0; z < tmpSecMarks.length; z++) {
                  if (!tmpSelected.includes(tmpSecMarks[z])) {
                    tmpKfMarks.push(tmpSecMarks[z]);
                    selectedMarks
                      .get(orderedSectionIds[j])
                      .push(tmpSecMarks[z]);
                    break;
                  }
                }
              }
              repeatKfs.push(tmpKfMarks);
            }
          } else {
            for (let i = 0, len = orderedSectionIds.length; i < len; i++) {
              let tmpSecMarks = sections.get(orderedSectionIds[i]);
              let judgeSame = jsTool.identicalArrays(firstKfMarks, tmpSecMarks);
              if (!allSelected && judgeSame && !oneMarkInFirstKf) {
                allSelected = true;
              }
              if (!judgeSame) {
                //dont show the 1st kf twice
                repeatKfs.push(tmpSecMarks);
              }
            }
          }

          let samePath = false;
          for (let i = 0; i < allPaths.length; i++) {
            if (jsTool.identicalArrays(repeatKfs, allPaths[i].kfMarks)) {
              samePath = true;
              break;
            }
          }
          // repeatKfRecord.push(repeatKfs);
          allPaths.push({
            attrComb: attrComb,
            sortedAttrValueComb: orderedSectionIds,
            kfMarks: repeatKfs,
            firstKfMarks: firstKfDataMarks,
            lastKfMarks: lastKfDataMarks,
          });
          //check if the selection is one mark from each sec
          if (
            (!allSelected && !oneMarkInFirstKf && !oneMarkFromEachSec) ||
            samePath
          ) {
            filterAllPaths.push(count);
          }
          count++;
        });

        //filter all paths
        filterAllPaths.sort(function (a, b) {
          return b - a;
        });
        for (let i = 0; i < filterAllPaths.length; i++) {
          allPaths.splice(filterAllPaths[i], 1);
        }

        //check numeric ordering
        let hasNumericOrder: boolean = false;
        let numericOrders: { attr: string; order: number; marks: string[] }[];
        if (firstKfDataMarks.length === 1) {
          [hasNumericOrder, numericOrders] = Suggest.checkNumbericOrder(
            firstKfDataMarks[0]
          );
        }

        if (hasNumericOrder) {
          //generate path according to the order of values of numeric attributes
          numericOrders.forEach(
            (ordering: { attr: string; order: number; marks: string[] }) => {
              let orderedMarks: string[] =
                ordering.order === 0
                  ? ordering.marks
                  : ordering.marks.reverse();
              let orderedKfMarks: string[][] = orderedMarks.map((a: string) => [
                a,
              ]);
              Suggest.allPaths.push({
                attrComb: ["id"],
                sortedAttrValueComb: orderedMarks,
                kfMarks: orderedKfMarks,
                firstKfMarks: firstKfDataMarks,
                lastKfMarks: lastKfDataMarks,
                ordering: {
                  attr: ordering.attr,
                  order: ordering.order === 0 ? "asscending" : "descending",
                },
              });
            }
          );
        }

        console.log("all paths", allPaths);
      }
    }
  } else if (
    sepFirstKfMarks.dataMarks.length === 0 &&
    sepFirstKfMarks.nonDataMarks.length > 0
  ) {
    //suggest based on non data attrs
    const firstKfNonDataMarks: string[] = sepFirstKfMarks.nonDataMarks;
    const lastKfNonDataMarks: string[] = sepLastKfMarks.nonDataMarks;

    if (!jsTool.identicalArrays(firstKfNonDataMarks, lastKfNonDataMarks)) {
      //count the number of types in first kf
      const typeCount: Map<string, string[]> = new Map();
      const attrValstrs: Set<string> = new Set();
      firstKfNonDataMarks.forEach((mId: string) => {
        let attrValStr: string = "";
        const tmpDatum: IDataItem = Util.nonDataTable.get(mId);
        Object.keys(tmpDatum).forEach((attr: string) => {
          if (Util.isNonDataAttr(attr) && attr !== "text") {
            attrValStr += `*${tmpDatum[attr]}`;
          }
        });
        if (typeof typeCount.get(attrValStr) === "undefined") {
          typeCount.set(attrValStr, []);
        }
        typeCount.get(attrValStr).push(mId);
        attrValstrs.add(attrValStr);
      });
      let oneFromEachType: boolean = true;
      typeCount.forEach((mIds: string[], mType: string) => {
        if (mIds.length > 1) {
          oneFromEachType = false;
        }
      });

      if (oneFromEachType) {
        //fetch all marks with the same attr values
        let suggestionLastKfMarks: Map<string, string[]> = new Map(); //key: attrValStr, value: marks have those attr values
        Util.nonDataTable.forEach((datum: IDataItem, mId: string) => {
          let tmpAttrValStr: string = "";
          Object.keys(datum).forEach((attr: string) => {
            if (Util.isNonDataAttr(attr) && attr !== "text") {
              tmpAttrValStr += `*${datum[attr]}`;
            }
          });
          if (attrValstrs.has(tmpAttrValStr)) {
            // if (tmpAttrValStr === attrValStr) {
            if (
              typeof suggestionLastKfMarks.get(tmpAttrValStr) === "undefined"
            ) {
              suggestionLastKfMarks.set(tmpAttrValStr, []);
            }
            suggestionLastKfMarks.get(tmpAttrValStr).push(mId);
          }
        });

        //sort marks from each type
        let kfBefore: string[][] = [];
        let kfAfter: string[][] = [];
        let targetIdx: number = -100;
        let allLastKfMarks: string[] = [];
        let reverseIdx: boolean = false;

        suggestionLastKfMarks.forEach((mIds: string[], attrValStr: string) => {
          mIds.forEach((mId: string, idx: number) => {
            if (mId === typeCount.get(attrValStr)[0] && targetIdx === -100) {
              targetIdx = idx;
              if (targetIdx === mIds.length - 1) {
                reverseIdx = true;
              }
            }
            if (targetIdx === -100 || idx < targetIdx) {
              if (typeof kfBefore[idx] === "undefined") {
                kfBefore[idx] = [];
              }
              kfBefore[idx].push(mId);
            } else {
              if (typeof kfAfter[idx - targetIdx] === "undefined") {
                kfAfter[idx - targetIdx] = [];
              }
              kfAfter[idx - targetIdx].push(mId);
            }
            allLastKfMarks.push(mId);
          });
        });
        let tmpKfMarks: string[][] = reverseIdx
          ? [...kfAfter, ...kfBefore.reverse()]
          : [...kfAfter, ...kfBefore];
        let sortedAttrValueComb: string[] = tmpKfMarks.map((mIds: string[]) =>
          mIds.join(",")
        );
        if (typeCount.size === 1) {
          sortedAttrValueComb = tmpKfMarks.map((mIds: string[]) => mIds[0]);
          const attrComb: string[] = typeCount.size === 1 ? ["id"] : ["clsIdx"];
          allPaths = [
            {
              attrComb: attrComb,
              sortedAttrValueComb: sortedAttrValueComb,
              kfMarks: tmpKfMarks,
              firstKfMarks: firstKfNonDataMarks,
              lastKfMarks: allLastKfMarks,
            },
          ];
        } else {
          let flag = true;
          tmpKfMarks.forEach((mIds: string[]) => {
            let clsIdx: string = null;
            mIds.forEach((mId) => {
              const currentIdx = Util.nonDataTable.get(mId).clsIdx as string;
              clsIdx = clsIdx || currentIdx;
              if (clsIdx != currentIdx) {
                flag = false;
              }
            });
          });
          if (flag) {
            sortedAttrValueComb = tmpKfMarks.map(
              (mIds: string[]) => `${Util.nonDataTable.get(mIds[0]).clsIdx}`
            );
            const attrComb: string[] =
              typeCount.size === 1 ? ["id"] : ["clsIdx"];
            allPaths = [
              // {
              //   attrComb: attrComb,
              //   sortedAttrValueComb: sortedAttrValueComb,
              //   kfMarks: tmpKfMarks,
              //   firstKfMarks: firstKfNonDataMarks,
              //   lastKfMarks: allLastKfMarks,
              // },
            ];
          }
        }
      }
    }
  }
  return allPaths;
};
