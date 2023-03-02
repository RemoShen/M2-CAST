import Util from "../../../app/core/util";
import { jsTool } from "../../../util/jsTool";
import { createSvgElement } from "../../../util/svgManager";
import { SUGGEST_FRAME_CLS } from "../../global-consts";
import { ICoord, IRect } from "../../global-interfaces";
import { store } from "../../store";

export default class SuggestAniFrame {
  static labelHeight: number = 20;
  static padding: number = 5;
  static markCount: Map<string, number> = new Map();
  static frameInfos: { marks: string[]; pathIdxs: number[] }[] = [];
  static init(uniqueNextKfs: string[][]) {
    this.frameInfos = [];
    uniqueNextKfs.forEach((nkf: string[], idx: number) => {
      let added: boolean = false;
      this.frameInfos.forEach(
        (fi: { marks: string[]; pathIdxs: number[] }, fIdx: number) => {
          if (jsTool.identicalArrays(fi.marks, nkf)) {
            added = true;
            this.frameInfos[fIdx].pathIdxs.push(idx);
          }
        }
      );
      !added &&
        this.frameInfos.push({
          marks: nkf,
          pathIdxs: [idx],
        });
    });
  }

  static removeFrames() {
    Array.from(document.getElementsByClassName(SUGGEST_FRAME_CLS)).forEach(
      (suggestFrame: HTMLElement) => {
        suggestFrame.remove();
      }
    );
  }

  static createFrames() {
    this.removeFrames();
    const pathIdxSort: Map<number, number> = new Map();
    this.frameInfos
      .sort((a, b) => {
        return a.pathIdxs[0] - b.pathIdxs[0];
      })
      .forEach((fi, idx) => {
        pathIdxSort.set(fi.pathIdxs[0], idx);
      });

    this.frameInfos = this.frameInfos.sort((a, b) => {
      return a.marks.length - b.marks.length;
    });
    let frameBBoxes: IRect[] = [],
      frameLabels: string[] = [];
    this.frameInfos.forEach(
      (fi: { marks: string[]; pathIdxs: number[] }, frameIdx: number) => {
        let minX: number = 100000,
          maxX: number = -100000,
          minY: number = 100000,
          maxY: number = -100000;
        let maxFramedNum: number = 0;
        fi.marks.forEach((mId: string) => {
          //calculate bbox
          const bbox = (<SVGGraphicsElement>(
            (<unknown>document.getElementById(mId))
          )).getBBox();
          minX = bbox.x < minX ? bbox.x : minX;
          minY = bbox.y < minY ? bbox.y : minY;
          maxX = bbox.x + bbox.width > maxX ? bbox.x + bbox.width : maxX;
          maxY = bbox.y + bbox.height > maxY ? bbox.y + bbox.height : maxY;

          typeof this.markCount.get(mId) === "undefined" &&
            this.markCount.set(mId, 0);
          const framedTimes: number = this.markCount.get(mId); //how many times this marks has been framed
          if (maxFramedNum < framedTimes) {
            maxFramedNum = framedTimes;
          }
          this.markCount.set(mId, framedTimes + 1);
        });
        minX -= maxFramedNum * this.padding;
        maxX += maxFramedNum * this.padding;
        minY -= maxFramedNum * this.padding;
        maxY += maxFramedNum * this.padding;
        const chartContent: HTMLElement =
          document.getElementById("chartContent");
        const chartContentTrans: ICoord = Util.extractTransNums(
          chartContent.getAttributeNS(null, "transform")
        );
        const frameParas = {
          class: SUGGEST_FRAME_CLS,
          fill: "none",
          stroke: "#676767",
          strokeWidth: "1",
          strokeDasharray: "2 2",
          x: `${
            minX * store.getState().chartScaleRatio - 5 + chartContentTrans.x
          }`,
          y: `${
            minY * store.getState().chartScaleRatio - 5 + chartContentTrans.y
          }`,
          width: `${(maxX - minX) * store.getState().chartScaleRatio + 10}`,
          height: `${(maxY - minY) * store.getState().chartScaleRatio + 10}`,
        };
        const frame: SVGRectElement = <SVGRectElement>(
          createSvgElement({ tag: "rect", para: frameParas, flag: true })
        );
        frameBBoxes.push({
          x: parseFloat(frameParas.x),
          y: parseFloat(frameParas.y),
          width: parseFloat(frameParas.width),
          height: parseFloat(frameParas.height),
        });

        frameLabels.push(`SUG. ${pathIdxSort.get(fi.pathIdxs[0]) + 1}`);
        document.getElementById("visChart").appendChild(frame);
      }
    );
    frameBBoxes = frameBBoxes.sort((a, b) => {
      return a.y - b.y;
    });
    let preY: number = 0;
    frameBBoxes.forEach((fb: IRect, idx: number) => {
      let targetY: number = fb.y;
      if (targetY - preY < this.labelHeight + 2) {
        targetY += this.labelHeight + 2 - targetY + preY;
      }
      preY = targetY;
      document.getElementById("visChart").appendChild(
        this.createLabel(
          {
            x: fb.x + fb.width,
            y: targetY,
          },
          frameLabels[frameLabels.length - 1 - idx]
        )
      );
    });
  }
  static createLabel(posi: ICoord, label: string): SVGGElement {
    const g: SVGGElement = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        class: SUGGEST_FRAME_CLS,
        transform: `translate(${posi.x}, ${posi.y - this.labelHeight / 2})`,
      },
      flag: true,
    });
    const line: SVGLineElement = <SVGLineElement>createSvgElement({
      tag: "line",
      para: {
        stroke: "#676767",
        // strokeWidth: '1',
        // strokeDasharray: '2 2',
        x1: "0",
        y1: `${this.labelHeight / 2}`,
        x2: `${this.padding}`,
        y2: `${this.labelHeight / 2}`,
      },
      flag: true,
    });
    const background: SVGRectElement = <SVGRectElement>createSvgElement({
      tag: "rect",
      para: {
        stroke: "#676767",
        // strokeWidth: '1',
        // strokeDasharray: '2 2',
        fill: "rgba(255, 255, 255, 0.5)",
        rx: `${this.labelHeight / 2}`,
        x: `${this.padding}`,
        y: "0",
        width: `${7 * label.length + this.labelHeight}`,
        height: `${this.labelHeight}`,
      },
      flag: true,
    });
    const text: SVGTextContentElement = <SVGTextContentElement>(
      createSvgElement({
        tag: "text",
        para: {
          dominantBaseline: "middle",
          x: `${this.padding * 2}`,
          y: `${this.labelHeight / 2}`,
          fill: "#676767",
        },
        flag: true,
      })
    );
    text.innerHTML = label;
    g.appendChild(line);
    g.appendChild(background);
    g.appendChild(text);
    return g;
  }
}
