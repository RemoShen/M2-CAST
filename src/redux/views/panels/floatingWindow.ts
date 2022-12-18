import "../../assets/style/panels/floating-window.scss";
import MushroomImg from "../../assets/img/examples/mushroom.png";
import MushroomChart from "../../assets/charts/mushrooms_s.svg";
import OsImg from "../../assets/img/examples/os.png";
import OsChart from "../../assets/charts/os.svg";
import DemoImg from "../../assets/img/examples/demo.png";
import DemoChart from "../../assets/charts/demo.svg";
import NightingaleImg from "../../assets/img/examples/nightingale.png";
import NightingaleChart from "../../assets/charts/nightingale.svg";
import Co2Img from "../../assets/img/examples/co2.png";
import Co2Chart from "../../assets/charts/co2.svg";
import DessertImg from "../../assets/img/examples/dessert.png";
import DessertChart from "../../assets/charts/desserts.svg";
import BostonImg from "../../assets/img/examples/bostonWeather.png";
import BostonChart from "../../assets/charts/bostonWeather.svg";
import WorldPopuImg from "../../assets/img/examples/worldPopulation.png";
import WorldPopuChart from "../../assets/charts/worldPopulation.svg";
import PolioImg from "../../assets/img/examples/polio.png";
import PolioChart from "../../assets/charts/polio_black.svg";
import DrivingImg from "../../assets/img/examples/driving.png";
import DrivingChart from "../../assets/charts/driving.svg";
import FlareImg from "../../assets/img/examples/flare.png";
import FlareChart from "../../assets/charts/flare.svg";
import DynamicChart from "../../assets/charts/dynamic.svg";
import DynamicImg from "../../assets/img/examples/dynamic.png";
import UsPopulationImg from "../../assets/img/examples/usPopulation.png";
import UsPopulationChart from "../../assets/charts/usPopulation.svg";
import PurchaseLineChart from "../../assets/charts/purchases.svg";
import PurchaseLineImg from "../../assets/img/examples/purchases.png";
import Reducer from "../../../app/reducer";
import * as action from "../../../app/action";
import { State, state } from "../../../app/state";
import { Loading } from "../widgets/loading";
import {
  BOSTON_CHART,
  CLICKABLE_AREA_CHART,
  CLICKABLE_AREA_PROJECT,
  CO2_CHART,
  DEMO_CHART,
  DESSERT_CHART,
  DRIVING_CHART,
  DYNAMIC_CHART,
  FLARE_CHART,
  MUSHROOM_CHART,
  NIGHTINGALE_CHART,
  OS_CHART,
  POLIO_CHART,
  PURCHASE_CHART,
  USPOPULATION_CHART,
  VIDEO_VIEW_CONTENT_ID,
  WORLDPOPULATION_CHART,
} from "./panel-consts";
import { NON_SKETCH_CLS } from "../../global-consts";
import { store } from "../../store";
import { updateSpecCharts } from "../../action/canisAction";
import { clearSelectMarks } from "../../action/chartAction";
import { toggleLoading } from "../../renderers/renderer-tools";

export default class FloatingWindow {
  floatingWindow: HTMLDivElement;
  static TYPE_EXAMPLE: any;
  static DESSERT_CHART: any;

  public createFloatingWindow(id: string) {
    //create the background container
    this.floatingWindow = document.createElement("div");
    this.floatingWindow.id = id;
    this.floatingWindow.className = `floating-container ${NON_SKETCH_CLS}`;
    const windowBg: HTMLDivElement = document.createElement("div");
    windowBg.className = "floating-bg";
    this.floatingWindow.appendChild(windowBg);

    //create window
    const fWindow: HTMLDivElement = document.createElement("div");
    fWindow.className = "f-window";
    const windowTitle: HTMLDivElement = document.createElement("div");
    windowTitle.className = "title-wrapper";
    const titleContent: HTMLDivElement = document.createElement("div");
    titleContent.className = "title-content";

    windowTitle.appendChild(titleContent);
    const closeBtn: HTMLSpanElement = document.createElement("span");
    closeBtn.className = "title-btn";
    const closeIcon: HTMLSpanElement = document.createElement("span");
    closeIcon.className = "btn-icon close-icon";
    closeBtn.appendChild(closeIcon);
    closeBtn.onclick = () => {
      this.floatingWindow.remove();
    };
    windowTitle.appendChild(closeBtn);
    fWindow.appendChild(windowTitle);
    //create window content
    const windowContent: HTMLDivElement = document.createElement("div");
    windowContent.className = "content-wrapper";
    switch (id) {
      case FloatingWindow.TYPE_EXAMPLE:
        titleContent.innerHTML = "";
        windowContent.appendChild(this.createExampleList());
        break;
      // case FloatingWindow.TYPE_SPEC:
      //     titleContent.innerHTML = 'spec';
      //     windowContent.appendChild(this.createSpecPanel());
      //     break;
      default:
        break;
    }

    fWindow.appendChild(windowContent);
    this.floatingWindow.appendChild(fWindow);
  }

  public createExampleList(): HTMLDivElement {
    const exampleList: HTMLDivElement = document.createElement("div");
    exampleList.className = "example-list";

    const clickableAreaContainer: HTMLDivElement =
      document.createElement("div");
    clickableAreaContainer.className = "click-to-open-area-container";

    const clickableAreaSubContainerChart: HTMLDivElement =
      document.createElement("div");
    clickableAreaSubContainerChart.className =
      "click-to-open-area-subcontainer";
    const openchartTitle: HTMLHeadingElement = document.createElement("h3");
    openchartTitle.innerText = "Load Charts";
    clickableAreaSubContainerChart.appendChild(openchartTitle);
    clickableAreaSubContainerChart.appendChild(
      this.createClickableArea(CLICKABLE_AREA_CHART)
    );
    clickableAreaContainer.appendChild(clickableAreaSubContainerChart);

    const clickableAreaSubContainerProj: HTMLDivElement =
      document.createElement("div");
    clickableAreaSubContainerProj.className = "click-to-open-area-subcontainer";
    const projectTitle: HTMLHeadingElement = document.createElement("h3");
    projectTitle.innerText = "Open Project";
    clickableAreaSubContainerProj.appendChild(projectTitle);
    clickableAreaSubContainerProj.appendChild(
      this.createClickableArea(CLICKABLE_AREA_PROJECT)
    );
    clickableAreaContainer.appendChild(clickableAreaSubContainerProj);
    exampleList.appendChild(clickableAreaContainer);

    const sep: HTMLHRElement = document.createElement("hr");
    sep.className = "floating-window-sep";
    exampleList.appendChild(sep);

    const chartTitle: HTMLHeadingElement = document.createElement("h3");
    chartTitle.innerText = "Load Example Project";
    exampleList.appendChild(chartTitle);
    //add chart examples
    const exampleItemContainer1: HTMLDivElement = document.createElement("div");
    exampleItemContainer1.className = "list-item-container";
    exampleItemContainer1.appendChild(
      this.createExampleItem(NIGHTINGALE_CHART, "Nightingale")
    );
    exampleItemContainer1.appendChild(
      this.createExampleItem(DYNAMIC_CHART, "drawing dynamic")
    );

    exampleItemContainer1.appendChild(
      this.createExampleItem(DEMO_CHART, "BarChart")
    );
    // exampleItemContainer1.appendChild(
    //   this.createExampleItem(POLIO_CHART, "Polio Incidence Rates")
    // );
    exampleItemContainer1.appendChild(
      this.createExampleItem(CO2_CHART, "CO2 Emissions")
    );
    exampleList.appendChild(exampleItemContainer1);
    const exampleItemContainer2: HTMLDivElement = document.createElement("div");
    exampleItemContainer2.className = "list-item-container";
    exampleItemContainer2.appendChild(
      this.createExampleItem(PURCHASE_CHART, "purchase line")
    );

    exampleItemContainer2.appendChild(
      this.createExampleItem(OS_CHART, "Mobile OS")
    );
    exampleItemContainer2.appendChild(
      this.createExampleItem(WORLDPOPULATION_CHART, "World Population Pyramid")
    );
    exampleItemContainer2.appendChild(
      this.createExampleItem(DRIVING_CHART, "Driving")
    );
    exampleList.appendChild(exampleItemContainer2);
    const exampleItemContainer3: HTMLDivElement = document.createElement("div");
    exampleItemContainer3.className = "list-item-container";
    exampleItemContainer3.appendChild(
      this.createExampleItem(MUSHROOM_CHART, "Mushroom")
    );
    exampleItemContainer3.appendChild(
      this.createExampleItem(BOSTON_CHART, "Boston Weather")
    );


    // exampleItemContainer3.appendChild(this.createExampleItem(FLARE_CHART, 'Flare'));
    exampleList.appendChild(exampleItemContainer3);
    return exampleList;
  }

  public createClickableArea(type: string): HTMLDivElement {
    const clickableArea: HTMLDivElement = document.createElement("div");
    clickableArea.className = "click-to-open-area";
    clickableArea.ondragover = (overEvt) => {
      overEvt.preventDefault();
    };
    clickableArea.ondragenter = () => {
      clickableArea.classList.add("drag-over-area");
    };
    clickableArea.ondragleave = () => {
      clickableArea.classList.remove("drag-over-area");
    };

    switch (type) {
      case CLICKABLE_AREA_CHART:
        clickableArea.innerHTML = "Drop or Open File (.dsvg)";
        clickableArea.ondrop = (dropEvt) => {
          const that = this;
          dropEvt.preventDefault();
          let projectFile = dropEvt.dataTransfer.files[0];
          const fr = new FileReader();
          fr.readAsText(projectFile);
          fr.onload = function () {
            const chart: string = <string>fr.result;
            toggleLoading({
              isLoading: true,
              targetEle: document.getElementById(VIDEO_VIEW_CONTENT_ID),
              content: Loading.LOADING,
            });
            setTimeout(() => {
              store.dispatch(updateSpecCharts([chart]));
            }, 1);
            that.floatingWindow.remove();
          };
        };
        clickableArea.onclick = (clickEvt) => {
          const that = this;
          const input: HTMLInputElement = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("multiple", "multiple");
          input.onchange = (changeEvt) => {
            let charts: string[] = [];
            for (let i = 0, len = input.files.length; i < len; i++) {
              const chartFile: File = input.files[i];
              const fr = new FileReader();
              fr.readAsText(chartFile);
              fr.onload = function () {
                const chart: string = <string>fr.result;
                charts.push(chart);
                if (i === input.files.length - 1) {
                  //reach the last input file
                  toggleLoading({
                    isLoading: true,
                    targetEle: document.getElementById(VIDEO_VIEW_CONTENT_ID),
                    content: Loading.LOADING,
                  });
                  // Reducer.triger(action.UPDATE_LOADING_STATUS, { il: true, srcDom: document.getElementById(VIDEO_VIEW_CONTENT_ID), content: Loading.LOADING });
                  setTimeout(() => {
                    //reset state history
                    // State.stateHistoryIdx = -1;
                    // State.stateHistory = [];
                    // State.tmpStateBusket = [];
                    // Reducer.triger(action.LOAD_CHARTS, charts);
                    store.dispatch(updateSpecCharts(charts));
                  }, 1);
                  that.floatingWindow.remove();
                }
              };
            }
          };
          input.click();
          return false;
        };
        break;
      case CLICKABLE_AREA_PROJECT:
        clickableArea.innerHTML = "Drop or Open File (.cpro)";
        clickableArea.ondrop = (dropEvt) => {
          const that = this;
          dropEvt.preventDefault();
          let projectFile = dropEvt.dataTransfer.files[0];
          const fr = new FileReader();
          fr.readAsText(projectFile);
          fr.onload = function () {
            const spec: string = <string>fr.result;
            Reducer.triger(action.LOAD_CANIS_SPEC, JSON.parse(spec).spec);
            store.dispatch(clearSelectMarks());
            that.floatingWindow.remove();
          };
        };
        clickableArea.onclick = (clickEvt) => {
          const that = this;
          const input: HTMLInputElement = document.createElement("input");
          input.setAttribute("type", "file");
          input.onchange = (changeEvt) => {
            let projectFile = input.files[0];
            const fr = new FileReader();
            fr.readAsText(projectFile);
            fr.onload = function () {
              const spec: string = <string>fr.result;
              Reducer.triger(action.LOAD_CANIS_SPEC, JSON.parse(spec).spec);
              store.dispatch(clearSelectMarks());
              that.floatingWindow.remove();
            };
          };
          input.click();
          return false;
        };
        break;
    }
    const uploadIcon: HTMLDivElement = document.createElement("div");
    uploadIcon.className = "upload-icon";
    clickableArea.appendChild(uploadIcon);

    return clickableArea;
  }

  public createExampleItem(name: string, caption: string): HTMLDivElement {
    const item: HTMLDivElement = document.createElement("div");
    item.className = "example-list-item";
    const imgWrapper: HTMLDivElement = document.createElement("div");
    const img: HTMLImageElement = document.createElement("img");
    switch (name) {
      case MUSHROOM_CHART:
        img.src = MushroomImg;
        item.onclick = () => this.loadExampleChart(MushroomChart);
        break;
      case DRIVING_CHART:
        img.src = DrivingImg;
        item.onclick = () => this.loadExampleChart(DrivingChart);
        break;
      case OS_CHART:
        img.src = OsImg;
        item.onclick = () => this.loadExampleChart(OsChart);
        break;
      case DEMO_CHART:
        img.src = DemoImg;
        item.onclick = () => this.loadExampleChart(DemoChart);
        break;
      case NIGHTINGALE_CHART:
        img.src = NightingaleImg;
        item.onclick = () => this.loadExampleChart(NightingaleChart);
        break;
      case CO2_CHART:
        img.src = Co2Img;
        item.onclick = () => this.loadExampleChart(Co2Chart);
        break;
      case DESSERT_CHART:
        img.src = DessertImg;
        item.onclick = () => this.loadExampleChart(DessertChart);
        break;
      case BOSTON_CHART:
        img.src = BostonImg;
        item.onclick = () => this.loadExampleChart(BostonChart);
        break;
      case WORLDPOPULATION_CHART:
        img.src = WorldPopuImg;
        item.onclick = () => this.loadExampleChart(WorldPopuChart);
        break;
      case POLIO_CHART:
        img.src = PolioImg;
        item.onclick = () => this.loadExampleChart(PolioChart);
        break;
      case FLARE_CHART:
        img.src = FlareImg;
        item.onclick = () => this.loadExampleChart(FlareChart);
        break;
      case DYNAMIC_CHART:
        img.src = DynamicImg;
        item.onclick = () => this.loadExampleChart(DynamicChart);
        break;
      case PURCHASE_CHART:
        img.src = PurchaseLineImg;
        item.onclick = () => this.loadExampleChart(PurchaseLineChart);
    }
    imgWrapper.appendChild(img);
    item.appendChild(imgWrapper);
    const captionWrapper: HTMLParagraphElement = document.createElement("p");
    captionWrapper.innerText = caption;
    item.appendChild(captionWrapper);
    return item;
  }

  public loadExampleChart(chart: any) {
    //triger loading
    toggleLoading({
      isLoading: true,
      targetEle: document.body,
      content: Loading.LOADING,
    });
    // Reducer.triger(action.UPDATE_LOADING_STATUS, { il: true, srcDom: document.body, content: Loading.LOADING });
    setTimeout(() => {
      //reset state history
      State.stateHistoryIdx = -1;
      State.stateHistory = [];
      State.tmpStateBusket = [];

      // Reducer.triger(action.LOAD_CHARTS, [chart]);
      store.dispatch(updateSpecCharts([chart]));
      this.floatingWindow.remove();
    }, 1);
  }

  /**
   * to test keyframes since there is no timeline view yet
   */
  // public createSpecPanel(): HTMLDivElement {
  //     const wrapper: HTMLDivElement = document.createElement('div');
  //     wrapper.style.width = '100%';
  //     wrapper.style.height = '100%';
  //     const specWrapper: HTMLDivElement = document.createElement('div');
  //     specWrapper.style.width = '100%';
  //     specWrapper.style.height = '30px';
  //     specWrapper.appendChild(this.createTestSpecBtn('mushroomSpec', mushroomSpec));
  //     specWrapper.appendChild(this.createTestSpecBtn('mushroomTest1', mushroomTest1));
  //     // specWrapper.appendChild(this.createTestSpecBtn('ganttSpec', ganttSpec));
  //     specWrapper.appendChild(this.createTestSpecBtn('osSpec', osSpec));
  //     specWrapper.appendChild(this.createTestSpecBtn('purchasesSpec', purchasesSpec));
  //     specWrapper.appendChild(this.createTestSpecBtn('nightingaleSpec', nightingaleSpec));
  //     wrapper.appendChild(specWrapper);
  //     const specPanel: HTMLTextAreaElement = document.createElement('textarea');
  //     specPanel.style.width = '100%';
  //     specPanel.style.height = '400px';
  //     specPanel.id = 'specPanel';
  //     specPanel.innerHTML = JSON.stringify(state.spec.animations, null, 2);
  //     wrapper.appendChild(specPanel);
  //     const renderBtn: HTMLButtonElement = document.createElement('button');
  //     renderBtn.innerHTML = 'render spec';
  //     renderBtn.onclick = () => {
  //         let tmpSpec = JSON.parse(specPanel.value);
  //         Reducer.triger(action.UPDATE_SPEC_ANIMATIONS, tmpSpec);
  //         this.floatingWindow.remove();
  //     }
  //     wrapper.appendChild(renderBtn);
  //     return wrapper;
  // }
  // public createTestSpecBtn(text: string, spec: any) {
  //     const mushroomSpecBtn: HTMLButtonElement = document.createElement('button');
  //     mushroomSpecBtn.innerHTML = text;
  //     mushroomSpecBtn.onclick = () => {
  //         document.getElementById('specPanel').innerHTML = JSON.stringify(spec, null, 2);
  //     }
  //     return mushroomSpecBtn;
  // }
}
