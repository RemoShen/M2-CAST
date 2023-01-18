import { kfContainer } from "../vl/kfContainer";
import { createSvgElement } from "../../../util/svgManager";
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
  }

  public createViewContainer(id: string, className: string): void {
    this.container = document.createElement("div");
    this.container.id = id;
    this.container.className = VIEW_CONTENT_CLS + " " + className;
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
