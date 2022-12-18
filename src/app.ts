import "./redux/assets/style/app.scss";
import { nav } from "./redux/views/nav/nav";
import ResizablePanel from "./redux/views/panels/resizablePanel";
import ViewWindow from "./redux/views/panels/viewWindow";
import { state } from "./app/state";
import {
  detectCanTrigger,
  detectDownArea,
  scaleChart,
  translateChart,
} from "./util/tool";
import { player } from "./redux/views/slider/player";
import { Ava } from "./app/core/Ava";
import { BTN_CLS } from "./redux/views/buttons/button-consts";
import {
  callSysMenu,
  selectSysMenu,
  CALL_SYS_MENU,
  SELECT_SYS_MENU,
} from "./redux/views/menu/menu-interactions";
import { sysMenu } from "./redux/views/menu/systemMenu";
import KfItem from "./redux/views/vl/kfItem";
import KfGroup from "./redux/views/vl/kfGroup";
import { store } from "./redux/store";
import {
  CHART_VIEW_CONTENT_ID,
  CHART_VIEW_TITLE,
  KF_VIEW_CONTENT_ID,
  KF_VIEW_TITLE,
} from "./redux/views/panels/panel-consts";
import {
  DOUBLE_TAP_TIME,
  NON_SKETCH_CLS,
  SINGLE_TAP_TIME,
  TARGET_CHART,
  TARGET_KEYFRAME,
} from "./redux/global-consts";
import { ICoord } from "./redux/global-interfaces";
import { sketchCanvas } from "./redux/views/panels/sketchCanvas";
import {
  dragging,
  zoomChart,
  DRAGGING,
  ZOOM_CHART,
  toggleSystemTouch,
  doubleTaptoggleVideo,
  DOUBLE_TAP_TOGGLE_VIDEO,
  tapChart,
  TAP_CHART,
} from "./redux/views/panels/interactions";
import { toggleVideoMode } from "./redux/action/videoAction";
import { jsTool } from "./util/jsTool";
import { markSelection } from "./util/markSelection";
import AniMIL from "./mil/AniMIL";
import InputTouch from "./mil/input/inputs/touch";
import { kfContainer } from "./redux/views/vl/kfContainer";
import { updateEffectType } from "./redux/action/canisAction";
function app(): HTMLDivElement {
  const outerWrapper: HTMLDivElement = document.createElement("div");
  outerWrapper.id = "appWrapper";
  outerWrapper.className = "outer-wrapper";
  const innerWrapper: ResizablePanel = new ResizablePanel(true, {
    p1: 7.5,
    p2: 2.5,
    verticle: true,
  });
  innerWrapper.wrapper.classList.add("inner-wrapper");

  //create main panels
  //create chart view
  const chartView: ViewWindow = new ViewWindow(CHART_VIEW_TITLE, false);
  chartView.createView();
  innerWrapper.addChild(chartView);

  //create keyframe view
  const kfView: ViewWindow = new ViewWindow(KF_VIEW_TITLE, true);
  kfView.createView();

  innerWrapper.addChild(kfView);
  outerWrapper.appendChild(innerWrapper.wrapper);

  nav.createNav();
  outerWrapper.appendChild(nav.navContainer);

  // const footer: HTMLDivElement = document.createElement('div');
  // footer.id = 'footer';
  // footer.className = 'footer';
  // outerWrapper.appendChild(footer);
  Ava.init();
  return outerWrapper;
}

const documentPointerMove = (e: PointerEvent) => {
  e.preventDefault();
  if (e.pointerType === "pen" || e.pointerType === "mouse") {
    sketchCanvas.drawing(e);
  }
};

let lastUpTime: number = 0;
let lastDownTime: number = 0;
let isDoubleTapping: boolean = false;

const documentPointerUp = (e: PointerEvent) => {
  e.preventDefault();
  KfItem.endDragging();
  if (
    sketchCanvas.sketching &&
    (e.pointerType === "pen" || e.pointerType === "mouse")
  ) {
    sketchCanvas.endDrawing();
    // sketchCanvas.touchType = TOUCH_NULL;
  } else if (e.pointerType === "touch") {
    lastUpTime = new Date().getTime();
    const currentTime: number = new Date().getTime();
    const diffTime: number = currentTime - lastDownTime;
    if (diffTime < SINGLE_TAP_TIME) {
      //single tapping
      markSelection.tappingChart(<SVGElement>e.target, {
        x: e.clientX,
        y: e.clientY,
      });
    }
  }
  document.removeEventListener("pointermove", documentPointerMove);
  document.removeEventListener("pointerup", documentPointerUp);
};

/**
 * check whether the user is using pen or finger to select
 * @param e
 */
const documentPointerDown = (e: PointerEvent) => {
  e.preventDefault();
  const target = <HTMLElement>e.target;
  
  // if (detectCanSketch(target)) {//for test
  if (
    detectCanTrigger(target, NON_SKETCH_CLS) &&
    (e.pointerType === "pen" || e.pointerType === "mouse")
  ) {
    //can start drawing
    // if (e.buttons === 2) {
    //     Reducer.triger(action.UPDATE_TOUCH_TYPE, TOUCH_MULTI);
    // } else {
    //     Reducer.triger(action.UPDATE_TOUCH_TYPE, TOUCH_SINGLE);
    // }
    sketchCanvas.toggleSketching(true, { x: e.clientX, y: e.clientY });
  } else if (e.pointerType === "touch") {
    e.preventDefault();
    lastDownTime = new Date().getTime();
    const currentTime: number = new Date().getTime();
    const diffTime: number = currentTime - lastUpTime;
    isDoubleTapping = diffTime <= DOUBLE_TAP_TIME;
    if (isDoubleTapping) {
      //double tapping
      const chartArea: DOMRect = document
        .getElementById(CHART_VIEW_CONTENT_ID)
        .getBoundingClientRect();
      const kfArea: DOMRect = document
        .getElementById(KF_VIEW_CONTENT_ID)
        .getBoundingClientRect();
      if (jsTool.inBoundary(chartArea, { x: e.clientX, y: e.clientY })) {
        if (player.shown) {
          store.dispatchSystem(toggleVideoMode(false));
        } else {
          store.dispatchSystem(toggleVideoMode(true));
        }
      } else if (jsTool.inBoundary(kfArea, { x: e.clientX, y: e.clientY })) {
      }
    }
  }
  document.addEventListener("pointermove", documentPointerMove);
  document.addEventListener("pointerup", documentPointerUp);
};

document.addEventListener("pointerdown", documentPointerDown);

//touch events: pinch, move
// let touchDown: boolean = false, touchTarget: string, preDist: number, prePosi: ICoord, touchPntSvgNoScale: ICoord, latestTouch: number = 0;
// const generalTouchStart = (e: TouchEvent) => {
//     if (!state.sketching) {
//         //detect double tap
//         const currentTouch: number = new Date().getTime();
//         const timeDiff: number = currentTouch - latestTouch;
//         if (timeDiff < 300 && e.touches.length === 1) {//double tap
//             resetChartScaleAndTrans();
//         } else {
//             touchDown = true;
//             touchTarget = detectDownArea(e.touches[0].target, { x: e.touches[0].pageX, y: e.touches[0].pageY });
//             prePosi = { x: e.touches[0].pageX, y: e.touches[0].pageY };
//             const svg: HTMLElement = document.getElementById('visChart');
//             const touchPntSvg: ICoord = screenToSvgCoords(svg, prePosi.x, prePosi.y);
//             touchPntSvgNoScale = { x: touchPntSvg.x / state.chartScaleRatio, y: touchPntSvg.y / state.chartScaleRatio };
//             if (e.touches.length === 2) {//start to pinch
//                 preDist = pointDist({ x: e.touches[0].pageX, y: e.touches[0].pageY }, { x: e.touches[1].pageX, y: e.touches[1].pageY });
//             }
//         }
//         latestTouch = currentTouch;
//     }
// }
// const generalTouchMove = (e: TouchEvent) => {
//     if (touchDown && !state.sketching) {
//         if (e.touches.length === 1) {//moving
//             const currentPosi: ICoord = { x: e.touches[0].pageX, y: e.touches[0].pageY };
//             if (touchTarget === 'chart') {
//                 translateChart({ x: currentPosi.x - prePosi.x, y: currentPosi.y - prePosi.y });
//             } else if (touchTarget === 'keyframe') {

//             }
//             prePosi = currentPosi;
//         } else if (e.touches.length === 2) {//pinching
//             const currentDist: number = pointDist({ x: e.touches[0].pageX, y: e.touches[0].pageY }, { x: e.touches[1].pageX, y: e.touches[1].pageY });
//             const diff: number = currentDist - preDist;
//             if (touchTarget === 'chart') {
//                 const scaleNum: number = diff / 200;
//                 scaleChart(scaleNum, touchPntSvgNoScale);
//             } else if (touchTarget === 'keyframe') {

//             }
//             preDist = currentDist;
//         }
//     }
// }
// const generalTouchUp = (e: TouchEvent) => {
//     document.removeEventListener('touchmove', generalTouchMove);
//     document.removeEventListener('touchup', generalTouchUp);
//     touchDown = false;
// }
// document.addEventListener('touchstart', generalTouchStart);
// document.addEventListener('touchmove', generalTouchMove);

//cancel right click
document.oncontextmenu = () => {
  return false;
};

document.onkeyup = (e) => {
  var event: any = e || window.event;
  var key = event.which || event.keyCode || event.charCode;
  if (key == 13) {
    // if (typeof document.getElementById(Hint.TIMING_HINT_ID) !== 'undefined') {
    //     hintTag.contentInput.blur();
    // }
  } else if (key == 32) {
    if (player.playing) {
      player.pauseAnimation();
    } else {
      player.playAnimation();
    }
  }
};

document.body.appendChild(app());
document.oncontextmenu = (e) => {
  e.preventDefault();
};

const documentTouch = new AniMIL(document.body);
documentTouch.add(callSysMenu);
documentTouch.add(selectSysMenu);
documentTouch.add(dragging);
// documentTouch.add(dragKf);
documentTouch.add(zoomChart);

// documentTouch.add(tapChart);
// documentTouch.add(doubleTaptoggleVideo);

//chart pan & zoom
let preChartPosi: ICoord = null;
let startChartPosi: ICoord = null;
let directionLock: number = -1;
let regionLock: number = -1;
documentTouch.on(DRAGGING, (e: any) => {
  e.preventDefault();
  if (e.pointerType === "touch") {
    const currentPosi: ICoord = e.center;
    if (!preChartPosi) {
      preChartPosi = currentPosi;
      startChartPosi = currentPosi;
      directionLock = -1;
      regionLock = -1;
    } else {
      const touchTarget: number = detectDownArea(e.center);
      switch (touchTarget) {
        case TARGET_CHART:
          if (regionLock === 1) {
            break;
          }
          regionLock = 0;
          translateChart(
            {
              x: currentPosi.x - preChartPosi.x,
              y: currentPosi.y - preChartPosi.y,
            },
            true
          );
          break;
        case TARGET_KEYFRAME:
          if (regionLock === 0) {
            break;
          }
          regionLock = 1;
          if (KfItem.dragInfo) {
            if (KfItem.dragInfo.targetMoveItem instanceof KfGroup) {
              KfItem.dragInfo.dragItem.moveKfGroupTarget(
                currentPosi,
                preChartPosi
              );
            } else if (KfItem.dragInfo.targetMoveItem instanceof KfItem) {
              KfItem.dragInfo.dragItem.moveKfTarget(currentPosi, preChartPosi);
            }
          } else {
            if (
              directionLock === 0 ||
              (directionLock !== 1 &&
                Math.abs(currentPosi.x - startChartPosi.x) >
                  Math.abs(currentPosi.y - startChartPosi.y) &&
                Math.abs(currentPosi.x - startChartPosi.x) > 10)
            ) {
              directionLock = 0;
              kfContainer.scroll({
                w: -(currentPosi.x - preChartPosi.x),
                // h: -(currentPosi.y - preChartPosi.y),
              });
            } else if (
              directionLock === 1 ||
              (directionLock !== 0 &&
                Math.abs(currentPosi.x - startChartPosi.x) <
                  Math.abs(currentPosi.y - startChartPosi.y) &&
                Math.abs(currentPosi.y - startChartPosi.y) > 10)
            ) {
              directionLock = 1;
              kfContainer.scroll({
                // w: -(currentPosi.x - preChartPosi.x),
                h: -(currentPosi.y - preChartPosi.y),
              });
            }
          }
          break;
      }
      preChartPosi = currentPosi;
    }
  }
});

documentTouch.on(`${DRAGGING}end`, (e: any) => {
  e.preventDefault();
  const touchTarget: number = detectDownArea(e.center);
  switch (touchTarget) {
    case TARGET_CHART:
      break;
    case TARGET_KEYFRAME:
      KfItem.endDragging();
      break;
  }
  preChartPosi = null;
});

let preScale: number = -1;
let scaleStartPnt: ICoord = null;
let startScaleRatio: number = 0;
documentTouch.on(ZOOM_CHART, (e: any) => {
  e.preventDefault();
  if (preScale === -1) {
    preScale = e.scale;
  }
  if (!scaleStartPnt) {
    scaleStartPnt = e.center;
    startScaleRatio = store.getState().chartScaleRatio;
  }
  const touchTarget: number = detectDownArea(e.center);
  if (touchTarget & TARGET_CHART) {
    const svg: HTMLElement = document.getElementById("visChart");
    const touchPntSvg: ICoord = jsTool.screenToSvgCoords(
      svg,
      scaleStartPnt.x,
      scaleStartPnt.y
    );
    let touchPntSvgNoScale: ICoord = {
      x: touchPntSvg.x / startScaleRatio,
      y: touchPntSvg.y / startScaleRatio,
    };
    scaleChart(e.scale - preScale, touchPntSvgNoScale);
    preScale = e.scale;
  }
  //TODO: touch other components
});
documentTouch.on(`${ZOOM_CHART}end`, (e: any) => {
  e.preventDefault();
  preScale = -1;
  scaleStartPnt = null;
});

// documentTouch.on(`${TAP_CHART}up`, (e: any) => {
//     console.log('tapping chart: ', e);
//     markSelection.tappingChart(<SVGElement>e.target, e.center);
// })

// documentTouch.on(`${DOUBLE_TAP_TOGGLE_VIDEO}up`, (e: any) => {
//     // resetChartScaleAndTrans();
//     const chartArea: DOMRect = document.getElementById(CHART_VIEW_CONTENT_ID).getBoundingClientRect();
//     const kfArea: DOMRect = document.getElementById(KF_VIEW_CONTENT_ID).getBoundingClientRect();
//     if (jsTool.inBoundary(chartArea, e.center)) {
//         if (player.shown) {
//             store.dispatch(toggleVideoMode(false));
//         } else {
//             store.dispatch(toggleVideoMode(true));
//         }
//     } else if (jsTool.inBoundary(kfArea, e.center)) {

//     }
// })

//system menu
documentTouch.on(CALL_SYS_MENU, (e: any) => {
  if (e.pointerType === "touch") {
    if (detectCanTrigger(e.target, NON_SKETCH_CLS)) {
      selectSysMenu.set({ enable: true });
      toggleSystemTouch(true);
      sysMenu.createSystemMenu(e.center);
    }
  }
});
documentTouch.on(SELECT_SYS_MENU, (e: any) => {
  if (e.pointerType === "touch") {
    sysMenu.judgeSystemMenu(e.center);
  }
});
documentTouch.on(
  `${SELECT_SYS_MENU}cancel ${SELECT_SYS_MENU}end ${CALL_SYS_MENU}up`,
  (e: any) => {
    if (e.pointerType === "touch") {
      if (detectCanTrigger(e.target, BTN_CLS)) {
        selectSysMenu.set({ enable: false });
        toggleSystemTouch(false);
        sysMenu.destroySysMenu();
      }
    }
  }
);

sketchCanvas.initCanvas();
//init styles
player.resizePlayer(player.widget.clientWidth - 198);
state.reset(true);

window.onresize = () => {
  player.resizePlayer(player.widget.clientWidth - 198);
  sketchCanvas.updateCanvasSize();
};