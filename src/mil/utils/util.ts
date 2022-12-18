import Manager, { IEvtStyle } from "../manager";
import * as inputConsts from "../input/input-consts";
import { inputHandler } from "../input/input-util";
import MouseInput from "../input/inputs/mouse";
import PointerEventInput from "../input/inputs/pointer";
import TouchInput from "../input/inputs/touch";

export const ifUndefined = (val1: any, val2: any) => {
  return typeof val1 === "undefined" ? val2 : val1;
};

export const splitStr = (str: string) => {
  return str.trim().split(/\s+/g);
};

export const addEventListeners = (target: any, types: string, handler: any) => {
  splitStr(types).forEach((type: string) => {
    target.addEventListener(type, handler, false);
  });
};

/**
 * @private
 * removeEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
export const removeEventListeners = (
  target: any,
  types: string,
  handler: any
) => {
  splitStr(types).forEach((type: string) => {
    target.removeEventListener(type, handler, false);
  });
};

let _uniqueId: number = 1;
export const uniqueId = () => {
  return _uniqueId++;
};

/**
 * @private
 * create new input type manager
 * called by the Manager constructor
 * @param {Hammer} manager
 * @returns {Input}
 */
export const createInputInstance = (manager: Manager) => {
  let Type;
  let evtStyle: IEvtStyle = manager.options.eventStyle;
  // console.log('evt style is : ', evtStyle);
  // let inputClass = manager.options.inputClass;
  let {
    options: { inputClass },
  } = manager;
  // console.log('creating input instance: ', manager, inputClass, inputConsts.SUPPORT_POINTER_EVENTS, inputConsts.SUPPORT_ONLY_TOUCH, inputConsts.SUPPORT_TOUCH);
  if (inputClass) {
    Type = inputClass;
  } else if (inputConsts.SUPPORT_POINTER_EVENTS) {
    Type = PointerEventInput;
  } else if (inputConsts.SUPPORT_ONLY_TOUCH) {
    Type = TouchInput;
  } else if (!inputConsts.SUPPORT_TOUCH) {
    Type = MouseInput;
  } else {
    //Type = TouchMouseInput;
  }
  return new Type(manager, inputHandler);
};

/**
 * @private
 * let a boolean value also be a function that must return a boolean
 * this first item in args will be used as the context
 * @param {Boolean|Function} val
 * @param {Array} [args]
 * @returns {Boolean}
 */
export const boolOrFn = (val: any, args: any) => {
  if (typeof val === "function") {
    return val.apply(args ? args[0] || undefined : undefined, args);
  }
  return val;
};

/**
 * @private
 * get the window object of an element
 * @param {HTMLElement} element
 * @returns {DocumentView|Window}
 */
export const getWindowForElement = (element: any) => {
  let doc = element.ownerDocument || element;
  return doc.defaultView || doc.parentWindow || window;
};

export const inStr = (str: string, find: string) => {
  return str.indexOf(find) > -1;
};

/**
 * if the argument is an array, we want to execute the fn on each entry
 * if it aint an array we don't want to do a thing.
 * this is used by all the methods that accept a single and array argument.
 */
export const invokeArrayArg = (arg: any, fn: any, context: any) => {
  if (Array.isArray(arg)) {
    arg.forEach(context[fn], context);
    return true;
  }
  return false;
};

/**
 * find if a array contains the object using indexOf or a simple polyFill
 */
export const inArray = (src: any[], find: any, findByKey?: string) => {
  if (src.indexOf && !findByKey) {
    return src.indexOf(find);
  } else {
    let i = 0;
    while (i < src.length) {
      if (
        (findByKey && src[i][findByKey] == find) ||
        (!findByKey && src[i] === find)
      ) {
        // do not use === here, test fails
        return i;
      }
      i++;
    }
    return -1;
  }
};

/**
 * walk objects and arrays
 */
export const each = (obj: any, iterator: any, context: any) => {
  let i;

  if (!obj) {
    return;
  }

  if (obj.forEach) {
    obj.forEach(iterator, context);
  } else if (obj.length !== undefined) {
    i = 0;
    while (i < obj.length) {
      iterator.call(context, obj[i], i, obj);
      i++;
    }
  } else {
    for (i in obj) {
      obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
    }
  }
};

/**
 * get the center of all the pointers
 */
export const getCenter = (pointers: any[]) => {
  let pointersLength = pointers.length;

  // no need to loop when only one touch
  if (pointersLength === 1) {
    return {
      x: Math.round(pointers[0].clientX),
      y: Math.round(pointers[0].clientY),
    };
  }

  let x = 0;
  let y = 0;
  let i = 0;
  while (i < pointersLength) {
    x += pointers[i].clientX;
    y += pointers[i].clientY;
    i++;
  }

  return {
    x: Math.round(x / pointersLength),
    y: Math.round(y / pointersLength),
  };
};

/**
 * find if a node is in the given parent
 */
export const hasParent = (node: any, parent: any) => {
  while (node) {
    if (node === parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};

/**
 * convert array-like objects to real arrays
 */
export const toArray = (obj: any) => {
  return Array.prototype.slice.call(obj, 0);
};

/**
 * unique array with objects based on a key (like 'id') or just by the array's value
 */
export const uniqueArray = (src: any[], key: string, sort: boolean) => {
  let results: any = [];
  let values = [];
  let i = 0;

  while (i < src.length) {
    let val = key ? src[i][key] : src[i];
    if (inArray(values, val) < 0) {
      results.push(src[i]);
    }
    values[i] = val;
    i++;
  }

  if (sort) {
    if (!key) {
      results = results.sort();
    } else {
      results = results.sort((a: any, b: any) => {
        return a[key] > b[key];
      });
    }
  }

  return results;
};

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} target
 * @param {...Object} objects_to_assign
 * @returns {Object} target
 */
export let assign: any;
if (typeof Object.assign !== "function") {
  assign = function assign(target: any) {
    if (target === undefined || target === null) {
      throw new TypeError("Cannot convert undefined or null to object");
    }

    let output = Object(target);
    for (let index = 1; index < arguments.length; index++) {
      const source = arguments[index];
      if (source !== undefined && source !== null) {
        for (const nextKey in source) {
          if (source.hasOwnProperty(nextKey)) {
            output[nextKey] = source[nextKey];
          }
        }
      }
    }
    return output;
  };
} else {
  assign = Object.assign;
}

/**
 * simple function bind
 * @param {Function} fn
 * @param {Object} context
 * @returns {Function}
 */
export const bindFn = (fn: any, context: any) => {
  return function boundFn() {
    return fn.apply(context, arguments);
  };
};

/**
 * set a timeout with a given scope
 * @param {Function} fn
 * @param {Number} timeout
 * @param {Object} context
 * @returns {number}
 */
export const setTimeoutContext = (fn: any, timeout: number, context: any) => {
  return setTimeout(bindFn(fn, context), timeout);
};

export const createTransitionStyleCss = (ele: any, cssProps: string[]) => {
  let transStr: string =
    ele.style.transition === "" ? "" : `${ele.style.transition}, `;
  cssProps.forEach((propName: string, idx: number) => {
    transStr += `${propName} 0.2s cubic-bezier(0.445, 0.05, 0.55, 0.95)${
      idx === cssProps.length - 1 ? "" : ","
    }`;
  });
  ele.style.transition = transStr;
};

export const DEBUG_MODE: number = 0;
export const PROD_MODE: number = 1;
export let consoleMode: number = DEBUG_MODE;
export const updateMode = (m: number) => {
  consoleMode = m;
};
export const log = (...values: any[]) => {
  if (consoleMode === DEBUG_MODE) {
    console.log(...values);
  }
};

// const stacktrace = function () {
//     const st2: any = (f: any) => {
//         const args = [];
//         if (f) {
//             for (var i = 0; i < f.arguments.length; i++) {
//                 args.push(f.arguments[i]);
//             }
//             // substring(9) here to get rid of "function " prefix
//             var function_name = f.toString().split('(')[0].substring(9);
//             // recur to get previous caller
//             return st2(f.caller) + function_name + '(' + args.join(', ') + ')' + ">";
//         } else {
//             return "";
//         }
//     }
//     return st2(arguments.callee.caller);
// }
