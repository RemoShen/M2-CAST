import { SUGGESTION_FRAME_CLS } from "../redux/global-consts";
import { ICoord } from "../redux/global-interfaces";
import { jsTool } from "./jsTool";

export interface ISvgEle {
  tag: string;
  para: {
    [key: string]: string | number;
  };
  flag: boolean; //whether changing the upper case to lower case with -
}

export interface IAniProps {
  attrName: string;
  from: string;
  to: string;
  dur: string;
}

export const PNT_DOWN_CLS: string = "pointer-down-cls";
export const PNT_UP_CLS: string = "pointer-up-cls";
export const SHOW_CLS: string = "svg-ele-show";
export const HIDE_CLS: string = "svg-ele-hide";

// export default class SVGManager {
export const resetPosi = (svg: SVGSVGElement, ele: SVGElement) => {
  ele.setAttributeNS(null, "transform", "translate(0,0)");
  switch (ele.tagName.toLowerCase()) {
    case "rect":
    case "text":
      updateProps(
        ele,
        {
          x: "0",
          y: "0",
        },
        true
      );
      break;
    case "circle":
      updateProps(
        ele,
        {
          cx: "0",
          cy: "0",
        },
        true
      );
      break;
    case "line":
      const x1: number = parseFloat(ele.getAttributeNS(null, "x1"));
      const x2: number = parseFloat(ele.getAttributeNS(null, "x2"));
      const y1: number = parseFloat(ele.getAttributeNS(null, "y1"));
      const y2: number = parseFloat(ele.getAttributeNS(null, "y2"));
      const midPnt: ICoord = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
      updateProps(
        ele,
        {
          x1: `${x1 - midPnt.x}`,
          y1: `${y1 - midPnt.y}`,
          x2: `${x2 - midPnt.x}`,
          y2: `${y2 - midPnt.y}`,
        },
        true
      );
      break;
    case "path":
      let d: string = ele.getAttributeNS(null, "d");
      d = d
        .replace(/(\d)\s(?=[mMlLhHvVcCsSqQtTaAzZ])/g, "$1")
        .replace(/([mMlLhHvVcCsSqQtTaA])\s(?=(\d|[-+]))/g, "$1")
        .replace(/\s/g, ",");
      let cmdRegExp = new RegExp(
        /[mMlLhHvVcCsSqQtTaAzZ][^mMlLhHvVcCsSqQtTaAzZ]*/g
      );
      let cmds = d.match(cmdRegExp);
      if (cmds[0].substring(0, 1).toLowerCase() === "m") {
        const moveDist: number[] = cmds[0]
          .substring(1)
          .split(",")
          .map((n) => parseFloat(n));
        ele.setAttributeNS(
          null,
          "transform",
          `translate(${-moveDist[0]},${-moveDist[1]})`
        );
      }
      break;
  }
};

export const pointerDownAni = (ele: SVGElement) => {
  ele.querySelectorAll(`.${PNT_DOWN_CLS}`).forEach((bEle) => {
    (<any>bEle).beginElement();
  });
};
export const pointerUpAni = (ele: SVGElement) => {
  ele.querySelectorAll(`.${PNT_UP_CLS}`).forEach((bEle) => {
    (<any>bEle).beginElement();
  });
};

export const createSvgElement = (tagPara: ISvgEle) => {
  const svgElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    tagPara.tag
  );
  Object.keys(tagPara.para).forEach((key) => {
    const attrName: string = tagPara.flag ? toHyphen(key) : key;
    svgElement.setAttributeNS(null, attrName, `${tagPara.para[key]}`);
  });
  return svgElement;
};

/**
 * camel to hyphen
 * @param propName : css prop name in camel style
 */
export const toHyphen = (propName: string) => {
  return propName.replace(/[A-Z]/g, (matched: string, idx: number) => {
    return `-${matched.toLowerCase()}`;
  });
};

export const createAnimateTag = (cls: string, aniProps: IAniProps) => {
  return createSvgElement({
    tag: "animate",
    para: {
      class: cls,
      attributeType: "XML",
      attributeName: aniProps.attrName,
      from: aniProps.from,
      to: aniProps.to,
      begin: "indefinite",
      dur: aniProps.dur,
      fill: "freeze",
    },
    flag: false,
  });
};

export const createAnimatingEle = (
  tagPara: ISvgEle,
  hasAppearAni: boolean,
  touchAnis: IAniProps[],
  appearAnis?: IAniProps[]
) => {
  const ele: any = createSvgElement(tagPara);
  touchAnis.forEach((touchAni: IAniProps) => {
    ele.appendChild(
      createAnimateTag(PNT_DOWN_CLS, {
        attrName: touchAni.attrName,
        from: touchAni.from,
        to: touchAni.to,
        dur: touchAni.dur,
      })
    );
    ele.appendChild(
      createAnimateTag(PNT_UP_CLS, {
        attrName: touchAni.attrName,
        from: touchAni.to,
        to: touchAni.from,
        dur: touchAni.dur,
      })
    );
  });
  if (hasAppearAni) {
    appearAnis.forEach((appearAni: IAniProps) => {
      ele.appendChild(
        createAnimateTag(SHOW_CLS, {
          attrName: appearAni.attrName,
          from: appearAni.from,
          to: appearAni.to,
          dur: appearAni.dur,
        })
      );
      ele.appendChild(
        createAnimateTag(HIDE_CLS, {
          attrName: appearAni.attrName,
          from: appearAni.to,
          to: appearAni.from,
          dur: appearAni.dur,
        })
      );
    });
  }
  return ele;
};

export const createDashBox = () => {
  const svg: HTMLElement = document.getElementById("visChart");
  const dashBox: SVGRectElement = <SVGRectElement>createSvgElement({
    tag: "rect",
    para: {
      class: SUGGESTION_FRAME_CLS,
      fill: "none",
      stroke: "#676767",
      strokeWidth: "1",
      strokeDasharray: "2 2",
    },
    flag: true,
  });
  svg && svg.appendChild(dashBox);
  return dashBox;
};

export const updateProps = (
  ele: any,
  props: { [key: string]: string },
  flag: boolean = false
) => {
  Object.keys(props).forEach((key: string) => {
    const attrName: string = flag ? toHyphen(key) : key;
    ele.setAttributeNS(null, attrName, props[key]);
  });
};

export const transScaleEle = (ele: SVGElement, dist: ICoord, scale: number) => {
  const trans: ICoord = jsTool.extractTransNums(
    ele.getAttributeNS(null, "transform")
  );
  ele.setAttributeNS(
    null,
    "transform",
    `translate(${trans.x + dist.x}, ${trans.y + dist.y}) scale(${scale})`
  );
};

export const translateEle = (ele: SVGElement, dist: ICoord) => {
  const { trans, scale } = jsTool.extractTransScaleNums(
    ele.getAttributeNS(null, "transform")
  );
  ele.setAttributeNS(
    null,
    "transform",
    `translate(${trans[0] + dist.x}, ${trans[1] + dist.y}) ${
      scale !== 1 ? "scale(" + scale + ")" : ""
    }`
  );
};

export const scaleEle = (ele: SVGElement, scale: number) => {
  const trans: ICoord = jsTool.extractTransNums(
    ele.getAttributeNS(null, "transform")
  );
  ele.setAttributeNS(
    null,
    "transform",
    `translate(${trans.x}, ${trans.y}) scale(${scale})`
  );
};
// }

// export const svgManager = new SVGManager();
