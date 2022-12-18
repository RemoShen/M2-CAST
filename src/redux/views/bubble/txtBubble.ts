import Bubble from "./bubble";

export const TXT_BUBBLE_CLS: string = "txt-bubble";

export default class TxtBubble extends Bubble {
  content: string[];
  constructor(
    trigerComponent: HTMLElement | SVGElement,
    direct: string,
    hasCover: boolean,
    transparent: boolean,
    content: string[]
  ) {
    super(trigerComponent, direct, hasCover, transparent);
    this.content = content;
    this.initContent();
  }
  initContent() {
    this.content.forEach((c: string) => {
      this.container.innerHTML += `<p>${c}</p>`;
    });
    this.container.classList.add(TXT_BUBBLE_CLS);
    // this.container.innerHTML = this.content.join(', ');
  }
}
