import { KfContainer, kfContainer } from "./kfContainer";
import KfItem from "./kfItem";
import { TimingSpec } from "canis_toolkit";
import KfGroup from "./kfGroup";
import { state } from "../../../app/state";
import { KF_FG_LAYER } from "./vl-consts";
import { IKeyframe, ICoord } from "../../global-interfaces";
import { store } from "../../store";

export default class IntelliRefLine {
  static HIGHLIGHT_STROKE_COLOR: string = "#0e89e5";
  static TRIGER_STROKE_COLOR: string = "#e2640e";
  static STROKE_COLOR: string = "#676767";
  static Real_COLOR: string = '#969696';
  static idx: number = 0;
  static allLines: Map<number, IntelliRefLine> = new Map(); //key: line id, value: IntelliRefLine Obj
  static kfLineMapping: Map<number, { theOtherEnd: number; lineId: number }> =
    new Map(); //key: kf id, value: {theOtherEnd: kf on the other end of this line, lineId: id of the IntelliRefLine obj}

  public id: number;
  public container: HTMLElement;
  public line: SVGLineElement;
  public fakeDuration: SVGRectElement;

  public createLine(alignWithKfId: number, alignToKfId: number) {
    //judge whether the alignto kfgroup is merged to alignwith group
    const alignToKfGroup: KfGroup = KfItem.allKfItems
      .get(alignToKfId)
      .parentObj.fetchAniGroup();
    this.container = document.getElementById(KF_FG_LAYER);
    this.id = IntelliRefLine.idx;
    IntelliRefLine.idx++;
    this.line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    this.line.setAttributeNS(null, "stroke", IntelliRefLine.STROKE_COLOR);
    this.line.setAttributeNS(null, "stroke-dasharray", "4 2");
    this.line.setAttributeNS(null, "stroke-width", "1");
    this.container.appendChild(this.line);
    IntelliRefLine.allLines.set(this.id, this);
    IntelliRefLine.kfLineMapping.set(alignWithKfId, {
      theOtherEnd: alignToKfId,
      lineId: this.id,
    });
    IntelliRefLine.kfLineMapping.set(alignToKfId, {
      theOtherEnd: alignWithKfId,
      lineId: this.id,
    });

    IntelliRefLine.updateLine(alignWithKfId);
    if (alignToKfGroup.alignMerge) {
      this.hideLine();
    }
  }

  /**
   * update line position and size
   * @param kfId : either alignwith kf or alignto kf
   */
  public static updateLine(kfId: number) {
    if (typeof IntelliRefLine.kfLineMapping.get(kfId) !== "undefined") {
      const lineItem: IntelliRefLine = IntelliRefLine.allLines.get(
        IntelliRefLine.kfLineMapping.get(kfId).lineId
      );
      const containerBBox: DOMRect = lineItem.container.getBoundingClientRect(); //fixed
      const alignKf1: IKeyframe = KfItem.allKfInfo.get(kfId);
      const alignKf2: IKeyframe = KfItem.allKfInfo.get(
        IntelliRefLine.kfLineMapping.get(kfId).theOtherEnd
      );
      let alignWithKfBBox: DOMRect,
        alignWithKfInfo: IKeyframe,
        alignToKfBBox: DOMRect,
        alignToKfInfo: IKeyframe;
      let alignWithKf: KfItem, alignToKf: KfItem;
      if (typeof alignKf1 !== "undefined" && typeof alignKf2 !== "undefined") {
        if (typeof alignKf1.alignTo === "undefined") {
          alignWithKf = KfItem.allKfItems.get(alignKf1.id);
          alignToKf = KfItem.allKfItems.get(alignKf2.id);
          alignWithKfInfo = alignKf1;
          alignToKfInfo = alignKf2;
        } else {
          alignWithKf = KfItem.allKfItems.get(alignKf2.id);
          alignToKf = KfItem.allKfItems.get(alignKf1.id);
          alignWithKfInfo = alignKf2;
          alignToKfInfo = alignKf1;
        }
        if (alignWithKf.rendered && alignToKf.rendered) {
          alignWithKfBBox = alignWithKf.container.getBoundingClientRect(); //fixed
          alignToKfBBox = alignToKf.container.getBoundingClientRect(); //fixed
          const [minX, maxX]: [number, number] = alignToKf.calAlignRange();
          if (alignToKfInfo.timingRef === TimingSpec.timingRef.previousEnd) {
            lineItem.line.setAttributeNS(
              null,
              "x1",
              `${(maxX - containerBBox.left) / store.getState().kfZoomLevel}`
            );
            lineItem.line.setAttributeNS(
              null,
              "x2",
              `${(maxX - containerBBox.left) / store.getState().kfZoomLevel}`
            );
          } else {
            lineItem.line.setAttributeNS(
              null,
              "x1",
              `${(minX - containerBBox.left) / store.getState().kfZoomLevel}`
            );
            lineItem.line.setAttributeNS(
              null,
              "x2",
              `${(minX - containerBBox.left) / store.getState().kfZoomLevel}`
            );
          }

          // lineItem.line.setAttributeNS(null, 'y1', `${24}`);
          lineItem.line.setAttributeNS(
            null,
            "y1",
            `${
              (alignWithKfBBox.top - containerBBox.top) /
              store.getState().kfZoomLevel
            }`
          );
          lineItem.line.setAttributeNS(
            null,
            "y2",
            `${
              (alignToKfBBox.bottom - containerBBox.top) /
              store.getState().kfZoomLevel
            }`
          );
          lineItem.line.setAttributeNS(null, "transform", "");
        }
      }
    }
  }

  public static hintAniPosis(kfGroup: KfGroup): IntelliRefLine[] {
    let hintLines: IntelliRefLine[] = [];
    for (let i = 0, len = [...KfGroup.allAniGroups].length; i < len; i++) {
      const aniGroup: KfGroup = [...KfGroup.allAniGroups][i][1];
      let showHintLine: boolean = kfGroup.id !== aniGroup.id;
      if (
        typeof kfGroup.alignId !== "undefined" &&
        typeof aniGroup.alignTarget !== "undefined"
      ) {
        if (kfGroup.alignId === aniGroup.alignTarget) {
          showHintLine = false;
        }
      }
      // if (typeof kfGroup.alignId !== 'undefined' && typeof aniGroup.alignTarget !== 'undefined') {
      //     if (kfGroup.alignId !== aniGroup.alignTarget && kfGroup.id !== aniGroup.id) {
      if (showHintLine) {
        const firstKf: KfItem = aniGroup.fetchFirstKf();
        const aniGroupBBox: DOMRect = aniGroup.groupBg.getBoundingClientRect(); //fixed
        const firstKfBBox: DOMRect = firstKf.container.getBoundingClientRect(); //fixed

        const tmpHintLine1: IntelliRefLine = new IntelliRefLine();
        tmpHintLine1.hintInsert(
          { x: aniGroupBBox.right, y: aniGroupBBox.top },
          aniGroupBBox.height / store.getState().kfZoomLevel,
          true,
          false
        );
        hintLines.push(tmpHintLine1);
        const tmpHintLine2: IntelliRefLine = new IntelliRefLine();
        tmpHintLine2.hintInsert(
          { x: aniGroupBBox.left, y: aniGroupBBox.top },
          aniGroupBBox.height / store.getState().kfZoomLevel,
          true,
          false
        );
        // tmpHintLine2.hintAlign({ x: aniGroupBBox.left, y: aniGroupBBox.top }, aniGroupBBox.height / store.getState().kfZoomLevel, false);
        hintLines.push(tmpHintLine2);
        const tmpHintLine3: IntelliRefLine = new IntelliRefLine();
        tmpHintLine3.hintAlign(
          { x: firstKfBBox.left, y: firstKfBBox.top },
          firstKfBBox.height / store.getState().kfZoomLevel,
          false
        );
        hintLines.push(tmpHintLine3);
        const tmpHintLine4: IntelliRefLine = new IntelliRefLine();
        tmpHintLine4.hintAlign(
          { x: firstKfBBox.right, y: firstKfBBox.top },
          firstKfBBox.height / store.getState().kfZoomLevel,
          false
        );
        hintLines.push(tmpHintLine4);
      }
      //     }
      // }
    }
    return hintLines;
  }

  public zoomHideLine(): void {
    this.line.setAttributeNS(null, "display", "none");
  }

  public zoomShowLine(): void {
    this.line.setAttributeNS(null, "display", "");
  }

  public hideLine(): void {
    if (typeof this !== "undefined") {
      this.line.setAttributeNS(null, "opacity", "0");
    }
  }

  public showLine(): void {
    if (typeof this !== "undefined") {
      this.line.setAttributeNS(null, "opacity", "1");
    }
  }

  public hintAlign(
    targetPosi: ICoord,
    targetHeight: number,
    highlight: boolean
  ) {
    this.container = document.getElementById(KF_FG_LAYER);
    const containerBBox: DOMRect = document
      .getElementById(KfContainer.KF_CONTAINER)
      .getBoundingClientRect(); //fixed
    if (typeof this.line === "undefined") {
      this.line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
    }
    if (!this.container.contains(this.line)) {
      this.container.appendChild(this.line);
    }
    this.line.setAttributeNS(
      null,
      "stroke",
      highlight
        ? IntelliRefLine.TRIGER_STROKE_COLOR
        : IntelliRefLine.HIGHLIGHT_STROKE_COLOR
    );
    this.line.setAttributeNS(null, "stroke-width", "2");
    this.line.setAttributeNS(null, "stroke-dasharray", "4 2");
    this.line.setAttributeNS(
      null,
      "x1",
      `${
        (targetPosi.x - containerBBox.left) / store.getState().kfZoomLevel -
        kfContainer.transDistance.width
      }`
    );
    this.line.setAttributeNS(
      null,
      "y1",
      `${
        (targetPosi.y - containerBBox.top) / store.getState().kfZoomLevel -
        kfContainer.transDistance.height
      }`
    );
    this.line.setAttributeNS(
      null,
      "x2",
      `${
        (targetPosi.x - containerBBox.left) / store.getState().kfZoomLevel -
        kfContainer.transDistance.width
      }`
    );
    this.line.setAttributeNS(
      null,
      "y2",
      `${
        (targetPosi.y - containerBBox.top) / store.getState().kfZoomLevel +
        targetHeight -
        kfContainer.transDistance.height
      }`
    );
  }

  public showFakeDuration(targetPosi: ICoord, targetHeight: number) {
    const containerBBox: DOMRect = document
      .getElementById(KfContainer.KF_CONTAINER)
      .getBoundingClientRect(); //fixed
    if (typeof this.fakeDuration === "undefined") {
      this.fakeDuration = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
    }
    this.fakeDuration.setAttributeNS(
      null,
      "x",
      `${
        (targetPosi.x - containerBBox.left) / store.getState().kfZoomLevel -
        kfContainer.transDistance.width -
        30
      }`
    );
    this.fakeDuration.setAttributeNS(
      null,
      "y",
      `${
        (targetPosi.y - containerBBox.top) / store.getState().kfZoomLevel -
        kfContainer.transDistance.height
      }`
    );
    this.fakeDuration.setAttributeNS(null, "width", "30");
    this.fakeDuration.setAttributeNS(
      null,
      "height",
      `${targetHeight - kfContainer.transDistance.height}`
    );
    this.fakeDuration.setAttributeNS(
      null,
      "fill",
      `url(#${KfContainer.DURATION_GRADIENT})`
    );
    this.container.appendChild(this.fakeDuration);
  }

  public hintInsert(
    targetPosi: ICoord,
    targetHeight: number,
    vertical: boolean,
    highlight: boolean
  ) {
    this.container = document.getElementById(KF_FG_LAYER);
    const containerBBox: DOMRect = document
      .getElementById(KfContainer.KF_CONTAINER)
      .getBoundingClientRect(); //fixed
    if (typeof this.line === "undefined") {
      this.line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
    }
    if (!this.container.contains(this.line)) {
      this.container.appendChild(this.line);
    }
    this.line.setAttributeNS(
      null,
      "stroke",
      highlight
        ? IntelliRefLine.TRIGER_STROKE_COLOR
        : IntelliRefLine.HIGHLIGHT_STROKE_COLOR
    );
    this.line.setAttributeNS(null, "stroke-width", "4");
    this.line.setAttributeNS(null, "stroke-dasharray", "1 0");
    if (vertical) {
      this.line.setAttributeNS(
        null,
        "x1",
        `${
          (targetPosi.x - containerBBox.left) / store.getState().kfZoomLevel -
          kfContainer.transDistance.width
        }`
      );
      this.line.setAttributeNS(
        null,
        "y1",
        `${
          (targetPosi.y - containerBBox.top) / store.getState().kfZoomLevel -
          kfContainer.transDistance.height
        }`
      );
      this.line.setAttributeNS(
        null,
        "x2",
        `${
          (targetPosi.x - containerBBox.left) / store.getState().kfZoomLevel -
          kfContainer.transDistance.width
        }`
      );
      this.line.setAttributeNS(
        null,
        "y2",
        `${
          (targetPosi.y - containerBBox.top) / store.getState().kfZoomLevel +
          targetHeight -
          kfContainer.transDistance.height
        }`
      );
    }
  }

  public removeHintLine() {
    if (typeof this.container !== "undefined") {
      if (this.container.contains(this.line)) {
        this.container.removeChild(this.line);
      }
    }
  }

  public removeFakeDuration() {
    if (typeof this.container !== "undefined") {
      if (this.container.contains(this.fakeDuration)) {
        this.container.removeChild(this.fakeDuration);
      }
    }
  }
}

export let hintDrop: IntelliRefLine = new IntelliRefLine();
