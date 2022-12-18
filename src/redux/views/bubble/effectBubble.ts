import { Animation } from "canis_toolkit";
import Bubble from "./bubble";
import { ICoord } from "../../global-interfaces";
import {
  createSvgElement,
  scaleEle,
  translateEle,
} from "../../../util/svgManager";

export default class EffectBubble extends Bubble {
  markId: string;
  svgContainer: SVGSVGElement;
  scaleLayer: SVGGElement;
  transLayer: SVGGElement;
  targetMark: SVGElement;
  anchors: SVGRectElement[];
  constructor(
    trigerComponent: HTMLElement | SVGElement,
    direct: string,
    hasCover: boolean,
    transparent: boolean,
    markId: string
  ) {
    super(trigerComponent, direct, hasCover, transparent);
    this.container.classList.add("effect-bubble");
    this.markId = markId;
    this.anchors = [];
    this.initContent();
    this.background.addEventListener("pointerdown", () => {
      this.hideBubble();
    });
  }

  initContent() {
    const tmpContainer: HTMLDivElement = document.createElement("div");
    tmpContainer.classList.add("inner-container");
    this.container.appendChild(tmpContainer);

    const svgW: number = 200,
      svgH: number = 200;
    this.svgContainer = <SVGSVGElement>createSvgElement({
      tag: "svg",
      para: {
        width: `${svgW}`,
        height: `${svgH}`,
      },
      flag: true,
    });
    tmpContainer.appendChild(this.svgContainer);

    const m: SVGElement = <SVGElement>(
      document.getElementById(this.markId).cloneNode(true)
    );
    m.id = null;
    this.scaleLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.transLayer = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    this.transLayer.appendChild(m);
    this.scaleLayer.appendChild(this.transLayer);

    this.svgContainer.appendChild(this.scaleLayer);

    const nameWrapper: HTMLDivElement = document.createElement("div");
    nameWrapper.classList.add("name-wrapper");
    nameWrapper.innerHTML = `Effect: ${
      Animation.allMarkAni.get(this.markId).actionAttrs[0].animationType
    }`;
    tmpContainer.appendChild(nameWrapper);
  }

  showCallback() {
    this.invokeSvg();
  }

  /**
   * update inner element position after loaded
   */
  invokeSvg() {
    const svgBBox: DOMRect = this.svgContainer.getBoundingClientRect();
    const targetMarkBBox: DOMRect = this.scaleLayer.getBoundingClientRect();
    //cal scale
    const percent: number = 0.8;
    const scale: number =
      targetMarkBBox.width > targetMarkBBox.height
        ? (200.0 * percent) / targetMarkBBox.width
        : (200.0 * percent) / targetMarkBBox.height;

    const svgCenter: ICoord = {
      x: svgBBox.left + svgBBox.width / 2 / scale,
      y: svgBBox.top + svgBBox.height / 2 / scale,
    };
    const targetMarkCenter: ICoord = {
      x: targetMarkBBox.left + targetMarkBBox.width / 2,
      y: targetMarkBBox.top + targetMarkBBox.height / 2,
    };
    const transDist: ICoord = {
      x: svgCenter.x - targetMarkCenter.x,
      y: svgCenter.y - targetMarkCenter.y,
    };
    scaleEle(this.scaleLayer, scale);
    translateEle(this.transLayer, transDist);
    if (this.anchors.length === 0) {
      setTimeout(() => {
        const currentMarkBBox: DOMRect =
          this.scaleLayer.getBoundingClientRect();
        [
          {
            x: currentMarkBBox.left - svgBBox.left,
            y: currentMarkBBox.top - svgBBox.top + currentMarkBBox.height / 2,
          },
          {
            x: currentMarkBBox.left - svgBBox.left + currentMarkBBox.width / 2,
            y: currentMarkBBox.top - svgBBox.top,
          },
          {
            x: currentMarkBBox.right - svgBBox.left,
            y: currentMarkBBox.top - svgBBox.top + currentMarkBBox.height / 2,
          },
          {
            x: currentMarkBBox.left - svgBBox.left + currentMarkBBox.width / 2,
            y: currentMarkBBox.bottom - svgBBox.top,
          },
          {
            x: currentMarkBBox.left - svgBBox.left + currentMarkBBox.width / 2,
            y: currentMarkBBox.top - svgBBox.top + currentMarkBBox.height / 2,
          },
        ].forEach((posi: ICoord) => {
          this.svgContainer.appendChild(
            createSvgElement({
              tag: "rect",
              para: {
                width: "4",
                height: "4",
                x: `${posi.x - 2}`,
                y: `${posi.y - 2}`,
                stroke: "#676767",
                fill: "#fff",
                strokeWidth: "1",
              },
              flag: true,
            })
          );
        });
      }, 2);
    }
  }
}
