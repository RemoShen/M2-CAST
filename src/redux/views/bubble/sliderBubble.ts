import Slider from "../slider/slider";
import Bubble from "./bubble";
import { ISlider } from "../slider/interfaces";
import { store } from "../../store";
import { updateActiveSlider } from "../../action/appAction";

export default class SliderBubble extends Bubble {
  slider: Slider;
  disableCover: HTMLDivElement;

  constructor(
    trigerComponent: HTMLElement | SVGElement,
    direct: string,
    hasCover: boolean,
    sliderOptions: ISlider
  ) {
    super(trigerComponent, direct, hasCover);
    this.initSlider(sliderOptions);
  }
  initSlider(sliderOptions: ISlider) {
    this.slider = new Slider(sliderOptions);
    this.slider.createWidget();
    this.container.appendChild(this.slider.sliderContainer);
    // this.disableCover = document.createElement('div');
    // this.disableCover.classList.add('disable-cover', `disable-${this.direct}`);
    // this.container.appendChild(this.disableCover);
  }
  showCallback() {
    Slider.activeSlider = this.slider;
    // store.dispatch(updateActiveSlider(this.slider));
  }
  hideCallback() {
    Slider.activeSlider = undefined;
    // store.dispatch(updateActiveSlider(undefined));
  }
}
