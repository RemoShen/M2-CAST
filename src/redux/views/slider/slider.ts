import "../../assets/style/slider/slider.scss";
import Util from "../../../app/core/util";
import { NON_SKETCH_CLS } from "../../global-consts";
import { ISlider } from "./interfaces";
import {
  NUMERIC_SLIDER,
  SLIDER_MIN_WIDTH,
  SLIDER_RADIUS,
  SLIDER_HEIGHT_BIG,
  SLIDER_HEIGHT_SMALL,
  CATEGORY_SLIDER,
  SLIDER_HEIGHT_DIFF,
} from "./slider-consts";
import { createSvgElement } from "../../../util/svgManager";
import { jsTool } from "../../../util/jsTool";
import { store } from "../../store";

export default class Slider {
  static activeSlider: Slider;

  options: ISlider = { sliderType: NUMERIC_SLIDER };

  _currentValue: number | string;
  preX: number;
  slided: boolean;

  //properties of the slider
  _containerWidth: number;
  containerHeight: number;
  sliderMargin: number;
  // trackWidth: number;
  reverseScale: (a: number) => number | string; //return the data value which the slider currently encodes
  scale: (a: number | string) => number; //return position of the slider with the input data value
  created: boolean = false; //whether this slide bar is added
  callbackFunc: (v: number | string) => void; //function to call on mouse up

  //components in the slider
  sliderContainer: SVGSVGElement;
  slider: SVGCircleElement | SVGPathElement;
  trackBg: SVGLineElement;
  trackPassed: SVGLineElement;
  currentValTxt: SVGTextContentElement;

  set currentValue(cv: number | string) {
    this._currentValue = cv;
    this.updateCurrentValTxt();
    typeof this.slider !== "undefined" &&
      this.slider.setAttributeNS(null, "cx", `${this.scale(cv)}`);
    typeof this.trackPassed !== "undefined" &&
      this.trackPassed.setAttributeNS(null, "x2", `${this.scale(cv)}`);
  }

  get currentValue(): number | string {
    return this._currentValue;
  }

  set containerWidth(cw: number) {
    this._containerWidth = cw >= SLIDER_MIN_WIDTH ? cw : SLIDER_MIN_WIDTH;
    if (this.created) {
      this.sliderContainer.setAttributeNS(
        null,
        "width",
        (this._containerWidth + 2 * this.sliderMargin).toString()
      );
      this.trackBg.setAttributeNS(
        null,
        "x2",
        (this.containerWidth + this.sliderMargin).toString()
      );
      this.slider.setAttributeNS(
        null,
        "cx",
        this.scale(this.currentValue).toString()
      );
      this.trackPassed.setAttributeNS(
        null,
        "x2",
        this.scale(this.currentValue).toString()
      );
      this.currentValTxt.setAttributeNS(
        null,
        "x",
        (this.containerWidth / 2 + this.sliderMargin).toString()
      );
    }
  }
  get containerWidth() {
    return this._containerWidth;
  }

  constructor(options: ISlider) {
    Object.assign(this.options, options);
    this.initDomain();
    this.slided = false;
    this.currentValue = this.options.default || 0;
    this.sliderMargin = SLIDER_RADIUS + 2;
    this.containerWidth = this.options.sliderWidth - 2 * this.sliderMargin;
    this.containerHeight =
      this.options.showCurrentVal || this.options.showTicks
        ? SLIDER_HEIGHT_BIG
        : SLIDER_HEIGHT_SMALL;
    this.reverseScale = (a: number) => {
      if (this.options.sliderType === NUMERIC_SLIDER) {
        return jsTool.toFixed(
          ((<number>a - this.sliderMargin) / this.containerWidth) *
            (<number>this.options.domain[1] - <number>this.options.domain[0]) +
            <number>this.options.domain[0],
          2
        );
      } else if (this.options.sliderType === CATEGORY_SLIDER) {
        const step: number =
          this.containerWidth / (this.options.domain.length - 1);
        const index: number = Math.round(
          (<number>a - this.sliderMargin) / step
        );
        return this.options.domain[index];
      }
    };
    this.scale = (a: number | string) => {
      if (this.options.sliderType === NUMERIC_SLIDER) {
        if (this.options.domain[1] !== this.options.domain[0]) {
          return jsTool.toFixed(
            (this.containerWidth *
              (<number>a - <number>this.options.domain[0])) /
              (<number>this.options.domain[1] -
                <number>this.options.domain[0]) +
              this.sliderMargin,
            2
          );
        }
        return this.sliderMargin;
      } else if (this.options.sliderType === CATEGORY_SLIDER) {
        if (this.options.domain.length > 1) {
          const step: number =
            this.containerWidth / (this.options.domain.length - 1);
          return jsTool.toFixed(
            this.options.domain.indexOf(<never>a) * step + this.sliderMargin,
            2
          );
        }
        return this.containerWidth + this.sliderMargin;
      }
    };
  }

  initDomain() {
    if (this.options.sliderType === CATEGORY_SLIDER) {
      Util.dataValues.forEach(
        (values: string[] | number[], attrName: string) => {
          if (values.indexOf(<never>this.options.domain[0]) >= 0) {
            this.options.domain = values;
            this.options.default = values[0];
          }
        }
      );
    }
  }

  public createTicks() {
    const tick1: SVGLineElement = <SVGLineElement>createSvgElement({
      tag: "line",
      para: {
        x1: `${this.sliderMargin}`,
        y1: `${
          (SLIDER_HEIGHT_DIFF + this.containerHeight) / 2 +
          this.options.trackWidth / 2
        }`,
        x2: `${this.sliderMargin}`,
        y2: `${(SLIDER_HEIGHT_DIFF + this.containerHeight) / 2 - 4}`,
        stroke: "#c2c2c2",
        strokeWidth: `${this.options.trackWidth}`,
      },
      flag: true,
    });
    this.sliderContainer.appendChild(tick1);
    const tick2: SVGLineElement = <SVGLineElement>createSvgElement({
      tag: "line",
      para: {
        x1: `${this.containerWidth + this.sliderMargin}`,
        y1: `${
          (SLIDER_HEIGHT_DIFF + this.containerHeight) / 2 +
          this.options.trackWidth / 2
        }`,
        x2: `${this.containerWidth + this.sliderMargin}`,
        y2: `${(SLIDER_HEIGHT_DIFF + this.containerHeight) / 2 - 4}`,
        stroke: "#c2c2c2",
        strokeWidth: `${this.options.trackWidth}`,
      },
      flag: true,
    });
    this.sliderContainer.appendChild(tick2);
    const tickLabel1: SVGTextContentElement = <SVGTextContentElement>(
      createSvgElement({
        tag: "text",
        para: {
          alignmentBaseline: "baseline",
          textAnchor: "start",
          x: "0",
          y: `${(SLIDER_HEIGHT_DIFF + this.containerHeight) / 2 - 6}`,
          fontSize: "10",
        },
        flag: true,
      })
    );
    tickLabel1.innerHTML = `${this.options.domain[0]}`;
    this.sliderContainer.appendChild(tickLabel1);
    const tickLabel2: SVGTextContentElement = <SVGTextContentElement>(
      createSvgElement({
        tag: "text",
        para: {
          alignmentBaseline: "baseline",
          textAnchor: "end",
          x: `${this.containerWidth + this.sliderMargin}`,
          y: `${(SLIDER_HEIGHT_DIFF + this.containerHeight) / 2 - 6}`,
          fontSize: "10",
        },
        flag: true,
      })
    );
    tickLabel2.innerHTML = `${
      this.options.domain[this.options.domain.length - 1]
    }`;
    this.sliderContainer.appendChild(tickLabel2);
  }

  public createTrack() {
    //create track background
    this.trackBg = <SVGLineElement>createSvgElement({
      tag: "line",
      para: {
        x1: `${this.sliderMargin}`,
        y1: `${(SLIDER_HEIGHT_DIFF + this.containerHeight) / 2}`,
        x2: `${this.containerWidth + this.sliderMargin}`,
        y2: `${(SLIDER_HEIGHT_DIFF + this.containerHeight) / 2}`,
        stroke: "#c2c2c2",
        strokeWidth: `${this.options.trackWidth}`,
      },
      flag: true,
    });
    this.sliderContainer.appendChild(this.trackBg);

    //create track for the passed
    this.trackPassed = <SVGLineElement>createSvgElement({
      tag: "line",
      para: {
        class: "track-passed",
        x1: this.sliderMargin.toString(),
        y1: ((SLIDER_HEIGHT_DIFF + this.containerHeight) / 2).toString(),
        x2: this.scale(this.currentValue).toString(),
        y2: ((SLIDER_HEIGHT_DIFF + this.containerHeight) / 2).toString(),
        stroke: "#c2c2c2",
        strokeWidth: this.options.trackWidth.toString(),
      },
      flag: true,
    });
    this.sliderContainer.appendChild(this.trackPassed);
    if (this.options.showTicks) {
      this.createTicks();
    }
  }

  public createSliderBlock() {
    this.slider = <SVGCircleElement>createSvgElement({
      tag: "circle",
      para: {
        class: "slider " + (this.options.hideSlider ? "hidden-slider" : ""),
        r: SLIDER_RADIUS.toString(),
        cx: this.scale(this.currentValue).toString(),
        cy: ((SLIDER_HEIGHT_DIFF + this.containerHeight) / 2).toString(),
      },
      flag: true,
    });
    //bind dragging event to the slider
    this.slider.onpointerdown = (downEvt) => {
      this.sliderDown(downEvt.pageX);
    };
    this.sliderContainer.appendChild(this.slider);
  }

  public createValTxt() {
    this.currentValTxt = <SVGTextContentElement>createSvgElement({
      tag: "text",
      para: {
        alignmentBaseline: "hanging",
        textAnchor: "middle",
        x: `${this.containerWidth / 2 + this.sliderMargin}`,
        y: "4",
        fontSize: "14",
      },
      flag: true,
    });
    this.currentValTxt.innerHTML = `${this.currentValue}`;
  }

  public createWidget(): void {
    this.sliderContainer = <SVGSVGElement>createSvgElement({
      tag: "svg",
      para: {
        class: `float-slider-container ${NON_SKETCH_CLS}`,
        width: (this.containerWidth + 2 * this.sliderMargin).toString(),
        height: this.containerHeight.toString(),
      },
      flag: true,
    });

    this.createTrack();
    this.createSliderBlock();
    this.createValTxt();
    this.options.showCurrentVal &&
      this.sliderContainer.appendChild(this.currentValTxt);

    this.created = true;
    this.options.hideSlider ? this.fadeOutSlider() : this.fadeInSlider();
  }

  public sliderDown(downX: number) {
    // Reducer.triger(action.UPDATE_MOUSE_MOVING, true);
    // store.dispatch(updateMouseMoving(true));
    this.preX = downX;
    document.addEventListener("pointermove", (moveEvt: PointerEvent) => {
      this.sliderMove(moveEvt.pageX);
    });
    document.addEventListener("pointerup", () => {
      this.sliderUp();
    });
  }

  public sliderMove(moveX: number) {
    this.slided = true;
    const currentX: number = moveX;
    const diffX: number = currentX - this.preX;
    const oriSliderX: number = parseFloat(
      this.slider.getAttributeNS(null, "cx")
    );
    let currentSliderX: number = 0;
    if (
      oriSliderX + diffX <= this.containerWidth + this.sliderMargin &&
      oriSliderX + diffX >= this.sliderMargin
    ) {
      if (this.options.sliderType === NUMERIC_SLIDER) {
        // this.slider.setAttributeNS(null, 'cx', `${currentSliderX + diffX}`);
        // this.trackPassed.setAttributeNS(null, 'x2', `${currentSliderX + diffX}`);
        currentSliderX = oriSliderX + diffX;
        this.preX = currentX;
      } else if (this.options.sliderType === CATEGORY_SLIDER) {
        const step: number =
          this.containerWidth / (this.options.domain.length - 1);
        const idx: number = Math.round((currentX - this.preX) / step);
        // this.slider.setAttributeNS(null, 'cx', `${currentSliderX + idx * step}`);
        // this.trackPassed.setAttributeNS(null, 'x2', `${currentSliderX + idx * step}`);
        currentSliderX = oriSliderX + idx * step;
        if (Math.abs(idx) === 1) {
          this.preX += idx * step;
        }
      }
    } else if (oriSliderX + diffX > this.containerWidth + this.sliderMargin) {
      // this.slider.setAttributeNS(null, 'cx', `${this.containerWidth + this.sliderMargin}`);
      // this.trackPassed.setAttributeNS(null, 'x2', `${currentSliderX + diffX}`);
      currentSliderX = this.containerWidth + this.sliderMargin;
    } else if (oriSliderX + diffX < this.sliderMargin) {
      currentSliderX = this.sliderMargin;
    }
    this.currentValue = this.reverseScale(currentSliderX);
    if (this.callbackFunc && typeof this.callbackFunc !== "undefined") {
      this.callbackFunc(this.reverseScale(currentSliderX));
    }
  }

  public sliderUp() {
    // Reducer.triger(action.UPDATE_MOUSE_MOVING, false);
    // store.dispatch(updateMouseMoving(false));
    const currentSliderX: number = parseFloat(
      this.slider.getAttributeNS(null, "cx")
    );
    this.currentValue = this.reverseScale(currentSliderX);
    if (this.callbackFunc && typeof this.callbackFunc !== "undefined") {
      this.callbackFunc(this.currentValue);
    }
    document.onmousemove = null;
    document.onmouseup = null;
  }

  public moveSlider(value: number): void {
    this.currentValue = value;
    // this.slider.setAttributeNS(null, 'cx', this.scale(value).toString());
    // this.trackPassed.setAttributeNS(null, 'x2', this.scale(value).toString());
    if (this.callbackFunc && typeof this.callbackFunc !== "undefined") {
      this.callbackFunc(value);
    }
  }

  public updateCurrentValTxt() {
    if (typeof this.currentValTxt !== "undefined") {
      this.currentValTxt.innerHTML = `${this.currentValue}`;
    }
  }

  /**
   *
   * @param cw new container width
   */
  public updateSlider(cw: number) {
    this.containerWidth = cw;
  }

  public updateDomain(domain: [number, number]) {
    this.options.domain = domain;
  }

  public fadeInSlider() {
    this.sliderContainer.style.opacity = "1";
  }

  public fadeOutSlider() {
    this.sliderContainer.style.opacity = "0";
  }
}
