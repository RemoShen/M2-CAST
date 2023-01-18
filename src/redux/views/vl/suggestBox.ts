import "../../assets/style/vl/suggestBox.scss";
import KfItem from "./kfItem";
import KfGroup, { GROUP_PADDING, GROUP_RX } from "./kfGroup";
import Suggest from "../../../app/core/suggest";
import KfOmit from "./kfOmit";
import {
  KF_FG_LAYER,
  KF_PADDING,
  KF_POPUP_LAYER,
  SUGGEST_MENU_RX,
} from "./vl-consts";
import { RANDOM_ORDER } from "../../../util/markSelection";
import { NON_SKETCH_CLS } from "../../global-consts";
import {
  IPath,
  IKeyframe,
  ICoord,
  IActivatePlusBtn,
} from "../../global-interfaces";
import { store } from "../../store";
import {
  updateSelectMarks,
} from "../../action/chartAction";
import { jsTool } from "../../../util/jsTool";
import {
  updateActivatePlusBtn,
  updateKfGroupSize,
} from "../../action/vlAction";
import PlusBtn from "./plusBtn";
import { createSvgElement, translateEle } from "../../../util/svgManager";
import { dragging } from "../panels/interactions";
import { toggleVideoMode, updatePreviewing } from "../../action/videoAction";
import { ICanisSpec } from "../../../app/core/canisGenerator";
import AniMIL from "../../../mil/AniMIL";
import { player } from "../slider/player";

interface IOptionInfo {
  kfIdx: number;
  attrs: string[];
  values: string[];
  marks: string[];
  allCurrentMarks: string[];
  allGroupMarks: string[];
  kfWidth: number;
  kfHeight: number;
  suggestOnFirstKf: boolean;
  ordering?: {
    attr: string;
    order: string;
  };
}
/**
    SuggestBox为底部的推荐预览及选择框
 */
export class SuggestBox {
  static PADDING: number = 6; //6
  static SHOWN_NUM: number = 1; //1
  static MENU_WIDTH: number = 20; //20
  static preUniqueIdx: number = -1; //-1
  static currentUniqueIdx: number = -1; //-1
  static CLIP_ID: string = "optionClip";

  public static reset() {
    this.preUniqueIdx = -1;
    this.currentUniqueIdx = -1;
  }

  public lastUpdateSuggestionPathActionInfo: {
    ap: IPath[];
    kfIdxInPath: number;
    startKf: KfItem;
    suggestOnFirstKf: boolean;
    selectedMarks: string[];
  };
  public kfBeforeSuggestBox: KfItem;
  public uniqueKfIdx: number;
  public kfWidth: number = 240;
  public kfHeight: number = 178;
  public boxWidth: number = 240;
  public suggestMenu: SuggestMenu;
  public menu: SuggestMenu;
  public menuWidth: number = 0;
  public preMenuWidth: number = 0; //TODO: remove this
  public numShown: number = SuggestBox.SHOWN_NUM;
  public container: SVGGElement;
  public itemContainer: SVGGElement;
  public options: OptionItem[] = [];
  public _currentSelection: number;

  set currentSelection(cs: number) {
    console.trace("setting cs to: ", cs);
    this._currentSelection = cs;
    if (typeof this.menu !== "undefined") {
      this.menu.highlightIdx = cs;
    }
    this.doPreview(cs);
  }

  get currentSelection(): number {
    return this._currentSelection;
  }

  public createOptionClip() {
    const defs: SVGDefsElement = <SVGDefsElement>(
      createSvgElement({ tag: "defs", para: {}, flag: true })
    );
    const clipPath: SVGClipPathElement = <SVGClipPathElement>createSvgElement({
      tag: "clipPath",
      para: {
        id: SuggestBox.CLIP_ID,
      },
      flag: true,
    });
    const clipRect: SVGRectElement = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        x: 0,
        y: 0,
        width: this.boxWidth,
        height: this.kfHeight + 2 * SuggestBox.PADDING,
      },
      flag: true,
    });
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    this.container.appendChild(defs);
  }

  public createSuggestBox(
    kfBeforeSuggestBox: KfItem,
    allCurrentPaths: IPath[],
    uniqueKfIdx: number,
    suggestOnFirstKf: boolean
  ) {
    if (typeof this.container === "undefined") {
      this.container = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
    }

    this.kfBeforeSuggestBox = kfBeforeSuggestBox;
    this.uniqueKfIdx = uniqueKfIdx;
    this.kfWidth = 0;
    this.kfHeight = 0;
    this.boxWidth = 0;
    // this.kfWidth = this.kfBeforeSuggestBox.kfWidth - 2 * SuggestBox.PADDING * this.kfBeforeSuggestBox.kfWidth / this.kfBeforeSuggestBox.kfHeight;
    // this.kfHeight = this.kfBeforeSuggestBox.kfHeight - 2 * SuggestBox.PADDING;
    // this.boxWidth = this.kfWidth + 3 * SuggestBox.PADDING + 20;
    const tmpKfInfo: IKeyframe = KfItem.allKfInfo.get(
      this.kfBeforeSuggestBox.id
    );
    this.createOptionKfs(
      allCurrentPaths,
      [...tmpKfInfo.allCurrentMarks, ...tmpKfInfo.marksThisKf],
      tmpKfInfo.allGroupMarks,
      suggestOnFirstKf
    );

    if (this.options.length <= this.numShown) {
      this.numShown = this.options.length;
      this.preMenuWidth = this.menuWidth;
      this.menuWidth = 0;
      if (typeof this.suggestMenu !== "undefined") {
        this.container.removeChild(this.suggestMenu.container);
        this.suggestMenu = undefined;
      }
    } else {
      this.numShown = SuggestBox.SHOWN_NUM;
      this.preMenuWidth = this.menuWidth;
      this.menuWidth = SuggestBox.MENU_WIDTH;
    }


    this.menu = new SuggestMenu(
      {
        x: this.kfWidth + 2 * SuggestBox.PADDING,
        y: this.kfHeight / 2 + SuggestBox.PADDING,
      },
      this.options.length,
      this.numShown
    );
    this.container.appendChild(this.menu.container);

    this.currentSelection = 0;
    const popupLayer: HTMLElement = document.getElementById(KF_POPUP_LAYER);
    popupLayer.appendChild(this.container);
  }

  bindTouchEvts() {
    const SCROLLITEM: string = "scrollItem";
    const scrollItem = new AniMIL.Pan({
      event: SCROLLITEM,
    });
    const itemTouch = new AniMIL(this.itemContainer);
    itemTouch.add(scrollItem);
    let preY: number = -1,
      totalDist: number = 0;
    itemTouch.on(SCROLLITEM, (e: any) => {
      dragging.set({ enable: false });
      const currentY: number = e.center.y;
      if (preY === -1) {
        preY = currentY;
      } else {
        const clipRect: SVGRectElement = document
          .getElementById(SuggestBox.CLIP_ID)
          .querySelector("rect");
        const diffY: number = currentY - preY;
        totalDist += diffY;
        translateEle(<SVGElement>this.itemContainer, { x: 0, y: diffY });
        translateEle(clipRect, { x: 0, y: -diffY });
        preY = currentY;
      }
    });
    itemTouch.on(`${SCROLLITEM}end`, (e: any) => {
      preY = -1;

      if (Math.abs(totalDist) >= this.kfHeight / 4) {
        const clipRect: SVGRectElement = document
          .getElementById(SuggestBox.CLIP_ID)
          .querySelector("rect");
        if (totalDist < 0 && this.currentSelection < this.options.length - 1) {
          //scroll up
          translateEle(<SVGElement>this.itemContainer, {
            x: 0,
            y: -(this.kfHeight + 2 * OptionItem.PADDING + totalDist),
          });
          translateEle(clipRect, {
            x: 0,
            y: this.kfHeight + 2 * OptionItem.PADDING + totalDist,
          });
          this.currentSelection++;
        } else if (totalDist > 0 && this.currentSelection > 0) {
          //scroll down
          translateEle(<SVGElement>this.itemContainer, {
            x: 0,
            y: this.kfHeight + 2 * OptionItem.PADDING - totalDist,
          });
          translateEle(clipRect, {
            x: 0,
            y: -(this.kfHeight + 2 * OptionItem.PADDING - totalDist),
          });
          this.currentSelection--;
        } else {
          translateEle(<SVGElement>this.itemContainer, { x: 0, y: -totalDist });
          translateEle(clipRect, { x: 0, y: totalDist });
        }
      }

      totalDist = 0;
      dragging.set({ enable: true });
    });
  }

  public doPreview(idx: number) {
    if (store.getState().suggestSpecs && store.getState().suggestSpecs[idx]) {
      const spec: ICanisSpec = store.getState().suggestSpecs[idx].spec;
      const path: IPath = store.getState().suggestSpecs[idx].path;
      store.dispatchSystem(updatePreviewing(path, spec, false, true));
      store.dispatchSystem(
        updatePreviewing(store.getState().previewPath, null, false, true)
      );
    }
  }

  public removeSuggestBox() {
    if (typeof this.container !== "undefined") {
      this.container.innerHTML = "";
    }
    const popupLayer: HTMLElement = document.getElementById(KF_POPUP_LAYER);
    if (popupLayer.contains(this.container)) {
      popupLayer.removeChild(this.container);
    }
    this.options = [];
    this.menuWidth = 0;
    this.suggestMenu = undefined;
  }

  public createKfOnPath(
    marksThisStep: string[],
    preKfInfo: IKeyframe,
    startKf: KfItem,
    transX: number
  ): [IKeyframe, KfItem] {
    const tmpKfInfo: IKeyframe = KfItem.createKfInfo(marksThisStep, {
      duration: preKfInfo.duration,
      allCurrentMarks: preKfInfo.allCurrentMarks,
      allGroupMarks: preKfInfo.allGroupMarks,
      isGhost: true,
    });
    KfItem.allKfInfo.set(tmpKfInfo.id, tmpKfInfo);
    let tmpKf: KfItem = new KfItem();
    const startX: number =
      jsTool.extractTransNums(
        startKf.container.getAttributeNS(null, "transform")
      ).x +
      transX -
      GROUP_PADDING;
    tmpKf.createItem(
      tmpKfInfo,
      startKf.parentObj.treeLevel + 1,
      startKf.parentObj,
      startX
    );
    startKf.parentObj.children.push(tmpKf);
    // tmpKf.idxInGroup = startKf.parentObj.children.length - 1;
    return [tmpKfInfo, tmpKf];
  }

  /**
   *
   * @param allSuggestedPaths
   * @param startKf
   * @param suggestOnFirstKf
   * @returns filtered paths that contains the unique next kf
   */
  public renderKfOnPathBeforeSelection(
    allSuggestedPaths: IPath[],
    startKf: KfItem,
    suggestOnFirstKf: boolean
  ): IPath[] {
    const marksEachStep: Map<number, string[]> =
      store.getState().activatePlusBtn.selectedMarksEachStep;
    let kfBeforeSuggestBox: KfItem = startKf;
    // let transX: number = 0;
    let transX: number = startKf.totalWidth; //!!!!dont know why comment this out
    let lastKf: KfItem;
    const startKfInfo: IKeyframe = KfItem.allKfInfo.get(startKf.id);
    let preKfInfo: IKeyframe = startKfInfo;
    let preKf: KfItem = startKf;
    let preStepIdx: number = -1;
    if (typeof marksEachStep !== "undefined") {
      const marksEachStepArr: [number, string[]][] = [...marksEachStep];
      const marksToAdd: string[] = [];

      for (let i = 0, len = marksEachStepArr.length; i < len; i++) {
        let stepIdx: number = marksEachStepArr[i][0];
        let marksThisStep: string[] = marksEachStepArr[i][1];
        marksToAdd.push(...marksThisStep);
        //render kfs in between
        if (stepIdx - preStepIdx - 1 > 0) {
          for (let j = preStepIdx + 1; j < stepIdx; j++) {
            let omittedMarksRecord: string[] = [];
            if (stepIdx - preStepIdx - 1 > 2) {
              if (j === stepIdx - 1) {
                //put omit
                const kfOmit: KfOmit = new KfOmit();
                const omitStartX: number =
                  jsTool.extractTransNums(
                    preKf.container.getAttributeNS(null, "transform")
                  ).x +
                  preKf.kfWidth +
                  transX;
                kfOmit.createOmit(
                  KfOmit.KF_OMIT,
                  omitStartX,
                  stepIdx - preStepIdx - 3,
                  startKf.parentObj,
                  false,
                  true,
                  startKf.kfHeight / 2
                );
                startKf.parentObj.children.push(kfOmit);
                startKf.parentObj.kfOmits.push(kfOmit);
                transX += kfOmit.totalWidth + 2 * KF_PADDING;
              } else if (j > preStepIdx + 1 && j < stepIdx - 1) {
                omittedMarksRecord = [
                  ...omittedMarksRecord,
                  ...allSuggestedPaths[0].kfMarks[j],
                ];
              }
            }

            //render kf
            const [tmpKfInfo, tmpKf] = this.createKfOnPath(
              [...allSuggestedPaths[0].kfMarks[j], ...omittedMarksRecord],
              preKfInfo,
              startKf,
              transX
            );
            lastKf = tmpKf;
            transX += tmpKf.totalWidth;
            kfBeforeSuggestBox = tmpKf;
            preKfInfo = tmpKfInfo;
            preKf = tmpKf;
          }
        }

        //render this kf
        const [tmpKfInfo, tmpKf] = this.createKfOnPath(
          marksThisStep,
          preKfInfo,
          startKf,
          transX
        );
        lastKf = tmpKf;
        transX += tmpKf.totalWidth;
        kfBeforeSuggestBox = tmpKf;
        preKfInfo = tmpKfInfo;
        preKf = tmpKf;

        //filter all paths
        let tmpAllPaths: IPath[] = [];
        allSuggestedPaths.forEach((p: IPath) => {
          if (jsTool.identicalArrays(p.kfMarks[stepIdx], marksThisStep)) {
            tmpAllPaths.push(p);
          }
        });
        allSuggestedPaths = tmpAllPaths;
        preStepIdx = stepIdx;
      }
      store.dispatchSystem(updateSelectMarks(marksToAdd));
    }
    const nextUniqueKfIdx: number = Suggest.findNextUniqueKf(
      allSuggestedPaths,
      preStepIdx
    );
    SuggestBox.preUniqueIdx = SuggestBox.currentUniqueIdx;
    SuggestBox.currentUniqueIdx = nextUniqueKfIdx;
    if (nextUniqueKfIdx === -1) {
    } else {
      //render kfs before
      for (let j = preStepIdx + 1; j < nextUniqueKfIdx; j++) {
        let omittedMarksRecord: string[] = [];
        if (nextUniqueKfIdx - preStepIdx - 1 > 2) {
          if (j === nextUniqueKfIdx - 1) {
            //put omit
            const kfOmit: KfOmit = new KfOmit();
            const omitStartX: number =
              jsTool.extractTransNums(
                preKf.container.getAttributeNS(null, "transform")
              ).x +
              preKf.kfWidth +
              transX;
            kfOmit.createOmit(
              KfOmit.KF_OMIT,
              omitStartX,
              nextUniqueKfIdx - preStepIdx - 3,
              startKf.parentObj,
              false,
              true,
              startKf.kfHeight / 2
            );
            startKf.parentObj.children.push(kfOmit);
            startKf.parentObj.kfOmits.push(kfOmit);
            transX += kfOmit.totalWidth + 2 * KF_PADDING;
          } else if (j > preStepIdx + 1 && j < nextUniqueKfIdx - 1) {
            omittedMarksRecord = [
              ...omittedMarksRecord,
              ...allSuggestedPaths[0].kfMarks[j],
            ];
          }
        }
        //render kf
        const [tmpKfInfo, tmpKf] = this.createKfOnPath(
          [...allSuggestedPaths[0].kfMarks[j], ...omittedMarksRecord],
          preKfInfo,
          startKf,
          transX
        );
        lastKf = tmpKf;
        transX += tmpKf.totalWidth;
        kfBeforeSuggestBox = tmpKf;
        preKfInfo = tmpKfInfo;
        preKf = tmpKf;
      }

      suggestBox.createSuggestBox(
        kfBeforeSuggestBox,
        allSuggestedPaths,
        nextUniqueKfIdx,
        suggestOnFirstKf
      );
      let transStartKf: KfItem =
        typeof lastKf === "undefined" ? startKf : lastKf;
      startKf.parentObj.translateGroup(
        transStartKf,
        suggestBox.boxWidth * store.getState().kfZoomLevel +
          suggestBox.menuWidth,
        false,
        false,
        false,
        {
          lastItem: false,
          extraWidth:
            suggestBox.boxWidth + SuggestBox.PADDING + suggestBox.menuWidth,
        }
      );

      //update the container slider
      const rootGroupBBox: DOMRect = document
        .getElementById(KF_FG_LAYER)
        .getBoundingClientRect();
      store.dispatchSystem(
        updateKfGroupSize({
          width: rootGroupBBox.width,
          height: rootGroupBBox.height,
        })
      );
    }
    return this.filterPathWithUniqueNextKf(allSuggestedPaths, nextUniqueKfIdx);
  }

  public resetProps() {
    this.lastUpdateSuggestionPathActionInfo = undefined;
    this.menuWidth = 0;
    this.preMenuWidth = 0;
  }
  /**
   * this is not filtering according to user selection
   * @param paths
   * @param uniqueKfIdx
   * @returns
   */
  public filterPathWithUniqueNextKf(
    paths: IPath[],
    uniqueKfIdx: number
  ): IPath[] {
    const result: IPath[] = [];
    if (uniqueKfIdx === -1) {
      result.push(paths[0]);
    } else {
      let uniqueKfRecorder: string[][] = []; //record unique kfs
      paths.forEach((path: IPath) => {
        const marksThisKf: string[] = path.kfMarks[uniqueKfIdx];
        if (!jsTool.Array2DItem(uniqueKfRecorder, marksThisKf)) {
          uniqueKfRecorder.push(marksThisKf);
          result.push(path);
        }
      });
    }
    return result;
  }

  public createOptionKfs(
    allCurrentPaths: IPath[],
    allCurrentMarks: string[],
    allGroupMarks: string[],
    suggestOnFirstKf: boolean
  ): void {
    // console.log('all paths right now: ', allCurrentPaths);
    this.options = [];
    let uniqueKfRecorder: string[][] = []; //record unique kfs
    allCurrentPaths.forEach((path: IPath) => {
      const marksThisKf: string[] = path.kfMarks[this.uniqueKfIdx];
      for (let i = 0, len = path.kfMarks.length; i < len; i++) {
        if (!jsTool.identicalArrays(path.kfMarks[i], marksThisKf)) {
          path.kfMarks[i].forEach((markId) => {
            // document.getElementById(markId).style.opacity = "0.3";
            document.getElementById(markId).setAttribute("opacity", "0.3");
          });
        } else {
          break;
        }
      }
      if (!jsTool.Array2DItem(uniqueKfRecorder, marksThisKf)) {
        uniqueKfRecorder.push(marksThisKf);
        let optionInfo: IOptionInfo = {
          kfIdx: this.uniqueKfIdx,
          attrs: path.attrComb,
          values: path.sortedAttrValueComb[this.uniqueKfIdx + 1].split(","),
          marks: marksThisKf,
          allCurrentMarks: allCurrentMarks,
          allGroupMarks: allGroupMarks,
          kfWidth: this.kfWidth,
          kfHeight: this.kfHeight,
          suggestOnFirstKf: suggestOnFirstKf,
          ordering: path.ordering,
        };

        let optionItem: OptionItem = new OptionItem();
        optionItem.createaItem(optionInfo);
        this.options.push(optionItem);
      }
    });
  }
}
export class SuggestMenu {
  static MENU_WIDTH: number = 20;
  static MENU_ICON_COLOR: string = "#e5e5e5";
  static MENU_ICON_HIGHLIGHT_COLOR: string = "#494949";
  static BTN_SIZE: number = 20;
  static PADDING: number = 2;
  static DOT_SIZE: number = 10;
  static UP_DIRECT: string = "up";
  static DOWN_DIRECT: string = "down";

  public container: SVGGElement;
  public numPages: number = 0;
  public pageIdx: number = 0;
  public dots: SVGCircleElement[] = [];

  public _highlightIdx: number = -1;

  set highlightIdx(idx: number) {
    if (this._highlightIdx >= 0) {
      this.dots[this._highlightIdx].classList.remove("highlight-btn");
      this.dots[this._highlightIdx].classList.add("normal-btn");
    }
    this.dots[idx].classList.add("highlight-btn");
    this.dots[idx].classList.remove("normal-btn");

    this._highlightIdx = idx;
  }
  get highlightIdx(): number {
    return this._highlightIdx;
  }

  constructor(startCoord: ICoord, numOptions: number, numShown: number) {
    this.numPages = Math.ceil(numOptions / numShown);
    const menuHeight: number =
      (SuggestMenu.BTN_SIZE + 2 * SuggestMenu.PADDING) * 2 +
      this.numPages * (SuggestMenu.DOT_SIZE + 2 * SuggestMenu.PADDING);
    this.container = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.container.classList.add(NON_SKETCH_CLS);
    this.container.setAttributeNS(
      null,
      "transform",
      `translate(${startCoord.x - SUGGEST_MENU_RX}, ${
        startCoord.y - menuHeight / 2
      })`
    );

    this.dots = [];
    for (let i = 0; i < this.numPages; i++) {
      const tmpDot: SVGCircleElement = this.createDot(i);
      this.container.appendChild(tmpDot);
      this.dots.push(tmpDot);
    }
  }

  public createDot(idx: number): SVGCircleElement {
    let dot: SVGCircleElement = <SVGCircleElement>createSvgElement({
      tag: "circle",
      para: {
        fill: SuggestMenu.MENU_ICON_COLOR,
        r: 0,
        // r: SuggestMenu.BTN_SIZE / 2 - 6,
        cx: SUGGEST_MENU_RX + SuggestMenu.BTN_SIZE / 2,
        cy:
          SuggestMenu.BTN_SIZE +
          SuggestMenu.PADDING * 3 +
          SuggestMenu.DOT_SIZE / 2 +
          (SuggestMenu.DOT_SIZE + 2 * SuggestMenu.PADDING) * idx,
      },
      flag: true,
    });


    return dot;
  }
}

export class OptionItem {
  static PADDING: number = 6;
  public container: SVGGElement;
  public optionKf: KfItem;
  public marksThisOption: string[];
  public createaItem(optionInfo: IOptionInfo) {
    this.container = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.container.classList.add("clickable-component");
    this.marksThisOption = optionInfo.marks;
    this.optionKf = new KfItem();
    this.optionKf.createOptionKfItem(
      optionInfo.allCurrentMarks,
      optionInfo.allGroupMarks,
      optionInfo.marks,
      optionInfo.kfWidth,
      optionInfo.kfHeight
    );
    const bg: SVGRectElement = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        class: "ease-fade hide-ele",
        width: this.optionKf.kfWidth + 3 * OptionItem.PADDING,
        height: this.optionKf.kfHeight + 2 * OptionItem.PADDING,
        rx: GROUP_RX,
        fill: "#b6b6b6",
      },
      flag: true,
    });
    this.container.appendChild(bg);
    this.container.appendChild(this.optionKf.container);
    this.container.onclick = () => {
      this.clickItem();
    };
  }

  public clickItem() {
    if (KfGroup.groupToInsert !== "") {
      if (typeof store.getState().previewPath === "undefined") {
        const spec: ICanisSpec = store.getState().suggestSpecs[0].spec;
        const path: IPath = store.getState().suggestSpecs[0].path;
        // store.dispatchSystem(updatePreviewing(path, spec, true, true));
      }
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
      store.dispatchSystem(updateActivatePlusBtn(currentActionInfo));
    }
  }

  /**
   *
   * @param index : index of this item in the shown items
   */
  public updateTrans(index: number) {
    this.container.setAttributeNS(
      null,
      "transform",
      `translate(0, ${
        index * (this.optionKf.kfHeight + 2 * OptionItem.PADDING)
      })`
    );
  }
}

export let suggestBox: SuggestBox = new SuggestBox();
