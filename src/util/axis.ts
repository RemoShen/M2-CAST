export default class Axis {
  axisMarks: Set<string>;

  constructor() {
    this.axisMarks = new Set();
  }

  public axisSelect(isdomain: string): string[] {
    let result_axis: string[] = [];
    let axisDomain: string[] = [];
    let axisTicks: string[] = [];
    let Line: string[] = [];
    let Symbol: string[] = [];
    let result: string[] = [];
    let axisLabel: string[] = [];
    let Link: string[] = [];
    let Shape: string[] = [];
    //filter marks
    this.axisMarks.forEach((mId) => {
      //update the appearance of marks
      const m: HTMLElement = document.getElementById(mId);
      if (m.getAttribute("data-datum").search("axis-domain") > 0) {
        axisDomain.push(mId);
      } else if (m.getAttribute("data-datum").search("axis-tick") > 0) {
        axisTicks.push(mId);
      } else if (m.getAttribute("data-datum").search("line") > 0) {
        Line.push(mId);
      } else if (m.getAttribute("data-datum").search("symbol") > 0) {
        Symbol.push(mId);
      } else if (m.getAttribute("data-datum").search("axis-label") > 0) {
        axisLabel.push(mId);
      } else if (m.getAttribute("data-datum").search("link") > 0) {
        Link.push(mId);
      } else if (m.getAttribute("data-datum").search("rectangle") > 0) {
        Shape.push(mId);
      }
      result.push(mId);
    });
    if (isdomain === "axis_domain") {
      if (axisDomain.length > 0) {
        axisDomain.forEach((mId) => {
          result_axis.push(mId);
        });
        return result_axis;
      } else if (Link.length > 0) {
        Link.forEach((mId) => {
          result_axis.push(mId);
        });
        return result_axis;
      } else if (Line.length > 0 && Symbol.length > 0) {
        Line.forEach((mId) => {
          result_axis.push(mId);
        });
        return result_axis;
      } else return result;
    } else if (isdomain === "axis_left") {
      if (axisTicks.length > 0) {
        axisTicks.forEach((mId) => {
          result_axis.push(mId);
        });
        return result_axis;
      } else if (axisLabel.length > 0) {
        axisLabel.forEach((mId) => {
          result_axis.push(mId);
        });
        return result_axis;
      } else if (Line.length > 0 && (Symbol.length > 0 || Shape.length > 0)) {
        Line.forEach((mId) => {
          result_axis.push(mId);
        });
        return result_axis;
      } else return result;
    }
  }
}
