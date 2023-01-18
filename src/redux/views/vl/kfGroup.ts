import KfTrack from "./kfTrack";
import KfOmit from "./kfOmit";
import KfTimingIllus from "./kfTimingIllus";
import KfItem from "./kfItem";
import IntelliRefLine, { hintDrop } from "./intelliRefLine";
import "../../assets/style/vl/keyframeGroup.scss";
import { KfContainer } from "./kfContainer";
import { TimingSpec, Animation } from "canis_toolkit";
import PlusBtn from "./plusBtn";
import Util from "../../../app/core/util";
import { sortableSvgTable } from "../widgets/sortableSvgTable";
import { SuggestBox, suggestBox } from "./suggestBox";
import Suggest from "../../../app/core/suggest";
import { AniEffect } from "./AniEffect";
import {
  EFFECT_FADE,
  EFFECT_NULL,
  GROUP_BASIC_GRAY,
  GROUP_GRAY_STEP,
  GROUP_TITLE_HEIHGT,
  KF_BG_LAYER,
  KF_FG_LAYER,
  KF_POPUP_LAYER,
  KF_WIDTH,
  TRACK_HEIGHT,
} from "./vl-consts";
import { IOrderInfo } from "../../../util/markSelection";
import {
  IKeyframeGroup,
  IKeyframe,
  IPath,
  ICoord,
} from "../../global-interfaces";
import { store } from "../../store";
import { transNodeElements, updateTranslate } from "../../../util/tool";
import { createSvgElement } from "../../../util/svgManager";
import { jsTool } from "../../../util/jsTool";
import { updateHighlightKf } from "../../action/vlAction";
import {
  UPDATE_DELAY_BETWEEN_GROUP,
  UPDATE_DELAY_TIMING_REF_BETWEEN_GROUP,
  UPDATE_TIMEING_REF_BETWEEN_GROUP,
  REMOVE_DELAY_BETWEEN_GROUP,
  REMOVE_DELAY_UPDATE_TIMING_REF_GROUP,
  MERGE_GROUP,
  UPDATE_ANI_ALIGN_AFTER_ANI_WITH_DELAY,
  UPDATE_ANI_ALIGN_AFTER_ANI,
  UPDATE_ANI_ALIGN_AFTER_KF,
  UPDATE_ANI_ALIGN_WITH_ANI,
  UPDATE_ANI_ALIGN_WITH_KF,
} from "../../action/canisAction";
import { hintTag } from "./hint";
import SuggestAniFrame from "../panels/suggestAniFrame";
import { vlRenderer } from "../../renderers/vlRenderer";

export interface IGroupTitleItem {
  className: string;
  effectType?: string;
  aniId: string;
}

export const GROUP_RX: number = 8;
export const GROUP_PADDING: number = 0;
export default class KfGroup extends KfTimingIllus {
  static groupIdx: number = 0;
  static leafLevel: number = 0;
  //add
  static PADDING: number = 6;
  static TITLE_CHAR_WIDTH: number = 9;
  static TITLE_PADDING: number = 4;
  static TITLE_HEIHGT: number = 18;

  static BASIC_GRAY: number = 239;
  static GRAY_STEP: number = 20;

  static allActions: Map<string, any> = new Map(); //key: aniId, value: action
  static allAniGroups: Map<string, KfGroup> = new Map(); //key: aniId, value: kfgroup corresponds to animation
  static allKfGroups: Map<number, KfGroup> = new Map();
  static allKfGroupInsertIdxes: Map<number, number> = new Map();
  static allAniGroupInfo: Map<string, IKeyframeGroup> = new Map(); //key: aniId, value: kfg info
  static groupToInsert: string = ""; //aniId of the group to insert

  // public id: number;
  public aniId: string;
  public preAniId: string;
  public newTrack: boolean;
  public posiX: number;
  public posiY: number;
  public delay: number;
  public _title: IGroupTitleItem[] = [];
  public rendered: boolean = false;
  public targetTrackId: string;
  public idxInGroup: number = 0;
  public groupRef: string = "";
  public refValue: string = "";
  public childrenRef: string;
  public childrenRefValues: string[] = [];
  public timingRef: string = TimingSpec.timingRef.previousStart;
  public kfHasOffset: boolean = false; //for updating omits
  public kfHasDuration: boolean = false; //for updating omits
  public _totalWidth: number = 0;
  public marks: string[];
  public treeLevel: number;
  public alignTarget: string;
  public alignId: string;
  public alignType: string;
  public alignMerge: boolean = false;
  public isDragging: boolean = false;

  public groupBg: SVGRectElement;
  public groupMenu: AniEffect;
  public plusBtn: PlusBtn;
  public groupTitleWrapper: SVGGElement;
  public groupTitle: SVGGElement;
  public groupTitleBg: SVGRectElement;
  public groupTitleContent: SVGGElement;
  public groupSortBtn: SVGGElement;
  public children: (KfGroup | KfItem | KfOmit)[] = [];
  public kfNum: number = 0;
  public kfOmits: KfOmit[] = [];
  public parentObj: KfGroup | KfTrack;
  public alignLines: number[] = [];
  public _renderWhenZooming: boolean = true;
  public titleContents: AniEffect[] = [];

  set title(t: IGroupTitleItem[]) {
    this._title = t;
    this.createTitleContent();
  }

  get title(): IGroupTitleItem[] {
    return this._title;
  }

  set totalWidth(tw: number) {
    this._totalWidth = tw;
    if (typeof this.groupTitle !== "undefined") {
      this.updateGroupTitle();
    }
  }
  get totalWidth(): number {
    return this._totalWidth;
  }

  set offsetDiff(od: number) {
    this._offsetDiff = od;
    transNodeElements(this.container, od, true);
    this.translateWholeGroup(od);
  }
  get offsetDiff(): number {
    return this._offsetDiff;
  }

  set renderWhenZooming(rwz: boolean) {
    const changed: boolean = rwz !== this.renderWhenZooming;
    this._renderWhenZooming = rwz;
    if (changed) {
      this.showGroupWhenZooming();
    }
  }

  get renderWhenZooming(): boolean {
    return this._renderWhenZooming;
  }

  public static reset() {
    this.groupIdx = 0;
    this.leafLevel = 0;
  }

  // /**
  //  *
  //  * @param selectedCls select a group to insert
  //  */
  public static selectAvailableGroup(selectedCls: string[]) {
    KfGroup.allAniGroups.forEach((aniKfg: KfGroup, aniId: string) => {
      const lastKf: KfItem = aniKfg.fetchLastKf();
      const lastKfMarks = KfItem.allKfInfo.get(lastKf.id).marksThisKf;
      let mClassCount: Set<string> = new Set();
      lastKfMarks.forEach((mId: string) => {
        mClassCount.add(Animation.markClass.get(mId));
      });
      if (jsTool.arrayContained([...mClassCount], selectedCls)) {
        KfGroup.groupToInsert = aniId;
      }
    });
  }

  /**
   * check whether the given kfg contains the given kf
   */
  public static containKf(
    kfg: KfGroup,
    kfMarks: string[]
  ): { contained: boolean; targetKf: KfItem } {
    if (kfg.children.length > 0) {
      for (let i = 0, len = kfg.children.length; i < len; i++) {
        const c: KfItem | KfGroup | KfOmit = kfg.children[i];
        if (c instanceof KfItem) {
          if (jsTool.identicalArrays(c.kfInfo.marksThisKf, kfMarks)) {
            return {
              contained: true,
              targetKf: c,
            };
          }
        }
      }
      return {
        contained: false,
        targetKf: null,
      };
    }
  }

  public static insertKfAfterSelection(
    aniGroupToInsert: string,
    selectedMarks: string[],
    orderInfo: IOrderInfo,
    previousKfs: string[][]
  ) {
    let firstKfInfoInParent: IKeyframe = KfItem.allKfInfo.get(
      KfGroup.allAniGroups.get(aniGroupToInsert).fetchFirstKf().id
    );
    const targetKfgId: number = KfGroup.allAniGroups
      .get(aniGroupToInsert)
      .fetchFirstKfg();
    const targetKfg: KfGroup = KfGroup.allKfGroups.get(targetKfgId);
    const { contained, targetKf } = this.containKf(targetKfg, selectedMarks);
    const insertIdx: number =
      typeof KfGroup.allKfGroupInsertIdxes.get(targetKfgId) === "undefined"
        ? 0
        : KfGroup.allKfGroupInsertIdxes.get(targetKfgId);
    let tmpKf: KfItem = targetKf;
    if (!contained) {
      const tmpKfInfo: IKeyframe = KfItem.createKfInfo(selectedMarks, {
        duration: firstKfInfoInParent.duration,
        allCurrentMarks: firstKfInfoInParent.allCurrentMarks,
        allGroupMarks: firstKfInfoInParent.allGroupMarks,
        isGhost: true,
      });
      KfItem.allKfInfo.set(tmpKfInfo.id, tmpKfInfo);

      //insert kfgroup info
      store.getState().keyframeGroups.forEach((kfg: IKeyframeGroup) => {
        if (kfg.aniId === aniGroupToInsert) {
          if (kfg.children.length > 0) {
            kfg = kfg.children[0];
            while (true) {
              if (kfg.children.length > 0) {
                kfg = kfg.children[0];
              } else {
                kfg.keyframes.splice(insertIdx, 0, tmpKfInfo);
              }
            }
          } else {
            kfg.keyframes.splice(insertIdx, 0, tmpKfInfo);
          }
        }
      });
      let startX: number = GROUP_PADDING;
      targetKfg.children.forEach((child: KfItem | KfOmit) => {
        if (child.idxInGroup <= insertIdx - 1) {
          startX += child.totalWidth;
        }
      });
      tmpKf = new KfItem();
      tmpKf.createItem(tmpKfInfo, targetKfg.treeLevel + 1, targetKfg, startX);

      targetKfg.children.splice(insertIdx, 0, tmpKf);
      KfGroup.allKfGroups.set(targetKfgId, targetKfg);
    }
    const axis: string[] = [
      "axis-label",
      "Title",
      "legend-text",
      "legend-value",
      "title",
      "axis-tick",
      "axis-domain",
      "legend-symbol",
      "x-axis-label",
      "y-axis-label",
      "axis",
    ];
    let keylist: string = "";
    store.getState().selection.forEach((mId) => {
      if (Util.nonDataTable.has(mId)) {
        keylist = Util.nonDataTable.get(mId).mShape as string;
      }
    });
    const suggestContain: boolean = jsTool.suggestContain(Suggest.allPaths);
    const isValidPath: boolean =
      Suggest.allPaths.findIndex((p) =>
        selectedMarks.every((mid) => p.lastKfMarks.includes(mid))
      ) > -1;
    if (
      Suggest.allPaths.length > 0 &&
      axis.indexOf(keylist) == -1 &&
      !suggestContain &&
      isValidPath
    ) {
      //change
      const pathWithUniqueNextKfs: IPath[] =
        suggestBox.renderKfOnPathBeforeSelection(Suggest.allPaths, tmpKf, true);
      Suggest.generateSpecsFromSuggestion(
        targetKfg,
        selectedMarks,
        pathWithUniqueNextKfs
      );
      const nextUniqueKfIdx: number = Suggest.findNextUniqueKf(
        Suggest.allPaths,
        insertIdx
      );

      if (nextUniqueKfIdx >= 0) {
        const nextUniqueKfs: string[][] = Suggest.allPaths.map(
          (p: IPath) => p.kfMarks[nextUniqueKfIdx - 1]
        );
      } else {
        Suggest.pathToSpec(
          Suggest.allPaths[0],
          (<KfItem>targetKfg.children[0]).aniId,
          selectedMarks,
          (<KfItem>targetKfg.children[0]).parentObj.marksThisAni(),
          false
        );
      }
    } else {
      const suggestOnFirstKf: boolean = Suggest.generateSuggestionPath(
        selectedMarks,
        firstKfInfoInParent,
        KfGroup.allAniGroups.get(aniGroupToInsert),
        orderInfo
      );
      
      if (previousKfs.length > 0) {
        let count = 1;
        while (count < previousKfs.length) {
          SuggestBox.currentUniqueIdx = count - 1;
          Suggest.filterPathsWithSelection(
            SuggestBox.currentUniqueIdx,
            previousKfs[count]
          );
          count++;
        }
      }
      const pathWithUniqueNextKfs: IPath[] =
        suggestBox.renderKfOnPathBeforeSelection(
          Suggest.allPaths,
          tmpKf,
          suggestOnFirstKf
        );
      Suggest.generateSpecsFromSuggestion(
        targetKfg,
        selectedMarks,
        pathWithUniqueNextKfs
      );
      const nextUniqueKfIdx: number = Suggest.findNextUniqueKf(
        Suggest.allPaths,
        previousKfs.length > 0 ? previousKfs.length - 1 : insertIdx
      );
      if (nextUniqueKfIdx >= 0) {
        const nextUniqueKfs: string[][] = Suggest.allPaths.map(
          (p: IPath) => p.kfMarks[nextUniqueKfIdx - 1]
        );
      } else {
        Suggest.pathToSpec(
          Suggest.allPaths[0],
          (<KfItem>targetKfg.children[0]).aniId,
          selectedMarks,
          (<KfItem>targetKfg.children[0]).parentObj.marksThisAni(),
          false
        );
      }
    }
  }

  constructor() {
    super();

    const that = this;

    this.children.push = function () {
      Array.prototype.push.apply(this, arguments);
      const child: KfGroup | KfItem | KfOmit = arguments[0];
      child instanceof KfGroup &&
        that.insertChildKfGroup(child, that.children.length - 1);
      child instanceof KfOmit &&
        that.insertChildKfOmit(child, that.children.length - 1);
      child instanceof KfItem &&
        that.insertChildKfItem(child, that.children.length - 1);
      return 0;
    };
    this.children.splice = function () {
      const result: (KfGroup | KfItem | KfOmit)[] =
        Array.prototype.splice.apply(this, arguments);
      const currentInsertIdx: number = KfGroup.allKfGroupInsertIdxes.get(
        that.id
      );
      KfGroup.allKfGroupInsertIdxes.set(
        that.id,
        typeof currentInsertIdx === "undefined" ? 1 : currentInsertIdx + 1
      );
      const child: KfGroup | KfItem | KfOmit = arguments[2];
      const insertIdx: number = arguments[0];
      this.forEach((c: KfGroup | KfItem | KfOmit) => {
        c.idxInGroup >= insertIdx && c.idxInGroup++;
      });
      child instanceof KfGroup && that.insertChildKfGroup(child, insertIdx);
      child instanceof KfOmit && that.insertChildKfOmit(child, insertIdx);
      child instanceof KfItem && that.insertChildKfItem(child, insertIdx);
      return result;
    };
    this.children.unshift = function () {
      const result: number = Array.prototype.unshift.apply(this, arguments);
      const child: KfGroup | KfItem | KfOmit = arguments[0];
      this.forEach((c: KfGroup | KfItem | KfOmit) => {
        c.idxInGroup++;
      });
      child instanceof KfGroup && that.insertChildKfGroup(child, 0);
      child instanceof KfOmit && that.insertChildKfOmit(child, 0);
      child instanceof KfItem && that.insertChildKfItem(child, 0);
      return result;
    };
  }

  private insertChildKfGroup(child: KfGroup, index: number): void {
    this.container.appendChild(child.container);
    child.idxInGroup = index;
    this.kfNum += child.kfNum;

    if (this.children.length > 1) {
      const preChild: KfGroup | KfOmit = <KfGroup | KfOmit>(
        this.children[index - 1]
      );
      const preChildTransX: number = jsTool.extractTransNums(
        preChild.container.getAttributeNS(null, "transform")
      ).x;

      if (preChild instanceof KfGroup) {
        child.translateWholeGroup(preChildTransX + preChild.totalWidth, true);
      } else if (preChild instanceof KfOmit) {
        child.translateWholeGroup(
          preChildTransX + preChild.totalWidth + KfOmit.PADDING,
          true
        );
      }
    }
    this.updateTotalWidth();
  }

  private insertChildKfOmit(child: KfOmit, index: number): void {
    child.idxInGroup = index;
    this.kfOmits.push(child);
    this.updateTotalWidth();
    this.translateGroup(child, child.totalWidth, true, false, false);
  }

  private insertChildKfItem(child: KfItem, index: number): void {
    child.idxInGroup = index;
    if (child.rendered) {
      this.updateTotalWidth();
      this.translateGroup(child, child.totalWidth, true, false, false);
    }
  }

  public updateTotalWidth() {
    let currentTotalWidth: number = 0;
    this.children.forEach((c: KfGroup | KfItem | KfOmit) => {
      currentTotalWidth += c.totalWidth;
      if (c instanceof KfOmit) {
        currentTotalWidth += 2 * KfOmit.PADDING;
      }
    });
    this.totalWidth = currentTotalWidth;
    if (this.parentObj instanceof KfGroup) {
      this.parentObj.updateTotalWidth();
    }
  }

  private updateGroupTitle() {
    const groupTitleWidth: number = this.totalWidth - this.offsetWidth;
    this.groupTitleBg.setAttributeNS(null, "width", `${groupTitleWidth}`);
    //translate group title
    if (typeof this.groupTitleContent !== "undefined") {
      const w: number = this.groupTitleContent.getBoundingClientRect().width;
      this.groupTitleContent.setAttributeNS(
        null,
        "transform",
        `translate(${(groupTitleWidth - w) / 2}, ${
          (GROUP_TITLE_HEIHGT - AniEffect.BTN_SIZE) / 2
        })`
      );
    }
  }

  private createTitleContent() {
    const totalAvailableWidth: number =
      this.totalWidth === 0 ? KF_WIDTH : this.totalWidth;
    let availableWidth: number =
      (totalAvailableWidth - (this.title.length - 1) * AniEffect.MARGIN) /
      this.title.length;
    availableWidth =
      availableWidth > AniEffect.MAX_ITEM_WIDTH
        ? AniEffect.MAX_ITEM_WIDTH
        : availableWidth;
    this.titleContents = [];
    this.title.forEach((titleItem: IGroupTitleItem, idx: number) => {
      if (typeof this.groupTitleContent === "undefined") {
        this.groupTitleContent = <SVGGElement>createSvgElement({
          tag: "g",
          para: {
            transform: `translate(0, ${
              (GROUP_TITLE_HEIHGT - AniEffect.BTN_SIZE) / 2
            })`,
          },
          flag: true,
        });
      }
      this.groupTitleContent.appendChild(
        this.createTitleContentItem(
          titleItem,
          idx * availableWidth,
          availableWidth
        )
      );
    });
  }

  private createTitleContentItem(
    titleItem: IGroupTitleItem,
    startX: number,
    availableWidth: number
  ): SVGGElement {
    const effectType: string =
      this.treeLevel === 0
        ? titleItem.effectType && typeof titleItem.effectType !== "undefined"
          ? titleItem.effectType
          : EFFECT_FADE
        : EFFECT_NULL;
    const markEffectItem: AniEffect = new AniEffect(
      effectType,
      titleItem.className,
      titleItem.aniId,
      startX,
      availableWidth
    );
    this.titleContents.push(markEffectItem);
    return markEffectItem.container;
  }

  public updateGroupPosiAndSize(
    lastGroupStart: number,
    lastGroupWidth: number,
    lastGroup: boolean,
    rootGroup: boolean = false
  ): void {
    if (this.children) {
      if (this.children[0] instanceof KfGroup) {
        //children are kfgroups
        this.children.forEach((c: KfGroup, i: number) => {
          if (i === 0 || i === 1 || i === this.children.length - 1) {
            if (i === 0) {
              (<KfGroup>this.children[i]).updateGroupPosiAndSize(
                KfGroup.PADDING + this.offsetWidth,
                0,
                false
              );
            } else {
              if (this.children.length > 3 && i === this.children.length - 1) {
                (<KfGroup>this.children[i]).updateGroupPosiAndSize(
                  (<KfGroup>this.children[1]).posiX,
                  (<KfGroup>this.children[1]).totalWidth +
                    this.kfOmits[0].totalWidth,
                  true
                );
              } else {
                (<KfGroup>this.children[i]).updateGroupPosiAndSize(
                  (<KfGroup>this.children[i - 1]).posiX,
                  (<KfGroup>this.children[i - 1]).totalWidth,
                  false
                );
              }
            }
          } else if (
            this.children.length > 3 &&
            i === this.children.length - 2
          ) {
            this.kfOmits.forEach((kfO: KfOmit) => {
              kfO.updateThumbnail(this.kfHasOffset, this.kfHasDuration);
              // kfO.updateNum(this.kfNum - 3);
              kfO.updateTrans(
                (<KfGroup>this.children[1]).posiX +
                  (<KfGroup>this.children[1]).totalWidth,
                KfGroup.PADDING +
                  (<KfGroup>this.children[1]).posiY +
                  this.children[1].container.getBoundingClientRect().height /
                    store.getState().kfZoomLevel /
                    2
              ); //fixed
            });
          }
          if (c instanceof KfGroup) {
            this.alignLines = [...this.alignLines, ...c.alignLines];
          }
        });
      }

      //update size
      const oriW: number = this.totalWidth;
      let [diffX, currentGroupWidth, gHeight] = this.updateSize();

      //update position
      const transPosiY = rootGroup
        ? this.posiY + 1
        : this.posiY + KfGroup.PADDING;
      if (this.newTrack) {
        this.translateContainer(lastGroupStart + diffX, transPosiY);
        this.posiX = lastGroupStart + this.offsetWidth;
        this.totalWidth =
          currentGroupWidth > lastGroupWidth
            ? currentGroupWidth
            : lastGroupWidth;
      } else {
        this.translateContainer(
          lastGroupStart + lastGroupWidth + diffX,
          transPosiY
        );
        this.posiX = lastGroupStart + lastGroupWidth;
        this.totalWidth = currentGroupWidth;
      }

      //check whther need to update the available insert of kftrack
      if (
        this.parentObj instanceof KfTrack &&
        typeof this.alignTarget !== "undefined" &&
        !this.alignMerge
      ) {
        this.updateParentTrackInsert();
      }

      //update background color
      const grayColor: number =
        KfGroup.BASIC_GRAY -
        KfGroup.GRAY_STEP * (KfGroup.leafLevel - this.treeLevel);
      if (this.alignMerge) {
        const alignWithGroup: KfGroup = this.fetchAlignWithGroup();
        const alignWithGroupBBox: DOMRect =
          alignWithGroup.container.getBoundingClientRect();
        const currentBBox: DOMRect = this.container.getBoundingClientRect();
        const diffW: number = currentBBox.right - alignWithGroupBBox.right;
        if (diffW > 0) {
          alignWithGroup.extendSize(diffW);
        }
      }
    }
  }

  public addEasingTransform() {
    this.groupTitle.classList.add("ease-transform");
  }
  public removeEasingTransform() {
    this.groupTitle.classList.remove("ease-transform");
  }

  /**
   * @param g : container of this group, could be track or another group
   * @param p : init position of the root group
   */
  public createGroup(
    kfg: IKeyframeGroup,
    previousAniId: string,
    parentObj: KfGroup | KfTrack,
    posiY: number,
    treeLevel: number,
    targetTrackId: string
  ): void {
    this.id = kfg.id;
    KfGroup.allKfGroups.set(this.id, this);
    this.aniId = kfg.aniId;
    this.preAniId = previousAniId;
    this.marks = kfg.marks;
    this.groupRef = kfg.groupRef;
    this.timingRef = kfg.timingRef;
    this.targetTrackId = targetTrackId;
    this.newTrack = kfg.newTrack;
    this.treeLevel = treeLevel;
    this.posiY = posiY;
    this.hasOffset = kfg.delayIcon;
    this.parentObj = parentObj;
    this.delay = kfg.delay;
    this.alignId = kfg.alignId;
    this.alignTarget = kfg.alignTarget;
    this.alignType = kfg.alignType;
    if (typeof kfg.merge !== "undefined") {
      this.alignMerge = kfg.merge;
    }
    if (typeof kfg.refValue === "undefined") {
      let classRecorder: Map<string, string> = new Map();
      this.marks.forEach((m: string) => {
        let className: string = Animation.markClass.get(m);
        let effectType: string = Animation.allMarkAni.get(m).actionAttrs[0].oriActionType;
        
        if (className.indexOf("axis") >= 0) {
          className = "axis";
        } else if (className.indexOf("legend") >= 0) {
          className = "legend";
        }
        classRecorder.set(className, effectType);
      });
      this.title = Array.from(classRecorder).map(([className, effectType]) => {
        return {
          className: className,
          effectType: effectType,
          aniId: kfg.aniId,
        };
      });
    } else {
      this.refValue = kfg.refValue;
      this.title = kfg.refValue.split(",").map((cn: string) => {
        return { className: cn, aniId: kfg.aniId };
      });
    }

    if (kfg.keyframes.length > 0) {
      this.childrenRef = kfg.keyframes[0].groupRef;
      this.childrenRefValues = kfg.keyframes.map((k: IKeyframe) => k.refValue);
    } else {
      if (kfg.children.length > 0) {
        this.childrenRef = kfg.children[0].groupRef;
        this.childrenRefValues = kfg.children.map(
          (c: IKeyframeGroup) => c.refValue
        );
      }
    }

    if (typeof parentObj.container !== "undefined") {
      this.rendered = true;
      this.renderGroup();
    }
  }

  public createBlankKfg(
    parentObj: KfTrack,
    targetGroupAniId: string,
    startX: number
  ): void {
    this.parentObj = parentObj;
    this.aniId = targetGroupAniId;
    this.treeLevel = 0;
    this.container = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.posiY = 2;
    this.preAniId = "";
    this.parentObj.children.push(this);
    this.groupBg = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        stroke: "#898989",
        fill: `rgba(0,0,0,0)`,
        strokeWidth: "1",
        rx: `${GROUP_RX}`,
        x: "0",
      },
      flag: true,
    });
    this.container.appendChild(this.groupBg);
    // this.parentObj.container.appendChild(this.container);
  }

  public restorePlusBtn() {
    if (typeof this.plusBtn !== "undefined") {
      this.plusBtn.restoreBtn();
    }
  }

  public renderGroup() {
    this.container = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.container.setAttributeNS(null, "id", `group${this.id}`);
    if (this.treeLevel > 0) {
      this.translateContainer(0, GROUP_TITLE_HEIHGT);
      // this.translateContainer(0, 0)
    }
    const pd = false;
    let ifTitle: boolean = true;
    if (this.parentObj instanceof KfTrack) {
      this.posiY = 0;
      if (
        typeof this.alignTarget !== "undefined" &&
        this.alignType === Animation.alignTarget.withEle
      ) {
        //find the aligned group
        const alignWithGroup: KfGroup = this.fetchAlignWithGroup();

        if (this.alignMerge) {
          //align to the lowest group

          const lowestGroupBBox: DOMRect = alignWithGroup
            .fetchFirstKf()
            .parentObj.container.getBoundingClientRect(); //fixed
          let transY: number =
            (this.parentObj.container.getBoundingClientRect().top -
              lowestGroupBBox.top) /
            store.getState().kfZoomLevel;

          this.posiY = this.posiY - transY + GROUP_TITLE_HEIHGT;
          ifTitle = false;
        } else {
          //translate the omit in alignWith group (on the lowest level, like OS example)
          this.posiY = this.posiY - 2;
          const lowestBranches: KfGroup[] = [];
          alignWithGroup.fetchLowestSubBranch(lowestBranches);
          const heightDiff: number =
            this.parentObj.trackPosiY -
            KfTrack.allTracks.get(alignWithGroup.targetTrackId).trackPosiY +
            TRACK_HEIGHT -
            GROUP_TITLE_HEIHGT;
          lowestBranches.forEach((lowestGroupInAlignWith: KfGroup) => {
            if (lowestGroupInAlignWith.rendered) {
              lowestGroupInAlignWith.kfOmits.forEach((omit: KfOmit) => {
                const oriTrans: ICoord = jsTool.extractTransNums(
                  omit.container.getAttributeNS(null, "transform")
                );
                omit.updateTrans(oriTrans.x + GROUP_PADDING, heightDiff / 8);
                // omit.createUseTag();
              });
            }
          });
        }
      }
      this.parentObj.children.push(this);

      if (this.alignMerge) {
        //align to the lowest group
        let preBarId: string = this.preAniId;
        for (let value of KfGroup.allAniGroups) {
          if (this.aniId != value[0]) {
            if (value[1].alignType != "element") {
              preBarId = value[1].aniId;
            }
          } else {
            break;
          }
        }
        KfGroup.allAniGroups.get(preBarId).title = [
          ...KfGroup.allAniGroups.get(preBarId).title,
          ...this.title,
        ];
        KfGroup.allAniGroups.get(preBarId).createGroupTitle();
      }
    }

    this.drawGroupOffset();
    this.drawGroupBg();
    if (ifTitle) {
      this.createGroupTitle();
    }

    this.container.onmouseleave = (leaveEvt: any) => {
      // this.unbindGroupTitleDrag();
      let flag: boolean = !this.isDragging;
      if (typeof sortableSvgTable.container !== "undefined") {
        flag = flag && !sortableSvgTable.container.contains(leaveEvt.toElement);
      }
      if (flag) {
        //this is the original element the event handler was assigned to
        var e = leaveEvt.relatedTarget;

        while (e != null) {
          if (e == this.container) {
            return;
          }
          e = (<HTMLElement>e).parentNode;
        }
      }
    };
  }

  public updateParentKfHasTiming(
    hasOffset: boolean,
    hasDuration: boolean
  ): void {
    this.kfHasOffset = hasOffset;
    this.kfHasDuration = hasDuration;
    if (this.parentObj instanceof KfGroup) {
      if (
        this.parentObj.kfHasOffset !== hasOffset ||
        this.parentObj.kfHasDuration !== hasDuration
      ) {
        this.parentObj.updateParentKfHasTiming(hasOffset, hasDuration);
      }
    }
  }

  public addGroupToPopLayerWhenDrag(): KfGroup[] {
    this.container.setAttributeNS(
      null,
      "_transform",
      this.container.getAttributeNS(null, "transform")
    );
    const containerBBox: DOMRect = this.container.getBoundingClientRect(); //fixed
    this.parentObj.container.removeChild(this.container);
    const popKfContainer: HTMLElement = document.getElementById(KF_POPUP_LAYER);
    const popKfContainerBbox: DOMRect = document
      .getElementById(KF_FG_LAYER)
      .getBoundingClientRect(); //fixed
    popKfContainer.appendChild(this.container);
    //set new transform
    this.translateContainer(
      (containerBBox.left - popKfContainerBbox.left) /
        store.getState().kfZoomLevel,
      GROUP_TITLE_HEIHGT +
        (containerBBox.top - popKfContainerBbox.top) /
          store.getState().kfZoomLevel
    );
    //check whether there are aligned kf groups
    const groupsAligned: KfGroup[] = [];
    if (typeof this.alignId !== "undefined") {
      KfGroup.allAniGroups.forEach((aniGroup: KfGroup, tmpAniId: string) => {
        if (
          tmpAniId !== this.aniId &&
          aniGroup.alignTarget === this.alignId &&
          aniGroup.alignType === Animation.alignTarget.withEle
        ) {
          groupsAligned.push(aniGroup);
          aniGroup.container.setAttributeNS(
            null,
            "_transform",
            aniGroup.container.getAttributeNS(null, "transform")
          );
          const tmpContainerBBox: DOMRect =
            aniGroup.container.getBoundingClientRect(); //fixed
          aniGroup.parentObj.container.removeChild(aniGroup.container);
          popKfContainer.appendChild(aniGroup.container);
          aniGroup.translateContainer(
            (tmpContainerBBox.left - popKfContainerBbox.left) /
              store.getState().kfZoomLevel,
            (tmpContainerBBox.top - popKfContainerBbox.top) /
              store.getState().kfZoomLevel
          );
        }
      });
    }
    return groupsAligned;
  }

  public reinsertGroupToItsParent(alignedGroups: KfGroup[]): void {
    [this, ...alignedGroups].forEach((tmpKfGroup: KfGroup) => {
      tmpKfGroup.container.setAttributeNS(
        null,
        "transform",
        tmpKfGroup.container.getAttributeNS(null, "_transform")
      );
      tmpKfGroup.parentObj.container.appendChild(tmpKfGroup.container);
    });
    this.kfOmits.forEach((omit: KfOmit) => {
      if (typeof omit.useTag !== "undefined") {
        omit.updateUseTagPosi();
      }
    });
  }

  public bindGroupTitleClick() {
    const that = this;
    this.groupTitle.onpointerdown = (pointEvt) => {
      //highlight kf
      pointEvt.preventDefault();
      pointEvt.stopPropagation();
      const endKf: KfItem = that.findLastKf();
      store.dispatch(updateHighlightKf(endKf));
    };
    this.groupTitle.onpointerup = (PointEvt) => {
      this.unbindGroupTitleClick();
    };
  }

  public bindGroupTitleDrag() {
    this.groupTitle.onpointerdown = (touchEvt: any) => {
      if (touchEvt.pointerType === "touch") {
        touchEvt.stopPropagation();
        touchEvt.preventDefault();
        this.isDragging = true;
        KfContainer.showPopCover();
        let oriMousePosiRecord: ICoord = {
          x: touchEvt.pageX,
          y: touchEvt.pageY,
        };
        let oriMousePosi: ICoord = { x: touchEvt.pageX, y: touchEvt.pageY };
        const groupsAligned: KfGroup[] = this.addGroupToPopLayerWhenDrag();
        let canTitleDrag: boolean = true;
        let updateSpec: boolean = false;
        let actionType: string = "";
        let actionInfo: any = {};
        const preSibling: KfGroup = <KfGroup>(
          this.parentObj.children[this.idxInGroup - 1]
        );
        //if dragging ani group, create hint lines
        let hintLines: IntelliRefLine[] = [];
        if (this.groupRef === "root") {
          hintLines = IntelliRefLine.hintAniPosis(this);
        }

        const bindTarget = document.getElementById("panel1");
        const releaseTarget = document;

        const onpointermove = (moveEvt: any) => {
          moveEvt.preventDefault();
          moveEvt.stopPropagation();

          const currentMousePosi: ICoord = {
            x: moveEvt.pageX,
            y: moveEvt.pageY,
          };
          const posiDiff: ICoord = {
            x:
              (currentMousePosi.x - oriMousePosi.x) /
              store.getState().kfZoomLevel,
            y:
              (currentMousePosi.y - oriMousePosi.y) /
              store.getState().kfZoomLevel,
          };
          const posiDiffToOri: ICoord = {
            x:
              (currentMousePosi.x - oriMousePosiRecord.x) /
              store.getState().kfZoomLevel,
            y:
              (currentMousePosi.y - oriMousePosiRecord.y) /
              store.getState().kfZoomLevel,
          };
          const oriTrans: ICoord = jsTool.extractTransNums(
            this.container.getAttributeNS(null, "transform")
          );
          this.translateContainer(
            oriTrans.x + posiDiff.x,
            oriTrans.y + posiDiff.y
          );
          groupsAligned.forEach((alignedGroup: KfGroup) => {
            const tmpOriTrans: ICoord = jsTool.extractTransNums(
              alignedGroup.container.getAttributeNS(null, "transform")
            );
            alignedGroup.translateContainer(
              tmpOriTrans.x + posiDiff.x,
              tmpOriTrans.y + posiDiff.y
            );
          });
          if (
            this.idxInGroup > 0 &&
            preSibling.rendered &&
            this.groupRef !== "root"
          ) {
            //group within animation
            [updateSpec, actionType, actionInfo] =
              this.dragInnerGroup(preSibling);
          } else {
            [updateSpec, actionType, actionInfo] =
              this.dragAniGroup(posiDiffToOri);
          }
          oriMousePosi = currentMousePosi;
          // }
        };

        const onpointerup = (touchEvt: any) => {
          touchEvt.preventDefault();
          document.onmousemove = null;
          document.onmouseup = null;
          KfContainer.hidePopCover();
          this.isDragging = false;
          if (!updateSpec) {
            hintLines.forEach((hl: IntelliRefLine) => {
              hl.removeHintLine();
            });
            this.reinsertGroupToItsParent(groupsAligned);
          } else {
            store.dispatch({
              type: actionType,
              payload: {
                infoObj: actionInfo,
              },
            });
          }
          document.getElementById(KF_POPUP_LAYER).innerHTML = "";
          bindTarget.removeEventListener("pointermove", onpointermove);
          releaseTarget.removeEventListener("pointerup", onpointerup);
        };

        bindTarget.addEventListener("pointermove", onpointermove);
        releaseTarget.addEventListener("pointerup", onpointerup);
      }
    };
  }
  public unbindGroupTitleDrag() {}

  public unbindGroupTitleClick() {
    this.groupTitle.onpointerdown = null;
  }

  public createGroupTitle(): void {
    const grayColor: number =
      GROUP_BASIC_GRAY + GROUP_GRAY_STEP * this.treeLevel;
    this.groupTitleWrapper = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        transform: `translate(${
          this.alignMerge ? this.offsetWidth + GROUP_PADDING : this.offsetWidth
        }, ${-GROUP_TITLE_HEIHGT})`,
      },
      flag: true,
    });
    this.groupTitle = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        class: "kf-group-title ease-transform draggable-component",
        transform: "translate(0, 0)",
      },
      flag: true,
    });
    this.groupTitleBg = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        width: "200",
        height: `${GROUP_TITLE_HEIHGT + 2 * GROUP_PADDING}`,
        fill: `rgb(${grayColor},${grayColor},${grayColor})`,
        stroke: "#fff",
        strokeWidth: "1px",
        rx: `${GROUP_TITLE_HEIHGT / 2}`,
      },
      flag: true,
    });
    this.groupTitle.appendChild(this.groupTitleBg);
    if (typeof this.groupTitleContent === "undefined") {
      this.groupTitleContent = <SVGGElement>createSvgElement({
        tag: "g",
        para: {
          transform: `translate(0, ${
            (GROUP_TITLE_HEIHGT - AniEffect.BTN_SIZE) / 2
          })`,
        },
        flag: true,
      });
    }
    this.groupTitle.appendChild(this.groupTitleContent);
    this.bindGroupTitleDrag();
    this.groupTitleWrapper.appendChild(this.groupTitle);
    this.container.appendChild(this.groupTitleWrapper);
  }

  public drawGroupOffset(): void {
    if (this.hasOffset) {
      this.drawOffset(this.delay, 100, GROUP_RX);
      this.container.appendChild(this.offsetIllus);
    }
  }

  /**
   * draw group bg as well as title
   */
  public drawGroupBg(): void {
    this.groupBg = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        fill: "rgba(0,0,0,0)",
        x: `${this.offsetWidth}`,
      },
      flag: true,
    });
    this.container.appendChild(this.groupBg);
  }


  /**
   * returns: updateSpec:boolean, actionType: string, actionInfo: any
   */
  public dragAniGroup(posiDiffToOri: ICoord): [boolean, string, any] {
    const currentAniId: string = this.aniId;
    const sepCurrentAniMarks: { dataMarks: string[]; nonDataMarks: string[] } =
      Util.separateDataAndNonDataMarks(
        KfGroup.allAniGroupInfo.get(currentAniId).marks
      );
    const currentGBBox: DOMRect = this.groupBg.getBoundingClientRect(); //fixed
    const currentGPosi: ICoord = { x: currentGBBox.left, y: currentGBBox.top };
    let targetAni: {
      targetAniId: string;
      currentAniId: string;
      actionType: string;
    };
    for (let i = 0, len = [...KfGroup.allAniGroups].length; i < len; i++) {
      const aniGroup: KfGroup = [...KfGroup.allAniGroups][i][1];
      if (this.id !== aniGroup.id) {
        const firstKf: KfItem = aniGroup.fetchFirstKf();
        const alignTargetGroup: boolean =
          typeof KfItem.allKfInfo.get(firstKf.id).alignTo === "undefined";
        //judge the relative position between this one and aniGroup & the first Kf in aniGroup
        const aniGroupBBox: DOMRect = aniGroup.groupBg.getBoundingClientRect(); //fixed
        const firstKfBBox: DOMRect = firstKf.container.getBoundingClientRect(); //fixed
        const targetAniId: string = aniGroup.aniId;
        const sepTargetAniMarks: {
          dataMarks: string[];
          nonDataMarks: string[];
        } = Util.separateDataAndNonDataMarks(
          KfGroup.allAniGroupInfo.get(targetAniId).marks
        );
        //add orange lines according to drag position
        if (
          typeof this.delay !== "undefined" &&
          this.delay > 0 &&
          posiDiffToOri.x < 0
        ) {
          this.hideOffset();
          targetAni = {
            targetAniId: targetAniId,
            currentAniId: currentAniId,
            actionType: UPDATE_ANI_ALIGN_AFTER_ANI,
          }; //after group has higher priority
        } else if (
          typeof this.delay !== "undefined" &&
          this.delay > 0 &&
          posiDiffToOri.x >= 0
        ) {
          this.showOffset();
        }
        if (
          currentGPosi.x >= aniGroupBBox.right &&
          currentGPosi.x <=
            aniGroupBBox.right + 6 * store.getState().kfZoomLevel &&
          currentGPosi.y >= aniGroupBBox.top
        ) {
          targetAni = {
            targetAniId: targetAniId,
            currentAniId: currentAniId,
            actionType: UPDATE_ANI_ALIGN_AFTER_ANI_WITH_DELAY,
          }; //after group has higher priority
          hintDrop.hintInsert(
            { x: aniGroupBBox.right, y: aniGroupBBox.top },
            aniGroupBBox.height / store.getState().kfZoomLevel,
            true,
            true
          );
          break;
        } else {
          if (
            currentGPosi.x >= aniGroupBBox.left &&
            currentGPosi.x <
              aniGroupBBox.left + 6 * store.getState().kfZoomLevel &&
            currentGPosi.y >= aniGroupBBox.top
          ) {
            targetAni = {
              targetAniId: targetAniId,
              currentAniId: currentAniId,
              actionType: UPDATE_ANI_ALIGN_WITH_ANI,
            };
            hintDrop.hintInsert(
              { x: aniGroupBBox.left, y: aniGroupBBox.top },
              aniGroupBBox.height / store.getState().kfZoomLevel,
              true,
              true
            );
          } else if (
            currentGPosi.x >= firstKfBBox.left &&
            currentGPosi.x <
              firstKfBBox.left + 30 * store.getState().kfZoomLevel &&
            alignTargetGroup
          ) {
            targetAni = {
              targetAniId: targetAniId,
              currentAniId: currentAniId,
              actionType:
                sepCurrentAniMarks.nonDataMarks.length > 0 ||
                sepTargetAniMarks.nonDataMarks.length > 0
                  ? UPDATE_ANI_ALIGN_WITH_ANI
                  : UPDATE_ANI_ALIGN_WITH_KF,
            };
            hintDrop.hintAlign(
              { x: firstKfBBox.left, y: firstKfBBox.top },
              firstKfBBox.height / store.getState().kfZoomLevel,
              true
            );
          } else if (
            currentGPosi.x >= firstKfBBox.right &&
            currentGPosi.x <
              firstKfBBox.right + 30 * store.getState().kfZoomLevel &&
            alignTargetGroup
          ) {
            targetAni = {
              targetAniId: targetAniId,
              currentAniId: currentAniId,
              actionType:
                sepCurrentAniMarks.nonDataMarks.length > 0 ||
                sepTargetAniMarks.nonDataMarks.length > 0
                  ? UPDATE_ANI_ALIGN_AFTER_ANI_WITH_DELAY
                  : UPDATE_ANI_ALIGN_AFTER_KF,
            };
            hintDrop.hintAlign(
              { x: firstKfBBox.right, y: firstKfBBox.top },
              firstKfBBox.height / store.getState().kfZoomLevel,
              true
            );
          }
        }
      }
    }
    if (typeof targetAni === "undefined") {
      hintDrop.removeHintLine();
      return [false, "", {}];
    } else {
      //triger action
      return [
        true,
        targetAni.actionType,
        {
          targetAniId: targetAni.targetAniId,
          currentAniId: targetAni.currentAniId,
        },
      ];
    }
  }

  public dragInnerGroup(preSibling: KfGroup): [boolean, string, any] {
    let updateSpec: boolean = false;
    let actionType: string = "";
    let actionInfo: any = {};
    const currentGroupBBox: DOMRect = this.groupBg.getBoundingClientRect(); //fixed
    const preGroupBBox: DOMRect = preSibling.groupBg.getBoundingClientRect(); //fixed
    const posiYDiff: number = currentGroupBBox.top - preGroupBBox.top;
    const posiXRightDiff: number =
      (currentGroupBBox.left - preGroupBBox.right) /
      store.getState().kfZoomLevel;
    const posiXLeftDiff: number =
      (currentGroupBBox.left - preGroupBBox.left) /
      store.getState().kfZoomLevel;
    const currentKfOffsetW: number =
      KfGroup.BASIC_OFFSET_DURATION_W > this.offsetWidth
        ? KfGroup.BASIC_OFFSET_DURATION_W
        : this.offsetWidth;
    let correctTimingRef: boolean = true;
    let compareXDiff: number = posiXRightDiff;
    let updateTimingRef: string = "";
    if (posiYDiff <= currentGroupBBox.height) {
      //timing ref should be start after
      if (this.timingRef !== TimingSpec.timingRef.previousEnd) {
        correctTimingRef = false;
        updateTimingRef = TimingSpec.timingRef.previousEnd;
      }
    } else {
      //create new track and change timing ref to start with
      if (this.timingRef !== TimingSpec.timingRef.previousStart) {
        correctTimingRef = false;
        updateTimingRef = TimingSpec.timingRef.previousStart;
      }
      compareXDiff = posiXLeftDiff;
    }
    if (compareXDiff >= currentKfOffsetW) {
      //show delay
      preSibling.cancelHighlightGroup();
      if (!this.hasOffset) {
        //add default delay
        if (typeof this.offsetIllus === "undefined") {
          this.drawOffset(
            KfGroup.minOffset,
            currentGroupBBox.height / store.getState().kfZoomLevel,
            GROUP_RX,
            true
          );
        }
        this.container.prepend(this.offsetIllus);

        updateSpec = true;
        actionInfo.aniId = this.aniId;
        actionInfo.groupRef = this.groupRef;
        actionInfo.delay = 300;
        if (correctTimingRef) {
          actionType = UPDATE_DELAY_BETWEEN_GROUP;
        } else {
          actionType = UPDATE_DELAY_TIMING_REF_BETWEEN_GROUP;
          actionInfo.ref = updateTimingRef;
        }
      } else {
        this.showOffset();
        if (correctTimingRef) {
          updateSpec = false;
          actionInfo = {};
        } else {
          updateSpec = true;
          actionType = UPDATE_TIMEING_REF_BETWEEN_GROUP;
          actionInfo.aniId = this.aniId;
          actionInfo.groupRef = this.groupRef;
          actionInfo.ref = updateTimingRef;
        }
      }
    } else if (compareXDiff < currentKfOffsetW && compareXDiff >= 0) {
      //remove delay
      preSibling.cancelHighlightGroup();
      if (this.hasOffset) {
        //remove delay
        this.hideOffset();

        updateSpec = true;
        actionInfo.aniId = this.aniId;
        actionInfo.groupRef = this.groupRef;
        if (correctTimingRef) {
          actionType = REMOVE_DELAY_BETWEEN_GROUP;
        } else {
          actionType = REMOVE_DELAY_UPDATE_TIMING_REF_GROUP;
          actionInfo.ref = updateTimingRef;
        }
      } else {
        if (
          typeof this.offsetIllus !== "undefined" &&
          this.container.contains(this.offsetIllus)
        ) {
          this.container.removeChild(this.offsetIllus);
        }
        if (correctTimingRef) {
          updateSpec = false;
          actionInfo = {};
        } else {
          updateSpec = true;
          actionType = UPDATE_TIMEING_REF_BETWEEN_GROUP;
          actionInfo.aniId = this.aniId;
          actionInfo.groupRef = this.groupRef;
          actionInfo.ref = updateTimingRef;
        }
      }
    } else {
      //
      if (posiYDiff <= currentGroupBBox.height) {
        //timing ref should be start after
        preSibling.highlightGroup();
        updateSpec = true;
        actionType = MERGE_GROUP;
        actionInfo.aniId = this.aniId;
        actionInfo.groupRef = this.groupRef;
      } else {
        //create new track and change timing ref to start with
        preSibling.cancelHighlightGroup();
        if (this.hasOffset) {
          //remove delay
          this.hideOffset();

          updateSpec = true;
          actionInfo.aniId = this.aniId;
          actionInfo.groupRef = this.groupRef;
          if (correctTimingRef) {
            actionType = REMOVE_DELAY_BETWEEN_GROUP;
          } else {
            actionType = REMOVE_DELAY_UPDATE_TIMING_REF_GROUP;
            actionInfo.ref = updateTimingRef;
          }
        } else {
          if (
            typeof this.offsetIllus !== "undefined" &&
            this.container.contains(this.offsetIllus)
          ) {
            this.container.removeChild(this.offsetIllus);
          }
          if (correctTimingRef) {
            updateSpec = false;
            actionInfo = {};
          } else {
            updateSpec = true;
            actionType = UPDATE_TIMEING_REF_BETWEEN_GROUP;
            actionInfo.aniId = this.aniId;
            actionInfo.groupRef = this.groupRef;
            actionInfo.ref = updateTimingRef;
          }
        }
      }
    }

    return [updateSpec, actionType, actionInfo];
  }

  public fetchAlignWithGroup(): KfGroup {
    let alignWithGroup: KfGroup;
    KfGroup.allAniGroups.forEach((aniGroup: KfGroup, aniId: string) => {
      if (
        aniGroup.alignId === this.alignTarget ||
        aniGroup.aniId === this.alignTarget
      ) {
        alignWithGroup = aniGroup;
      }
      // if (arrayContained(aniGroup.alignLines, this.alignLines)) {
      //     alignWithGroup = aniGroup;
      // }
    });
    return alignWithGroup;
  }

  public fetchAllKfs(): KfItem[] {
    const allKfs: KfItem[] = [];
    this.children.forEach((c: KfItem | KfOmit) => {
      if (c instanceof KfItem) {
        allKfs.push(c);
      }
    });
    return allKfs;
  }

  /**
   * find all kfs in an anigroup before the given kf
   */
  public fetchAllKfsBefore(targetKf: KfItem): KfItem[] {
    const result: KfItem[] = [];
    const queue: Array<KfGroup | KfItem | KfOmit> = [];
    queue.unshift(this);
    while (queue.length != 0) {
      const item: KfGroup | KfItem | KfOmit = queue.shift();
      if (item instanceof KfGroup) {
        if (item.children.length > 0) {
          const children = item.children;
          children.forEach((c: KfGroup | KfItem | KfOmit) => {
            queue.push(c);
          });
        }
      } else if (item instanceof KfItem) {
        if (item.id === targetKf.id) {
          return result;
        }
        result.push(item);
      }
    }
    return result;
  }

  public fetchFirstKf(): KfItem {
    if (this.children[0] instanceof KfItem) {
      return this.children[0];
    } else {
      return (<KfGroup>this.children[0]).fetchFirstKf();
    }
  }
  public fetchLastKf(): KfItem {
    if (this.children[this.children.length - 1] instanceof KfItem) {
      return <KfItem>this.children[this.children.length - 1];
    } else {
      return (<KfGroup>this.children[this.children.length - 1]).fetchLastKf();
    }
  }
  public fetchFirstKfg(): number {
    if (this.children[0] instanceof KfItem) {
      return this.id;
    } else {
      return (<KfGroup>this.children[0]).fetchFirstKfg();
    }
  }
  public fetchAniGroup(): KfGroup {
    if (this.parentObj instanceof KfTrack) {
      return this;
    } else {
      return this.parentObj.fetchAniGroup();
    }
  }

  public hideOffset() {
    this.offsetIllus.setAttributeNS(null, "opacity", "0");
  }

  public showOffset() {
    this.offsetIllus.setAttributeNS(null, "opacity", "1");
  }

  public highlightGroup() {
    this.groupBg.classList.add("highlight-kf");
  }

  public cancelHighlightGroup() {
    this.groupBg.classList.remove("highlight-kf");
  }

  // public showGroupBg() {
  //     this.groupBg.setAttributeNS(null, 'stroke', '#898989');
  //     if (this.groupBg.getAttributeNS(null, 'fill') === 'none') {
  //         this.groupBg.setAttributeNS(null, 'fill', this.groupBg.getAttributeNS(null, '_fill'));
  //     }
  //     this.groupBg.setAttributeNS(null, 'fill-opacity', '0.4');
  // }

  // public hideGroupBg() {
  //     this.groupBg.setAttributeNS(null, 'stroke', '#00000000');
  //     this.groupBg.setAttributeNS(null, '_fill', this.groupBg.getAttributeNS(null, 'fill'));
  //     this.groupBg.setAttributeNS(null, 'fill', 'none');
  //     this.groupBg.setAttributeNS(null, 'fill-opacity', undefined);
  // }

  // public rerenderGroupBg() {
  //     this.groupBg.setAttributeNS(null, 'fill-opacity', '1');
  // }

  /**
   * when this group translates, translate the aligned elements: refLine, kfs and their group
   * @param transX
   */
  public translateWholeGroup(
    transX: number,
    currentOneIncluded: boolean = false
  ) {
    if (currentOneIncluded) {
      const oriTrans: ICoord = jsTool.extractTransNums(
        this.container.getAttributeNS(null, "transform")
      );
      this.translateContainer(oriTrans.x + transX, oriTrans.y);
    }
    //find all group ids in current group
    let allGroupIds: number[] = [];
    this.findAllGroups(allGroupIds);

    //according to reflines in this group, find all related kfs, then find their groups, then translate those groups
    const allAlignedKfs: Set<number> = new Set();
    this.alignLines.forEach((lId: number) => {
      const refLine: IntelliRefLine = IntelliRefLine.allLines.get(lId);
      //translate the line
      updateTranslate(refLine.line, { x: transX, y: 0 });
      IntelliRefLine.kfLineMapping.forEach(
        (value: { theOtherEnd: number; lineId: number }, kfId: number) => {
          if (value.lineId === lId) {
            allAlignedKfs.add(kfId);
            allAlignedKfs.add(value.theOtherEnd);
          }
        }
      );
    });

    //find their kfgroups
    let targetTransGroupIds: number[] = [];
    [...allAlignedKfs].forEach((kfId: number) => {
      const tmpGroup: KfGroup = KfItem.allKfItems.get(kfId).parentObj;
      const tmpGroupId: number = tmpGroup.id;
      if (
        !allGroupIds.includes(tmpGroupId) &&
        !targetTransGroupIds.includes(tmpGroupId)
      ) {
        targetTransGroupIds.push(tmpGroupId);
        // targetTransGroups.push(tmpGroup);
        updateTranslate(tmpGroup.container, { x: transX, y: 0 });
      }
    });
  }

  public findAllGroups(idArr: number[]): void {
    idArr.push(this.id);
    this.children.forEach((c: any) => {
      if (c instanceof KfGroup) {
        c.findAllGroups(idArr);
      }
    });
  }

  public findLastKf(): KfItem {
    let lastKf: KfItem;
    if (this.children[0] instanceof KfItem) {
      this.children.forEach((c: KfItem | KfOmit) => {
        if (c instanceof KfItem) {
          lastKf = c;
        }
      });
    }
    return lastKf;
  }

  /**
   * set the translate value of the group container, translate the use tag of the omit if there is one
   * @param x
   * @param y
   */
  public translateContainer(x: number, y: number) {
    this.container.setAttributeNS(null, "transform", `translate(${x} ${y})`);
    this.kfOmits.forEach((omit: KfOmit) => {
      if (typeof omit.useTag !== "undefined") {
        omit.updateUseTagPosi();
      }
    });
  }

  /**
   * translate from a given kf in group, update size of this group, and size and position of siblings and parents
   * @param startTransItem
   * @param transX
   * @param updateAlignedKfs
   */
  public translateGroup(
    startTransItem: KfItem | KfOmit,
    transX: number,
    updateAlignedKfs: boolean,
    updateStartItem: boolean,
    updateStartItemAligned: boolean,
    extraInfo: { lastItem: boolean; extraWidth: number } = {
      lastItem: false,
      extraWidth: 0,
    }
  ): void {
    //translate kfitems after the input one within the same group
    let currentTransX: number = 0;
    const currentIdxInGroup: number = startTransItem.idxInGroup;
    if (!extraInfo.lastItem) {
      currentTransX = jsTool.extractTransNums(
        startTransItem.container.getAttributeNS(null, "transform")
      ).x;
    } else {
      currentTransX =
        jsTool.extractTransNums(
          startTransItem.container.getAttributeNS(null, "transform")
        ).x +
        startTransItem.container.getBoundingClientRect().width /
          store.getState().kfZoomLevel; //fixed
    }
    let count: number = 0;
    let comingThroughOmit: boolean = false;
    let cameThroughOmit: KfOmit;
    this.children.forEach((k: KfItem | KfOmit) => {
      if (k.rendered) {
        const tmpTrans: ICoord = jsTool.extractTransNums(
          k.container.getAttributeNS(null, "transform")
        );
        const tmpIdxInGroup: number = k.idxInGroup;

        if (updateStartItem) {
          //need to update startitem and its aligned elements too
          if (
            (tmpTrans.x >= currentTransX ||
              tmpIdxInGroup >= currentIdxInGroup) &&
            !(count === 0 && k instanceof KfOmit)
          ) {
            k.translateContainer(tmpTrans.x + transX, tmpTrans.y);
            if (k instanceof KfItem) {
              k.transOmitsWithItem();
            }
            if (k instanceof KfItem && updateAlignedKfs) {
              k.translateAlignedGroups(transX, updateAlignedKfs);
            }
            count++;
          }
        } else {
          //dont update startitem
          if (updateStartItemAligned) {
            //update its aligned elements
            if (
              (tmpTrans.x >= currentTransX ||
                tmpIdxInGroup >= currentIdxInGroup) &&
              !(count === 0 && k instanceof KfOmit)
            ) {
              if (k.id !== startTransItem.id) {
                k.translateContainer(tmpTrans.x + transX, tmpTrans.y);
                if (k instanceof KfItem) {
                  k.transOmitsWithItem();
                }
              }
              if (k instanceof KfItem && updateAlignedKfs) {
                k.translateAlignedGroups(transX, updateAlignedKfs);
              }
              count++;
            }
          } else {
            if (
              k.id !== startTransItem.id &&
              (tmpTrans.x >= currentTransX ||
                tmpIdxInGroup >= currentIdxInGroup)
            ) {
              k.translateContainer(tmpTrans.x + transX, tmpTrans.y);
              if (k instanceof KfItem) {
                k.transOmitsWithItem();
                if (updateAlignedKfs) {
                  k.translateAlignedGroups(transX, updateAlignedKfs);
                }
              }
              count++;
            }
          }
        }
      }

      if (updateStartItem) {
        if (k instanceof KfOmit) {
          comingThroughOmit = true;
          cameThroughOmit = k;
          transX += k.totalWidth + GROUP_PADDING;
        } else if (k instanceof KfItem && comingThroughOmit) {
          comingThroughOmit = false;
          const omitWidth: number =
            typeof cameThroughOmit === "undefined"
              ? KfOmit.OMIT_WIDTH
              : cameThroughOmit.totalWidth;
          transX -= omitWidth + GROUP_PADDING;
        }
      }
    });
    //update the group size and position
    let extraWidth: number = extraInfo.lastItem ? extraInfo.extraWidth : 0;
    let [diffX, currentGroupWidth, childHeight] = this.updateSize(extraWidth);
    const oriTrans: ICoord = jsTool.extractTransNums(
      this.container.getAttributeNS(null, "transform")
    );
    this.translateContainer(oriTrans.x + diffX, oriTrans.y);
    this.posiX = oriTrans.x + diffX;
    this.totalWidth = currentGroupWidth;
    if (this.parentObj instanceof KfGroup) {
      this.parentObj.updateTotalWidth();
    }
    //update parent group and siblings
    this.updateSiblingAndParentSizePosi(transX, updateAlignedKfs);
  }

  public updateSiblingAndParentSizePosi(
    transX: number,
    updateAlignedKfs: boolean
  ) {
    const currentGroupBBox: DOMRect = this.container.getBoundingClientRect(); //fixed
    this.parentObj.children.forEach((c: KfGroup | KfOmit) => {
      if (c.rendered) {
        const tmpGroupBBox: DOMRect = c.container.getBoundingClientRect(); //fixed
        let needTrans: boolean =
          tmpGroupBBox.left >= currentGroupBBox.left && c.id !== this.id;
        if (c instanceof KfGroup) {
          needTrans = needTrans && c.idxInGroup > this.idxInGroup;
        }
        if (needTrans) {
          if (c instanceof KfOmit || (c instanceof KfGroup && c.rendered)) {
            const tmpTrans: ICoord = jsTool.extractTransNums(
              c.container.getAttributeNS(null, "transform")
            );
            c.translateContainer(tmpTrans.x + transX, tmpTrans.y);

            if (c instanceof KfGroup) {
              //translate plus btn is there is one
              if (typeof c.plusBtn !== "undefined") {
                c.plusBtn.translateBtn(transX);
              }
              if (c.children[0] instanceof KfItem && updateAlignedKfs) {
                //need to update the aligned kfs and their group
                c.children.forEach((cc: KfItem | KfOmit) => {
                  if (cc instanceof KfItem) {
                    const tmpAlignTargetLeft: number =
                      cc.kfBg.getBoundingClientRect().left; //fixed
                    const tmpAlignTargetRight: number =
                      cc.container.getBoundingClientRect().right; //fixed
                    if (
                      typeof KfItem.allKfInfo.get(cc.id).alignWithKfs !==
                      "undefined"
                    ) {
                      KfItem.allKfInfo
                        .get(cc.id)
                        .alignWithKfs.forEach((kfId: number) => {
                          const tmpKfItem: KfItem = KfItem.allKfItems.get(kfId);
                          const tmpKfItemInfo: IKeyframe =
                            KfItem.allKfInfo.get(kfId);
                          if (typeof tmpKfItem !== "undefined") {
                            const tmpKfItemBBox: DOMRect =
                              tmpKfItem.container.getBoundingClientRect(); //fixed
                            if (
                              tmpKfItemInfo.timingRef ===
                              TimingSpec.timingRef.previousEnd
                            ) {
                              if (tmpKfItemBBox.left !== tmpAlignTargetRight) {
                                //this kf together with its group need to be updated
                                tmpKfItem.parentObj.translateGroup(
                                  tmpKfItem,
                                  (tmpAlignTargetRight - tmpKfItemBBox.left) /
                                    store.getState().kfZoomLevel,
                                  false,
                                  true,
                                  true
                                );
                              }
                            } else {
                              if (tmpKfItemBBox.left !== tmpAlignTargetLeft) {
                                //this kf together with its group need to be updated
                                tmpKfItem.parentObj.translateGroup(
                                  tmpKfItem,
                                  (tmpAlignTargetLeft - tmpKfItemBBox.left) /
                                    store.getState().kfZoomLevel,
                                  false,
                                  true,
                                  true
                                );
                              }
                            }
                          }
                        });
                      IntelliRefLine.updateLine(cc.id); //cc is a alignwith kf, update refline
                    }
                  }
                });
              }
            }
          }
        }
      }
    });
    //update size and position of parent
    if (this.parentObj instanceof KfGroup) {
      this.parentObj.updateSize();
      this.parentObj.updateSiblingAndParentSizePosi(transX, updateAlignedKfs);
    }
  }

  /**
   * for merged aligned groups
   * @param extraWidth : width in visual pixel level
   */
  public extendSize(extraWidth: number): void {
    this.groupBg.setAttributeNS(
      null,
      "width",
      `${
        parseFloat(this.groupBg.getAttributeNS(null, "width")) +
        extraWidth / store.getState().kfZoomLevel
      }`
    );
    //update available insert and groups in the tracks which current group prossesses
    if (this.parentObj instanceof KfTrack) {
      this.updateParentTrackInsert();
    }
  }

  public updateSize(extraWidth: number = 0): [number, number, number] {
    //get size of all children (kfgroup or kfitem)
    let maxBoundry: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    } = {
      top: Number.MAX_SAFE_INTEGER,
      right: Number.MIN_SAFE_INTEGER,
      bottom: Number.MIN_SAFE_INTEGER,
      left: Number.MAX_SAFE_INTEGER,
    };
    //the first child within group should have the translate as KfGroup.PADDING
    let diffX: number = 0;
    if (this.children[0] instanceof KfItem) {
      const currentTransX: number = jsTool.extractTransNums(
        this.children[0].container.getAttributeNS(null, "transform")
      ).x;
      diffX = this.hasOffset
        ? currentTransX - GROUP_PADDING - this.offsetWidth
        : currentTransX - GROUP_PADDING;
    }
    let childHasHiddenDuration: boolean = false;
    let right1: number = 0;
    this.children.forEach((c: KfGroup | KfItem | KfOmit, idx: number) => {
      if (typeof c.container !== "undefined") {
        if (c instanceof KfItem || c instanceof KfOmit) {
          if (c instanceof KfItem && c.hasHiddenDuration) {
            childHasHiddenDuration = true;
          }
          const currentTrans: ICoord = jsTool.extractTransNums(
            c.container.getAttributeNS(null, "transform")
          );
          c.translateContainer(currentTrans.x - diffX, currentTrans.y);
          if (c instanceof KfItem) {
            c.transOmitsWithItem();
          }
        }
        let countingBBox: boolean = true; //check whether this child is counted for calculating bbox
        let kfsAlignToCurrentKf: KfItem[] = [];
        if (c instanceof KfItem) {
          countingBBox = c.renderWhenZooming;
          if (typeof KfItem.allKfInfo.get(c.id) !== "undefined") {
            if (
              typeof KfItem.allKfInfo.get(c.id).alignWithKfs !== "undefined" &&
              idx === this.children.length - 1
            ) {
              KfItem.allKfInfo
                .get(c.id)
                .alignWithKfs.forEach((kfId: number) => {
                  const kfAligned: KfItem = KfItem.allKfItems.get(kfId);
                  if (
                    typeof kfId !== "undefined" &&
                    typeof kfAligned !== "undefined"
                  ) {
                    if (kfAligned.parentObj.alignMerge) {
                      kfsAlignToCurrentKf.push(kfAligned);
                    }
                  }
                });
            }
          }
        }
        if (countingBBox) {
          const tmpBBox: DOMRect =
            c instanceof KfGroup
              ? c.groupBg.getBoundingClientRect()
              : c.container.getBoundingClientRect(); //fixed
          if (tmpBBox.top < maxBoundry.top && !(c instanceof KfOmit)) {
            maxBoundry.top = tmpBBox.top;
          }
          if (tmpBBox.right > maxBoundry.right) {
            maxBoundry.right = tmpBBox.right;

            // tmpRightBoundary = tmpBBox.right;
            if (c instanceof KfItem && c.parentObj.kfOmits.length === 16) {
              right1 = maxBoundry.right - 310; //padding12
            } else {
              right1 = maxBoundry.right;
            }
            if (idx === this.children.length - 1) {
              kfsAlignToCurrentKf.forEach((kfAligned: KfItem) => {
                maxBoundry.right +=
                  kfAligned.container.getBoundingClientRect().width;
              });
            }
          }
          if (tmpBBox.bottom > maxBoundry.bottom && !(c instanceof KfOmit)) {
            maxBoundry.bottom = tmpBBox.bottom;
          }
          if (tmpBBox.left < maxBoundry.left) {
            maxBoundry.left = tmpBBox.left;
          }
        }
      }
    });
    //check for merged alignto kfs
    let currentGroupWidth: number =
      (right1 - maxBoundry.left) / store.getState().kfZoomLevel +
      2 * GROUP_PADDING +
      extraWidth;
    let childHeight: number =
      (maxBoundry.bottom - maxBoundry.top) / store.getState().kfZoomLevel +
      2 * GROUP_PADDING;
    if (childHasHiddenDuration) {
      childHeight -= KfTimingIllus.EXTRA_HEIGHT;
    }
    if (childHeight < 0) {
      childHeight = 0;
    }
    if (currentGroupWidth < 0) {
      currentGroupWidth = 0;
    }

    //update size
    this.groupBg.setAttributeNS(null, "height", `${childHeight}`);
    this.groupBg.setAttributeNS(null, "width", `${currentGroupWidth}`);
    if (this.hasOffset) {
      this.updateOffset(childHeight);
      currentGroupWidth += this.offsetWidth;

    }

    //update available insert and groups in the tracks which current group prossesses
    if (this.parentObj instanceof KfTrack) {
      this.updateParentTrackInsert();
    }
    return [diffX, currentGroupWidth, childHeight];
  }

  public updateParentTrackInsert() {
    if (typeof KfTrack.aniTrackMapping.get(this.aniId) !== "undefined") {
      [...KfTrack.aniTrackMapping.get(this.aniId)].forEach(
        (kfTrack: KfTrack) => {
          const tmpBBox: DOMRect = this.container.getBoundingClientRect(); //fixed
          const rightBoundary: number = tmpBBox.right;
          const kftStart: number = document
            .getElementById(KF_BG_LAYER)
            .getBoundingClientRect().left; //fixed
          if (
            (rightBoundary - kftStart) / store.getState().kfZoomLevel >
            kfTrack.availableInsert
          ) {
            kfTrack.availableInsert =
              (rightBoundary - kftStart) / store.getState().kfZoomLevel;
          }
        }
      );
    }
  }

  public marksThisAni(): string[] {
    if (this.parentObj instanceof KfGroup) {
      return this.parentObj.marksThisAni();
    } else {
      return this.marks;
    }
  }

  /**
   * check whether the index of omits are correct within group
   */
  public checkChildrenOrder(): boolean {
    let omitRightPosi: boolean = true,
      omitCount: number = 0;
    for (let i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i] instanceof KfOmit) {
        omitRightPosi = i === 2 + omitCount * 4;
        if (!omitRightPosi) {
          break;
        }
        omitCount++;
      }
    }
    return omitRightPosi;
  }

  /**
   * if the omits within group are not in the right position, re-insert the omits into the group
   */
  public reorderKfChildren() {
    //delete all omits in the group
    for (let i = 0, len = this.children.length; i < len; ) {
      if (this.children[i] instanceof KfOmit) {
        this.children.splice(i, 1);
      } else {
        i++;
      }
    }
    //re-insert omits
    this.kfOmits.forEach((omit: KfOmit, idx: number) => {
      this.children.splice(2 + idx * 4, 0, omit);
    });

    //reset idxInGroup
    this.children.forEach((c: KfItem | KfOmit, idx: number) => {
      c.idxInGroup = idx;
    });
  }

  // TODO: need to remove this method!!!!
  public insertChild(child: KfGroup | KfItem | KfOmit, idx: number): void {
    //update ori idx
    for (let i = idx, len = this.children.length; i < len; i++) {
      this.children[i].idxInGroup++;
    }
    this.children.splice(idx, 0, child);
  }

  public removeChild(idx: number): void {
    //update ori idx
    for (let i = idx + 1, len = this.children.length; i < len; i++) {
      this.children[i].idxInGroup--;
    }
    this.children.splice(idx, 1);
  }

  /**
   * current group align to others
   */
  public updateAlignGroupKfPosis() {
    this.children.forEach((c: KfItem | KfOmit) => {
      if (c instanceof KfItem) {
        const alignRange: [number, number] = c.calAlignRange();
        const currentBBox: DOMRect = c.container.getBoundingClientRect();
        // const timingRef: string = c.timingType;
        const timingRef: string = KfGroup.allAniGroups.get(c.aniId).timingRef;
        const diffX: number =
          timingRef === TimingSpec.timingRef.previousEnd
            ? (alignRange[1] - currentBBox.left) / store.getState().kfZoomLevel
            : (alignRange[0] - currentBBox.left) / store.getState().kfZoomLevel;
        if (diffX !== 0) {
          const oriTrans: ICoord = jsTool.extractTransNums(
            c.container.getAttributeNS(null, "transform")
          );
          c.translateContainer(oriTrans.x + diffX, oriTrans.y);
        }
      }
    });
    let diffX = this.updateSize()[0];
    const oriTrans: ICoord = jsTool.extractTransNums(
      this.container.getAttributeNS(null, "transform")
    );

    this.translateContainer(oriTrans.x + diffX, oriTrans.y);
  }

  /**
   *
   * @param kzl : levels deeper than kzl will be simplified
   */
  public zoomGroup(kzl: number, showThumbnail: number) {
    if (this.children.length > 0) {
      if (this.children[0] instanceof KfGroup) {
        let kfGroupCount: number = 0;
        this.children.forEach((c: KfGroup | KfOmit, idx: number) => {
          if (c instanceof KfGroup && c.rendered) {
            if (c.treeLevel > kzl) {
              //hide kfs whose level is deeper than level of this group
              if (kfGroupCount === 1 && idx !== this.children.length - 1) {
                c.renderWhenZooming = false;
              } else {
                c.zoomGroup(kzl, showThumbnail);
              }
            } else {
              if (!c.renderWhenZooming) {
                c.renderWhenZooming = true;
              }
              c.zoomGroup(kzl, showThumbnail);
            }
            kfGroupCount++;
          }
        });
      } else {
        //children are kfitems
        let leafLevel: number = this.treeLevel + 1;
        //check whther the position of the kfomits are correct
        const omitRightPosi: boolean = this.checkChildrenOrder();
        if (!omitRightPosi) {
          this.reorderKfChildren();
        }

        const kfItemsInChildren: number[] = [];
        this.children.forEach((c: KfItem | KfOmit, idx: number) => {
          if (c instanceof KfItem) {
            kfItemsInChildren.push(c.id);
          }
        });
        kfItemsInChildren.forEach((cId: number, idx: number) => {
          // get cid in groups
          const tmpKf: KfItem = KfItem.allKfItems.get(cId);
          //whether this kf is aligned to other kfs
          const alignToOthers: boolean =
            typeof KfGroup.allAniGroups.get(tmpKf.aniId).alignTarget !==
              "undefined" &&
            KfGroup.allAniGroups.get(tmpKf.aniId).alignType ===
              Animation.alignTarget.withEle;

          let hidingThisKf = false;
          if (alignToOthers) {
            const alignTargetKf: KfItem = KfItem.allKfItems.get(
              KfItem.allKfInfo.get(cId).alignTo
            );
            hidingThisKf =
              !alignTargetKf.renderWhenZooming ||
              !alignTargetKf.checkParentRenderedWhenZooming();
            leafLevel =
              KfItem.allKfItems.get(KfItem.allKfInfo.get(cId).alignTo).parentObj
                .treeLevel + 1;
          } else {
            hidingThisKf =
              (idx === 1 || idx === 2) && idx !== kfItemsInChildren.length - 1;
          }
          if (leafLevel > kzl) {
            //hide kfs whose level is deeper than leafLevel
            if (hidingThisKf) {
              tmpKf.renderWhenZooming = false;
            } else {
              tmpKf.renderWhenZooming = true;
            }
          } else {
            if (!tmpKf.renderWhenZooming) {
              tmpKf.renderWhenZooming = true;
            }
          }

          //show the corresponding thumbnail of this level
          if (tmpKf.rendered && tmpKf.renderWhenZooming) {
            tmpKf.zoomItem(showThumbnail);
          }
        });

        //update kfomit position, cause there might be newly added omits, so need to go through the children again
        let preVisibleKfs: KfItem[] = [],
          visKfRecorder: KfItem;
        let numVisKfAfterLastOmit: number = 0;
        this.children.forEach((c: KfItem | KfOmit, idx: number) => {
          // omitIsLast = (idx === this.children.length - 1 && c instanceof KfOmit);
          if (c instanceof KfOmit) {
            numVisKfAfterLastOmit = 0;
            preVisibleKfs.push(visKfRecorder);
          } else if (c instanceof KfItem && c.rendered && c.renderWhenZooming) {
            visKfRecorder = c;
            numVisKfAfterLastOmit++;
            // c.checkMalposition();
          }
        });

        if (this.kfOmits.length > 0) {
          let diffX: number = 0;
          if (numVisKfAfterLastOmit === 0) {
            //omit becomes the last child
            this.kfOmits.forEach((omit: KfOmit, idx: number) => {
              if (preVisibleKfs[idx] != undefined) {
                omit.correctTrans(preVisibleKfs[idx]);
              }
            });
            //calculate the distance difference between omits of this group and the group it aligns to
            diffX = this.updateSize(
              KfOmit.maxOmitWidth - this.kfOmits[0].totalWidth
            )[0];
          } else {
            diffX = this.updateSize()[0];
          }

          // let [diffX, currentGroupWidth, childHeight] = this.updateSize(extraWidth);
          const oriTrans: ICoord = jsTool.extractTransNums(
            this.container.getAttributeNS(null, "transform")
          );
          this.translateContainer(oriTrans.x + diffX, oriTrans.y);
        }
      }
    }
  }

  public fetchLastSubBranch(): KfGroup {
    if (this.children.length > 0) {
      if (this.children[this.children.length - 1] instanceof KfGroup) {
        return (<KfGroup>(
          this.children[this.children.length - 1]
        )).fetchLastSubBranch();
      } else {
        return this;
      }
    }
  }

  public fetchLowestSubBranch(lowestLevelBranch: KfGroup[]): void {
    if (this.children.length > 0) {
      if (this.children[0] instanceof KfGroup) {
        this.children.forEach((c: KfGroup | KfOmit) => {
          if (c instanceof KfGroup) {
            c.fetchLowestSubBranch(lowestLevelBranch);
          }
        });
      } else {
        lowestLevelBranch.push(this);
      }
    }
  }

  public showGroupWhenZooming() {
    if (this.rendered) {
      const groupWidth: number = parseFloat(
        this.groupBg.getAttributeNS(null, "width")
      );
      if (!this.renderWhenZooming) {
        //rendered -> not rendered
        if ((<KfGroup>this.parentObj).kfOmits.length === 0) {
          const groupTrans: ICoord = jsTool.extractTransNums(
            this.container.getAttributeNS(null, "transform")
          );
          const kfOmit: KfOmit = new KfOmit();
          kfOmit.createOmit(
            KfOmit.KF_GROUP_OMIT,
            groupTrans.x + groupWidth,
            1,
            <KfGroup>this.parentObj,
            false,
            false,
            parseFloat(this.groupBg.getAttributeNS(null, "height")) / 2,
            this.idxInGroup
          );
          (<KfGroup>this.parentObj).insertChild(kfOmit, this.idxInGroup + 1);
          kfOmit.idxInGroup = this.idxInGroup + 1;
          (<KfGroup>this.parentObj).kfOmits.push(kfOmit);
          this.translateGroup(
            kfOmit,
            -groupWidth + kfOmit.totalWidth,
            false,
            false,
            false
          );
          //update the position of omits
          const oriOmitTrans: ICoord = jsTool.extractTransNums(
            kfOmit.container.getAttributeNS(null, "transform")
          );
          kfOmit.updateTrans(
            oriOmitTrans.x - kfOmit.totalWidth - GROUP_PADDING,
            oriOmitTrans.y + kfOmit.oHeight / 2
          );
        } else {
          (<KfGroup>this.parentObj).kfOmits[0].updateNum(
            (<KfGroup>this.parentObj).kfOmits[0].omittedNum + 1
          );

          this.translateGroup(
            (<KfGroup>this.parentObj).kfOmits[0],
            -groupWidth,
            true,
            false,
            false
          );
        }
        this.container.setAttributeNS(null, "display", "none");
        this.kfOmits.forEach((omit: KfOmit) => {
          omit.container.setAttributeNS(null, "display", "none");
        });
      } else {
        //not rendered -> rendered
        this.container.setAttributeNS(null, "display", "");
        this.kfOmits.forEach((omit: KfOmit) => {
          omit.container.setAttributeNS(null, "display", "");
        });
        if ((<KfGroup>this.parentObj).kfOmits[0].omittedNum === 1) {
          //remove kfOmit
          const tmpOmit: KfOmit = (<KfGroup>this.parentObj).kfOmits[0];
          this.translateGroup(
            tmpOmit,
            groupWidth - GROUP_PADDING,
            false,
            false,
            false
          );
          tmpOmit.removeOmit(this.parentObj);
          (<KfGroup>this.parentObj).removeChild(
            (<KfGroup>this.parentObj).kfOmits[0].idxInGroup
          ); //test if it is +1
          (<KfGroup>this.parentObj).kfOmits.splice(0, 1);
        } else {
          //update number
          (<KfGroup>this.parentObj).kfOmits[0].updateNum(
            (<KfGroup>this.parentObj).kfOmits[0].omittedNum - 1
          );
          //restore the omit position to the right side of its preItem
          this.translateGroup(
            (<KfGroup>this.parentObj).kfOmits[0],
            groupWidth,
            false,
            false,
            false
          );
          const preItemTrans: ICoord = jsTool.extractTransNums(
            (<KfGroup>(
              this.parentObj
            )).kfOmits[0].preItem.container.getAttributeNS(null, "transform")
          );
          const oriOmitTrans: ICoord = jsTool.extractTransNums(
            (<KfGroup>this.parentObj).kfOmits[0].container.getAttributeNS(
              null,
              "transform"
            )
          );
          const preKfWidth: number =
            (<KfGroup>(
              (<KfGroup>this.parentObj).kfOmits[0].preItem
            )).container.getBoundingClientRect().width /
            store.getState().kfZoomLevel;
          (<KfGroup>this.parentObj).kfOmits[0].updateTrans(
            preItemTrans.x + preKfWidth,
            oriOmitTrans.y + (<KfGroup>this.parentObj).kfOmits[0].oHeight / 2
          );
        }
      }
    }
  }
}
