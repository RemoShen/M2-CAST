import AniMIL from "../../../mil/AniMIL";

export const DRAGGING: string = "dragChart";
export const dragging = new AniMIL.Pan({
  event: DRAGGING,
});
export const ZOOM_CHART: string = "zoomChart";
export const zoomChart = new AniMIL.Pinch({
  event: ZOOM_CHART,
});
export const DOUBLE_TAP_TOGGLE_VIDEO: string = "doubleTaptoggleVideo";
export const doubleTaptoggleVideo = new AniMIL.Tap({
  event: DOUBLE_TAP_TOGGLE_VIDEO,
  taps: 2,
});
export const TAP_CHART: string = "tapChart";
export const tapChart = new AniMIL.Tap({
  event: TAP_CHART,
});
export const SELECT_MULTI: string = "multiSelect";
export const multiSelect = new AniMIL.Press({
  time: 300,
  event: SELECT_MULTI,
});

export const toggleSystemTouch = (flag: boolean) => {
  dragging.set({ enable: !flag });
  zoomChart.set({ enable: !flag });
};
