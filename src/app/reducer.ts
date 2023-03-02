
export default class Reducer {
  static list: any = {};

  public static listen(key: string, fn: any): void {
    if (!this.list[key]) {
      this.list[key] = [];
    }
    this.list[key].push(fn);
  }

  public static triger(key: string, prop: any): void {
    let fns = this.list[key];
    if (!fns || fns.length == 0) {
      return;
    }
    for (var i = 0, fn; (fn = fns[i++]); ) {
      fn.apply(this, [prop]);
    }
  }

  public static saveAndTriger(
    action: string,
    oldActionVal: any,
    newActionVal: any
  ) {
  }

}