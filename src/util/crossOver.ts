export default class CrossOver {
  crossOverMarks: Set<string>;

  constructor() {
    this.crossOverMarks = new Set();
  }

  public crossOverSelect(framedMarks: string[]): string[] {
    let result: string[] = [];
    //filter marks
    this.crossOverMarks.forEach((mId) => {
      //update the appearance of marks
      const m: HTMLElement = document.getElementById(mId);
      if (framedMarks.includes(mId)) {
        // m.classList.add('non-framed-mark');
      } else {
        // m.classList.remove('non-framed-mark');
        result.push(mId);
      }
    });
    return result;
  }
}
