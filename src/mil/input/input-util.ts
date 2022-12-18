import Input from "./input";
import * as inputConsts from "./input-consts";
import * as util from "../utils/util";
import Manager from "../manager";
import { ICoord } from "../../redux/global-interfaces";

/**
 * calculate the angle between two coordinates
 */
export const getAngle = (p1: ICoord, p2: ICoord) => {
  let x = p2.x - p1.x;
  let y = p2.y - p1.y;
  return (Math.atan2(y, x) * 180) / Math.PI;
};

/**
 * calculate the absolute distance between two points
 */
export const getDistance = (p1: ICoord, p2: ICoord) => {
  let x = p2.x - p1.x;
  let y = p2.y - p1.y;
  return Math.sqrt(x * x + y * y);
};

/**
 * calculate the scale factor between two pointersets
 * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
 */
export const getScale = (start: any[], end: any[]) => {
  const endCoord0: ICoord = { x: end[0].clientX, y: end[0].clientY };
  const endCoord1: ICoord = { x: end[1].clientX, y: end[1].clientY };
  const startCoord0: ICoord = { x: start[0].clientX, y: start[0].clientY };
  const startCoord1: ICoord = { x: start[1].clientX, y: start[1].clientY };
  return (
    getDistance(endCoord0, endCoord1) / getDistance(startCoord0, startCoord1)
  );
};

/**
 * calculate the rotation degrees between two pointersets
 */
export const getRotation = (start: any[], end: any[]) => {
  const endCoord0: ICoord = { x: end[0].clientX, y: end[0].clientY };
  const endCoord1: ICoord = { x: end[1].clientX, y: end[1].clientY };
  const startCoord0: ICoord = { x: start[0].clientX, y: start[0].clientY };
  const startCoord1: ICoord = { x: start[1].clientX, y: start[1].clientY };
  return getAngle(endCoord1, endCoord0) + getAngle(startCoord1, startCoord0);
};

/**
 * get the direction between two points
 */
export const getDirection = (x: number, y: number) => {
  if (x === y) {
    return inputConsts.DIRECTION_NONE;
  }

  if (Math.abs(x) >= Math.abs(y)) {
    return x < 0 ? inputConsts.DIRECTION_LEFT : inputConsts.DIRECTION_RIGHT;
  }
  return y < 0 ? inputConsts.DIRECTION_UP : inputConsts.DIRECTION_DOWN;
};

/**
 * calculate the velocity between two points. unit is in px per ms.
 */
export const getVelocity = (deltaTime: number, x: number, y: number) => {
  return {
    x: x / deltaTime || 0,
    y: y / deltaTime || 0,
  };
};

/**
 * create a simple clone from the input used for storage of firstInput and firstMultiple
 */
export const simpleCloneInputData = (input: Input) => {
  // make a simple copy of the pointers because we will get a reference if we don't
  // we only need clientXY for the calculations
  let pointers = [];
  let i = 0;
  while (i < input.pointers.length) {
    pointers[i] = {
      clientX: Math.round(input.pointers[i].clientX),
      clientY: Math.round(input.pointers[i].clientY),
    };
    i++;
  }

  return {
    timeStamp: Date.now(),
    pointers,
    center: util.getCenter(pointers),
    deltaX: input.deltaX,
    deltaY: input.deltaY,
  };
};

/**
 * velocity is calculated every x ms
 */
export const computeIntervalInputData = (session: any, input: Input) => {
  let last = session.lastInterval || input;
  let deltaTime = input.timeStamp - last.timeStamp;
  let velocity;
  let velocityX;
  let velocityY;
  let direction;

  if (
    input.eventType !== inputConsts.INPUT_CANCEL &&
    (deltaTime > inputConsts.COMPUTE_INTERVAL || last.velocity === undefined)
  ) {
    let deltaX = input.deltaX - last.deltaX;
    let deltaY = input.deltaY - last.deltaY;

    let v = getVelocity(deltaTime, deltaX, deltaY);
    velocityX = v.x;
    velocityY = v.y;
    velocity = Math.abs(v.x) > Math.abs(v.y) ? v.x : v.y;
    direction = getDirection(deltaX, deltaY);

    session.lastInterval = input;
  } else {
    // use latest velocity info if it doesn't overtake a minimum period
    velocity = last.velocity;
    velocityX = last.velocityX;
    velocityY = last.velocityY;
    direction = last.direction;
  }

  input.velocity = velocity;
  input.velocityX = velocityX;
  input.velocityY = velocityY;
  input.direction = direction;
};

export const computeDeltaXY = (session: any, input: Input) => {
  let { center } = input;
  // let { offsetDelta:offset = {}, prevDelta = {}, prevInput = {} } = session;
  // jscs throwing error on defalut destructured values and without defaults tests fail
  let offset = session.offsetDelta || {};
  let prevDelta = session.prevDelta || {};
  let prevInput = session.prevInput || {};

  if (
    input.eventType === inputConsts.INPUT_START ||
    prevInput.eventType === inputConsts.INPUT_END
  ) {
    prevDelta = session.prevDelta = {
      x: prevInput.deltaX || 0,
      y: prevInput.deltaY || 0,
    };

    offset = session.offsetDelta = {
      x: center.x,
      y: center.y,
    };
  }

  input.deltaX = prevDelta.x + (center.x - offset.x);
  input.deltaY = prevDelta.y + (center.y - offset.y);
};

/**
 * extend the data with some usable properties like scale, rotate, velocity etc
 */
export const computeInputData = (manager: Manager, input: Input) => {
  let { session } = manager;
  let { pointers } = input;
  let { length: pointersLength } = pointers;

  // store the first input to calculate the distance and direction
  if (!session.firstInput) {
    session.firstInput = simpleCloneInputData(input);
  }

  // to compute scale and rotation we need to store the multiple touches
  if (pointersLength > 1 && !session.firstMultiple) {
    session.firstMultiple = simpleCloneInputData(input);
  } else if (pointersLength === 1) {
    session.firstMultiple = false;
  }

  let { firstInput, firstMultiple } = session;
  let offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;

  let center = (input.center = util.getCenter(pointers));
  input.timeStamp = Date.now();
  input.deltaTime = input.timeStamp - firstInput.timeStamp;

  input.angle = getAngle(offsetCenter, center);
  input.distance = getDistance(offsetCenter, center);

  computeDeltaXY(session, input);
  input.offsetDirection = getDirection(input.deltaX, input.deltaY);

  let overallVelocity = getVelocity(
    input.deltaTime,
    input.deltaX,
    input.deltaY
  );
  input.overallVelocityX = overallVelocity.x;
  input.overallVelocityY = overallVelocity.y;
  input.overallVelocity =
    Math.abs(overallVelocity.x) > Math.abs(overallVelocity.y)
      ? overallVelocity.x
      : overallVelocity.y;

  input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
  input.rotation = firstMultiple
    ? getRotation(firstMultiple.pointers, pointers)
    : 0;

  input.maxPointers = !session.prevInput
    ? input.pointers.length
    : input.pointers.length > session.prevInput.maxPointers
    ? input.pointers.length
    : session.prevInput.maxPointers;

  computeIntervalInputData(session, input);

  // find the correct target
  let target = manager.ele;
  if (util.hasParent(input.srcEvent.target, target)) {
    target = input.srcEvent.target;
  }
  input.target = target;
};

export const inputHandler = (
  manager: Manager,
  eventType: any,
  input: Input
) => {
  let pointersLen = input.pointers.length;
  let changedPointersLen = input.changedPointers.length;
  let isFirst =
    eventType & inputConsts.INPUT_START &&
    pointersLen - changedPointersLen === 0;
  let isFinal =
    eventType & (inputConsts.INPUT_END | inputConsts.INPUT_CANCEL) &&
    pointersLen - changedPointersLen === 0;

  input.isFirst = !!isFirst;
  input.isFinal = !!isFinal;

  if (isFirst) {
    manager.session = {};
  }

  // source event is the normalized value of the domEvents
  // like 'touchstart, mouseup, pointerdown'
  input.eventType = eventType;

  // compute scale, rotation etc
  computeInputData(manager, input);

  manager.recognize(input);
  manager.session.prevInput = input;
};
