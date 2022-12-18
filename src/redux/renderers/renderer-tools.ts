import KfGroup from "../views/vl/kfGroup";
import KfOmit from "../views/vl/kfOmit";
import KfTrack from "../views/vl/kfTrack";
import { KF_BG_LAYER, KF_FG_LAYER, KF_OMIT_LAYER } from "../views/vl/vl-consts";
import { Loading } from "../views/widgets/loading";
import { createSvgElement } from "../../util/svgManager";
import { ILoading } from "../global-interfaces";
import { suggestBox } from "../views/vl/suggestBox";

export const resetKeyframeTracks = () => {
  //reset
  document.getElementById(KF_BG_LAYER).innerHTML = "";
  document.getElementById(KF_FG_LAYER).innerHTML = "";
  document.getElementById(KF_OMIT_LAYER).innerHTML = "";
  const placeHolder: SVGRectElement = <SVGRectElement>createSvgElement({
    tag: "rect",
    para: {
      fill: "#00000000",
      width: "1",
      height: "18",
    },
    flag: true,
  });
  document.getElementById(KF_FG_LAYER).appendChild(placeHolder);
  suggestBox.removeSuggestBox();
  KfTrack.reset();
  KfGroup.reset();
  KfOmit.reset();
  const firstTrack: KfTrack = new KfTrack();
  firstTrack.createTrack();
};

export const toggleLoading = (loadingInfo: ILoading) => {
  if (loadingInfo.isLoading) {
    renderLoading(loadingInfo.targetEle, loadingInfo.content);
  } else {
    removeLoading();
  }
};
const renderLoading = (wrapper: HTMLElement, content: string) => {
  const loadingBlock: Loading = new Loading();
  loadingBlock.createLoading(wrapper, content);
};

const removeLoading = () => {
  Loading.removeLoading();
};
