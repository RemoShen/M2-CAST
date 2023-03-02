import { Animation } from "canis_toolkit";
import { ManualStep } from "../redux/action/interfaces";
import { store } from "../redux/store";
import { jsTool } from "./jsTool";
import { Polygon } from "./polygon";

export const isMark = (target: SVGElement | HTMLElement) => {
  return target.classList.contains("mark");
};

/**
 * classify selected marks by class
 * @param mIds
 * @returns
 */

export const classifySelection = (mIds: string[]) => {
  mIds = [...new Set(mIds)];
  const currentSelectedMarks: Map<string, string[]> = new Map(); //
  if (typeof store.getState().selectMarks !== "undefined") {
    store.getState().selectMarks.forEach((value: string[], key: string) => {
      currentSelectedMarks.set(key, value);
    });
  }
  mIds.forEach((mId: string) => {
    const className: string = Animation.markClass.get(mId);
    if (typeof className !== "undefined") {
      if (typeof currentSelectedMarks.get(className) === "undefined") {
        currentSelectedMarks.set(className, []);
      }
      const tmpSet: Set<string> = new Set(currentSelectedMarks.get(className)); //remove redundant
      tmpSet.add(mId);
      currentSelectedMarks.set(className, [...tmpSet]);
    }
  });
  return currentSelectedMarks;
};

/**
 * immutable
 * @param allPreviousSelectedMark 
 * @param mIds 
 * @returns 
 */
export const combineSelectStep = (allPreviousSelectedMark: string[][], mIds: string[]) => {
  const currentSelectedMarks: string[] = [...new Set(mIds)];
  // allPreviousSelectedMark.push(currentSelectedMarks);
  return [...allPreviousSelectedMark, currentSelectedMarks];
};
export const newManualSelect = (oldSelect: ManualStep, mIds: Set<string>, needComplete: boolean = true): ManualStep => {
  //exclusive or  (A∪B)∩(A∩B)
  const oldSet: Set<string> = oldSelect.marks;
  const newSet: Set<string> = new Set([...oldSet]);
  const newSteps = [...oldSelect.steps];
  mIds.forEach((mId: string) => {
    const element = document.getElementById(mId);
    if (oldSet.has(mId)) {
      newSet.delete(mId);
      removeHighlight(element);
      newSteps.length = 0;
      needComplete = false;
    } else {
      newSet.add(mId);
      addHighlight(element);
      newSteps.push(mId);
    }
  });

  if (!needComplete) {
    return { marks: newSet, steps: [] };
  }

  const numberSelect = Math.max(2, mIds.size);
  const newStepsLength = newSteps.length;
  if (newStepsLength < numberSelect) {
    return { marks: newSet, steps: newSteps };
  }

  const step1 = document.getElementById(newSteps[newStepsLength - 1]);
  const collectionAttr1 = step1.getAttribute("collection");
  if (collectionAttr1 == null || collectionAttr1.length == 0) {
    return { marks: newSet, steps: newSteps };
  }

  const collection1 = JSON.parse(collectionAttr1);

  let eqRow = true;
  let eqCol = true;

  for (let i = 0; i < numberSelect; i++) {
    const step = document.getElementById(newSteps[newStepsLength - i - 1]);
    const collectionAttr = step.getAttribute("collection");
    if (collectionAttr == null || collectionAttr.length == 0) {
      return { marks: newSet, steps: newSteps };
    }
    const collection = JSON.parse(collectionAttr);
    if (collection.id != collection1.id) {
      return { marks: newSet, steps: newSteps };
    }
    if (collection.row != collection1.row) {
      eqRow = false;
    }
    if (collection.col != collection1.col) {
      eqCol = false;
    }
  }

  if (!eqRow && !eqCol) {
    return { marks: newSet, steps: newSteps };
  }

  let marks = Array.from(document.getElementsByClassName("mark"));
  console.warn(store.getState().selection);
  store.getState().selectMarks.forEach(s => {
    marks = marks.filter(i => s.indexOf(i.id) == -1);
  });

  if (eqRow) {
    marks = marks.filter(mark => {
      const collectionAttr = mark.getAttribute("collection");
      if (!collectionAttr) return false;
      const collection = JSON.parse(collectionAttr);
      return collection.id == collection1.id && collection.row == collection1.row;
    })
  } else {
    marks = marks.filter(mark => {
      const collectionAttr = mark.getAttribute("collection");
      if (!collectionAttr) return false;
      const collection = JSON.parse(collectionAttr);
      return collection.id == collection1.id && collection.col == collection1.col;
    })
  }
  newSteps.length = 0;

  for (let i of marks) {
    if (!newSet.has(i.id)) {
      newSet.add(i.id);
      addHighlight(i as HTMLElement);
    }
  }

  return { marks: newSet, steps: newSteps };
};

export const addHighlight = (element: HTMLElement) => {
  const selectionGuideId = "selectionGuide";
  const svg = document.getElementById("visChart");
  let selectionGuide = document.getElementById(selectionGuideId) as Element;
  const chartContent = document.getElementById("chartContent");
  if (selectionGuide == null) {
    selectionGuide = document.createElementNS("http://www.w3.org/2000/svg", "g");
    selectionGuide.id = selectionGuideId;
    chartContent.appendChild(selectionGuide);
  }
  const opacityAttr = element.getAttribute("opacity");
  let opacity = 1;
  if (opacityAttr) {
    opacity = Number(opacityAttr);
  }

  element.classList.remove("non-framed-mark");
  element.setAttribute("opacity", (opacity * 0.3).toString());
  return;
  let frame: Element;
  if (element.tagName == "text") {
    frame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const boundingBox = element.getBoundingClientRect();
    const topLeft = jsTool.screenToSvgCoords(svg, boundingBox.left, boundingBox.top);
    const bottomRight = jsTool.screenToSvgCoords(svg, boundingBox.right, boundingBox.bottom);
    const transform = new Polygon().parseTransform(chartContent);
    frame.setAttribute("x", ((topLeft.x - transform.e) / transform.a).toString());
    frame.setAttribute("y", ((topLeft.y - transform.f) / transform.a).toString());
    frame.setAttribute("height", ((bottomRight.y - topLeft.y) / transform.a).toString());
    frame.setAttribute("width", ((bottomRight.x - topLeft.x) / transform.a).toString());
  } else {
    frame = element.cloneNode() as Element;
    frame.removeAttribute("data-datum");
  }
  frame.id = "qwert" + element.id;
  frame.setAttribute("fill", "none");
  frame.setAttribute("stroke", "black");
  frame.setAttribute("stroke-width", "1");
  frame.setAttribute("stroke-dasharray", "5, 5");
  frame.setAttribute("opacity", "1");
  frame.setAttribute("transform", new Polygon().getTransformFromChartContent(element).toString());

  const animation = document.createElementNS("http://www.w3.org/2000/svg", "animate");
  animation.setAttribute("attributeName", "stroke-dashoffset");
  animation.setAttribute("from", "0");
  animation.setAttribute("to", "10");
  animation.setAttribute("dur", "1");
  animation.setAttribute("repeatCount", "indefinite");
  frame.appendChild(animation);

  const animation2 = document.createElementNS("http://www.w3.org/2000/svg", "animate");
  animation2.setAttribute("attributeName", "stroke");
  animation2.setAttribute("from", "black");
  animation2.setAttribute("to", "white");
  animation2.setAttribute("dur", "1");
  animation2.setAttribute("repeatCount", "indefinite");
  frame.appendChild(animation2);

  frame.classList.forEach(value => frame.classList.remove(value));
  selectionGuide.appendChild(frame);
};

export const removeHighlight = (element: HTMLElement) => {
  const selectionGuideId = "selectionGuide";
  let selectionGuide = document.getElementById(selectionGuideId) as Element;
  const chartContent = document.getElementById("chartContent");
  if (selectionGuide == null) {
    selectionGuide = document.createElementNS("http://www.w3.org/2000/svg", "g");
    selectionGuide.id = selectionGuideId;
    selectionGuide.classList.add("selectionGuide");
    chartContent.appendChild(selectionGuide);
  }

  const opacityAttr = element.getAttribute("opacity");
  let opacity = 1;
  if (opacityAttr) {
    opacity = Number(opacityAttr);
  }
  element.classList.add("non-framed-mark");
  element.setAttribute("opacity", (opacity / 0.3).toString());
  // selectionGuide.removeChild(document.getElementById("qwert" + element.id))
};
//svgToPngBase64
export const svgToPngLink = (svgElement: HTMLElement | SVGElement) => {
  const canvas = document.createElement("canvas");
  canvas.width = svgElement.clientWidth;
  canvas.height = svgElement.clientHeight;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  ctx.drawImage(img, 0, 0);
  let pngLink = ''
  const link = document.createElement('a');
  link.download = 'my-image.png';
  link.href = canvas.toDataURL("image/png");
  img.src = "data:image/svg+xml," + encodeURIComponent(new XMLSerializer().serializeToString(svgElement));
  const matches = link.href.match(/^data:image\/png;base64,(.+)$/);
  return matches;
}
