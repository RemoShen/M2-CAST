import { ICoord } from "../../global-interfaces";
import { IEvent } from "../buttons/button-consts";

export const SHADOW_FILTER_ID: string = "menuShadow";
export const DARK_THEME: string = "dark";
export const DARK_COLOR: string = "#676767";
export const LIGHT_THEME: string = "light";
export const LIGHT_COLOR: string = "#fff";
export const STROKE_COLOR: string = "#9a9a9a";

export const SUBMENU_DISPLAY_FIXED: number = 0;
export const SUBMENU_DISPLAY_AUTO: number = 1;

export const FIRST_LEVEL_BTN_SIZE_BIG: number = 28;
export const FIRST_LEVEL_BTN_SIZE_SMALL: number = 6;
export const SECOND_LEVEL_BTN_SIZE: number = 24;
export const CIRCLE_MENU_R: number = 100;
export const LIST_MENU_BTN_MARGIN: number = 20;
export const LIST_MENU_LEVEL_GAP: number = 30;
export const MAX_SUBMENU_ANGLE = Math.PI / 4;

export const TOP_LEFT: number = 0;
export const TOP: number = 1;
export const TOP_RIGHT: number = 2;
export const RIGHT: number = 3;
export const BOTTOM_RIGHT: number = 4;
export const BOTTOM: number = 5;
export const BOTTOM_LEFT: number = 6;
export const LEFT: number = 7;
export const CENTER: number = 8;

export interface IMenuItem {
  type: string;
  content: string;
  buttonActionType: number;
  subMenuDisplay?: number;
  theme?: string;
  value?: number[] | string[];
  subMenu?: ISubMenuItem[];
}

export interface ISubMenuItem {
  type: string;
  content: string;
  strokeWidth: number;
  buttonActionType: number;
  value?: number[] | string[];
  percent?: number;
  evts: IEvent[];
}

export interface IMenuOptions {
  targetSVG?: SVGElement;
  parent?: SVGGElement | SVGElement;
  menuCenter?: ICoord;
  menuStruct?: IMenuItem;
  showSubMenu?: boolean;
  floating: boolean;
}
