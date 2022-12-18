import { ZOOM, ZOOM_IN, ZOOM_OUT } from "./panel-consts";
import { IViewBtnProp } from "./interfaces";

export default class ViewToolBtn {
  public btn(props: IViewBtnProp): HTMLSpanElement {
    const btn: HTMLSpanElement = document.createElement("span");
    btn.className = "tool-btn";
    if (props.title) {
      btn.title = props.title;
    }
    const btnIcon: HTMLSpanElement = document.createElement("span");
    btnIcon.className = "svg-icon " + props.iconClass;
    btn.appendChild(btnIcon);

    switch (props.clickEvtType) {
      case ZOOM:
        btn.setAttribute("disabled", "true");
        break;
      case ZOOM_IN:
        btn.classList.add("narrow-tool-btn");
        btn.onclick = () => this.zoomIn();
        break;
      case ZOOM_OUT:
        btn.classList.add("narrow-tool-btn");
        btn.onclick = () => this.zoomOut();
        break;
    }
    return btn;
  }

  public zoomIn(): void {}
  public zoomOut(): void {}
}
