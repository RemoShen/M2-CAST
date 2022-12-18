import { BTN_CONTENT_TYPE_ICON, DATA_ICON } from "../buttons/button-consts";
import { ListMenu } from "../menu/listMenu";
import {
  FIRST_LEVEL_BTN_SIZE_BIG,
  IMenuItem,
  LIGHT_THEME,
} from "../menu/menu-consts";
import Nav from "../nav/nav";
import { NAV_HEIGHT } from "../nav/nav-consts";
import { kfContainer } from "../vl/kfContainer";
import { createSvgElement } from "../../../util/svgManager";
import { ICoord } from "../../global-interfaces";
import {
  DATA_VIEW_TITLE,
  DATA_VIEW_CONTENT_ID,
  DATA_VIEW_CONTENT_CLS,
  CHART_VIEW_TITLE,
  CHART_VIEW_CONTENT_ID,
  CHART_VIEW_CONTENT_CLS,
  VIDEO_VIEW_TITLE,
  VIDEO_VIEW_CONTENT_ID,
  VIDEO_VIEW_CONTENT_CLS,
  KF_VIEW_TITLE,
  KF_VIEW_CONTENT_ID,
  KF_VIEW_CONTENT_CLS,
  VIEW_CONTENT_CLS,
} from "./panel-consts";

export default class ViewContent {
  container: HTMLDivElement;

  public static createMultiChartContainer(): HTMLDivElement {
    const chartPanel: HTMLElement = document.getElementById(
      CHART_VIEW_CONTENT_ID
    );
    const multiChartContainer: HTMLDivElement = document.createElement("div");
    multiChartContainer.className = "multi-charts-cover";
    chartPanel.innerHTML = "";
    chartPanel.appendChild(multiChartContainer);
    return multiChartContainer;
  }

  public createViewContent(contentType: string) {
    switch (contentType) {
      case DATA_VIEW_TITLE:
        this.createViewContainer(DATA_VIEW_CONTENT_ID, DATA_VIEW_CONTENT_CLS);
        this.createDataDashboard();
        break;
      case CHART_VIEW_TITLE:
        this.createViewContainer(CHART_VIEW_CONTENT_ID, CHART_VIEW_CONTENT_CLS);
        this.createChartViewSVG();
        break;
      case VIDEO_VIEW_TITLE:
        this.createViewContainer(VIDEO_VIEW_CONTENT_ID, VIDEO_VIEW_CONTENT_CLS);
        break;
      case KF_VIEW_TITLE:
        this.createViewContainer(KF_VIEW_CONTENT_ID, KF_VIEW_CONTENT_CLS);
        this.container.appendChild(this.createKeyframeListContainer());
        break;
    }
  }

  public createChartViewSVG() {
    const svg: SVGElement = createSvgElement({
      tag: "svg",
      para: {},
      flag: true,
    });
    this.container.appendChild(svg);

    // const dataMenuCenter: ICoord = {
    //     x: FIRST_LEVEL_BTN_SIZE_BIG + 10,
    //     y: FIRST_LEVEL_BTN_SIZE_BIG + 40 + NAV_HEIGHT
    // }
    // const dataMenuStruct: IMenuItem = {
    //     type: BTN_CONTENT_TYPE_ICON,
    //     content: DATA_ICON,
    //     theme: LIGHT_THEME,
    //     buttonActionType: MENU_TYPE_MAIN,
    //     subMenu: [{
    //         type: TouchBtn.BTN_CONTENT_TYPE_STR,
    //         content: 'Data',
    //         buttonActionType: TouchPopMenu.MENU_TYPE_DATA
    //     }, {
    //         type: TouchBtn.BTN_CONTENT_TYPE_STR,
    //         content: 'Data',
    //         buttonActionType: TouchPopMenu.MENU_TYPE_DATA
    //     }]
    // }

    // const menu: ListMenu = new ListMenu(dataMenuCenter, { width: svg.clientWidth, height: svg.clientHeight }, dataMenuStruct, false);
    // menu.container.setAttributeNS(null, 'id', ViewContent.DATA_MENU_ID);
    // svg.appendChild(menu.container);
  }

  public createViewContainer(id: string, className: string): void {
    this.container = document.createElement("div");
    this.container.id = id;
    this.container.className = VIEW_CONTENT_CLS + " " + className;
    // if (id === ViewContent.CHART_VIEW_CONTENT_ID) {
    //     const multiChartCover: HTMLDivElement = document.createElement('div');
    //     multiChartCover.className = 'multi-charts-cover';
    //     this.container.appendChild(multiChartCover);
    // }
  }

  public createKeyframeListContainer(): HTMLDivElement {
    const keyframePanel: HTMLDivElement = document.createElement("div");
    keyframePanel.className = "kf-panel";
    kfContainer.createKfContainer();
    keyframePanel.appendChild(kfContainer.kfWidgetContainer);

    return keyframePanel;
  }

  public createDataDashboard() {
    //data table container
    const dataTableWrapper: HTMLDivElement = document.createElement("div");
    dataTableWrapper.className = "data-table-wrapper";

    const dataTableContainer: HTMLDivElement = document.createElement("div");
    dataTableContainer.id = "dataTabelContainer";
    dataTableContainer.className = "data-table-container";
    dataTableWrapper.appendChild(dataTableContainer);
    this.container.appendChild(dataTableWrapper);
  }
}
