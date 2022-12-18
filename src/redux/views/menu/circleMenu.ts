import { NON_SKETCH_CLS } from "../../global-consts";
import { ICoord } from "../../global-interfaces";
import { createAnimatingEle, createSvgElement } from "../../../util/svgManager";
import { CIRCLE_BTN } from "../buttons/button-consts";
import { Menu } from "./menu";
import {
  IMenuItem,
  IMenuOptions,
  CIRCLE_MENU_R,
  SECOND_LEVEL_BTN_SIZE,
  STROKE_COLOR,
  CENTER,
  BOTTOM,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
  LEFT,
  RIGHT,
  TOP,
  TOP_LEFT,
  TOP_RIGHT,
  SUBMENU_DISPLAY_AUTO,
  ISubMenuItem,
} from "./menu-consts";

export class CircularMenu extends Menu {
  fullArc: boolean;
  subMenuAngles: number[];

  constructor(options: IMenuOptions, fullArc: boolean) {
    super(options);
    this.fullArc = fullArc;
    this.subMenuAngles = [];
    this.updateTargetSVGPosiAndSize(this.options.showSubMenu);
    this.initMenu();
  }

  updateTargetSVGPosiAndSize(showSubMenu: boolean) {
    const svgPosi: ICoord = {
      x: this.options.menuCenter.x - CIRCLE_MENU_R - SECOND_LEVEL_BTN_SIZE,
      y: this.options.menuCenter.y - CIRCLE_MENU_R - SECOND_LEVEL_BTN_SIZE,
    };

    this.updateTargetSVGPosi(svgPosi);
    if (showSubMenu) {
      this.updateMenuCenter({
        x: CIRCLE_MENU_R + SECOND_LEVEL_BTN_SIZE,
        y: CIRCLE_MENU_R + SECOND_LEVEL_BTN_SIZE,
      });
      this.updateTargetSVGSize({
        width: (CIRCLE_MENU_R + SECOND_LEVEL_BTN_SIZE) * 2,
        height: (CIRCLE_MENU_R + SECOND_LEVEL_BTN_SIZE) * 2,
      });
    } else {
      this.updateMenuCenter({ x: this.centerR * 2, y: this.centerR * 2 });
      this.updateTargetSVGSize({
        width: this.centerR * 2,
        height: this.centerR * 2,
      });
    }
  }

  createSubMenu(): void {
    const subMenuContainer: SVGGElement = <SVGGElement>(
      createSvgElement({ tag: "g", para: {}, flag: true })
    );
    if (this.options.menuStruct.subMenu.length > 0) {
      let availableAngle: [number, number] = [Math.PI, Math.PI * 3];

      let startAngle: number = availableAngle[0];
      if (this.options.menuStruct.subMenuDisplay & SUBMENU_DISPLAY_AUTO) {
        //judge menu position
        let positionNo = CENTER;
        if (this.options.menuCenter.x < CIRCLE_MENU_R) {
          positionNo = LEFT;
          if (this.options.menuCenter.y < CIRCLE_MENU_R) {
            positionNo = TOP_LEFT;
          } else if (
            this.options.menuCenter.y >
            this.svgSize.height - CIRCLE_MENU_R
          ) {
            positionNo = BOTTOM_LEFT;
          }
        } else if (
          this.options.menuCenter.x >
          this.svgSize.width - CIRCLE_MENU_R
        ) {
          positionNo = RIGHT;
          if (this.options.menuCenter.y < CIRCLE_MENU_R) {
            positionNo = TOP_RIGHT;
          } else if (
            this.options.menuCenter.y >
            this.svgSize.height - CIRCLE_MENU_R
          ) {
            positionNo = BOTTOM_RIGHT;
          }
        } else {
          if (this.options.menuCenter.y < CIRCLE_MENU_R) {
            positionNo = TOP;
          } else if (
            this.options.menuCenter.y >
            this.svgSize.height - CIRCLE_MENU_R
          ) {
            positionNo = BOTTOM;
          }
        }

        switch (positionNo) {
          case TOP_LEFT: //top-left corner
            availableAngle = [0, Math.PI / 2];
            break;
          case TOP: //top
            availableAngle = [0, Math.PI];
            break;
          case TOP_RIGHT: //top-right corner
            availableAngle = [Math.PI / 2, Math.PI];
            break;
          case RIGHT: //right
            availableAngle = [Math.PI / 2, (3 * Math.PI) / 2];
            break;
          case BOTTOM_RIGHT: //bottom-right corner
            availableAngle = [Math.PI, (3 * Math.PI) / 2];
            break;
          case BOTTOM: //bottom
            availableAngle = [Math.PI, 2 * Math.PI];
            break;
          case BOTTOM_LEFT: //bottom-left corner
            availableAngle = [(3 * Math.PI) / 2, 2 * Math.PI];
            break;
          case LEFT: //left
            availableAngle = [(3 * Math.PI) / 2, (5 * Math.PI) / 2];
            break;
          default:
            availableAngle = [Math.PI, Math.PI * 3];
            break;
        }
        const autoStepAngle: number =
          (availableAngle[1] - availableAngle[0]) /
          (this.options.menuStruct.subMenu.length - 1);
        const midAngle: number =
          (availableAngle[1] - availableAngle[0]) / 2 + availableAngle[0];
        startAngle =
          midAngle -
          ((this.options.menuStruct.subMenu.length - 1) * autoStepAngle) / 2;
        this.subMenuAngles = new Array(this.options.menuStruct.subMenu.length)
          .fill(0)
          .map((a: number, idx: number) => {
            return startAngle + idx * autoStepAngle;
          });
      } else {
        const angleRange: number = availableAngle[1] - availableAngle[0];
        this.options.menuStruct.subMenu.forEach((subMenuItem: ISubMenuItem) => {
          this.subMenuAngles.push(
            availableAngle[0] + angleRange * subMenuItem.percent
          );
        });
      }

      const subMenuCenters: ICoord[] = [];
      const subMenuItems: SVGGElement[] = [];

      this.options.menuStruct.subMenu.forEach(
        (subMenuItem: ISubMenuItem, idx: number) => {
          const menuItem: IMenuItem = subMenuItem;
          const currentAngle: number = this.subMenuAngles[idx];
          const tpmCenter: ICoord = {
            x:
              Math.cos(currentAngle) * CIRCLE_MENU_R +
              this.options.menuCenter.x,
            y:
              Math.sin(currentAngle) * CIRCLE_MENU_R +
              this.options.menuCenter.y,
          };
          const subMenuBtn = this.createBtn(
            menuItem.type,
            menuItem.content,
            CIRCLE_BTN,
            tpmCenter,
            SECOND_LEVEL_BTN_SIZE,
            true,
            menuItem.buttonActionType,
            subMenuItem.evts,
            menuItem.value,
            subMenuItem.strokeWidth
          );
          this.subMenuItems.push(subMenuBtn);
          subMenuCenters.push(tpmCenter);
          subMenuItems.push(subMenuBtn.container);
        }
      );

      // create arc
      let startD: string = "",
        endD: string = "";
      if (!this.fullArc) {
        const arcPara: string[] = [
          `${CIRCLE_MENU_R}`,
          `${CIRCLE_MENU_R}`,
          "0",
          this.options.menuStruct.subMenuDisplay & SUBMENU_DISPLAY_AUTO
            ? this.subMenuAngles[this.subMenuAngles.length - 1] *
                (this.options.menuStruct.subMenu.length - 1) >
              Math.PI
              ? "1"
              : "0"
            : "1",
          "1",
          `${subMenuCenters[subMenuCenters.length - 1].x}`,
          `${subMenuCenters[subMenuCenters.length - 1].y}`,
        ];
        startD = "M" + subMenuCenters[0].x + "," + subMenuCenters[0].y;
        endD =
          "M" +
          subMenuCenters[0].x +
          "," +
          subMenuCenters[0].y +
          "A" +
          arcPara.join(" ");
      } else {
        startD =
          "M" +
          (this.options.menuCenter.x - CIRCLE_MENU_R) +
          "," +
          this.options.menuCenter.y;
        endD =
          "M" +
          (this.options.menuCenter.x - CIRCLE_MENU_R) +
          "," +
          this.options.menuCenter.y +
          "a" +
          CIRCLE_MENU_R +
          " " +
          CIRCLE_MENU_R +
          " 0 1 0 " +
          CIRCLE_MENU_R * 2 +
          " 0" +
          "a" +
          CIRCLE_MENU_R +
          " " +
          CIRCLE_MENU_R +
          " 0 1 0 " +
          -CIRCLE_MENU_R * 2 +
          " 0";
      }
      const arc: SVGPathElement = <SVGPathElement>createAnimatingEle(
        {
          tag: "path",
          para: {
            class: NON_SKETCH_CLS,
            stroke: STROKE_COLOR,
            fill: "none",
            strokeDasharray: "4 3",
          },
          flag: true,
        },
        true,
        [],
        [
          {
            attrName: "d",
            from: startD,
            to: endD,
            dur: "0.15s",
          },
        ]
      );
      subMenuContainer.appendChild(arc);

      subMenuItems.forEach((subMenuItem, i) => {
        //create lines
        const line: SVGLineElement = <SVGLineElement>createAnimatingEle(
          {
            tag: "line",
            para: {
              class: NON_SKETCH_CLS,
              stroke: STROKE_COLOR,
              fill: "none",
              strokeDasharray: "4 3",
              x1: `${this.options.menuCenter.x}`,
              y1: `${this.options.menuCenter.y}`,
              x2: `${this.options.menuCenter.x}`,
              y2: `${this.options.menuCenter.y}`,
            },
            flag: true,
          },
          true,
          [],
          [
            {
              attrName: "x2",
              from: `${this.options.menuCenter.x}`,
              to: `${subMenuCenters[i].x}`,
              dur: "0.2s",
            },
            {
              attrName: "y2",
              from: `${this.options.menuCenter.y}`,
              to: `${subMenuCenters[i].y}`,
              dur: "0.2s",
            },
          ]
        );
        subMenuContainer.appendChild(line);
        subMenuContainer.appendChild(subMenuItem);
      });
    }
    this.subMenu = subMenuContainer;
    this.container.appendChild(this.subMenu);
  }
}
