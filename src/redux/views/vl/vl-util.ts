import KfGroup from "./kfGroup";
import { Animation } from "canis_toolkit";
import KfItem from "./kfItem";
import { KF_POPUP_LAYER } from "./vl-consts";
import { IOrderInfo, RANDOM_ORDER } from "../../../util/markSelection";
import { store } from "../../store";
import {
  updateMarksToConfirm,
  updateSelection,
  updateSelectionOrder,
  updateSuggestedMarks,
} from "../../action/chartAction";
import { jsTool } from "../../../util/jsTool";
import { updateActivatePlusBtn } from "../../action/vlAction";

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
