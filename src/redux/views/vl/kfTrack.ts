import { TimingSpec } from "canis_toolkit";
import { jsTool } from "../../../util/jsTool";
import { createSvgElement } from "../../../util/svgManager";
import { store } from "../../store";
import KfGroup from "./kfGroup";
import KfOmit from "./kfOmit";
import {
  KF_BG_LAYER,
  KF_FG_LAYER,
  KF_PADDING,
  TRACK_HEIGHT,
  TRACK_PADDING_TOP,
  TRACK_WIDTH,
} from "./vl-consts";

export default class KfTrack {
  static trackIdx: number = 0;
  static allTracks: Map<string, KfTrack> = new Map(); //key:id, value: kftrack
  static aniTrackMapping: Map<string, Set<KfTrack>> = new Map(); //key: aniId, value: tracks this animation possesses

  public trackId: string;
  public trackBgContainer: SVGGElement;
  public trackPosiY: number;
  public container: SVGGElement;
  public trackBg: SVGRectElement;
  public splitLineTop: SVGLineElement;
  public splitLineBottom: SVGLineElement;
  public availableInsert: number = KF_PADDING;
  public children: KfGroup[] = [];

  public static reset() {
    this.trackIdx = 0;
    this.allTracks.clear();
    this.aniTrackMapping.clear();
  }

  constructor() {
    const that = this;

    this.children.push = function () {
      const result = Array.prototype.push.apply(this, arguments);
      const child: KfGroup | KfOmit = arguments[0];
      child.idxInGroup = that.children.length - 1;
      if (child instanceof KfGroup) {
        let transX: number = that.availableInsert;
        if (
          child.preAniId !== "" &&
          child.timingRef === TimingSpec.timingRef.previousStart
        ) {
          transX = jsTool.extractTransNums(
            KfGroup.allAniGroups
              .get(child.preAniId)
              .container.getAttributeNS(null, "transform")
          ).x;
        }
        that.availableInsert = transX; //need to  test!!!!!!!!
        child.translateContainer(transX, child.posiY);
        that.container.appendChild(child.container);
      }
      return result;
    };
    this.children.splice = function () {
      const result = Array.prototype.splice.apply(this, arguments);
      return result;
    };
    this.children.unshift = function () {
      const result = Array.prototype.unshift.apply(this, arguments);
      return result;
    };
  }

  public createTrack(fake: boolean = false): void {
    let numExistTracks: number = document.querySelectorAll(
      ".kf-track:not(.fake-track)"
    ).length;
    if (
      store
        .getState()
        .sortDataAttrs.find((a) => a.attr == "OS" || a.attr == "Emission") &&
      numExistTracks > 1
    ) {
      numExistTracks = 1;
    }


    this.trackPosiY =
      numExistTracks * TRACK_HEIGHT + (numExistTracks + 1) * TRACK_PADDING_TOP;
    this.trackBgContainer = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        id: `trackBg${KfTrack.trackIdx}`,
        transform: `translate(0, ${this.trackPosiY})`,
      },
      flag: true,
    });
    document.getElementById(KF_BG_LAYER).appendChild(this.trackBgContainer);

    this.trackId = `trackFg${KfTrack.trackIdx}`;
    this.container = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        id: this.trackId,
        class: `kf-track ${fake ? "fake-track" : ""}`,
        transform: `translate(0, ${
          numExistTracks * TRACK_HEIGHT +
          (numExistTracks + 1) * TRACK_PADDING_TOP
        })`,
      },
      flag: true,
    });
    document.getElementById(KF_FG_LAYER).appendChild(this.container);

    KfTrack.trackIdx++;

    //draw track bg
    this.trackBg = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        x: "0",
        y: "0",
        width: `${TRACK_WIDTH}`,
        height: fake ? "0" : `${TRACK_HEIGHT}`,
        fill: "#fff",
      },
      flag: true,
    });
    this.trackBgContainer.appendChild(this.trackBg);

    if (!fake) {
      //draw split line
      this.splitLineTop = <SVGLineElement>createSvgElement({
        tag: "line",
        para: {
          x1: "0",
          y1: "0",
          x2: "20000",
          y2: "0",
          stroke: "#f7f7f7",
        },
        flag: true,
      });
      this.trackBgContainer.appendChild(this.splitLineTop);
      this.splitLineBottom = <SVGLineElement>createSvgElement({
        tag: "line",
        para: {
          x1: "0",
          y1: `${TRACK_HEIGHT}`,
          x2: "20000",
          y2: `${TRACK_HEIGHT}`,
          stroke: "#f7f7f7",
        },
        flag: true,
      });
      this.trackBgContainer.appendChild(this.splitLineBottom);

      KfTrack.allTracks.set(this.trackId, this);
    }
  }
}
