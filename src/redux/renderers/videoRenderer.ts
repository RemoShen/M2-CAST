import Lottie from "lottie-web";
import { toggleVideoMode, updateLottieAni } from "../action/videoAction";
import { store } from "../store";
import {
  CHART_VIEW_CONTENT_ID,
  VIDEO_VIEW_CONTENT_ID,
} from "../views/panels/panel-consts";
import { Animation } from "canis_toolkit";
import { player } from "../views/slider/player";
import { updateKfTracks } from "../action/vlAction";
import { canis, ICanisSpec } from "../../app/core/canisGenerator";
import { SuggestBox } from "../views/vl/suggestBox";
import { resetKeyframeTracks } from "./renderer-tools";
import { TXT_BUBBLE_CLS } from "../views/bubble/txtBubble";
import {
  BTN_CONTENT_TYPE_STR,
  BTN_TYPE_PREVIEW,
  CIRCLE_BTN,
  DEFAULT_BTN_SIZE,
  ISVGBtn,
  MID_FONT,
} from "../views/buttons/button-consts";
import { NON_SKETCH_CLS } from "../global-consts";
import { IAttrAndSpec } from "../global-interfaces";
import { DARK_COLOR, LIGHT_COLOR } from "../views/menu/menu-consts";
import { SVGBtn } from "../views/buttons/svgButton";

export const videoRenderer = {
  toggleVideoMode: () => {
    player.togglePlayMode();
  },

  updateLottieSpec: () => {
    videoRenderer.renderVideo(false);
    resetKeyframeTracks();
    store.dispatchSystem(updateKfTracks(Animation.animations));
  },

  renderVideo: (
    autoPlay: boolean,
    lottieSpec: any = store.getState().lottieSpec
  ) => {
    document.getElementById(VIDEO_VIEW_CONTENT_ID).innerHTML = "";
    store.dispatchSystem(
      updateLottieAni(
        Lottie.loadAnimation({
          container: document.getElementById(VIDEO_VIEW_CONTENT_ID),
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData: lottieSpec, // the animation data
        })
      )
    );

    //start to play animation
    if (autoPlay && !store.getState().showVideo) {
      store.dispatchSystem(toggleVideoMode(true));
    }
  },

  renderVideoRange: (
    startTime: number,
    endTime: number,
    lottieSpec: any = store.getState().lottieSpec
  ) => {
    document.getElementById(VIDEO_VIEW_CONTENT_ID).innerHTML = "";
    store.dispatchSystem(
      updateLottieAni(
        Lottie.loadAnimation({
          container: document.getElementById(VIDEO_VIEW_CONTENT_ID),
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData: lottieSpec, // the animation data
        })
      )
    );

    //start to play animation
    player.playing = true;
    player.playRange(startTime, endTime);
  },

  renderSuggestSpec: async () => {
    const targetSpec: ICanisSpec = store.getState().isPreviewing
      ? store.getState().previewSpec
      : store.getState().spec;
    // new Promise((resolve, reject) => {
    const oldChartContainer = document.getElementById(CHART_VIEW_CONTENT_ID);
    oldChartContainer.id = `tmp${CHART_VIEW_CONTENT_ID}`;
    const tmpContainer = document.createElement("div");
    tmpContainer.id = CHART_VIEW_CONTENT_ID;
    document.body.appendChild(tmpContainer);
    // }).then(async () => {
    //render video
    const lottieSpec = await canis.renderSpec(targetSpec, () => {
      document.body.removeChild(document.getElementById(CHART_VIEW_CONTENT_ID));
      document.getElementById(`tmp${CHART_VIEW_CONTENT_ID}`).id =
        CHART_VIEW_CONTENT_ID;
    });

    player.resetPlayer({
      frameRate: canis.frameRate,
      currentTime: 0,
      totalTime: canis.duration(),
    });
    store.dispatchSystem(toggleVideoMode(store.getState().isPreviewing));
    if (store.getState().isPreviewing) {
      let startTime: number = 10000000,
        endTime: number = 0;
      (SuggestBox.preUniqueIdx === -1
        ? store.getState().previewPath.firstKfMarks
        : store.getState().previewPath.kfMarks[SuggestBox.preUniqueIdx]
      ).forEach((mId: string) => {
        if (Animation.allMarkAni.get(mId).startTime < startTime) {
          startTime = Animation.allMarkAni.get(mId).startTime;
        }
      });
      store
        .getState()
        .previewPath.kfMarks[SuggestBox.currentUniqueIdx].forEach(
          (mId: string) => {
            const tmpStart: number = Animation.allMarkAni.get(mId).startTime;
            const tmpDuration: number =
              Animation.allMarkAni.get(mId).totalDuration;
            if (tmpStart + tmpDuration > endTime) {
              endTime = tmpStart + tmpDuration;
            }
          }
        );
      //render video view
      videoRenderer.renderVideoRange(startTime, endTime, lottieSpec);
    } else {
      videoRenderer.renderVideo(false, lottieSpec);
    }
    // })
  },

  // renderPreviewBtns: () => {
  //     if (store.getState().suggestSpecs.length > 1) {
  //         console.log('rendering preview btns: ', store.getState().suggestSpecs);
  //         const containerId = 'previewBtnContainer';
  //         if (document.getElementById(containerId)) {
  //             document.getElementById(containerId).remove();
  //             Array.from(document.getElementsByClassName(TXT_BUBBLE_CLS)).forEach(tb => tb.remove());
  //         }
  //         const padding: number = 10;
  //         const r: number = DEFAULT_BTN_SIZE;
  //         const container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  //         container.id = containerId;
  //         container.classList.add('preview-btn-container', NON_SKETCH_CLS);
  //         const containerW: number = padding * 2 + r * 2;
  //         const containerH: number = store.getState().suggestSpecs.length * 2 * r + (store.getState().suggestSpecs.length + 1) * padding;
  //         const chartBBox: DOMRect = document.getElementById('chartContent').getBoundingClientRect();
  //         container.setAttributeNS(null, 'style', `left:${chartBBox.left - containerW}px; top: ${chartBBox.bottom - containerH}px; border-radius: ${containerW / 2}px`);
  //         container.setAttributeNS(null, 'width', `${containerW}`);
  //         container.setAttributeNS(null, 'height', `${containerH}`);
  //         document.body.appendChild(container);
  //         store.getState().suggestSpecs.forEach((attrAndSpec: IAttrAndSpec, idx: number) => {//preview button
  //             const buttonProps: ISVGBtn = {
  //                 type: CIRCLE_BTN,
  //                 center: { x: r + padding, y: (idx + 1) * padding + (idx * 2 + 1) * r },
  //                 r: r,
  //                 appearAni: false,
  //                 startFill: LIGHT_COLOR,
  //                 endFill: DARK_COLOR,
  //                 innerContent: {
  //                     type: BTN_CONTENT_TYPE_STR,
  //                     fontSize: MID_FONT,
  //                     content: `SUG. ${idx + 1}`
  //                 },
  //                 values: attrAndSpec,
  //                 events: []
  //             }
  //             const btn: SVGBtn = new SVGBtn(container, false, buttonProps);
  //             container.appendChild(btn.container);
  //             btn.bindPressing(BTN_TYPE_PREVIEW);
  //         })
  //     }
  // }
};
