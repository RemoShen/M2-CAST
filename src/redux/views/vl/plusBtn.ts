import KfGroup, { GROUP_PADDING, GROUP_RX } from "./kfGroup";
import { Animation, ChartSpec } from "canis_toolkit";
import KfItem from "./kfItem";
import KfTrack from "./kfTrack";
import {
  IKeyframe,
  ISize,
  IKeyframeGroup,
  ICoord,
} from "../../global-interfaces";
import { clearDragOver } from "../../../util/tool";
import { createSvgElement, updateProps } from "../../../util/svgManager";
import { jsTool } from "../../../util/jsTool";
import { toggleVoice } from "../../action/voiceAction";
import { store } from "../../store";
import {
  ISVGBtn,
  CIRCLE_BTN,
  PNT_DOWN_SIZE,
  BTN_CONTENT_TYPE_ICON,
  VOICE_ICON,
  BTN_CONTENT_TYPE_STR,
} from "../buttons/button-consts";
import { SVGBtn } from "../buttons/svgButton";
import { LIGHT_COLOR, DARK_COLOR } from "../menu/menu-consts";
import {
  updateActivatePlusBtn,
  updateHighlightKf,
} from "../../action/vlAction";

export default class PlusBtn {
  static BTN_SIZE: number = 32;
  static PADDING: number = 6;
  static BTN_COLOR: string = "#9fa0a0";
  static BTN_HIGHLIGHT_COLOR: string = "#358bcb";
  static BTN_DRAGOVER_COLOR: string = "#ea5514";
  static allPlusBtn: PlusBtn[] = [];
  static plusBtnMapping: Map<string, PlusBtn> = new Map(); //key: aniId, value: index in allPlusBtn
  static dragoverBtn: PlusBtn;
  static BTN_IDX: number = 0;

  // public parentObj: KfGroup;
  public onShow: boolean = true;
  public parentTrack: KfTrack;
  public targetKfg: KfGroup;
  public firstKfArrInTargetKfg: IKeyframe[];
  public fakeKfg: KfGroup;
  public id: number;
  public aniId: string;
  public kfSize: ISize;
  public acceptableCls: string[];
  public _isHighlighted: boolean = false;
  public container: SVGGElement;
  public btnBg: SVGRectElement;
  public btnIcon: SVGTextElement;
  public btn: SVGBtn;

  set isHighlighted(h: boolean) {
    this._isHighlighted = h;
    h ? this.highlightBtn() : this.cancelHighlightBtn();
  }

  get isHighlighted(): boolean {
    return this._isHighlighted;
  }

  // public static findPlusBtn(selectedCls: string[]) {
  //     for (let i = 0, len = this.allPlusBtn.length; i < len; i++) {
  //         const pb: PlusBtn = this.allPlusBtn[i];
  //         if (jsTool.arrayContained(pb.acceptableCls, selectedCls) && pb.onShow) {
  //             this.dragoverBtn = pb;
  //             break;
  //         }
  //     }
  // }

  // public static highlightPlusBtns(selectedCls: string[]): void {
  //     //filter which button to highlight (has the same accepatable classes)
  //     this.allPlusBtn.forEach((pb: PlusBtn) => {
  //         if (jsTool.arrayContained(pb.acceptableCls, selectedCls) && pb.onShow) {
  //             pb.isHighlighted = true;
  //             let transX: number = pb.kfSize.width - this.BTN_SIZE;
  //             // pb.targetKfg.translateWholeGroup(transX, true);
  //             const firstKf: KfItem = pb.targetKfg.fetchFirstKf();
  //             pb.targetKfg.translateGroup(firstKf, transX, true, true, true);
  //         }
  //     })
  // }

  // public static cancelHighlightPlusBtns(): void {
  //     this.allPlusBtn.forEach((pb: PlusBtn) => {
  //         if (pb.isHighlighted && pb.onShow) {
  //             pb.cancelHighlightBtn();
  //             let transX: number = pb.kfSize.width - this.BTN_SIZE;
  //             // pb.targetKfg.translateWholeGroup(-transX, true);
  //             const firstKf: KfItem = pb.targetKfg.fetchFirstKf();
  //             pb.targetKfg.translateGroup(firstKf, -transX, true, true, true);
  //         }
  //     })
  // }

  public static detectAdding(
    kfg: IKeyframeGroup,
    kfs: IKeyframe[]
  ): [boolean, string[]] {
    const kf0Marks = kfs[0].marksThisKf;
    let mClassCount: string[] = [];
    kf0Marks.forEach((mId: string) => {
      mClassCount.push(Animation.markClass.get(mId));
    });
    mClassCount = [...new Set(mClassCount)];

    if (typeof kfg.merge !== "undefined" && kfg.merge) {
      return [false, []];
    } else {
      if (mClassCount.length === 1) {
        let allDataEncoded: boolean = true;
        let hasDiffAttrValue: boolean = false;
        let datum0: any = ChartSpec.dataMarkDatum.get(kf0Marks[0]);
        for (let i = 1, len = kf0Marks.length; i < len; i++) {
          if (typeof ChartSpec.dataMarkDatum.get(kf0Marks[i]) === "undefined") {
            allDataEncoded = false;
            break;
          } else {
            const datum: any = ChartSpec.dataMarkDatum.get(kf0Marks[i]);
            for (let key in datum) {
              if (
                datum[key] !== datum0[key] &&
                typeof datum0[key] !== "undefined"
              ) {
                hasDiffAttrValue = true;
              }
            }
            if (hasDiffAttrValue) {
              break;
            }
          }
        }
        if (hasDiffAttrValue || (kfs.length === 1 && kf0Marks.length > 1)) {
          return [true, mClassCount];
        } else {
          return [false, []];
        }
      } else {
        return [true, mClassCount];
      }
    }
  }

  /**
   *
   * @param targetKfg : root group
   * @param parentTrack
   * @param startX
   * @param kfSize
   * @param acceptableCls
   */
  public createBtn(
    targetKfg: KfGroup,
    firstKfArrInTargetKfg: IKeyframe[],
    parentTrack: KfTrack,
    startX: number,
    kfSize: ISize,
    acceptableCls: string[]
  ): void {
    //create a blank kfg
    this.fakeKfg = new KfGroup();
    this.fakeKfg.createBlankKfg(
      parentTrack,
      targetKfg.aniId,
      startX + GROUP_PADDING
    );
    this.aniId = targetKfg.aniId;
    this.targetKfg = targetKfg;
    this.targetKfg.plusBtn = this;
    this.firstKfArrInTargetKfg = firstKfArrInTargetKfg;
    this.parentTrack = parentTrack;
    this.kfSize = kfSize;
    this.id = PlusBtn.BTN_IDX;
    PlusBtn.BTN_IDX++;
    this.acceptableCls = acceptableCls;

    const buttonProps: ISVGBtn = {
      type: CIRCLE_BTN,
      center: { x: PlusBtn.BTN_SIZE / 2, y: PlusBtn.BTN_SIZE / 2 },
      r: PlusBtn.BTN_SIZE / 2,
      appearAni: false,
      startFill: LIGHT_COLOR,
      endFill: DARK_COLOR,
      innerContent: {
        type: BTN_CONTENT_TYPE_STR,
        content: "+",
      },
      values: [],
      events: [],
    };

    this.container = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        transform: `translate(${PlusBtn.PADDING},${
          PlusBtn.PADDING + this.kfSize.height / 2 - PlusBtn.BTN_SIZE / 2
        })`,
      },
      flag: true,
    });
    this.btnBg = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        x: "0",
        y: "0",
        width: `${PlusBtn.BTN_SIZE}`,
        height: `${PlusBtn.BTN_SIZE}`,
        rx: `${GROUP_RX}`,
        fill: "#fff",
        stroke: `${PlusBtn.BTN_HIGHLIGHT_COLOR}`,
        strokeWidth: "0",
        strokeDasharray: "4 3",
      },
      flag: true,
    });
    this.container.appendChild(this.btnBg);
    this.btnIcon = <SVGTextElement>createSvgElement({
      tag: "text",
      para: {
        x: `${PlusBtn.BTN_SIZE / 2}`,
        y: `${PlusBtn.BTN_SIZE / 2 + 7}`,
        textAnchor: "middle",
        fill: `${PlusBtn.BTN_COLOR}`,
        fontSize: "16pt",
      },
      flag: true,
    });
    this.btnIcon.innerHTML = "+";
    this.container.appendChild(this.btnIcon);
    this.btn = new SVGBtn(this.container, true, buttonProps);
    this.container.appendChild(this.btn.container);
    this.container.onpointerup = () => {
      this.isHighlighted = !this.isHighlighted;
    };

    this.fakeKfg.container.appendChild(this.container);
    this.fakeKfg.plusBtn = this;

    PlusBtn.allPlusBtn.push(this);
  }

  public removeBtn(): void {
    for (let i = 0, len = PlusBtn.allPlusBtn.length; i < len; i++) {
      if (PlusBtn.allPlusBtn[i].id === this.id) {
        PlusBtn.allPlusBtn[i].onShow = false;
        break;
      }
    }
    if (this.fakeKfg.container.contains(this.container)) {
      this.fakeKfg.container.removeChild(this.container);
    }
  }

  public restoreBtn(): void {
    this.onShow = true;
    this.fakeKfg.container.appendChild(this.container);
  }

  public translateBtn(transX: number): void {
    const oriTrans: ICoord = jsTool.extractTransNums(
      this.container.getAttributeNS(null, "transform")
    );
    this.container.setAttributeNS(
      null,
      "transform",
      `translate(${oriTrans.x + transX}, ${oriTrans.y})`
    );
  }

  public highlightBtn(): void {
    store.dispatch(updateHighlightKf(undefined));
    KfGroup.groupToInsert = this.targetKfg.aniId;
    this.btn.hideBtn();
    const oriTrans: ICoord = jsTool.extractTransNums(
      this.container.getAttributeNS(null, "transform")
    );
    this.container.setAttributeNS(
      null,
      "transform",
      `translate(${oriTrans.x},${PlusBtn.PADDING})`
    );
    const firstKf: KfItem = this.targetKfg.fetchFirstKf();
    this.targetKfg.translateGroup(
      firstKf,
      this.kfSize.width - PlusBtn.BTN_SIZE,
      true,
      true,
      true
    );
    updateProps(
      this.btnBg,
      {
        width: `${this.kfSize.width}`,
        height: `${this.kfSize.height}`,
        strokeWidth: "1",
      },
      true
    );
    updateProps(
      this.btnIcon,
      {
        x: `${this.kfSize.width / 2}`,
        y: `${this.kfSize.height / 2 + 6}`,
        fill: `${PlusBtn.BTN_HIGHLIGHT_COLOR}`,
      },
      true
    );
  }

  public cancelHighlightBtn(): void {
    KfGroup.groupToInsert = ""; //need to restore to highlight kfww
    this.btn.showBtn();
    const oriTrans: ICoord = jsTool.extractTransNums(
      this.container.getAttributeNS(null, "transform")
    );
    this.container.setAttributeNS(
      null,
      "transform",
      `translate(${oriTrans.x},${
        PlusBtn.PADDING + this.kfSize.height / 2 - PlusBtn.BTN_SIZE / 2
      })`
    );
    const firstKf: KfItem = this.targetKfg.fetchFirstKf();
    this.targetKfg.translateGroup(
      firstKf,
      PlusBtn.BTN_SIZE - this.kfSize.width,
      true,
      true,
      true
    );
    updateProps(
      this.btnBg,
      {
        width: `${PlusBtn.BTN_SIZE}`,
        height: `${PlusBtn.BTN_SIZE}`,
        strokeWidth: "0",
      },
      true
    );
    updateProps(
      this.btnIcon,
      {
        x: `${PlusBtn.BTN_SIZE / 2}`,
        y: `${PlusBtn.BTN_SIZE / 2 + 6}`,
        fill: `${PlusBtn.BTN_COLOR}`,
      },
      true
    );
  }

  // public dragSelOver(): void {
  //     this.btnBg.setAttributeNS(null, 'stroke', `${PlusBtn.BTN_DRAGOVER_COLOR}`);
  //     this.btnIcon.setAttributeNS(null, 'fill', `${PlusBtn.BTN_DRAGOVER_COLOR}`);
  //     clearDragOver();
  //     PlusBtn.dragoverBtn = this;
  // }

  // public dragSelOut(): void {
  //     this.btnBg.setAttributeNS(null, 'stroke', `${PlusBtn.BTN_HIGHLIGHT_COLOR}`);
  //     this.btnIcon.setAttributeNS(null, 'fill', `${PlusBtn.BTN_HIGHLIGHT_COLOR}`);
  //     PlusBtn.dragoverBtn = undefined;
  // }

  // public dropSelOn(): void {
  //     const selectedMarks: string[] = state.activatePlusBtn.selection;
  //     let firstKfInfoInParent: IKeyframe = this.firstKfArrInTargetKfg[0];
  //     const tmpKfInfo: IKeyframe = KfItem.createKfInfo(selectedMarks,
  //         {
  //             duration: firstKfInfoInParent.duration,
  //             allCurrentMarks: firstKfInfoInParent.allCurrentMarks,
  //             allGroupMarks: firstKfInfoInParent.allGroupMarks
  //         });
  //     KfItem.allKfInfo.set(tmpKfInfo.id, tmpKfInfo);
  //     const targetKfg: Kfgourp = KfGroup.allAniGroups.get(this.targetKfg.aniId).fetchFirstKfg();

  //     //create a kf and replace the plus btn
  //     this.removeBtn();
  //     let tmpKf: KfItem = new KfItem();
  //     tmpKf.createItem(tmpKfInfo, 1, targetKfg, KfGroup.PADDING);
  //     tmpKf.idxInGroup = 0;
  //     targetKfg.children.forEach((c: KfGroup | KfItem | KfOmit) => {
  //         c.idxInGroup++;
  //     })
  //     targetKfg.children.unshift(tmpKf);

  //     const suggestOnFirstKf: boolean = Suggest.generateSuggestionPath(selectedMarks, firstKfInfoInParent, this.targetKfg);
  //     suggestBox.renderKfOnPathAndSuggestionBox(Suggest.allPaths, tmpKf, this.fakeKfg, suggestOnFirstKf);
  // }
}
