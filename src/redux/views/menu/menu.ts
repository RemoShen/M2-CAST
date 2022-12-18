import "../../assets/style/menu.scss";
import { NON_SKETCH_CLS } from "../../global-consts";
import { ICoord, ISize } from "../../global-interfaces";
import { createSvgElement, HIDE_CLS, SHOW_CLS } from "../../../util/svgManager";
import {
  BIG_FONT,
  BTN_TYPE_DATA,
  BTN_TYPE_MAIN,
  CIRCLE_BTN,
  IEvent,
  MID_FONT,
  PNT_DOWN_SIZE,
  SHADOW_R,
  SHADOW_X,
  SHADOW_Y,
} from "../buttons/button-consts";
import { SVGBtn } from "../buttons/svgButton";
import {
  DARK_THEME,
  DARK_COLOR,
  LIGHT_COLOR,
  FIRST_LEVEL_BTN_SIZE_SMALL,
  FIRST_LEVEL_BTN_SIZE_BIG,
  IMenuOptions,
} from "./menu-consts";

export class Menu {
  options: IMenuOptions = { floating: false };
  // targetSVG: SVGElement
  // parent: SVGElement | SVGGElement
  _svgSize: ISize;
  container: SVGGElement;
  // menuCenter: ICoord
  // menuStruct: IMenuItem
  _showSubMenu: boolean;
  mainBtn: SVGBtn;
  centerR: number;
  subMenu: SVGGElement;
  subMenuItems: SVGBtn[];
  _highlightItem: number;
  _selectedItem: number;
  addShadow: boolean = true;

  set showSubMenu(ssm: boolean) {
    this._showSubMenu = ssm;
    ssm ? this.unfoldSubMenu() : this.foldSubMenu();
  }

  get showSubMenu(): boolean {
    return this._showSubMenu;
  }

  set svgSize(s: ISize) {
    this._svgSize = s;
    if (
      this.options.targetSVG &&
      typeof this.options.targetSVG !== "undefined"
    ) {
      this.options.targetSVG.setAttributeNS(null, "width", `${s.width}`);
      this.options.targetSVG.setAttributeNS(null, "height", `${s.height}`);
    }
  }

  get svgSize(): ISize {
    return this._svgSize;
  }

  set highlightItem(hi: number) {
    if (hi !== this._highlightItem) {
      this.subMenuItems.forEach((subMenuItem: SVGBtn) => {
        subMenuItem.btnDown = false;
      });
      if (typeof this.subMenuItems[hi] !== "undefined") {
        this.subMenuItems[hi].btnDown = true;
      }
      this._highlightItem = hi;
    }
  }
  get highlightItem(): number {
    return this._highlightItem;
  }

  set selectedItem(si: number) {
    if (typeof this.subMenuItems[si] !== "undefined") {
      this.subMenuItems[si].triggerBtn();
    }
    this._selectedItem = si;
  }

  get selectedItem(): number {
    return this._selectedItem;
  }

  constructor(options: IMenuOptions) {
    Object.assign(this.options, options || {});
    !this.options.targetSVG && this.createTargetSVG();
    this.options.targetSVG.classList.add(NON_SKETCH_CLS);
    !this.options.parent && this.assignParent();
    this.centerR =
      this.options.menuStruct.content === ""
        ? FIRST_LEVEL_BTN_SIZE_SMALL
        : FIRST_LEVEL_BTN_SIZE_BIG;
    this.subMenuItems = [];
    this._highlightItem = -1;
  }

  initMenu() {
    this.container = <SVGGElement>(
      createSvgElement({ tag: "g", para: {}, flag: true })
    );
    this.options.parent.appendChild(this.container);

    //create sub menu
    this.createSubMenu();

    //main button
    this.createMainBtn();

    this.showSubMenu = this.options.showSubMenu;
  }

  createTargetSVG() {
    this.options.targetSVG = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    this.options.targetSVG.classList.add("menu-svg");
  }

  /**
   * add shadow shift
   * @param posi
   */
  updateTargetSVGPosi(posi: ICoord) {
    if (
      this.options.targetSVG &&
      typeof this.options.targetSVG !== "undefined"
    ) {
      this.options.targetSVG.style.left = `${
        posi.x -
        PNT_DOWN_SIZE -
        (this.options.floating ? SHADOW_R - SHADOW_X : 0)
      }px`;
      this.options.targetSVG.style.top = `${
        posi.y -
        PNT_DOWN_SIZE -
        (this.options.floating ? SHADOW_R - SHADOW_Y : 0)
      }px`;
    }
  }
  /**
   * add shadow shift
   * @param posi
   */
  updateTargetSVGSize(size: ISize) {
    this.svgSize = {
      width:
        size.width +
        PNT_DOWN_SIZE * 2 +
        (this.options.floating ? SHADOW_R * 2 : 0),
      height:
        size.height +
        PNT_DOWN_SIZE * 2 +
        (this.options.floating ? SHADOW_R * 2 : 0),
    };
  }
  updateTargetSVGPosiAndSize(showSubMenu: boolean) {}
  updateMenuCenter(c: ICoord) {
    this.options.menuCenter = {
      x:
        c.x + PNT_DOWN_SIZE + (this.options.floating ? SHADOW_R - SHADOW_X : 0),
      y:
        c.y + PNT_DOWN_SIZE + (this.options.floating ? SHADOW_R - SHADOW_Y : 0),
    };
  }

  assignParent() {
    this.options.parent = this.options.targetSVG;
  }

  createSubMenu(): void {
    this.subMenu = <SVGGElement>(
      createSvgElement({ tag: "g", para: {}, flag: true })
    );
    this.container.appendChild(this.subMenu);
  }

  unfoldSubMenu() {
    if (typeof this.subMenu !== "undefined") {
      this.subMenu.querySelectorAll(`.${SHOW_CLS}`).forEach((smb) => {
        (<any>smb).beginElement();
      });
    }
  }

  foldSubMenu() {
    if (typeof this.subMenu !== "undefined") {
      this.subMenu.querySelectorAll(`.${HIDE_CLS}`).forEach((smb) => {
        (<any>smb).beginElement();
      });
    }
  }

  createBtn(
    type: string,
    content: string,
    shape: number,
    center: ICoord,
    r: number,
    animate: boolean,
    btnActionType: number,
    evts: IEvent[],
    value?: number[] | string[],
    strokeWidth?: number
  ): SVGBtn {
    const fontSize: number =
      btnActionType === BTN_TYPE_MAIN ? BIG_FONT : MID_FONT;
    // const events: IEvent[] = evts.map(evt => ({ type: 'pointerdown', func: evt })) || [];

    // decide btn event listener
    switch (btnActionType) {
      case BTN_TYPE_MAIN:
        evts.push({
          type: "pointerup",
          func: () => {
            this.showSubMenu = !this.showSubMenu;
          },
        });
        break;
      case BTN_TYPE_DATA:
        // evts.push({
        //     type: 'pointerdown',
        //     func: () => {
        //         this.showSubMenu = !this.showSubMenu;
        //     }
        // })
        break;
      default:
        break;
    }
    let createShadow: boolean = this.addShadow;
    this.addShadow = false;
    const btn: SVGBtn = new SVGBtn(this.options.targetSVG, createShadow, {
      type: shape,
      center: center,
      r: r,
      appearAni: animate,
      startFill:
        this.options.menuStruct.theme === DARK_THEME ? DARK_COLOR : LIGHT_COLOR,
      endFill:
        this.options.menuStruct.theme === DARK_THEME ? LIGHT_COLOR : DARK_COLOR,
      innerContent: {
        type: type,
        fontSize: fontSize,
        content: content,
      },
      events: evts,
      values: value,
      strokeWidth,
    });
    btn.bindPressing(btnActionType);
    return btn;
  }

  createMainBtn(): void {
    this.mainBtn = this.createBtn(
      this.options.menuStruct.type,
      this.options.menuStruct.content,
      CIRCLE_BTN,
      this.options.menuCenter,
      this.centerR,
      false,
      this.options.menuStruct.buttonActionType,
      [],
      this.options.menuStruct.value
    );
    this.container.appendChild(this.mainBtn.container);
  }

  highlightSubMenuItem() {}

  toggleMenu(flag: boolean) {
    this.options.targetSVG.style.display = flag ? "" : "none";
  }

  reset() {
    this.showSubMenu = false;
    this.highlightItem = -1;
    this.selectedItem = -1;
  }
}
