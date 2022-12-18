import "../../assets/style/bubble/bubble.scss";
import { NON_SKETCH_CLS } from "../../global-consts";
import { BUBBLE_FROM_BOTTOM, BUBBLE_FROM_LEFT } from "./bubble-consts";

export default class Bubble {
  container: HTMLDivElement;
  // hasCover: boolean
  background: HTMLDivElement;
  // tip: HTMLParagraphElement
  trigerComponent: HTMLElement | SVGElement;
  direct: string;
  transparent: boolean;
  _shown: boolean;

  set shown(s: boolean) {
    this._shown = s;
    s ? this.showBubble() : this.hideBubble();
  }
  get shown(): boolean {
    return this._shown;
  }

  constructor(
    trigerComponent: HTMLElement | SVGElement,
    direct: string,
    hasCover: boolean,
    transparent: boolean = false
  ) {
    this.trigerComponent = trigerComponent;
    this.direct = direct;
    // this.hasCover = hasCover;
    this.transparent = transparent;
    this.init();
  }
  init() {
    this.background = document.createElement("div");
    this.background.classList.add("bubble-cover", NON_SKETCH_CLS);
    this.container = document.createElement("div");
    this.container.classList.add(
      "bubble-container",
      this.direct,
      NON_SKETCH_CLS
    );
    // this.tip = document.createElement('p');
    // this.tip.classList.add('tip');
    // this.tip.innerHTML = 'testing!!!!!!!!!!!!!!!!!!!!!!!!!!';
    // this.container.appendChild(this.tip);
    if (this.transparent) {
      this.container.classList.add("transparent");
    }
    // this.hasCover && document.body.appendChild(this.background);
    document.body.appendChild(this.container);
  }
  showBubble() {
    this.container.style.display = "";
    // if (this.hasCover) { this.background.style.display = ''; }
    const trigerCBBox: DOMRect = this.trigerComponent.getBoundingClientRect();
    switch (this.direct) {
      case BUBBLE_FROM_LEFT:
        this.container.style.top = `${
          trigerCBBox.top +
          (trigerCBBox.height - this.container.clientHeight) / 2
        }px`;
        this.container.style.left = `${trigerCBBox.right}px`;
        break;
      case BUBBLE_FROM_BOTTOM:
        this.container.style.top = `${
          trigerCBBox.top - this.container.clientHeight - 8
        }px`;
        this.container.style.left = `${
          trigerCBBox.left +
          trigerCBBox.width / 2 -
          this.container.clientWidth / 2
        }px`;
        break;
      //TODO:other two directions
    }
    this.showCallback();
  }
  showCallback() {}
  hideBubble() {
    this.container.style.display = "none";
    // if (this.hasCover) { this.background.style.display = 'none'; }
    this.hideCallback();
  }
  hideCallback() {}
  removeBubble() {
    document.body.contains(this.container) &&
      document.body.removeChild(this.container);
    document.body.contains(this.background) &&
      document.body.removeChild(this.background);
  }
  // showTip(tStr:string){
  //     this.tip.innerHTML = tStr;
  //     this.tip.style.opacity = '1';
  // }
  // hideTip(){
  //     this.tip.style.opacity = '0';
  // }
}
