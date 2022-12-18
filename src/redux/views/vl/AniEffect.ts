import { BTN_CONTENT_TYPE_ICON, CIRCLE_BTN } from "../buttons/button-consts";
import { SVGBtn } from "../buttons/svgButton";
import { KfContainer } from "./kfContainer";
import { DARK_COLOR, LIGHT_COLOR } from "../menu/menu-consts";
import { effectIcons, EFFECT_NULL, GROUP_TITLE_HEIHGT } from "./vl-consts";
import EffectBubble from "../bubble/effectBubble";
import KfGroup from "./kfGroup";
import { BUBBLE_FROM_BOTTOM } from "../bubble/bubble-consts";
import { createSvgElement } from "../../../util/svgManager";

export class AniEffect {
  static BTN_SIZE: number = 16;
  static PADDING: number = 2;
  static MARGIN: number = AniEffect.PADDING * 4;
  static MAX_ITEM_WIDTH: number = 100;
  static MENU_RX: number = 8;
  static CHAR_WIDTH: number = 9;
  static FONT_COLOR: string = "#676767";
  static ICON_HIGHLIGHT_COLOR: string = "#ededed";
  static MENU_LIST_WIDTH: number = 120;
  static EASING_MENU_LIST_WIDTH: number = 156;
  static MENU_LIST_ITEM_HEIGHT: number = 20;
  static DURATION: string = "duration";

  public effectType: string;
  public className: string;
  public aniId: string;
  public container: SVGGElement;
  public menuListContainer: SVGGElement;
  public startX: number;
  public availableWidth: number;
  public effectBubble: EffectBubble;

  constructor(
    effectType: string,
    className: string,
    aniId: string,
    startX: number,
    availableWidth: number
  ) {
    this.effectType = effectType;
    this.className = className;
    this.aniId = aniId;
    this.startX = startX;
    this.availableWidth = availableWidth;
    this.createItem();
  }

  private createItem(): void {
    this.container = <SVGGElement>createSvgElement({
      tag: "g",
      para: {
        transform: `translate(${this.startX},0)`,
      },
      flag: true,
    });

    let labelConent: string = this.className;
    let tmpAvailableWidth: number = this.availableWidth;
    if (this.effectType !== EFFECT_NULL) {
      //need to create effect btn
      const effectTypeBtn: SVGGElement = this.createBtn(this.effectType);
      tmpAvailableWidth -= AniEffect.BTN_SIZE + AniEffect.PADDING;
      this.container.appendChild(effectTypeBtn);
    }
    if (labelConent.length * AniEffect.CHAR_WIDTH > tmpAvailableWidth) {
      labelConent = `${labelConent.substring(0, 3)}.`;
    }
    const markLabel: SVGTextContentElement = <SVGTextContentElement>(
      createSvgElement({
        tag: "text",
        para: {
          fontSize: "10pt",
          x:
            this.effectType === EFFECT_NULL
              ? "0"
              : `${AniEffect.BTN_SIZE + 2 * AniEffect.PADDING}`,
          y: `${GROUP_TITLE_HEIHGT / 2}`,
          fill: AniEffect.FONT_COLOR,
        },
        flag: true,
      })
    );
    markLabel.innerHTML = labelConent;
    this.container.appendChild(markLabel);
  }

  private findMark(aniId: string, clsName: string): string {
    const targetGroup: KfGroup = KfGroup.allAniGroups.get(aniId);
    let mId: string = "";
    if (typeof targetGroup !== "undefined") {
      const allMarks: string[] = targetGroup.marksThisAni();
      for (let i = 0, len = allMarks.length; i < len; i++) {
        const tmpMarkCls: string = document
          .getElementById(allMarks[i])
          .getAttributeNS(null, "class");
        if (tmpMarkCls.indexOf(clsName) >= 0) {
          mId = allMarks[i];
          break;
        }
      }
    }
    return mId;
  }

  private createBtn(btnType: string, duration?: number): SVGGElement {
    const btn: SVGBtn = new SVGBtn(
      <any>document.getElementById(KfContainer.KF_CONTAINER),
      true,
      {
        type: CIRCLE_BTN,
        center: { x: AniEffect.BTN_SIZE / 2, y: AniEffect.BTN_SIZE / 2 },
        r: AniEffect.BTN_SIZE / 2,
        appearAni: false,
        startFill: "rgb(220, 220, 220)",
        endFill: DARK_COLOR,
        innerContent: {
          type: BTN_CONTENT_TYPE_ICON,
          fontSize: 10,
          content: effectIcons.get(btnType),
        },
        events: [
          {
            type: "pointerdown",
            func: (e: PointerEvent) => {
              if (typeof this.effectBubble === "undefined") {
                this.effectBubble = new EffectBubble(
                  btn.container,
                  BUBBLE_FROM_BOTTOM,
                  true,
                  true,
                  this.findMark(this.aniId, this.className)
                );
              }
              this.effectBubble.shown = false;
              // this.effectBubble.shown = !this.effectBubble.shown;
            },
          },
        ],
        values: [],
      }
    );
    return btn.container;
  }
}
