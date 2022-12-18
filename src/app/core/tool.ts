import { ICoord } from "../../redux/global-interfaces";
import { jsTool } from "../../util/jsTool";
import { IAnimationSpec } from "./canisGenerator";

export const distanceTo = (p1: ICoord, p2: ICoord) => {
  let dx = p2.x - p1.x;
  let dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const centroid = (points: ICoord[]) => {
  let x = 0.0,
    y = 0.0;
  for (let i = 0; i < points.length; i++) {
    x += points[i].x;
    y += points[i].y;
  }
  x /= points.length;
  y /= points.length;
  return { x: x, y: y };
};

export const rotateBy = (points: ICoord[], radians: number) => {
  let c = centroid(points);
  let cos = Math.cos(radians);
  let sin = Math.sin(radians);
  let newpoints = [];
  for (let i = 0; i < points.length; i++) {
    let qx = (points[i].x - c.x) * cos - (points[i].y - c.y) * sin + c.x;
    let qy = (points[i].x - c.x) * sin + (points[i].y - c.y) * cos + c.y;
    newpoints[newpoints.length] = { x: qx, y: qy };
  }
  return newpoints;
};

export const translateTo = (points: ICoord[], pt: ICoord) => {
  let c = centroid(points);
  let newpoints = [];
  for (let i = 0; i < points.length; i++) {
    let qx = points[i].x + pt.x - c.x;
    let qy = points[i].y + pt.y - c.y;
    newpoints[newpoints.length] = { x: qx, y: qy };
  }
  return newpoints;
};

export const scaleTo = (points: ICoord[], size: number) => {
  let B = boundingBox(points);
  let newpoints = new Array();
  for (let i = 0; i < points.length; i++) {
    let qx = points[i].x * (size / B.width);
    let qy = points[i].y * (size / B.height);
    newpoints[newpoints.length] = { x: qx, y: qy };
  }
  return newpoints;
};

export const boundingBox = (points: ICoord[]) => {
  let minX = +Infinity,
    maxX = -Infinity,
    minY = +Infinity,
    maxY = -Infinity;
  for (let i = 0; i < points.length; i++) {
    minX = Math.min(minX, points[i].x);
    minY = Math.min(minY, points[i].y);
    maxX = Math.max(maxX, points[i].x);
    maxY = Math.max(maxY, points[i].y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

export const vectorize = (points: ICoord[]) => {
  let sum = 0.0;
  let vector: number[] = [];
  for (let i = 0; i < points.length; i++) {
    vector[vector.length] = points[i].x;
    vector[vector.length] = points[i].y;
    sum += points[i].x * points[i].x + points[i].y * points[i].y;
  }
  let magnitude = Math.sqrt(sum);
  for (let i = 0; i < vector.length; i++) vector[i] /= magnitude;
  return vector;
};

export const compareAniAndSelector = (
  animation: IAnimationSpec,
  aniId: string
) => {
  if (animation.chartIdx == aniId[0]) {
    let selectId = animation.selector;
    while (selectId.search(" ") >= 0) {
      selectId = selectId.replace(" ", "");
    }
    aniId = aniId.slice(2);
    while (aniId.search(" ") >= 0) {
      aniId = aniId.replace(" ", "");
    }
    const selectIdToArray = selectId.split(",");
    const aniIdToArray = aniId.split(",");
    if (jsTool.identicalArrays(selectIdToArray, aniIdToArray)) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};
