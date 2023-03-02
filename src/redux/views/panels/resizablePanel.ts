import "../../assets/style/panels/resizable-panel.scss";
import ViewWindow from "./viewWindow";
import { player } from "../slider/player";

export interface IRPanel {
  wrapper: HTMLDivElement;
  panel1: HTMLDivElement;
  panel2: HTMLDivElement;
}

export interface IResizeProps {
  p1?: number;
  p2?: number;
  verticle: boolean;
}

export default class ResizablePanel {
  static panelNum: number = 0;

  // rPanel: IRPanel;
  wrapper: HTMLDivElement;
  panel1: HTMLDivElement;
  panel2: HTMLDivElement;
  resizer: HTMLDivElement;
  verticle: boolean;
  children: (ResizablePanel | ViewWindow)[];
  constructor(resizable: boolean, props: IResizeProps) {
    // this.rPanel = this.createRPanels(resizable, props);
    this.verticle = false;
    this.children = [];
    this.createRPanels(resizable, props);
  }
  /**
   * create two panels and one resizer
   */
  public createRPanels(resizable: boolean, props: IResizeProps): void {
    this.wrapper = this.createWrapper(resizable);
    this.verticle = props.verticle;
    this.panel1 = this.createPanel(resizable, props.p1, 0, !resizable);
    this.panel2 = this.createPanel(resizable, props.p2, 1);
    if (this.verticle) {
      this.panel2.style.marginTop = resizable ? "-3px" : "0px";
    } else {
      this.panel2.style.marginLeft = resizable ? "-3px" : "0px";
    }

    this.resizer = this.createResizer(resizable);
    this.wrapper.appendChild(this.panel1);
    this.wrapper.appendChild(this.resizer);
    this.wrapper.appendChild(this.panel2);
    // return {
    //     wrapper: wrapper,
    //     panel1: panel1,
    //     panel2: panel2
    // };
  }

  public createWrapper(resizable: boolean): HTMLDivElement {
    const wrapper: HTMLDivElement = document.createElement("div");
    wrapper.className = resizable
      ? "panel-wrapper"
      : "panel-wrapper flex-panel-wrapper";
    return wrapper;
  }

  /**
   * create one panel
   * @param percent: 0 - 10, size of the panel
   */
  public createPanel(
    resizable: boolean,
    size: number,
    panelIdx: number,
    fixed: boolean = false
  ): HTMLDivElement {
    const panel: HTMLDivElement = document.createElement("div");
    panel.className = "panel";
    panel.id = "panel" + ResizablePanel.panelNum;
    ResizablePanel.panelNum++;

    if (resizable && this.verticle) {
      panel.classList.add("v-panel");
      panel.style.height = "calc(" + size * 10 + "% - 0.5px)";
    } else if (resizable && !this.verticle) {
      panel.classList.add("h-panel");
      panel.style.width = "calc(" + size * 10 + "% - 0.5px)";
    } else if (!resizable && this.verticle) {
      fixed
        ? panel.classList.add("v-fix-panel")
        : panel.classList.add("v-flex-panel");
    } else if (!resizable && !this.verticle) {
      fixed
        ? panel.classList.add("h-fix-panel")
        : panel.classList.add("h-flex-panel");
    }
    if (panelIdx > 0) {
      this.verticle
        ? panel.classList.add("second-v-panel")
        : panel.classList.add("second-h-panel");
    }
    return panel;
  }

  public addChild(child: ResizablePanel | ViewWindow): void {
    this.children.push(child);
    if (child instanceof ResizablePanel) {
      this.children.length === 1
        ? this.panel1.appendChild(child.wrapper)
        : this.panel2.appendChild(child.wrapper);
    } else if (child instanceof ViewWindow) {
      this.children.length === 1
        ? this.panel1.appendChild(child.view)
        : this.panel2.appendChild(child.view);
      child.parentPanel = this;
    }
  }

  public resizerDown(evt: any) {
    // if (!store.getState().isMouseMoving) {
    // Reducer.triger(action.UPDATE_MOUSE_MOVING, true);
    // store.dispatch(updateMouseMoving(true));
    const wrapperBBox = {
      width: this.resizer.parentElement.offsetWidth,
      height: this.resizer.parentElement.offsetHeight,
    };
    evt.preventDefault();
    let downPosi = {
      x: evt.pageX,
      y: evt.pageY,
    };
    const panelId1 = this.panel1.id;
    const panelId2 = this.panel2.id;
    const that = this;
    document.onpointercancel = () => {};
    const resizerMove = (moveEvt: PointerEvent) => {
      moveEvt.preventDefault();
      // document.onmousemove = (moveEvt) => {
      const movePosi = {
        x: moveEvt.pageX,
        y: moveEvt.pageY,
      };
      const dis = {
        xDiff: movePosi.x - downPosi.x,
        yDiff: movePosi.y - downPosi.y,
      };
      if (that.verticle) {
        const disPercent = (dis.yDiff / wrapperBBox.height) * 100;
        const height1 = parseFloat(
          document
            .getElementById(panelId1)
            .style.height.split("%")[0]
            .split("(")[1]
        );
        const height2 = parseFloat(
          document
            .getElementById(panelId2)
            .style.height.split("%")[0]
            .split("(")[1]
        );
        document.getElementById(panelId1).style.height =
          "calc(" + (height1 + disPercent) + "% - 0.5px)";
        document.getElementById(panelId2).style.height =
          "calc(" + (height2 - disPercent) + "% - 0.5px)";
      } else {
        const disPercent = (dis.xDiff / wrapperBBox.width) * 100;
        const width1 = parseFloat(
          document
            .getElementById(panelId1)
            .style.width.split("%")[0]
            .split("(")[1]
        );
        const width2 = parseFloat(
          document
            .getElementById(panelId2)
            .style.width.split("%")[0]
            .split("(")[1]
        );
        document.getElementById(panelId1).style.width =
          "calc(" + (width1 + disPercent) + "% - 0.5px)";
        document.getElementById(panelId2).style.width =
          "calc(" + (width2 - disPercent) + "% - 0.5px)";
      }
      downPosi = movePosi;
      //resize the svg in view-content
      // that.resizeViewContentSVG(panelId1, panelId2);
    };
    const resizerUp = (upEvt: PointerEvent) => {
      document.removeEventListener("pointermove", resizerMove);
      document.removeEventListener("pointerup", resizerUp);
      // Reducer.triger(action.UPDATE_MOUSE_MOVING, false);
      // store.dispatch(updateMouseMoving(false));

      //resize the svg in view-content
      that.resizeViewContentSVG(panelId1, panelId2);
    };
    document.addEventListener("pointermove", resizerMove);
    document.addEventListener("pointerup", resizerUp);
    // }
  }

  public createResizer(dragable: boolean): HTMLDivElement {
    const resizer: HTMLDivElement = document.createElement("div");
    // const resizeBar: HTMLDivElement = document.createElement('div');
    // resizeBar.className = 'resize-bar';
    // resizer.appendChild(resizeBar);

    if (dragable) {
      resizer.className = this.verticle ? "v-resizer" : "h-resizer";
      resizer.setAttribute("title", "drag to resize");
      resizer.onmousedown = (downEvt) => {
        this.resizerDown(downEvt);
        // Reducer.triger(action.UPDATE_MOUSE_MOVING, true);
        // const wrapperBBox = {
        //     width: resizer.parentElement.offsetWidth,
        //     height: resizer.parentElement.offsetHeight
        // }
        // downEvt.preventDefault();
        // let downPosi = {
        //     x: downEvt.pageX,
        //     y: downEvt.pageY
        // }
        // document.onmousemove = (moveEvt) => {
        //     const movePosi = {
        //         x: moveEvt.pageX,
        //         y: moveEvt.pageY
        //     }
        //     const dis = {
        //         xDiff: movePosi.x - downPosi.x,
        //         yDiff: movePosi.y - downPosi.y
        //     }
        //     if (verticle) {
        //         const disPercent = dis.yDiff / wrapperBBox.height * 100;
        //         const height1 = parseFloat(document.getElementById(panelId1).style.height.split('%')[0].split('(')[1]);
        //         const height2 = parseFloat(document.getElementById(panelId2).style.height.split('%')[0].split('(')[1]);
        //         document.getElementById(panelId1).style.height = 'calc(' + (height1 + disPercent) + '% - 0.5px)';
        //         document.getElementById(panelId2).style.height = 'calc(' + (height2 - disPercent) + '% - 0.5px)';
        //     } else {
        //         const disPercent = dis.xDiff / wrapperBBox.width * 100;
        //         const width1 = parseFloat(document.getElementById(panelId1).style.width.split('%')[0].split('(')[1]);
        //         const width2 = parseFloat(document.getElementById(panelId2).style.width.split('%')[0].split('(')[1]);
        //         document.getElementById(panelId1).style.width = 'calc(' + (width1 + disPercent) + '% - 0.5px)';
        //         document.getElementById(panelId2).style.width = 'calc(' + (width2 - disPercent) + '% - 0.5px)';
        //     }
        //     downPosi = movePosi;

        //     //resize the svg in view-content
        //     this.resizeViewContentSVG(panelId1, panelId2);
        // }
        // document.onmouseup = (upEvt) => {
        //     document.onmouseup = null;
        //     document.onmousemove = null;
        //     Reducer.triger(action.UPDATE_MOUSE_MOVING, false);

        //     //resize the svg in view-content
        //     this.resizeViewContentSVG(panelId1, panelId2);
        // }
      };
    } else {
      resizer.className = this.verticle
        ? "non-dragable-v-resizerv-resizer"
        : "non-dragable-h-resizer";
    }

    return resizer;
  }

  public resizeViewContentSVG(panelId1: string, panelId2: string) {
    // [panelId1, panelId2].forEach((pId) => {
    //     Tool.resizeSvgContainer(pId);
    // })
    // resizePlayerContainer();
    player.resizePlayer(player.widget.clientWidth - 198);
  }
}
