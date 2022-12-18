import "../../assets/style/vl/keyframeItem.scss";
import KfGroup, { GROUP_PADDING, GROUP_RX } from "./kfGroup";
import KfTimingIllus from "./kfTimingIllus";
import KfOmit from "./kfOmit";
import IntelliRefLine from "./intelliRefLine";
import { TimingSpec } from "canis_toolkit";
import KfTrack from "./kfTrack";
import { createPopupComponent } from "./vl-util";
import {
  ALIGN_FRAME_COLOR,
  GROUP_TITLE_HEIHGT,
  KF_HEIGHT,
  KF_H_STEP,
  KF_PADDING,
  KF_POPUP_LAYER,
  KF_WIDTH,
  KF_W_STEP,
  TRACK_HEIGHT,
} from "./vl-consts";
import { MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL } from "../panels/panel-consts";
import {
  NON_SKETCH_CLS,
  SELECTION_FRAME,
  SINGLE_TAP_TIME,
  SUGGEST_FRAME_CLS,
} from "../../global-consts";
import {
  IKeyframe,
  ISize,
  ICoord,
  IOmitPattern,
} from "../../global-interfaces";
import { store } from "../../store";
import {
  calKfZoomLevel,
  enlargeMarks,
  resetMarkSize,
  resetTxtCover,
  transNodeElements,
} from "../../../util/tool";
import { createSvgElement, translateEle } from "../../../util/svgManager";
import { jsTool } from "../../../util/jsTool";
import { updateHighlightKf } from "../../action/vlAction";
import { CHART_THUMBNAIL_ZOOM_LEVEL } from "./vl-consts";
import {
  REMOVE_DELAY_BETWEEN_KF,
  REMOVE_LOWESTGROUP,
  updateEffectType,
  UPDATE_ALIGN_MERGE,
  UPDATE_DELAY_BETWEEN_KF,
  UPDATE_EFFECT_AND_DURATION,
  UPDATE_KF_TIMING_REF,
  UPDATE_TIMING_REF_DELAY_KF,
} from "../../action/canisAction";
import AniMIL from "../../../mil/AniMIL";
import { updatePreviewing } from "../../action/videoAction";
import { indexOf } from "lodash";
import Util from "../../../app/core/util";
import { KfContainer } from "./kfContainer";

export interface IDragItemInfo {
  targetMoveItem: KfItem | KfGroup;
  dragItem: KfItem;
  updateSpec: boolean;
  actionType: string;
  actionInfo: any;
  preSibling: KfItem | KfOmit;
  nextSibling: KfItem | KfOmit;
  firstSibling: KfItem;
  preKfRight: number;
  hintPosiLine: IntelliRefLine;
  containerBBox: DOMRect;
}

export default class KfItem extends KfTimingIllus {
  static STATIC_KF_ID: number = -100;
  static allKfInfo: Map<number, IKeyframe> = new Map(); //contains both fake and real info
  static allKfItems: Map<number, KfItem> = new Map(); //contains both fake and real kf
  static staticKf: KfItem;
  static dragoverKf: KfItem;
  static fakeKfIdx: number = 10000;
  static dragInfo: IDragItemInfo = null;

  public treeLevel: number;
  public parentObj: KfGroup;
  public isGhost: boolean; // kf generated after mark selection
  public rendered: boolean = false;
  public idxInGroup: number = 0;
  public _isHighlighted: boolean = false;
  public kfInfo: {
    delay: number;
    groupRef: string;
    refValue: string;
    duration: number;
    allCurrentMarks: string[];
    allGroupMarks: string[];
    marksThisKf: string[];
    alignTo?: number;
  };
  public preOmit: KfOmit;

  //widgets
  public kfHeight: number;
  public kfBg: SVGRectElement;
  public kfWidth: number;
  public alignFrame: SVGRectElement;
  public totalWidth: number = 0;
  public chartThumbnails: SVGImageElement[] = [];
  public _renderWhenZooming: boolean = true;
  public itemTouch: typeof AniMIL;

  set isHighlighted(h: boolean) {
    this._isHighlighted = h;
    h ? this.highlightKf() : this.cancelHighlightKf();
  }

  get isHighlighted(): boolean {
    return this._isHighlighted;
  }

  set offsetDiff(od: number) {
    this._offsetDiff = od;
    transNodeElements(this.container, od, true);
    this.parentObj.translateGroup(this, od, true, false, true);
  }

  get offsetDiff(): number {
    return this._offsetDiff;
  }

  set durationDiff(dd: number) {
    this._durationDiff = dd;
    this.parentObj.translateGroup(this, dd, true, false, true);
  }

  get durationDiff(): number {
    return this._durationDiff;
  }

  set renderWhenZooming(rwz: boolean) {
    const changed: boolean = rwz !== this.renderWhenZooming;
    this._renderWhenZooming = rwz;
    if (changed) {
      this.showItemWhenZooming();
    }
  }

  get renderWhenZooming(): boolean {
    return this._renderWhenZooming;
  }

  public static createKfInfo(
    selectedMarks: string[],
    basicInfo: {
      duration: number;
      allCurrentMarks: string[];
      allGroupMarks: string[];
      isGhost: boolean;
    }
  ): IKeyframe {
    KfItem.fakeKfIdx++;
    return {
      id: KfItem.fakeKfIdx,
      groupRef: "id",
      isGhost: basicInfo.isGhost,
      timingRef: TimingSpec.timingRef.previousEnd,
      duration: basicInfo.duration,
      allCurrentMarks: [...basicInfo.allCurrentMarks, ...selectedMarks],
      allGroupMarks: basicInfo.allGroupMarks,
      marksThisKf: selectedMarks,
      durationIcon: true,
      hiddenDurationIcon: false,
      delay: 0,
      delayIcon: false,
    };
  }

  public static endDragging() {
    if (this.dragInfo) {
      if (this.dragInfo.targetMoveItem instanceof KfGroup) {
        this.dragInfo.dragItem.upKfGroupTarget();
      } else if (this.dragInfo.targetMoveItem instanceof KfItem) {
        this.dragInfo.dragItem.upKfTarget();
      }
      this.dragInfo = null;
    }
  }

  // /**
  //  *
  //  */
  // public static recordZoomPosis(kfZoomLevel: number) {
  //     // if (typeof this.allKfItems.get([...this.allKfItems.keys()][0]).zoomPosis.get(kfZoomLevel) === 'undefined') {
  //     this.allKfItems.forEach((kf: KfItem, kfId: number) => {
  //         const tmpTrans: ICoord = extractTransNums(kf.container.getAttributeNS(null, 'transform'));
  //         this.allKfItems.get(kfId).zoomPosis.set(kfZoomLevel, {
  //             posi: tmpTrans,
  //             size: { w: 0, h: 0 }
  //         });
  //     })
  //     // }
  // }

  // public static restoreZoomPosis(kfZoomLevel: number) {
  //     this.allKfItems.forEach((kf: KfItem, kfId: number) => {
  //         this.allKfItems.get(kfId).container.setAttributeNS(null, 'transform', `translate(${kf.zoomPosis.get(kfZoomLevel).posi.x} ${kf.zoomPosis.get(kfZoomLevel).posi.y})`);
  //     })
  // }

  public createOptionKfItem(
    allCurrentMarks: string[],
    allGroupMarks: string[],
    marksThisKf: string[],
    kfWidth: number,
    kfHeight: number
  ) {
    this.kfWidth = kfWidth;
    this.kfHeight = kfHeight;
    this.container = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.container.classList.add(NON_SKETCH_CLS);
    this.translateContainer(GROUP_RX, GROUP_RX);
    this.drawKfBg(-1, { width: kfWidth, height: kfHeight });
    this.container.appendChild(this.kfBg);
    this.drawChart(allCurrentMarks, allGroupMarks, marksThisKf);
  }

  public createItem(
    kf: IKeyframe,
    treeLevel: number,
    parentObj: KfGroup,
    startX: number,
    size?: ISize
  ): void {
    this.isGhost = kf.isGhost;
    this.hasOffset = kf.delayIcon;
    this.hasDuration = kf.durationIcon;
    this.hasHiddenDuration = kf.hiddenDurationIcon;
    this.parentObj = parentObj;
    this.aniId = this.parentObj.aniId;
    if (
      this.parentObj.kfHasOffset !== this.hasOffset ||
      this.parentObj.kfHasDuration !== this.hasDuration
    ) {
      this.parentObj.updateParentKfHasTiming(this.hasOffset, this.hasDuration);
    }
    this.id = kf.id;
    this.treeLevel = treeLevel;

    if (typeof size !== "undefined") {
      this.kfHeight = size.height;
    } else {
      this.kfHeight = KF_HEIGHT - (treeLevel - 1) * KF_H_STEP;
    }
    this.kfInfo = {
      delay: kf.delay,
      groupRef: typeof kf.groupRef === "undefined" ? "id" : kf.groupRef,
      refValue: typeof kf.refValue === "undefined" ? "" : kf.refValue,
      duration: kf.duration,
      allCurrentMarks: kf.allCurrentMarks,
      allGroupMarks: kf.allGroupMarks,
      marksThisKf: kf.marksThisKf,
    };
    if (typeof kf.alignTo !== "undefined") {
      this.kfInfo.alignTo = kf.alignTo;
    }
    if (typeof parentObj.container !== "undefined") {
      this.rendered = true;
      this.renderItem(startX, size);
      if (typeof this.kfInfo.alignTo !== "undefined") {
        //this kf is align to others
        const aniGroup: KfGroup = this.parentObj.fetchAniGroup();
        if (aniGroup.alignMerge) {
          this.showAlignFrame();
        }
      }
    } else {
      KfItem.allKfItems.set(this.id, this);
    }

    const kfTouch = new AniMIL(this.container);
    kfTouch.add(pressKf);
    kfTouch.on(KF_PRESS, (e: any) => {
      KfItem.endDragging();
      //set path
      let path = JSON.parse(JSON.stringify(store.getState().previewPath));
      //set spec
      let spec = JSON.parse(JSON.stringify(store.getState().spec));
      const previousMarks =
        store.getState().highlightKf.currentHighlightKf.kfInfo.allCurrentMarks;
      const thisMarks =
        store.getState().highlightKf.currentHighlightKf.kfInfo.marksThisKf;
      const currentMarks = previousMarks.concat(thisMarks);
      const len: number = store.getState().spec.animations.length;
      for (let i = 0; i < len; i++) {
        let result: string[] = [];
        let pathSelect: string = "";
        jsTool
          .markstringTomark(spec.animations[i].selector)
          .forEach((markId) => {
            if (currentMarks.indexOf(markId) != -1) {
              result.push(markId);
            }
          });
        result.forEach((mark) => {
          //filter the current preview Info
          if (path.firstKfMarks.indexOf(mark) === -1) {
            pathSelect += jsTool.markToSelect(mark);
          }
        });
        pathSelect = pathSelect.slice(0, -1);
        pathSelect = pathSelect.slice(0, -1);
        if (pathSelect.length != 0) {
          spec.animations[i].selector = pathSelect;
        }
      }

      // store.getState().highlightKf.currentHighlightKf.kfInfo.allCurrentMarks.forEach((markId) => {
      //     if(spec.animations.length > 1 && spec.animations[0].indexOf(markId)){

      //     }else if(path.firstKfMarks.indexOf(markId) === -1){
      //         pathSelect += '#' + markId + ', ';
      //     }
      // })
      // store.getState().highlightKf.currentHighlightKf.kfInfo.marksThisKf.forEach((markId) => {
      //     if(spec.animations.length > 1 && spec.animations[0].indexOf(markId)){

      //     }else if(path.firstKfMarks.indexOf(markId) === -1){
      //         pathSelect += '#' + markId + ', ';
      //     }
      // })
      // if(pathSelect.length > 0){
      // pathSelect = pathSelect.slice(0,-1);
      // pathSelect = pathSelect.slice(0,-1);
      // }
      // if(spec.animations.length > 1){
      //     spec.animations[1].selector = pathSelect;
      // }else{
      //     spec.animations[0].selector = pathSelect;
      // }
      store.dispatchSystem(updatePreviewing(path, spec, true, true));

      // KfItem.dragInfo = this.startDragKf(parseInt(e.target.getAttributeNS(null, 'kfId')));
    });
    this.container.addEventListener("pointerdown", (downEvt: PointerEvent) => {
      store.dispatch(updateHighlightKf(this));
      KfItem.dragInfo = this.startDragKf(
        parseInt((<any>downEvt.target).getAttributeNS(null, "kfId"))
      );
    });
    this.container.addEventListener("pointerup", () => {
      store.dispatchSystem(
        updatePreviewing(store.getState().previewPath, null, false, true)
      );
    });
  }

  // public bindHoverBtn() {
  //     this.container.onmouseenter = () => {
  //         this.container.classList.add('drop-shadow-ele');
  //         // this.hoverBtnContainer.setAttributeNS(null, 'opacity', '1');
  //         // if (!state.mousemoving) {
  //         //     if (typeof this.kfInfo.alignTo !== 'undefined') {//this kf is align to others
  //         //         const aniGroup: KfGroup = this.parentObj.fetchAniGroup();
  //         //         aniGroup.transShowTitle();
  //         //     } else {
  //         //         this.parentObj.transShowTitle();
  //         //     }
  //         // }
  //     }
  //     this.container.onmouseleave = () => {
  //         this.container.classList.remove('drop-shadow-ele');
  //         // this.hoverBtnContainer.setAttributeNS(null, 'opacity', '0');
  //     }
  // }

  // public unbindHoverBtn() {
  //     this.container.classList.remove('drop-shadow-ele');
  //     this.hoverBtnContainer.setAttributeNS(null, 'opacity', '0');
  //     this.container.onmouseenter = null;
  //     this.container.onmouseleave = null;
  // }

  public renderItem(startX: number, size?: ISize) {
    this.container = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.container.classList.add(NON_SKETCH_CLS);
    this.translateContainer(startX + KF_PADDING, KF_PADDING);
    // this.bindHoverBtn();

    if (this.hasOffset) {
      this.drawOffset(this.kfInfo.delay, this.kfHeight, 0);
      this.container.appendChild(this.offsetIllus);
      this.totalWidth += this.offsetWidth;
    }
    this.drawKfBg(this.treeLevel, size);
    this.container.appendChild(this.kfBg);
    if (this.hasDuration) {
      this.drawDuration(
        this.kfInfo.duration,
        this.kfWidth,
        this.kfHeight,
        false
      );
      this.container.appendChild(this.durationIllus);
      this.totalWidth += this.durationWidth;
    } else if (this.hasHiddenDuration) {
      this.drawDuration(
        this.kfInfo.duration,
        this.kfWidth,
        this.kfHeight,
        true
      );
      this.container.appendChild(this.durationIllus);
    }

    this.drawChart(
      this.kfInfo.allCurrentMarks,
      this.kfInfo.allGroupMarks,
      this.kfInfo.marksThisKf,
      KfItem.allKfInfo.get(this.id).thumbnail
    );
    if (this.treeLevel === 1) {
      if (typeof this.parentObj.groupMenu === "undefined") {
        //fake groups
        this.parentObj.container.appendChild(this.container);
      } else {
        this.parentObj.container.insertBefore(
          this.container,
          this.parentObj.groupMenu.container
        );
      }
    } else {
      this.parentObj.container.appendChild(this.container);
    }

    //if this kfItem is aligned to previous kfItems, update positions
    KfItem.allKfItems.set(this.id, this);
    if (typeof this.kfInfo.alignTo !== "undefined") {
      this.updateAlignPosi(this.kfInfo.alignTo);
      // KfItem.allKfItems.set(this.id, this);
      //check whether there is already a line
      if (typeof IntelliRefLine.kfLineMapping.get(this.id) !== "undefined") {
        //already a line
        // if (typeof IntelliRefLine.kfLineMapping.get(this.kfInfo.alignTo) !== 'undefined') {//already a line
        const refLineId: number = IntelliRefLine.kfLineMapping.get(
          this.kfInfo.alignTo
        ).lineId;
        const oriToKf: number = IntelliRefLine.kfLineMapping.get(
          this.kfInfo.alignTo
        ).theOtherEnd;
        const oriToKfBottom: number = KfItem.allKfItems
          .get(oriToKf)
          .container.getBoundingClientRect().bottom; //fixed
        const currentKfBottom: number =
          this.container.getBoundingClientRect().bottom; //fixed
        if (currentKfBottom > oriToKfBottom) {
          //update the line info
          IntelliRefLine.kfLineMapping.get(this.kfInfo.alignTo).theOtherEnd =
            this.id;
          IntelliRefLine.kfLineMapping.delete(oriToKf);
          IntelliRefLine.kfLineMapping.set(this.id, {
            theOtherEnd: this.kfInfo.alignTo,
            lineId: refLineId,
          });
          IntelliRefLine.updateLine(this.kfInfo.alignTo);
        }
      } else {
        // create a line
        let refLine: IntelliRefLine = new IntelliRefLine();
        refLine.createLine(this.kfInfo.alignTo, this.id);
        KfItem.allKfItems
          .get(this.kfInfo.alignTo)
          .parentObj.alignLines.push(refLine.id);
        this.parentObj.alignLines.push(refLine.id);
      }
    } else {
      // KfItem.allKfItems.set(this.id, this);
    }

    //whether to highlight this kf
    if (
      store.getState().highlightKf &&
      store.getState().highlightKf.currentHighlightKf
    ) {
      if (
        jsTool.identicalArrays(
          this.kfInfo.allGroupMarks,
          store.getState().highlightKf.currentHighlightKf.kfInfo.allGroupMarks
        )
      ) {
        store.dispatchSystem(updateHighlightKf(this));
      }
    }
    // else if (store.getState().marksInNewCreateKFG.length > 0) {
    //     if (jsTool.identicalArrays(this.kfInfo.allGroupMarks, store.getState().marksInNewCreateKFG)) {
    //         store.dispatch(updateHighlightKf(this));
    //     }
    // }
    this.bindKfTap();
  }

  public bindKfTap() {
    let lastUpTime: number = 0;
    let lastDownTime: number = 0;

    const pointerUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        lastUpTime = new Date().getTime();
        const currentTime: number = new Date().getTime();
        const diffTime: number = currentTime - lastDownTime;
        if (diffTime < SINGLE_TAP_TIME) {
          //single tapping
          store.dispatchSystem(updateHighlightKf(this));
        }
      }
      this.container.removeEventListener("pointerup", pointerUp);
    };

    const pointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        lastDownTime = new Date().getTime();
      }
      this.container.addEventListener("pointerup", pointerUp);
    };

    this.container.addEventListener("pointerdown", pointerDown);
  }

  public showAlignFrame() {
    if (typeof this.alignFrame === "undefined") {
      const itemBBox: DOMRect = this.container.getBoundingClientRect(); //fixed
      this.alignFrame = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      this.alignFrame.setAttributeNS(
        null,
        "width",
        `${itemBBox.width / store.getState().kfZoomLevel}`
      );
      this.alignFrame.setAttributeNS(
        null,
        "height",
        `${itemBBox.height / store.getState().kfZoomLevel}`
      );
      this.alignFrame.setAttributeNS(null, "stroke", ALIGN_FRAME_COLOR);
      this.alignFrame.setAttributeNS(null, "stroke-width", "1");
      this.alignFrame.setAttributeNS(null, "stroke-dasharray", "4 2");
      this.alignFrame.setAttributeNS(null, "fill", "none");
      this.container.appendChild(this.alignFrame);
    } else {
      this.alignFrame.setAttributeNS(null, "opacity", "1");
    }
  }

  public hideAlignFrame() {
    if (typeof this.alignFrame !== "undefined") {
      this.alignFrame.setAttributeNS(null, "opacity", "0");
    }
  }

  public hideDuration() {
    this.durationIllus.setAttributeNS(null, "opacity", "0");
  }

  public showDuration() {
    this.durationIllus.setAttributeNS(null, "opacity", "1");
  }

  public hideOffset() {
    this.offsetIllus.setAttributeNS(null, "opacity", "0");
  }

  public showOffset() {
    this.offsetIllus.setAttributeNS(null, "opacity", "1");
  }

  // public kfDragoverKf() {
  //     this.kfBg.classList.add('dragover-kf');
  // }

  // public cancelKfDragoverKf() {
  //     this.kfBg.classList.remove('dragover-kf');
  // }

  public updateAlignPosi(alignTo: number) {
    //use bbox to compare position
    let currentPosiX: number =
      this.container.getBoundingClientRect().left -
      document.getElementById(KfContainer.KF_CONTAINER).getBoundingClientRect()
        .left; //fixed

    const currentKfInfo: IKeyframe = KfItem.allKfInfo.get(this.id);
    const alignedKfInfo: IKeyframe = KfItem.allKfInfo.get(alignTo);
    const alignedKfItem: KfItem = KfItem.allKfItems.get(alignTo);
    if (typeof alignedKfItem !== "undefined") {
      if (alignedKfItem.rendered) {
        let alignedKfBgX: number = 0;
        if (currentKfInfo.timingRef === TimingSpec.timingRef.previousStart) {
          alignedKfBgX = alignedKfItem.kfBg.getBoundingClientRect().left; //fixed
        } else {
          alignedKfBgX = alignedKfItem.container.getBoundingClientRect().right; //fixed
          KfItem.allKfInfo
            .get(alignedKfItem.id)
            .alignWithKfs.forEach((kfId: number) => {
              if (kfId !== this.id) {
                const tmpKf: KfItem = KfItem.allKfItems.get(kfId);
                if (typeof tmpKf !== "undefined" && tmpKf.rendered) {
                  const tmpKfBBox: DOMRect =
                    tmpKf.container.getBoundingClientRect(); //fixed
                  if (tmpKfBBox.right > alignedKfBgX) {
                    alignedKfBgX = tmpKfBBox.right;
                  }
                }
              }
            });
        }
        const bgDiffX: number = Math.abs(
          (currentPosiX - alignedKfBgX) / store.getState().kfZoomLevel
        );

        if (currentPosiX > alignedKfBgX) {
          //translate aligned kf and its group
          // if (currentPosiX > alignedKfBgX && (currentPosiX - alignedKfBgX >= 1)) { //translate aligned kf and its group
          let posiXForNextKf: number =
            this.container.getBoundingClientRect().right; //fixed

          //update aligned kfs, together with those kfs after it, and those in its parent group
          const currentAlignedKfTransX: number = jsTool.extractTransNums(
            alignedKfItem.container.getAttributeNS(null, "transform")
          ).x;
          alignedKfItem.translateContainer(
            currentAlignedKfTransX + bgDiffX,
            KF_PADDING
          );
          const alignedKfItemBBox: DOMRect =
            alignedKfItem.container.getBoundingClientRect(); //fixed
          if (alignedKfItemBBox.right > posiXForNextKf) {
            posiXForNextKf = alignedKfItemBBox.right;
          }

          //find the next kf in aligned group
          let flag: boolean = false;
          let transXForNextKf: number = 0;
          let nextKf: KfItem;
          for (
            let i: number = 0,
              len: number = alignedKfItem.parentObj.children.length;
            i < len;
            i++
          ) {
            const c: KfItem | KfOmit = <KfItem | KfOmit>(
              alignedKfItem.parentObj.children[i]
            );
            if (flag) {
              if (c instanceof KfOmit) {
                transXForNextKf = bgDiffX;
                const tmpTrans: ICoord = jsTool.extractTransNums(
                  c.container.getAttributeNS(null, "transform")
                );
                c.translateContainer(tmpTrans.x + transXForNextKf, tmpTrans.y);
              } else {
                const tmpBBox: DOMRect = c.container.getBoundingClientRect(); //fixed
                if (
                  tmpBBox.left +
                    transXForNextKf * store.getState().kfZoomLevel <
                  posiXForNextKf
                ) {
                  transXForNextKf =
                    (posiXForNextKf - tmpBBox.left) /
                    store.getState().kfZoomLevel;
                }
                nextKf = c;
                break;
              }
            }
            if (c instanceof KfItem) {
              flag = c.id === alignedKfItem.id;
            }
          }

          //update position of next kf in aligned group
          if (transXForNextKf > 0) {
            nextKf.parentObj.translateGroup(
              nextKf,
              transXForNextKf,
              true,
              true,
              true
            );
          }
        } else if (currentPosiX <= alignedKfBgX) {
          //translate current kf
          const currentTransX: number = jsTool.extractTransNums(
            this.container.getAttributeNS(null, "transform")
          ).x;
          this.translateContainer(currentTransX + bgDiffX, KF_PADDING);
          this.transOmitsWithItem();
          console.log('thistotalwidth', bgDiffX); 
          // this.totalWidth += bgDiffX;
          // if(this.totalWidth > 1800){
          //   this.totalWidth = 217.6;
          // }
          const kfGroupList = KfGroup.allAniGroups;
          const kfgroupListKey: string[] = Array.from(kfGroupList.keys());
          const currentKfListKey: string[] = [];
        
          if (kfgroupListKey.length > 1) {
            for (let i = kfgroupListKey.length - 2; i >= 0; i--) {
              const allvalues: string[] = kfGroupList.get(
                kfgroupListKey[i]
              ).childrenRefValues;
              const sepGroupKfMarks: {
                dataMarks: string[];
                nonDataMarks: string[];
              } = Util.separateDataAndNonDataMarks(allvalues);
              if (
                sepGroupKfMarks.dataMarks.length === 0 &&
                sepGroupKfMarks.nonDataMarks.length > 0
              ) {
                // currentPosiX += kfGroupList.get(kfgroupListKey[i]).totalWidth
                this.totalWidth -= kfGroupList.get(
                  kfgroupListKey[i]
                ).totalWidth;
              } else {
                break;
              }
            }
          }


          //find the next kf in aligned group
          let reachTarget: boolean = false;
          let transXForNextKf: number = 0;
          let nextKf: KfItem;
          let passedOmit: KfOmit;
          for (
            let i: number = 0,
              len: number = alignedKfItem.parentObj.children.length;
            i < len;
            i++
          ) {
            const c: KfItem | KfOmit = <KfItem | KfOmit>(
              alignedKfItem.parentObj.children[i]
            );
            if (reachTarget) {
              if (c instanceof KfOmit) {
                // transXForNextKf += KfOmit.OMIT_W + KfGroup.PADDING;
                passedOmit = c;
              } else {
                const currentBBox: DOMRect =
                  this.container.getBoundingClientRect(); //fixed
                const tmpBBox: DOMRect = c.container.getBoundingClientRect(); //fixed
                if (tmpBBox.left < currentBBox.right) {
                  transXForNextKf =
                    (currentBBox.right - tmpBBox.left) /
                    store.getState().kfZoomLevel;
                }
                nextKf = c;
                break;
              }
            }
            if (c instanceof KfItem) {
              reachTarget = c.id === alignedKfItem.id;
            }
          }

          //update position of next kf in aligned group
          if (transXForNextKf > 0) {
            alignedKfItem.parentObj.translateGroup(
              nextKf,
              transXForNextKf,
              true,
              true,
              true
            );
          }
        }
        //update the refline
        IntelliRefLine.updateLine(alignTo);
      }
    }
  }

  /**
   * reset the omit position to the left side of the kf
   */
  public transOmitsWithItem(): void {
    if (
      typeof this.preOmit !== "undefined" &&
      this.rendered &&
      this.renderWhenZooming
    ) {
      // if (typeof this.preOmit !== 'undefined') {
      const currentKfTrans: ICoord = jsTool.extractTransNums(
        this.container.getAttributeNS(null, "transform")
      );
      const oriTrans: ICoord = jsTool.extractTransNums(
        this.preOmit.container.getAttributeNS(null, "transform")
      );
      this.preOmit.translateContainer(
        this.preOmit.omitType === KfOmit.KF_ALIGN
          ? currentKfTrans.x - this.preOmit.totalWidth - GROUP_PADDING
          : currentKfTrans.x - this.preOmit.totalWidth,
        oriTrans.y
      );
      // this.preOmit.updateTrans(oriTrans.x + transX, oriTrans.y + KfOmit.OMIT_H / 1);
    }
  }

  public translateContainer(x: number, y: number) {
    this.container.setAttributeNS(null, "transform", `translate(${x}, ${y})`);
    //translate the refline if there is one
    IntelliRefLine.updateLine(this.id);
  }

  /**
   * calcualte the align range based on the alignwith kf and kfs aligned to this kf which are before the current kf
   */
  public calAlignRange(): [number, number] {
    const currentKfInfo: IKeyframe = KfItem.allKfInfo.get(this.id);
    const currentKfBBox: DOMRect = this.container.getBoundingClientRect();
    let minX: number = 10000000,
      maxX: number = -1;
    if (typeof currentKfInfo !== "undefined") {
      const alignTargetKf: KfItem = KfItem.allKfItems.get(
        currentKfInfo.alignTo
      );
      const alignTargetKfInfo: IKeyframe = KfItem.allKfInfo.get(
        alignTargetKf.id
      );
      if (typeof alignTargetKf !== "undefined") {
        if (alignTargetKf.rendered && alignTargetKf.renderWhenZooming) {
          //this kf is visible
          const alignTargetKfBBox: DOMRect =
            alignTargetKf.container.getBoundingClientRect();
          const alignTargetKfThumbnailBBox: DOMRect =
            alignTargetKf.kfBg.getBoundingClientRect();
          minX = alignTargetKfThumbnailBBox.left;
          maxX = alignTargetKfBBox.right;
          for (
            let i = 0, len = alignTargetKfInfo.alignWithKfs.length;
            i < len;
            i++
          ) {
            const kfId: number = alignTargetKfInfo.alignWithKfs[i];
            if (kfId === this.id) {
              break;
            }
            const tmpKf: KfItem = KfItem.allKfItems.get(kfId);
            if (typeof tmpKf !== "undefined") {
              if (
                tmpKf.rendered &&
                tmpKf.renderWhenZooming &&
                tmpKf.id !== this.id
              ) {
                const tmpBBox: DOMRect =
                  tmpKf.container.getBoundingClientRect();
                if (tmpBBox.right > maxX) {
                  maxX = tmpBBox.right;
                }
              }
            }
          }
        }
      }
    }
    return [minX, maxX];
  }

  public findNextSibling(): KfItem | KfOmit {
    return <KfItem | KfOmit>this.parentObj.children[this.idxInGroup + 1];
  }

  public moveKfGroupTarget(currentPosi: ICoord, prePosi: ICoord): void {
    // find all kfs in this kfgroup
    const allKfItems: KfItem[] = (<KfGroup>(
      KfItem.dragInfo.targetMoveItem
    )).fetchAllKfs();
    const alignWithGroupBBox: DOMRect = (<KfGroup>(
      KfItem.dragInfo.targetMoveItem
    ))
      .fetchAlignWithGroup()
      .container.getBoundingClientRect(); //fixed
    const posiDiff: ICoord = {
      x: (currentPosi.x - prePosi.x) / store.getState().kfZoomLevel,
      y: (currentPosi.y - prePosi.y) / store.getState().kfZoomLevel,
    };
    const oriTrans: ICoord = jsTool.extractTransNums(
      (<KfGroup>KfItem.dragInfo.targetMoveItem).container.getAttributeNS(
        null,
        "transform"
      )
    );
    (<KfGroup>KfItem.dragInfo.targetMoveItem).translateContainer(
      oriTrans.x,
      oriTrans.y + posiDiff.y
    );

    const currentBBox: DOMRect = (<KfGroup>(
      KfItem.dragInfo.targetMoveItem
    )).container.getBoundingClientRect(); //fixed
    if (
      (currentBBox.top - alignWithGroupBBox.top) /
        store.getState().kfZoomLevel <=
        TRACK_HEIGHT * 0.6 &&
      (currentBBox.top - alignWithGroupBBox.top) /
        store.getState().kfZoomLevel >=
        0
    ) {
      //set merge to true
      //change ref line to align frame
      allKfItems.forEach((kf: KfItem) => {
        kf.showAlignFrame();
        if (typeof IntelliRefLine.kfLineMapping.get(kf.id) !== "undefined") {
          const corresRefLine: IntelliRefLine = IntelliRefLine.allLines.get(
            IntelliRefLine.kfLineMapping.get(kf.id).lineId
          );
          if (typeof corresRefLine !== "undefined") {
            corresRefLine.hideLine();
          }
        }
      });
      //triger action
      if ((<KfGroup>KfItem.dragInfo.targetMoveItem).alignMerge) {
        KfItem.dragInfo.updateSpec = false;
      } else {
        KfItem.dragInfo.updateSpec = true;
        KfItem.dragInfo.actionType = UPDATE_ALIGN_MERGE;
        KfItem.dragInfo.actionInfo = {
          aniId: KfItem.dragInfo.dragItem.aniId,
          merge: true,
        };
      }
    } else if (
      (currentBBox.top - alignWithGroupBBox.top) /
        store.getState().kfZoomLevel >=
      TRACK_HEIGHT * 0.6
    ) {
      //set merge to false
      //change align frame to ref line
      allKfItems.forEach((kf: KfItem) => {
        kf.hideAlignFrame();
        if (typeof IntelliRefLine.kfLineMapping.get(kf.id) !== "undefined") {
          const corresRefLine: IntelliRefLine = IntelliRefLine.allLines.get(
            IntelliRefLine.kfLineMapping.get(kf.id).lineId
          );
          if (typeof corresRefLine !== "undefined") {
            corresRefLine.showLine();
          }
        }
      });
      //triger action
      if ((<KfGroup>KfItem.dragInfo.targetMoveItem).alignMerge) {
        KfItem.dragInfo.updateSpec = true;
        KfItem.dragInfo.actionType = UPDATE_ALIGN_MERGE;
        KfItem.dragInfo.actionInfo = {
          aniId: KfItem.dragInfo.dragItem.aniId,
          merge: false,
        };
      } else {
        KfItem.dragInfo.updateSpec = false;
      }
    }
  }

  public upKfGroupTarget() {
    if (!KfItem.dragInfo.updateSpec) {
      KfItem.dragInfo.targetMoveItem.container.setAttributeNS(
        null,
        "transform",
        KfItem.dragInfo.targetMoveItem.container.getAttributeNS(
          null,
          "_transform"
        )
      );
      KfItem.dragInfo.targetMoveItem.parentObj.container.appendChild(
        KfItem.dragInfo.targetMoveItem.container
      );
    } else {
      store.dispatch({
        type: KfItem.dragInfo.actionType,
        payload: {
          infoObj: KfItem.dragInfo.actionInfo,
        },
      });
      // Reducer.triger(KfItem.dragInfo.actionType, KfItem.dragInfo.actionInfo);
      const popKfContainer: HTMLElement =
        document.getElementById(KF_POPUP_LAYER);
      popKfContainer.removeChild(KfItem.dragInfo.targetMoveItem.container);
    }
  }

  public moveKfTarget(currentPosi: ICoord, prePosi: ICoord) {
    const posiDiff: ICoord = {
      x: (currentPosi.x - prePosi.x) / store.getState().kfZoomLevel,
      y: (currentPosi.y - prePosi.y) / store.getState().kfZoomLevel,
    };
    // console.log('moveing kf: ', currentPosi, prePosi, posiDiff, KfItem.dragInfo.dragItem);

    //check whether the kf is still inside its group
    // let looseFocus: boolean = KfItem.dragInfo.dragItem.checkDragOutOfGroup(posiDiff);

    // if (!looseFocus) {
    const oriTrans: ICoord = jsTool.extractTransNums(
      KfItem.dragInfo.dragItem.container.getAttributeNS(null, "transform")
    );
    KfItem.dragInfo.dragItem.translateContainer(
      oriTrans.x + posiDiff.x,
      oriTrans.y
    );
    if (KfItem.dragInfo.dragItem.idxInGroup > 0) {
      //this is not the first kf in group, need to check the position relation with previous kf
      const currentKfLeft: number =
        KfItem.dragInfo.dragItem.kfBg.getBoundingClientRect().left; //fixed
      // const preKfRight: number = preSibling.kfBg.getBoundingClientRect().right;//fixed
      const preKfDurationW: number =
        KfItem.BASIC_OFFSET_DURATION_W > KfItem.dragInfo.dragItem.durationWidth
          ? KfItem.BASIC_OFFSET_DURATION_W
          : KfItem.dragInfo.dragItem.durationWidth;
      const posiXDiff: number =
        (currentKfLeft - KfItem.dragInfo.preKfRight) /
        store.getState().kfZoomLevel;
      const currentKfOffsetW: number =
        KfItem.BASIC_OFFSET_DURATION_W > KfItem.dragInfo.dragItem.offsetWidth
          ? KfItem.BASIC_OFFSET_DURATION_W
          : KfItem.dragInfo.dragItem.offsetWidth;
      if (posiXDiff >= currentKfOffsetW + preKfDurationW) {
        //show both pre duration and current offset
        if (KfItem.dragInfo.dragItem.hasOffset) {
          KfItem.dragInfo.dragItem.showOffset();
        } else {
          if (typeof KfItem.dragInfo.dragItem.offsetIllus === "undefined") {
            KfItem.dragInfo.dragItem.drawOffset(
              KfItem.minOffset,
              KfItem.dragInfo.dragItem.kfHeight,
              0,
              true
            );
          }
          KfItem.dragInfo.dragItem.container.appendChild(
            KfItem.dragInfo.dragItem.offsetIllus
          );
        }
        //show pre duration
        if (KfItem.dragInfo.preSibling instanceof KfItem) {
          if (
            KfItem.dragInfo.preSibling.hasDuration ||
            KfItem.dragInfo.preSibling.hasHiddenDuration
          ) {
            KfItem.dragInfo.preSibling.showDuration();
          } else {
            if (
              typeof KfItem.dragInfo.preSibling.durationIllus === "undefined"
            ) {
              KfItem.dragInfo.preSibling.drawDuration(
                KfItem.minDuration,
                KfItem.dragInfo.dragItem.kfWidth,
                KfItem.dragInfo.dragItem.kfHeight,
                false
              );
            }
            KfItem.dragInfo.preSibling.container.appendChild(
              KfItem.dragInfo.preSibling.durationIllus
            );
          }
        } else if (KfItem.dragInfo.preSibling instanceof KfOmit) {
          //show fake duration
          KfItem.dragInfo.hintPosiLine.showFakeDuration(
            {
              x: KfItem.dragInfo.containerBBox.left,
              y: KfItem.dragInfo.containerBBox.top,
            },
            KfItem.dragInfo.containerBBox.height
          );
        }

        //target actions
        if (
          !KfItem.dragInfo.dragItem.hasOffset &&
          KfItem.dragInfo.preSibling.hasDuration
        ) {
          KfItem.dragInfo.updateSpec = true; //add default offset between kfs
          KfItem.dragInfo.actionType = UPDATE_DELAY_BETWEEN_KF;
          KfItem.dragInfo.actionInfo.aniId =
            KfItem.dragInfo.dragItem.parentObj.aniId;
          KfItem.dragInfo.actionInfo.delay = 300;
        } else if (
          !KfItem.dragInfo.preSibling.hasDuration &&
          KfItem.dragInfo.dragItem.hasOffset
        ) {
          KfItem.dragInfo.updateSpec = true; //change timing ref from with to after
          KfItem.dragInfo.actionType = UPDATE_KF_TIMING_REF;
          KfItem.dragInfo.actionInfo.aniId =
            KfItem.dragInfo.dragItem.parentObj.aniId;
          KfItem.dragInfo.actionInfo.ref = TimingSpec.timingRef.previousEnd;
        } else {
          KfItem.dragInfo.updateSpec = false;
          KfItem.dragInfo.actionInfo = {};
        }
      } else if (
        posiXDiff >= preKfDurationW &&
        posiXDiff < currentKfOffsetW + preKfDurationW
      ) {
        //show pre duration
        if (KfItem.dragInfo.dragItem.hasOffset) {
          KfItem.dragInfo.dragItem.hideOffset();
        } else {
          if (
            typeof KfItem.dragInfo.dragItem.offsetIllus !== "undefined" &&
            KfItem.dragInfo.dragItem.container.contains(
              KfItem.dragInfo.dragItem.offsetIllus
            )
          ) {
            KfItem.dragInfo.dragItem.container.removeChild(
              KfItem.dragInfo.dragItem.offsetIllus
            );
          }
        }
        //show pre duration
        if (KfItem.dragInfo.preSibling instanceof KfItem) {
          if (
            KfItem.dragInfo.preSibling.hasDuration ||
            KfItem.dragInfo.preSibling.hasHiddenDuration
          ) {
            KfItem.dragInfo.preSibling.showDuration();
          } else {
            if (
              typeof KfItem.dragInfo.preSibling.durationIllus === "undefined"
            ) {
              KfItem.dragInfo.preSibling.drawDuration(
                KfItem.minDuration,
                KfItem.dragInfo.dragItem.kfWidth,
                KfItem.dragInfo.dragItem.kfHeight,
                false
              );
            }
            KfItem.dragInfo.preSibling.container.appendChild(
              KfItem.dragInfo.preSibling.durationIllus
            );
          }
        } else if (KfItem.dragInfo.preSibling instanceof KfOmit) {
          //show fake duration
          KfItem.dragInfo.hintPosiLine.showFakeDuration(
            {
              x: KfItem.dragInfo.containerBBox.left,
              y: KfItem.dragInfo.containerBBox.top,
            },
            KfItem.dragInfo.containerBBox.height
          );
        }

        //target actions
        if (
          KfItem.dragInfo.dragItem.hasOffset &&
          KfItem.dragInfo.preSibling.hasDuration
        ) {
          KfItem.dragInfo.updateSpec = true; //remove offset between kfs
          KfItem.dragInfo.actionType = REMOVE_DELAY_BETWEEN_KF;
          KfItem.dragInfo.actionInfo.aniId =
            KfItem.dragInfo.dragItem.parentObj.aniId;
        } else if (
          KfItem.dragInfo.dragItem.hasOffset &&
          !KfItem.dragInfo.preSibling.hasDuration
        ) {
          KfItem.dragInfo.updateSpec = true; //change timing ref from with to after and remove offset
          KfItem.dragInfo.actionType = UPDATE_TIMING_REF_DELAY_KF;
          KfItem.dragInfo.actionInfo.aniId =
            KfItem.dragInfo.dragItem.parentObj.aniId;
          KfItem.dragInfo.actionInfo.ref = TimingSpec.timingRef.previousEnd;
          // actionInfo.delay = 300;
        } else {
          KfItem.dragInfo.updateSpec = false;
          KfItem.dragInfo.actionInfo = {};
        }
      } else if (posiXDiff < preKfDurationW && posiXDiff >= 0) {
        //show current offset and hide pre duration
        if (KfItem.dragInfo.dragItem.hasOffset) {
          KfItem.dragInfo.dragItem.showOffset();
        } else {
          if (typeof KfItem.dragInfo.dragItem.offsetIllus === "undefined") {
            KfItem.dragInfo.dragItem.drawOffset(
              KfItem.minOffset,
              KfItem.dragInfo.dragItem.kfHeight,
              0,
              true
            );
          }
          KfItem.dragInfo.dragItem.container.appendChild(
            KfItem.dragInfo.dragItem.offsetIllus
          );
        }
        //hide pre duration
        if (KfItem.dragInfo.preSibling instanceof KfItem) {
          if (
            KfItem.dragInfo.preSibling.hasDuration ||
            KfItem.dragInfo.preSibling.hasHiddenDuration
          ) {
            KfItem.dragInfo.preSibling.hideDuration();
          } else {
            if (
              typeof KfItem.dragInfo.preSibling.durationIllus !== "undefined" &&
              KfItem.dragInfo.preSibling.container.contains(
                KfItem.dragInfo.preSibling.durationIllus
              )
            ) {
              KfItem.dragInfo.preSibling.container.removeChild(
                KfItem.dragInfo.preSibling.durationIllus
              );
            }
          }
        } else if (KfItem.dragInfo.preSibling instanceof KfOmit) {
          //hide fake duration
          KfItem.dragInfo.hintPosiLine.removeFakeDuration();
        }

        //target actions
        if (
          !KfItem.dragInfo.dragItem.hasOffset &&
          KfItem.dragInfo.preSibling.hasDuration
        ) {
          KfItem.dragInfo.updateSpec = true; //change timing ref from after to with, and add default offset
          KfItem.dragInfo.actionType = UPDATE_TIMING_REF_DELAY_KF;
          KfItem.dragInfo.actionInfo.aniId =
            KfItem.dragInfo.dragItem.parentObj.aniId;
          KfItem.dragInfo.actionInfo.ref = TimingSpec.timingRef.previousStart;
          KfItem.dragInfo.actionInfo.delay = 300;
        } else if (
          KfItem.dragInfo.dragItem.hasOffset &&
          KfItem.dragInfo.preSibling.hasDuration
        ) {
          KfItem.dragInfo.updateSpec = true; //change timing ref from after to with
          KfItem.dragInfo.actionType = UPDATE_KF_TIMING_REF;
          KfItem.dragInfo.actionInfo.aniId =
            KfItem.dragInfo.dragItem.parentObj.aniId;
          KfItem.dragInfo.actionInfo.ref = TimingSpec.timingRef.previousStart;
        } else {
          KfItem.dragInfo.updateSpec = false;
          KfItem.dragInfo.actionInfo = {};
        }
      } else {
        //hide pre duration, this offset and highlight them
        if (KfItem.dragInfo.dragItem.hasOffset) {
          KfItem.dragInfo.dragItem.hideOffset();
        } else {
          if (
            typeof KfItem.dragInfo.dragItem.offsetIllus !== "undefined" &&
            KfItem.dragInfo.dragItem.container.contains(
              KfItem.dragInfo.dragItem.offsetIllus
            )
          ) {
            KfItem.dragInfo.dragItem.container.removeChild(
              KfItem.dragInfo.dragItem.offsetIllus
            );
          }
        }

        //hide pre duration
        if (KfItem.dragInfo.preSibling instanceof KfItem) {
          if (
            KfItem.dragInfo.preSibling.hasDuration ||
            KfItem.dragInfo.preSibling.hasHiddenDuration
          ) {
            KfItem.dragInfo.preSibling.hideDuration();
          } else {
            if (
              typeof KfItem.dragInfo.preSibling.durationIllus !== "undefined" &&
              KfItem.dragInfo.preSibling.container.contains(
                KfItem.dragInfo.preSibling.durationIllus
              )
            ) {
              KfItem.dragInfo.preSibling.container.removeChild(
                KfItem.dragInfo.preSibling.durationIllus
              );
            }
          }
        } else if (KfItem.dragInfo.preSibling instanceof KfOmit) {
          //hide fake duration
          KfItem.dragInfo.hintPosiLine.removeFakeDuration();
        }

        //target actions
        KfItem.dragInfo.updateSpec = true; //remove lowest level grouping
        KfItem.dragInfo.actionType = REMOVE_LOWESTGROUP;
        KfItem.dragInfo.actionInfo.aniId =
          KfItem.dragInfo.dragItem.parentObj.aniId;
      }
    }
    // }
  }

  public upKfTarget() {
    KfItem.dragInfo.hintPosiLine.removeHintLine();
    KfItem.dragInfo.hintPosiLine.removeFakeDuration();
    if (!KfItem.dragInfo.updateSpec) {
      if (
        typeof KfItem.dragInfo.preSibling !== "undefined" &&
        KfItem.dragInfo.preSibling instanceof KfItem
      ) {
        KfItem.dragInfo.preSibling.showDuration();
      }
      KfItem.dragInfo.dragItem.container.setAttributeNS(
        null,
        "transform",
        KfItem.dragInfo.dragItem.container.getAttributeNS(null, "_transform")
      );
      if (typeof KfItem.dragInfo.nextSibling !== "undefined") {
        KfItem.dragInfo.dragItem.parentObj.container.insertBefore(
          KfItem.dragInfo.dragItem.container,
          KfItem.dragInfo.nextSibling.container
        );
      } else {
        KfItem.dragInfo.dragItem.parentObj.container.appendChild(
          KfItem.dragInfo.dragItem.container
        );
      }
    } else {
      store.dispatch({
        type: KfItem.dragInfo.actionType,
        payload: {
          infoObj: KfItem.dragInfo.actionInfo,
        },
      });
      const popKfContainer: HTMLElement =
        document.getElementById(KF_POPUP_LAYER);
      popKfContainer.removeChild(KfItem.dragInfo.dragItem.container);
    }
  }

  public startDragKf(kfId: number): IDragItemInfo {
    if (!isNaN(kfId)) {
      const targetKf: KfItem = KfItem.allKfItems.get(kfId);
      const targetMoveItem: KfGroup | KfItem =
        typeof targetKf.kfInfo.alignTo !== "undefined"
          ? targetKf.parentObj.fetchAniGroup()
          : targetKf;
      const popKfContainer: HTMLElement =
        document.getElementById(KF_POPUP_LAYER);
      const popKfContainerBbox: DOMRect =
        popKfContainer.getBoundingClientRect(); //fixed
      const containerBBox = createPopupComponent(targetMoveItem);

      //add hint line if moving a single kf
      let hintPosiLine: IntelliRefLine = new IntelliRefLine();
      if (targetMoveItem instanceof KfItem) {
        hintPosiLine.hintAlign(
          { x: containerBBox.left, y: containerBBox.top },
          containerBBox.height,
          false
        );
      }

      //set new transform
      if (targetMoveItem instanceof KfGroup) {
        targetMoveItem.translateContainer(
          (containerBBox.left - popKfContainerBbox.left) /
            store.getState().kfZoomLevel,
          (containerBBox.top - popKfContainerBbox.top + GROUP_TITLE_HEIHGT) /
            store.getState().kfZoomLevel
        );
      } else {
        targetMoveItem.translateContainer(
          (containerBBox.left - popKfContainerBbox.left) /
            store.getState().kfZoomLevel,
          (containerBBox.top - popKfContainerBbox.top) /
            store.getState().kfZoomLevel
        );
      }

      const preSibling: KfItem | KfOmit = <KfItem | KfOmit>(
        targetKf.parentObj.children[targetKf.idxInGroup - 1]
      );
      const nextSibling: KfItem | KfOmit = <KfItem | KfOmit>(
        targetKf.parentObj.children[targetKf.idxInGroup + 1]
      );
      const firstSibling: KfItem = <KfItem>targetKf.parentObj.children[0];
      let preKfRight: number = containerBBox.left;
      // let visualPresiblingDurationW: number = 0;
      if (
        typeof preSibling !== "undefined" &&
        typeof firstSibling !== "undefined"
      ) {
        // visualPresiblingDurationW = preSibling.container.getBoundingClientRect().right - preSibling.kfBg.getBoundingClientRect().right;
        if (preSibling instanceof KfItem) {
          preKfRight = preSibling.kfBg.getBoundingClientRect().right;
        } else {
          preKfRight =
            containerBBox.left -
            (firstSibling.container.getBoundingClientRect().right -
              firstSibling.kfBg.getBoundingClientRect().right);
        }
      }
      return {
        targetMoveItem: targetMoveItem,
        dragItem: targetKf,
        updateSpec: false,
        actionType: "",
        actionInfo: {},
        preSibling: preSibling,
        nextSibling: nextSibling,
        firstSibling: firstSibling,
        preKfRight: preKfRight,
        hintPosiLine: hintPosiLine,
        containerBBox: containerBBox,
      };
    }
    return null;
  }

  /**
   * when dragging a group, check whether it is outside its parent group
   */
  public checkDragOutOfGroup(posiDiff: ICoord): boolean {
    const parentBBox: DOMRect =
      this.parentObj.container.getBoundingClientRect();
    const tmpCurrentBBox: DOMRect = this.container.getBoundingClientRect();

    if (
      tmpCurrentBBox.top + posiDiff.y < parentBBox.top ||
      tmpCurrentBBox.bottom + posiDiff.y > parentBBox.bottom ||
      tmpCurrentBBox.left + posiDiff.x < parentBBox.left ||
      tmpCurrentBBox.right + posiDiff.x > parentBBox.right
    ) {
      return true;
    }
    return false;
  }

  public drawKfBg(treeLevel: number, size?: ISize): void {
    if (typeof size !== "undefined") {
      this.kfWidth = size.width;
    } else {
      this.kfWidth = KF_WIDTH - treeLevel * KF_W_STEP;
    }
    this.kfBg = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        fill: "#fff",
        stroke: "#e4e4e4",
        strokeWidth: "1",
        x: `${typeof this.offsetIllus === "undefined" ? 0 : this.offsetWidth}`,
        y: "0",
        width: `${this.kfWidth}`,
        height: `${this.kfHeight}`,
      },
      flag: true,
    });
    this.totalWidth += this.kfWidth;
  }

  public drawChart(
    allMarks: string[],
    allGroupMarks: string[],
    marksThisKf: string[],
    chartThumbnail?: string
  ): void {
    if (typeof chartThumbnail === "undefined") {
      const svg: HTMLElement = document.getElementById("visChart");
      Array.from(svg.getElementsByClassName("mark")).forEach(
        (m: HTMLElement) => {
          if (!allMarks.includes(m.id) && !marksThisKf.includes(m.id)) {
            m.setAttributeNS(
              null,
              "_opacity",
              m.getAttributeNS(null, "opacity")
                ? m.getAttributeNS(null, "opacity")
                : "1"
            );
            m.setAttributeNS(null, "opacity", "0");
            m.classList.add("translucent-mark");
          } else if (
            allMarks.includes(m.id) &&
            !marksThisKf.includes(m.id) &&
            !allGroupMarks.includes(m.id)
          ) {
            m.setAttributeNS(
              null,
              "_opacity",
              m.getAttributeNS(null, "opacity")
                ? m.getAttributeNS(null, "opacity")
                : "1"
            );
            m.setAttributeNS(null, "opacity", "0.4");
            m.classList.add("translucent-mark");
          } else if (marksThisKf.includes(m.id)) {
            m.setAttributeNS(
              null,
              "_opacity",
              m.getAttributeNS(null, "opacity")
                ? m.getAttributeNS(null, "opacity")
                : "1"
            );
            m.setAttributeNS(null, "opacity", "1");
            m.classList.remove("translucent-mark");
            m.classList.add("include-mark");
          }
        }
      );
      this.renderChartToCanvas(svg, true);
      Array.from(svg.getElementsByClassName("translucent-mark")).forEach(
        (m: HTMLElement) => {
          m.classList.remove("translucent-mark");
          m.setAttributeNS(null, "opacity", m.getAttributeNS(null, "_opacity"));
        }
      );
      Array.from(svg.getElementsByClassName("include-mark")).forEach(
        (m: HTMLElement) => {
          m.classList.remove("include-mark");
          m.setAttributeNS(null, "opacity", m.getAttributeNS(null, "_opacity"));
        }
      );
    } else {
      const tmpContainer: HTMLDivElement = document.createElement("div");
      tmpContainer.innerHTML = chartThumbnail;
      this.renderChartToCanvas(<HTMLElement>tmpContainer.children[0], false);
    }
  }

  /**
   * remove highlight frames in chart when creating thumbnails
   */
  public removeHghlights(chartContent: HTMLElement): HTMLElement {
    const selectionFrame: HTMLElement = chartContent.querySelector(
      `#${SELECTION_FRAME}`
    );
    const suggestionFrames: HTMLElement[] = Array.from(
      chartContent.querySelectorAll(`.${SUGGEST_FRAME_CLS}`)
    );
    if (selectionFrame && typeof selectionFrame !== "undefined") {
      selectionFrame.remove();
    }
    suggestionFrames.forEach((f: HTMLElement) => {
      f.remove();
    });
    return chartContent;
  }

  public renderChartToCanvas(svg: HTMLElement, doEnlarge: boolean): void {
    // const thumbNailSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let thumbNailSvg: HTMLElement = <HTMLElement>svg.cloneNode(true);
    const chartContent: SVGGElement = svg.querySelector("#chartContent");
    let thumbNailChartContent: HTMLElement =
      thumbNailSvg.querySelector("#chartContent");
    const chartL: number = (svg as Node as SVGSVGElement).getBBox().x;
    const chartT: number = (svg as Node as SVGSVGElement).getBBox().y;
    const chartW: number = (svg as Node as SVGSVGElement).getBBox().width;
    const chartH: number = (svg as Node as SVGSVGElement).getBBox().height;
    thumbNailSvg.setAttribute("width", `${chartW}`);
    thumbNailSvg.setAttribute("height", `${chartH}`);
    thumbNailSvg.setAttribute(
      "viewBox",
      `${chartL} ${chartT} ${chartW} ${chartH}`
    );
    // thumbNailChartContent.setAttributeNS(
    //   null,
    //   "transform",
    //   `scale(${store.getState().chartScaleRatio})`
    // );
    thumbNailSvg = this.removeHghlights(thumbNailSvg);
    const shownThumbnail: number = Math.floor(
      (store.getState().kfZoomLevel - MIN_ZOOM_LEVEL) /
        ((MAX_ZOOM_LEVEL - MIN_ZOOM_LEVEL) / (CHART_THUMBNAIL_ZOOM_LEVEL / 2))
    );
    for (let i = 0; i < CHART_THUMBNAIL_ZOOM_LEVEL / 2; i++) {
      if (doEnlarge) {
        enlargeMarks(
          thumbNailSvg,
          "translucent-mark",
          CHART_THUMBNAIL_ZOOM_LEVEL / 2 - i,
          false
        );
      }
      this.chartThumbnails.push(
        this.createImage(thumbNailSvg, shownThumbnail - 1 === i)
      );
      if (doEnlarge) {
        resetTxtCover(thumbNailSvg);
      }
    }
    if (doEnlarge) {
      resetMarkSize(thumbNailSvg, "translucent-mark", false);
    }
  }

  public createImage(svg: HTMLElement, shown: boolean): SVGImageElement {
    let imgSrc: string = jsTool.svg2url(svg);
    const chartThumbnail: SVGImageElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "image"
    );
    if (!shown) {
      chartThumbnail.classList.add("no-display-ele");
    }
    chartThumbnail.setAttributeNS(
      null,
      "x",
      `${typeof this.offsetIllus === "undefined" ? 0 : this.offsetWidth}`
    );
    chartThumbnail.setAttributeNS(null, "y", "0");
    chartThumbnail.setAttributeNS(null, "width", `${this.kfWidth}`);
    chartThumbnail.setAttributeNS(null, "height", `${this.kfHeight}`);
    chartThumbnail.setAttributeNS(null, "href", imgSrc);
    chartThumbnail.setAttributeNS(null, "kfId", `${this.id}`);
    this.container.appendChild(chartThumbnail);
    return chartThumbnail;
  }

  public highlightKf() {
    this.kfBg.classList.add("highlight-kf");
    Array.from(document.getElementsByClassName("mark")).forEach(
      (m: HTMLElement) => {
        [...this.kfInfo.allCurrentMarks, ...this.kfInfo.marksThisKf].includes(
          m.id
        )
          ? m.classList.remove("non-framed-mark")
          : m.classList.add("non-framed-mark");
      }
    );
  }

  public cancelHighlightKf() {
    this.kfBg.classList.remove("highlight-kf");
  }

  /**
   * translate kfs and groups aligned to this kf
   * @param transX
   * @param updateAlignedKfs: might further influence other aligned elements
   */
  public translateAlignedGroups(
    transX: number,
    updateAlignedKfs: boolean
  ): void {
    if (typeof KfItem.allKfInfo.get(this.id).alignWithKfs !== "undefined") {
      IntelliRefLine.updateLine(this.id); //k is a alignwith kf, update refline
      KfItem.allKfInfo.get(this.id).alignWithKfs.forEach((kfId: number) => {
        const tmpKfItem = KfItem.allKfItems.get(kfId);
        if (typeof tmpKfItem !== "undefined") {
          // tmpKfItem.parentObj.translateGroup(tmpKfItem, transX, updateAlignedKfs, true, true);
          const tmpTrans: ICoord = jsTool.extractTransNums(
            tmpKfItem.container.getAttributeNS(null, "transform")
          );
          tmpKfItem.translateContainer(tmpTrans.x + transX, tmpTrans.y);
          let [diffX, currentGroupWidth, childHeight] =
            tmpKfItem.parentObj.updateSize();
          const oriTrans: ICoord = jsTool.extractTransNums(
            tmpKfItem.parentObj.container.getAttributeNS(null, "transform")
          );
          tmpKfItem.parentObj.translateContainer(
            oriTrans.x + diffX,
            oriTrans.y
          );
          //check whether need to update omit
          tmpKfItem.parentObj.kfOmits.forEach((kfo: KfOmit) => {
            const omitTrans: ICoord = jsTool.extractTransNums(
              kfo.container.getAttributeNS(null, "transform")
            );
            if (omitTrans.x >= tmpTrans.x) {
              let omitTransX: number = diffX === 0 ? transX : 0;
              kfo.translateContainer(omitTrans.x + omitTransX, omitTrans.y);
            }
          });
        }
      });
    }
  }

  public zoomItem(shownThumbnail: number): void {
    this.chartThumbnails.forEach((ct: SVGImageElement, i: number) => {
      if (i === shownThumbnail - 1) {
        ct.classList.remove("no-display-ele");
      } else {
        ct.classList.add("no-display-ele");
      }
    });
  }

  /**
   * check whether there are ancessters which are not rendered when zoomming
   */
  public checkParentRenderedWhenZooming(): boolean {
    let parent: KfGroup | KfTrack = this.parentObj;
    while (true) {
      if (parent instanceof KfTrack) {
        break;
      } else {
        if (!parent.renderWhenZooming || !parent.rendered) {
          return false;
        }
        parent = parent.parentObj;
      }
    }
    return true;
  }

  /**
   * return omit pattern and total height, currnet kf is the alignwith kf
   */
  public findOmitPattern(): [IOmitPattern[], number] {
    const currentKfInfo: IKeyframe = KfItem.allKfInfo.get(this.id);
    const omitPattern: IOmitPattern[] = [];
    let totalHeight: number = 0;
    if (typeof currentKfInfo !== "undefined") {
      omitPattern.push({
        merge: false,
        timing: TimingSpec.timingRef.previousStart,
        hasOffset: this.hasOffset,
        hasDuration: true,
      });
      totalHeight = TRACK_HEIGHT;
      currentKfInfo.alignWithKfs.forEach((tmpKfId: number) => {
        const tmpKf: KfItem = KfItem.allKfItems.get(tmpKfId);
        const tmpKfInfo: IKeyframe = KfItem.allKfInfo.get(tmpKfId);
        const tmpKfGroup: KfGroup = tmpKf.parentObj;
        if (!tmpKfGroup.alignMerge) {
          totalHeight += TRACK_HEIGHT;
        }
        omitPattern.push({
          merge: tmpKfGroup.alignMerge,
          timing: tmpKfInfo.timingRef,
          hasOffset: tmpKf.hasOffset,
          hasDuration: true,
        });
      });
    }
    return [omitPattern, totalHeight];
  }

  public showItemWhenZooming(): void {
    if (this.rendered) {
      const currentKfWidth: number =
        this.container.getBoundingClientRect().width /
        store.getState().kfZoomLevel; //current width with no white space (when align to others, the white space is included in the totalWidth attrbute)
      let kfWidthWithWhiteSpace: number = currentKfWidth;
      const currentKfTrans: ICoord = jsTool.extractTransNums(
        this.container.getAttributeNS(null, "transform")
      );
      let currentKfIdx: number = this.idxInGroup;
      let passedOmits: number = 0;
      let omitWidth: number = KfOmit.OMIT_WIDTH;

      while (true) {
        if (currentKfIdx - 1 >= 0) {
          const preChild: KfItem | KfOmit = <KfItem | KfOmit>(
            this.parentObj.children[currentKfIdx - 1]
          );
          let preChildWidth: number =
            preChild.container.getBoundingClientRect().width /
            store.getState().kfZoomLevel;
          let preChildTrans: ICoord = jsTool.extractTransNums(
            preChild.container.getAttributeNS(null, "transform")
          );
          if (preChild instanceof KfItem) {
            if (
              preChildTrans.x +
                preChildWidth +
                passedOmits * (GROUP_PADDING * 2 + omitWidth) ===
              currentKfTrans.x
            ) {
              break;
            } else if (
              currentKfTrans.x >
              preChildTrans.x +
                preChildWidth +
                passedOmits * (GROUP_PADDING * 2 + omitWidth)
            ) {
              kfWidthWithWhiteSpace +=
                currentKfTrans.x -
                preChildTrans.x -
                preChildWidth -
                passedOmits * (GROUP_PADDING * 2 + omitWidth);
              break;
            }
          } else if (preChild instanceof KfOmit) {
            omitWidth = KfOmit.maxOmitWidth;
            passedOmits++;
          }
          currentKfIdx--;
        } else {
          break;
        }
      }

      //if this kf is aligned to or with some kf, fetch the line
      let refLine: IntelliRefLine;
      if (typeof IntelliRefLine.kfLineMapping.get(this.id) !== "undefined") {
        refLine = IntelliRefLine.allLines.get(
          IntelliRefLine.kfLineMapping.get(this.id).lineId
        );
      } else {
        //check whether this is an alignto kf
        if (
          typeof KfItem.allKfInfo.get(this.id).alignTo !== "undefined" &&
          typeof IntelliRefLine.kfLineMapping.get(
            KfItem.allKfInfo.get(this.id).alignTo
          ) !== "undefined"
        ) {
          refLine = IntelliRefLine.allLines.get(
            IntelliRefLine.kfLineMapping.get(
              KfItem.allKfInfo.get(this.id).alignTo
            ).lineId
          );
        }
      }
      const kfZoomLevel: number = calKfZoomLevel();
      if (!this.renderWhenZooming) {
        //rendered -> not rendered : scale down
        this.container.setAttributeNS(null, "display", "none");
        if (typeof refLine !== "undefined") {
          refLine.zoomHideLine();
        }
        if (this.parentObj.kfOmits.length === 0) {
          const kfTrans: ICoord = jsTool.extractTransNums(
            this.container.getAttributeNS(null, "transform")
          );
          const kfOmit: KfOmit = new KfOmit();
          //decide the omit pattern
          let omitType: string = KfOmit.KF_OMIT;
          let omitStartY: number = this.kfHeight / 2;
          if (
            typeof KfItem.allKfInfo.get(this.id).alignWithKfs !== "undefined"
          ) {
            if (KfItem.allKfInfo.get(this.id).alignWithKfs.length > 0) {
              omitType = KfOmit.KF_ALIGN;
              [kfOmit.omitPattern, omitStartY] = this.findOmitPattern();
              omitStartY /= 2;
            }
          }
          kfOmit.createOmit(
            omitType,
            kfTrans.x + kfWidthWithWhiteSpace - GROUP_PADDING,
            1,
            this.parentObj,
            this.hasOffset,
            this.hasDuration,
            omitStartY,
            this.idxInGroup
          );
          this.parentObj.insertChild(kfOmit, this.idxInGroup + 1);
          kfOmit.idxInGroup = this.idxInGroup + 1;
          this.parentObj.kfOmits.push(kfOmit);
          this.parentObj.translateGroup(
            this,
            -kfWidthWithWhiteSpace + KfOmit.maxOmitWidth,
            false,
            false,
            false
          );
          //update the position of omits
          const oriOmitTrans: ICoord = jsTool.extractTransNums(
            kfOmit.container.getAttributeNS(null, "transform")
          );
          kfOmit.updateTrans(
            oriOmitTrans.x - KfOmit.maxOmitWidth,
            oriOmitTrans.y + kfOmit.oHeight / 2
          );
        } else {
          this.parentObj.kfOmits[0].updateNum(
            this.parentObj.kfOmits[0].omittedNum + 1
          );
          this.parentObj.translateGroup(
            this,
            -kfWidthWithWhiteSpace,
            false,
            false,
            false
          );
        }
      } else {
        //not rendered -> rendered: scale up
        this.container.setAttributeNS(null, "display", "");
        if (typeof refLine !== "undefined") {
          refLine.zoomShowLine();
        }
        if (this.parentObj.kfOmits[0].omittedNum === 1) {
          //remove kfOmit
          const tmpOmit: KfOmit = this.parentObj.kfOmits[0];
          tmpOmit.removeOmit(this.parentObj);
          this.parentObj.removeChild(this.parentObj.kfOmits[0].idxInGroup);
          this.parentObj.translateGroup(
            <KfItem | KfOmit>this.parentObj.children[this.idxInGroup - 1],
            -omitWidth,
            false,
            false,
            false
          );
          this.parentObj.translateGroup(
            this,
            kfWidthWithWhiteSpace,
            false,
            false,
            false
          );
          this.parentObj.kfOmits.splice(0, 1);
        } else {
          //update number
          this.parentObj.kfOmits[0].updateNum(
            this.parentObj.kfOmits[0].omittedNum - 1
          );
          this.parentObj.translateGroup(
            this,
            kfWidthWithWhiteSpace,
            false,
            false,
            false
          );
          //restore the omit position to the right side of its preItem
          // const preItemTrans: ICoord = jsTool.extractTransNums(this.parentObj.kfOmits[0].preItem.container.getAttributeNS(null, 'transform'));
          // const oriOmitTrans: ICoord = jsTool.extractTransNums(this.parentObj.kfOmits[0].container.getAttributeNS(null, 'transform'));
          // const preKfWidth: number = (<KfItem>this.parentObj.kfOmits[0].preItem).container.getBoundingClientRect().width / store.getState().kfZoomLevel;
          // this.parentObj.kfOmits[0].updateTrans(preItemTrans.x + preKfWidth, oriOmitTrans.y + this.parentObj.kfOmits[0].oHeight / 2);
          this.transOmitsWithItem();
        }
      }
    }
  }
}

export const KF_PRESS: string = "kfPress";
export const pressKf = new AniMIL.Press({
  time: 300,
  event: KF_PRESS,
});
