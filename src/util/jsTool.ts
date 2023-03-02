import { NestedMap } from "d3";
import { identity, isEqual } from "lodash";
import Suggest from "../app/core/suggest";
import { IBoundary, ICoord, IPath } from "../redux/global-interfaces";
import Lasso from "./lasso";
import { AnimationItem } from "lottie-web";

const circularObjectCache = new Map<any, any>();

export const jsTool = {
  identicalArrays: (arr1: any[], arr2: any[]) => {
    let same: boolean = true;
    if (arr1.length !== arr2.length) {
      same = false;
    }
    for (let i = 0; i < arr1.length; i++) {
      if (arr2.indexOf(arr1[i]) < 0) {
        same = false;
        break;
      }
    }
    return same;
  },
  suggestContain: (suggestAttrcomb: IPath[]) => {
    if (suggestAttrcomb.length > 0) {
      if (
        suggestAttrcomb[0].attrComb.indexOf("id") >= 0 ||
        suggestAttrcomb[0].attrComb.indexOf("clsIdx") >= 0
      )
        return true;
      else return false;
    } else return false;
  },
  markToSelect: (mark: string) => {
    return "#" + mark + ", ";
  },
  markstringTomark: (selectstring: string) => {
    while (selectstring.search("#") >= 0) {
      selectstring = selectstring.replace("#", "");
    }
    while (selectstring.search(" ") >= 0) {
      selectstring = selectstring.replace(" ", "");
    }
    return selectstring.split(",");
  },
  isgrow: (tps: ICoord[]) => {
    let count = 0;
    for (let i = 1; i < tps.length - 1; i++) {
      if (tps[i].x <= tps[i + 1].x) {
        if (tps[i].y < tps[i + 1].y && tps[i].y > tps[i - 1].y) {
          count++;
        } else if (tps[i].y > tps[i + 1].y && tps[i].y < tps[i - 1].y) {
          count++;
        }
      } else {
        return false;
      }
    }
    if (count >= 3) return true;
    else return false;
  },
  judgeEffectTypes: (tracePoints: ICoord[][][]) => {
    let tracePointsLength: number = 0;
    for (let i = 0, len = tracePoints[0].length; i < len; i++) {
      tracePointsLength =
        tracePoints[0][i].length > tracePointsLength
          ? tracePoints[0][i].length
          : tracePointsLength;
    }
    if (tracePointsLength < 10) {
      switch (
      tracePoints[0].length //sketch canvas length
      ) {
        case 5:
          return "FADE";
        case 6:
          return "FADE OUT";
      }
    } else {
      switch (tracePoints[0].length) {
        case 1:
          for (let i = 0, len = tracePoints.length; i < len; i++) {
            for (let j = 0, len2 = tracePoints[i].length; j < len2; j++) {
              const tps: ICoord[] = tracePoints[i][j]; //record tracePoints
              const iscircle = jsTool.isLasso(tps, Lasso.CLOSE_THR);
              const isgrow = jsTool.isgrow(tps);
              if (iscircle) {
                return "CIRCLE";
              } else if (isgrow) {
                return "GROW";
              }
            }
          }
        case 2:
          let detaX: number = 0;
          let detaY: number = 0;
          let top: boolean = true;
          let bottom: boolean = true;
          let right: boolean = true;
          let left: boolean = true;

          for (let i = 5, len = tracePoints[0][0].length; i < len - 2; i++) {
            let detaX1 = Math.abs(
              tracePoints[0][0][i + 1].x - tracePoints[0][0][i].x
            );
            let detaY1 = Math.abs(
              tracePoints[0][0][i + 1].y - tracePoints[0][0][i].y
            );
            detaX = detaX1 > detaX ? detaX1 : detaX;
            detaY = detaY1 > detaY ? detaY1 : detaY;
            if (
              !(
                tracePoints[0][0][i + 1].x < tracePoints[0][0][i].x &&
                right === true &&
                detaY < 5
              )
            ) {
              right = false;
            }
            if (
              !(
                tracePoints[0][0][i + 1].x > tracePoints[0][0][i].x &&
                left === true &&
                detaY < 5
              )
            ) {
              left = false;
            }
            if (
              !(
                tracePoints[0][0][i + 1].y > tracePoints[0][0][i].y &&
                top === true &&
                detaX < 5
              )
            ) {
              top = false;
            }
            if (
              !(
                tracePoints[0][0][i + 1].y < tracePoints[0][0][i].y &&
                bottom === true &&
                detaX < 5
              )
            ) {
              bottom = false;
            }
          }
          if (top) {
            return "WIPE TOP";
          } else if (bottom) {
            return "WIPE BOTTOM";
          } else if (right) {
            return "WIPE RIGHT";
          } else if (left) {
            return "WIPE LEFT";
          }
          return "WHEEL";
      }
    }
  },
  identicalMaps: (map1: Map<any, any>, map2: Map<any, any>) => {
    var testVal;
    if (map1.size !== map2.size) {
      return false;
    }
    for (var [key, val] of map1) {
      testVal = map2.get(key);
      if (testVal !== val || (testVal === undefined && !map2.has(key))) {
        return false;
      }
    }
    return true;
  },
  identicalSets: (set1: Set<any>, set2: Set<any>) => {
    let arr1: any[] = [...set1];
    let arr2: any[] = [...set2];
    return jsTool.identicalArrays(arr1, arr2);
  },
  getType: (obj: any) => {
    var type = Object.prototype.toString
      .call(obj)
      .match(/^\[object (.*)\]$/)[1]
      .toLowerCase();
    if (type === "string" && typeof obj === "object") return "object"; // Let "new String('')" return 'object'
    if (obj === null) return "null"; // PhantomJS has type "DOMWindow" for null
    if (obj === undefined) return "undefined"; // PhantomJS has type "DOMWindow" for undefined
    return type;
  },
  diff: (obj1: any, obj2: any, level: number) => {
    const testNoDiff = [
      "defaultChartScaleRatio",
      "chartScaleRatio",
      "dataTable",
      "isMouseMoving",
      "previewPath",
      "previewSpec",
      "updateSelectionOrder",
      "marksInNewCreateKFG",
      "activeSlider",
    ];
    // console.log('difff: ', obj1, obj2, jsTool.getType(obj2))
    let result: any = {};

    // [...new Set([...Object.keys(obj2), ...Object.keys(obj1)])].forEach((key: string) => {
    Object.keys(obj2).forEach((key: string) => {
      if (!testNoDiff.includes(key)) {
        if (
          (typeof obj1[key] === "undefined" ||
            typeof obj2[key] === "undefined") &&
          !(
            typeof obj1[key] === "undefined" && typeof obj2[key] === "undefined"
          )
        ) {
          result[key] = obj2[key];
        } else {
          const attrType: string = jsTool.getType(obj2[key]); //assume obj1 and obj2 has the same type for each key
          switch (attrType) {
            case "undefined":
              if (typeof obj1[key] !== "undefined") {
                result[key] = obj2[key];
              }
              break;
            case "object":
              // console.log('iterating key: ', key, markedAttrs, level);
              if (level < 4 || key === "grouping") {
                const tmpResult = jsTool.diff(obj1[key], obj2[key], level + 1);
                if (Object.keys(tmpResult).length > 0) {
                  result[key] = obj2[key];
                }
              }
              break;
            case "string":
            case "number":
            case "boolean":
              if (obj1[key] !== obj2[key]) {
                result[key] = obj2[key];
              }
              break;
            case "array":
              if (!jsTool.identicalArrays(obj1[key], obj2[key])) {
                result[key] = obj2[key];
              }
              break;
            case "map":
              if (!jsTool.identicalMaps(obj1[key], obj2[key])) {
                result[key] = obj2[key];
              }
              break;
            case "set":
              if (!jsTool.identicalSets(obj1[key], obj2[key])) {
                result[key] = obj2[key];
              }
              break;
          }
          // }
        }
      }
    });
    return result;
  },
  // ifRemove:(selectionStep: string[]) => {
  //   let ifremove: boolean = true;
  //   if(selectionStep.length > 1){
  //     selectionStep.forEach((select) => {

  //     })
  //   }
  // },
  extractTransNums: (translateStr: string) => {
    if (translateStr && typeof translateStr !== "undefined") {
      const transNums = translateStr
        .match(/[+-]?\d+(?:\.\d+)?/g)
        .map((x) => parseFloat(x));
      return { x: transNums[0], y: transNums[1] };
    }
    return { x: 0, y: 0 };
  },
  extractTransScaleNums: (transformStr: string) => {
    let transValues: number[] = [0, 0],
      scaleValue: number = 1;
    if (transformStr) {
      const values = transformStr.match(/\(([^)]*)\)/g);
      if (typeof values[0] !== "undefined") {
        const transStr: string = values[0].replace(/[\(\)]/g, "");
        transValues = transStr.split(",").map((s) => parseFloat(s));
      }
      if (typeof values[1] !== "undefined") {
        scaleValue = parseFloat(values[1].replace(/[\(\)]/g, ""));
      }
    }
    return { trans: transValues, scale: scaleValue };
  },
  firstLetterUppercase: (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  isCross: (p1: ICoord, p2: ICoord, p3: ICoord, p4: ICoord) => {
    var denominator =
      (p2.y - p1.y) * (p4.x - p3.x) - (p1.x - p2.x) * (p3.y - p4.y);
    if (denominator == 0) {
      return false;
    }

    const v1: ICoord = { x: p1.x - p3.x, y: p1.y - p3.y };
    const v2: ICoord = { x: p2.x - p3.x, y: p2.y - p3.y };
    const v3: ICoord = { x: p4.x - p3.x, y: p4.y - p3.y };

    const z1 = jsTool.vecCrossMul(v1, v3);
    const z2 = jsTool.vecCrossMul(v2, v3);

    return z1 * z2 <= 0;
  },
  isClosedShape: (path: ICoord[]) => {
    for (let i = 0, len = path.length; i < len - 1; i++) {
      const p = path[i];
      const nextP = path[i + 1];
      for (let j = 0; j < len - 1; j++) {
        const testP = path[j];
        const testNextP = path[j + 1];
        if (
          testP !== p &&
          testNextP !== p &&
          testP !== nextP &&
          testNextP !== nextP &&
          jsTool.isCross(testP, testNextP, p, nextP) &&
          jsTool.isCross(p, nextP, testP, testNextP)
        ) {
          return true;
        }
      }
    }
    return false;
  },
  isLineShape: (path: ICoord[]) => {
    let StartEndGapY: number = 0;
    let StartEndGapX: number = 0;
    let MaxX: number = path[0].x;
    let MinX: number = path[0].x;
    let MaxY: number = path[0].y;
    let MinY: number = path[0].y;

    for (let i = 0, len = path.length; i < len - 1; i++) {
      MaxX = path[i].x > MaxX ? path[i].x : MaxX;
      MaxY = path[i].y > MaxY ? path[i].y : MaxY;
      MinX = path[i].x < MinX ? path[i].x : MinX;
      MinY = path[i].y < MinY ? path[i].y : MinY;
      StartEndGapX = path[i].x - path[0].x;
      StartEndGapY = path[i].y - path[0].y;
    }
    const deltaX: number = Math.abs(
      Math.abs(MaxX) - Math.abs(MinX) - Math.abs(StartEndGapX)
    );
    const deltaY: number = Math.abs(
      Math.abs(MaxY) - Math.abs(MinY) - Math.abs(StartEndGapY)
    );
    if (deltaX < 10 && deltaY < 10) {
      if (StartEndGapX > 120 || StartEndGapY > 120) {
        return "axis_domain";
      } else return "axis_left";
    } else return "axis_left";
  },
  isLLineShape: (path: ICoord[]) => { },
  isLasso: (path: ICoord[], thr: number) => {

    let top = -Infinity, bottom = Infinity, left = Infinity, right = -Infinity;
    for (let i of path) {
      top = Math.max(top, i.y);
      bottom = Math.min(bottom, i.y);
      left = Math.min(left, i.x);
      right = Math.max(right, i.x);
    }

    const boundaryWidth = right - left;
    const boundaryHeight = top - bottom;

    console.warn(boundaryHeight);
    console.warn(boundaryWidth);

    const isClosed: boolean = jsTool.isClosedShape(path);
    const isAlmostClosed: boolean =
      // jsTool.pointDist(path[0], path[path.length - 1]) < thr;
      jsTool.pointDist(path[0], path[path.length - 1]) < Math.max(thr, Math.hypot(boundaryHeight, boundaryWidth) * .5);

    const l = path.length;
    // const smoothed = new Array<ICoord>;
    // smoothed.push(path[0]);
    // for (let i = 1; i < l - 1; i++) {
    //   smoothed.push(Icoord({x: 1, y : 2}))
    // }

    const BINS = 100;

    let histogram = new Array<number>(BINS);
    for (let i = 0; i < BINS; i++) {
      histogram[i] = 0;
    }

    for (let i = 1; i < l; i++) {
      let angle = Math.atan2(path[i].y - path[i - 1].y, path[i].x - path[i - 1].x);
      angle = (angle / Math.PI + 1) / 2 * (BINS - 1);
      let index = Math.floor(Math.min(BINS - 1, Math.max(0, angle)));
      histogram[index]++;
    }

    for (let i = 0; i < 100; i++) {
      let blurred = new Array<number>(BINS);
      for (let j = 0; j < BINS; j++) {
        blurred[j] =
          0.25 * histogram[j - 1 == -1 ? BINS - 1 : j - 1] +
          0.5 * histogram[j] +
          0.25 * histogram[j + 1 == BINS ? 0 : j + 1];
      }
      histogram = blurred;
    }

    let variance = 0;
    let mean = 0;

    for (let i of histogram) {
      mean += i;
    }
    mean /= BINS;

    for (let i of histogram) {
      variance += (i - mean) * (i - mean);
    }
    variance /= BINS;

    let cov = Math.sqrt(variance) / mean

    console.log(`COV: ${cov}`);
    // console.log(histogram);

    return (isClosed || isAlmostClosed) && cov < 0.83;
  }, //返回lasso选择是否成功
  isAxis: (path: ICoord[]) => {
    const isdomain: string = jsTool.isLineShape(path);
    // const isLLine: boolean = jsTool.isLLineShape(path);
    // return (isLine || isLLine);
    return isdomain;
  },
  pointDist: (pnt1: ICoord, pnt2: ICoord) => {
    return Math.sqrt(
      (pnt1.x - pnt2.x) * (pnt1.x - pnt2.x) +
      (pnt1.y - pnt2.y) * (pnt1.y - pnt2.y)
    );
  },
  vecCrossMul: (v1: ICoord, v2: ICoord) => {
    return v1.x * v2.y - v2.x * v1.y;
  },
  isNumber: (str: string) => {
    return /^[0-9]+.?[0-9]*/.test(str);
  },
  pointOutSector: (coord: ICoord, r: number) => {
    const menuCenter: ICoord = { x: 0, y: 0 };
    const dist: number = Math.sqrt(coord.x ** 2 + coord.y ** 2);
    r = 1.5 * r;
    if (dist > r) {
      return true;
    } else return false;
  },
  pointInSector: (
    p: ICoord,
    startAngle: number,
    endAngle: number,
    r: number
  ) => {
    startAngle = (180 * startAngle) / Math.PI;
    endAngle = (180 * endAngle) / Math.PI;
    var isInAngle = false,
      pointAngle = jsTool.getPointAngle(p);
    if (endAngle < 360) {
      if (pointAngle <= endAngle && pointAngle >= startAngle) {
        isInAngle = true;
      }
    } else {
      endAngle = endAngle - 360;
      if (pointAngle <= endAngle || pointAngle >= startAngle) {
        isInAngle = true;
      }
    }
    if (isInAngle) {
      var len = jsTool.pointDist(p, { x: 0, y: 0 });
      isInAngle = r > len;
    }
    return isInAngle;
  },
  getPointAngle: (p: ICoord) => {
    var angle = 0;
    if (p.x == 0) {
      if (p.y == 0) {
        angle = 0;
      } else if (p.y > 0) {
        angle = 90;
      } else {
        angle = 270;
      }
    } else {
      angle = (Math.atan(p.y / p.x) * 180) / Math.PI;
      if (p.x < 0) {
        angle = angle + 180;
      } else if (p.x > 0 && p.y < 0) {
        angle = angle + 360;
      }
    }
    if (angle >= 360) {
      angle = 0;
    }
    return angle;
  },
  toFixed: (input: number, num: number) => {
    return Math.floor(Math.pow(10, num) * input) / Math.pow(10, num);
  },
  pointsBBox: (pnts: ICoord[]) => {
    const result: IBoundary = { x1: 100000000, y1: 100000000, x2: 0, y2: 0 };
    pnts.forEach((p) => {
      if (p.x < result.x1) {
        result.x1 = p.x;
      }
      if (p.x > result.x2) {
        result.x2 = p.x;
      }
      if (p.y < result.y1) {
        result.y1 = p.y;
      }
      if (p.y > result.y2) {
        result.y2 = p.y;
      }
    });
    return result;
  },
  inBoundary: (bbox: IBoundary | DOMRect, pnt: ICoord) => {
    if (bbox instanceof DOMRect) {
      return (
        pnt.x >= bbox.left &&
        pnt.x <= bbox.right &&
        pnt.y >= bbox.top &&
        pnt.y <= bbox.bottom
      );
    } else {
      return (
        pnt.x >= bbox.x1 &&
        pnt.x <= bbox.x2 &&
        pnt.y >= bbox.y1 &&
        pnt.y <= bbox.y2
      );
    }
  },
  screenToSvgCoords: (svg: any, x: number, y: number) => {
    let result: ICoord = { x: 0, y: 0 };
    if (svg) {
      let rectPosiPoint1 = svg.createSVGPoint();
      rectPosiPoint1.x = x;
      rectPosiPoint1.y = y;
      result = rectPosiPoint1.matrixTransform(svg.getScreenCTM().inverse());
    }
    return result;
  },
  round: (n: number, d: number) => {
    d = Math.pow(10, d);
    return Math.round(n * d) / d;
  },
  svg2url: (svgElement: HTMLElement) => {
    const svgString = svgElement.outerHTML;
    let svg = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svg);
    svg = null;
    return url + "#" + Math.random();
    // const url = "data:image/svg+xml;base64," + btoa(svgString) + "#" + Math.floor(Math.random() * 1000000000).toString();
    // console.warn(url);
    // return url;
  },
  formatTime: (time: number) => {
    const minute: number = Math.floor(time / 60000);
    const second: number = Math.floor((time - minute * 60000) / 1000);
    const ms: number = Math.floor((time - minute * 60000 - second * 1000) / 1);
    const minStr: string = minute < 10 ? "0" + minute : "" + minute;
    const secStr: string = second < 10 ? "0" + second : "" + second;
    const msStr = ms < 100 ? (ms < 10 ? "00" + ms : "0" + ms) : "" + ms;
    return minStr + ":" + secStr + "." + msStr;
  },
  toRGB: (hexStr: string) => {
    return [
      parseInt("0x" + hexStr.substring(1, 3)),
      parseInt("0x" + hexStr.substring(3, 5)),
      parseInt("0x" + hexStr.substring(5, 7)),
    ];
  },
  /**
   * check whether b is an item in a
   * @param a
   * @param b
   */
  Array2DItem: (a: any[][], b: any[]) => {
    for (let i = 0, len = a.length; i < len; i++) {
      if (jsTool.identicalArrays(a[i], b)) {
        return true;
      }
    }
    return false;
  },
  /**
   * whether a contains b
   * @param a
   * @param b
   */
  arrayContained: (a: any[], b: any[]) => {
    if (a.length < b.length) return false;
    for (var i = 0, len = b.length; i < len; i++) {
      if (a.indexOf(b[i]) == -1) return false;
    }
    return true;
  },
  /**
   * remove b from a
   * @param a
   * @param b
   */
  excludeArray: (a: any[], b: any[]) => {
    return a.filter((c) => !b.includes(c));
  },
  containObj: (
    objArr: { [key: string]: any }[],
    obj: { [key: string]: any }
  ) => {
    let contains: boolean = false;
    objArr.forEach((tmpObj: { [key: string]: any }) => {
      contains = contains || isEqual(tmpObj, obj);
    });
    return contains;
  },
  deepClone: <T>(
    obj: T,
    deepClone: boolean = false,
    needFreeze: boolean = false
  ): T => {
    if (!deepClone) {
      circularObjectCache.clear();
    }
    if (circularObjectCache.has(obj)) {
      return circularObjectCache.get(obj);
    }
    if (obj instanceof Array) {
      const copiedObj = [] as any[] & T;
      circularObjectCache.set(obj, copiedObj);
      obj.forEach((val: any) =>
        copiedObj.push(jsTool.deepClone(val, true, needFreeze))
      ) as T;
      if (needFreeze) {
        return new Proxy(copiedObj, {
          get(target, p, receiver) {
            let ret = Reflect.get(target, p);
            if (typeof ret === "function") {
              ret = ret.bind(target);
            }
            return ret;
          },
          set(target, p, newValue, receiver) {
            // throw new Error("object is frozen");
            return true;
          },
        });
      }
      return copiedObj;
    }
    if (obj instanceof Map) {
      const copiedObj = new Map() as Map<any, any> & T;
      circularObjectCache.set(obj, copiedObj);
      for (let [k, v] of obj.entries()) {
        copiedObj.set(
          jsTool.deepClone(k, true, needFreeze),
          jsTool.deepClone(v, true, needFreeze)
        );
      }
      if (needFreeze) {
        return new Proxy(copiedObj, {
          get(target, p, receiver) {
            if (p === "clear") {
              return () => { };
            }
            if (p === "delete") {
              return () => { };
            }
            if (p === "set") {
              return () => { };
            }
            let ret = Reflect.get(target, p);
            if (typeof ret === "function") {
              ret = ret.bind(target);
            }
            return ret;
          },
          set(target, p, newValue, receiver) {
            // throw new Error("object is frozen");
            return true;
          },
        });
      }
      return copiedObj;
    }
    if (obj instanceof Set) {
      const copiedObj = new Set() as Set<any> & T;
      circularObjectCache.set(obj, copiedObj);
      for (let v of obj.values()) {
        copiedObj.add(jsTool.deepClone(v, true, needFreeze));
      }
      if (needFreeze) {
        return new Proxy(copiedObj, {
          get(target, p, receiver) {
            if (p === "clear") {
              return () => { };
            }
            if (p === "delete") {
              return () => { };
            }
            if (p === "add") {
              return () => { };
            }
            let ret = Reflect.get(target, p);
            if (typeof ret === "function") {
              ret = ret.bind(target);
            }
            return ret;
          },
          set(target, p, newValue, receiver) {
            // throw new Error("object is frozen");
            return true;
          },
        });
      }
      return copiedObj;
    }
    if (obj instanceof Date) {
      const copiedObj = new Date(obj) as Date & T;
      circularObjectCache.set(obj, copiedObj);
      if (needFreeze) {
        return new Proxy(copiedObj, {
          get(target, p, receiver) {
            let ret = Reflect.get(target, p);
            if (typeof ret === "function") {
              ret = ret.bind(target);
            }
            return ret;
          },
          set(target, p, newValue, receiver) {
            // throw new Error("object is frozen");
            return true;
          },
        });
      }
      return copiedObj;
    }
    if (
      typeof obj !== "object" ||
      obj instanceof Element ||
      obj instanceof Node ||
      obj === null
    ) {
      return obj;
    }
    const copiedObj = Object.assign({}, obj) as any;
    copiedObj.__proto__ = (obj as any).__proto__;
    circularObjectCache.set(obj, copiedObj);
    Object.entries(obj).forEach(([k, v]) => {
      copiedObj[k] = jsTool.deepClone(v, true, needFreeze);
    });
    if (needFreeze) {
      return new Proxy(copiedObj, {
        get(target, p, receiver) {
          let ret = Reflect.get(target, p);
          if (typeof ret === "function") {
            ret = ret.bind(target);
          }
          return ret;
        },
        set(target, p, newValue, receiver) {
          // throw new Error("object is frozen");
          return true;
        },
      });
    }
    return copiedObj;
  },
  findDuplicates(arr: string[]) {
    const filtered = arr.filter((item, index) => arr.indexOf(item) !== index);
    return [...new Set(filtered)];
  },
};
