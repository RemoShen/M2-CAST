import { jsTool } from "../../../util/jsTool";
import { markSelection } from "../../../util/markSelection";
import "../../assets/style/panels/divideWindow.scss";
export default class DivideWindow {
  divideTitle: string;
  view: HTMLDivElement;
  selectedMarksStep: string[][];
  constructor(title: string, selectedMarksStep: string[][]) {
    this.divideTitle = title;
    this.selectedMarksStep = selectedMarksStep;
  }

  /**
   * createDivideView
   */
  //sdsss ss
  public createDivideView(): void {
    this.view = document.createElement("div");
    this.view.className = "divideview";
    this.view.id = "divideview0";
    const divideviewTitleContainer: HTMLDivElement =
      document.createElement("div");
    divideviewTitleContainer.className = "divide-title-container";
    const divideTitleText: HTMLSpanElement = document.createElement("span");
    divideTitleText.className = "divide-title-text";
    const titleText: string = this.divideTitle;
    divideTitleText.innerHTML = titleText;
    divideviewTitleContainer.appendChild(divideTitleText);
    // this.view.appendChild(divideviewTitleContainer);
    this.createDivideSvg(this.selectedMarksStep);
    this.conButton();
    // document.getElementById('appWrapper').appendChild('');
  }
  public createDivideSvg(selectedMarksStep: string[][]) {
    selectedMarksStep.forEach((marks) => {
      marks.forEach((mark) => {
        this.svgToImage(document.getElementById(mark), mark);
        this.divideLine(mark); //not com
      });
    });
  }
  public svgToImage(svg: HTMLElement, mark: string) {
    let picsvg: HTMLElement = <HTMLElement>svg.cloneNode(true);
    const chartL: number = (svg as Node as SVGSVGElement).getBBox().x;
    const chartT: number = (svg as Node as SVGSVGElement).getBBox().y;
    const chartW: number = (svg as Node as SVGSVGElement).getBBox().width;
    const chartH: number = (svg as Node as SVGSVGElement).getBBox().height;
    picsvg.setAttribute("width", `${chartW}`);
    picsvg.setAttribute("height", `${chartH}`);
    picsvg.setAttribute("viewBox", `${chartL} ${chartT} ${chartW} ${chartH}`);

    let imgSrc: string = jsTool.svg2url(picsvg);

    const divideThumbnail: SVGImageElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "image"
    );
    divideThumbnail.setAttributeNS(null, "x", "25px");
    divideThumbnail.setAttributeNS(null, "y", "0");
    divideThumbnail.setAttributeNS(null, "width", "20px");
    divideThumbnail.setAttributeNS(null, "height", "20px");
    divideThumbnail.setAttributeNS(null, "href", imgSrc);
    divideThumbnail.setAttributeNS(null, "kfId", mark);
    this.view.appendChild(divideThumbnail);
  }
  /**
   * divideLin
   */
  public divideLine(mark: string) {}
  public conButton() {
    let conButton = document.createElement("input");
    conButton.type = "button";
    conButton.value = "generate spec";
    conButton.id = "con-button";
    this.view.appendChild(conButton);
    conButton.addEventListener("click", this.cliBtn);
  }
  public cliBtn() {
    // let markStep: string[][] = this.selectedMarksStep;

    // markStep.forEach((marks) => {

    // })
    // markSelection.checking([["mark3","mark6", "mark9", "mark12", "mark15", "mark18", "mark21", "mark24", "mark27", "mark30", "mark33", "mark36"]]);
    markSelection.checking([["mark3"]]);
    markSelection.checking([["mark6"]]);
    markSelection.checking([["mark2"]]);
    markSelection.checking([["mark1"]]);
    markSelection.checking([["mark5"]]);
    document.getElementById("divideview0").style.display = "none";
  }
}
