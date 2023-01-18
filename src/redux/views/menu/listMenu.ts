import { NON_SKETCH_CLS } from "../../global-consts";
import { ICoord } from "../../global-interfaces";
import {
  createAnimatingEle,
  createSvgElement,
  HIDE_CLS,
  SHOW_CLS,
} from "../../../util/svgManager";
import {
  BTN_CONTENT_TYPE_STR,
  BTN_HEIGHT,
  LETTER_WIDTH,
  RECT_BTN,
  RECT_BTN_PADDING,
} from "../buttons/button-consts";
import { Menu } from "./menu";
import {
  FIRST_LEVEL_BTN_SIZE_BIG,
  IMenuOptions,
  ISubMenuItem,
  LIST_MENU_BTN_MARGIN,
  LIST_MENU_LEVEL_GAP,
  SECOND_LEVEL_BTN_SIZE,
  STROKE_COLOR,
} from "./menu-consts";

export class ListMenu extends Menu {
  maxContentLen: number = 0;

  constructor(options: IMenuOptions) {
    super(options);
    this.updateTargetSVGPosiAndSize(this.options.showSubMenu);
    this.initMenu();
  }

  updateTargetSVGPosiAndSize(showSubMenu: boolean) {
    if (showSubMenu) {
      const svgPosi: ICoord = {
        x: this.options.menuCenter.x - this.centerR,
        y:
          this.options.menuCenter.y -
          SECOND_LEVEL_BTN_SIZE -
          ((this.options.menuStruct.subMenu.length - 1) *
            (BTN_HEIGHT + LIST_MENU_BTN_MARGIN)) /
            2,
      };
      this.updateMenuCenter({
        x: this.centerR,
        y:
          SECOND_LEVEL_BTN_SIZE +
          ((this.options.menuStruct.subMenu.length - 1) *
            (BTN_HEIGHT + LIST_MENU_BTN_MARGIN)) /
            2,
      });
      this.updateTargetSVGPosi(svgPosi);
      this.options.menuStruct.subMenu.forEach((s: ISubMenuItem) => {
        if (s.type === BTN_CONTENT_TYPE_STR) {
          if (s.content.length > this.maxContentLen) {
            this.maxContentLen = s.content.length;
          }
        }
      });
      this.updateTargetSVGSize({
        width:
          this.centerR * 2 +
          LIST_MENU_LEVEL_GAP +
          this.maxContentLen * LETTER_WIDTH +
          RECT_BTN_PADDING * 2 +
          10,
        height:
          this.options.menuStruct.subMenu.length *
          (BTN_HEIGHT + LIST_MENU_BTN_MARGIN),
      });
    } else {
      const svgPosi: ICoord = {
        x: this.options.menuCenter.x - this.centerR,
        y: this.options.menuCenter.y - this.centerR,
      };
      this.updateMenuCenter({ x: this.centerR, y: this.centerR });
      this.updateTargetSVGPosi(svgPosi);
      this.updateTargetSVGSize({
        width: FIRST_LEVEL_BTN_SIZE_BIG * 2,
        height: FIRST_LEVEL_BTN_SIZE_BIG * 2,
      });
    }
  }

  createSubMenu(): void {
    const subMenuContainer: SVGGElement = <SVGGElement>(
      createSvgElement({ tag: "g", para: {}, flag: true })
    );
    if (this.options.menuStruct.subMenu.length > 0) {
      //buttons
      for (
        let i = 0, len = this.options.menuStruct.subMenu.length;
        i < len;
        i++
      ) {
        const menuItem: ISubMenuItem = this.options.menuStruct.subMenu[i];
        const tmpCenter: ICoord = {
          x: this.options.menuCenter.x + LIST_MENU_LEVEL_GAP,
          y:
            this.options.menuCenter.y +
            i * (BTN_HEIGHT + LIST_MENU_BTN_MARGIN) -
            ((len - 1) * (BTN_HEIGHT + LIST_MENU_BTN_MARGIN)) / 2,
          // y: this.options.menuCenter.y + FIRST_LEVEL_BTN_SIZE_BIG + (i * 2 + 1) * SECOND_LEVEL_BTN_SIZE + (i + 1) * LIST_MENU_BTN_MARGIN
        };
        const line: SVGLineElement = <SVGLineElement>createSvgElement({
          tag: "line",
          para: {
            x1: this.options.menuCenter.x,
            y1: this.options.menuCenter.y,
            x2: tmpCenter.x,
            y2: tmpCenter.y,
            class: NON_SKETCH_CLS,
            stroke: STROKE_COLOR,
            fill: "none",
            strokeDasharray: "4 3",
          },
          flag: true,
        });
        subMenuContainer.appendChild(line);
        const subMenuBtn = this.createBtn(
          menuItem.type,
          menuItem.content,
          RECT_BTN,
          tmpCenter,
          this.maxContentLen * LETTER_WIDTH + RECT_BTN_PADDING * 2 + 10,
          true,
          menuItem.buttonActionType,
          menuItem.evts,
          menuItem.value
        );
        this.subMenuItems.push(subMenuBtn);
        subMenuContainer.appendChild(subMenuBtn.container);
      }
    }
    this.subMenu = subMenuContainer;
    this.container.appendChild(this.subMenu);
  }

  unfoldSubMenu() {
    if (typeof this.subMenu !== "undefined") {
      // this.updateTargetSVGSize({
      //     width: FIRST_LEVEL_BTN_SIZE_BIG * 2,
      //     height: FIRST_LEVEL_BTN_SIZE_BIG * 2 + this.options.menuStruct.subMenu.length * (LIST_MENU_BTN_MARGIN + SECOND_LEVEL_BTN_SIZE * 2)
      // })
      this.updateTargetSVGPosiAndSize(true);

      this.subMenu.querySelectorAll(`.${SHOW_CLS}`).forEach((smb) => {
        (<any>smb).beginElement();
      });
    }
  }

  foldSubMenu() {
    if (typeof this.subMenu !== "undefined") {
      // this.updateTargetSVGSize({
      //     width: FIRST_LEVEL_BTN_SIZE_BIG * 2,
      //     height: FIRST_LEVEL_BTN_SIZE_BIG * 2
      // })
      this.updateTargetSVGPosiAndSize(false);

      this.subMenu.querySelectorAll(`.${HIDE_CLS}`).forEach((smb) => {
        (<any>smb).beginElement();
      });
    }
  }
}
