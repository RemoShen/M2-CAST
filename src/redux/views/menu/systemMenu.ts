import {
  BTN_CONTENT_TYPE_ICON,
  BTN_CONTENT_TYPE_STR,
  BTN_TYPE_CUSTOM,
  BTN_TYPE_MAIN,
  EXPORT_ICON,
  OPEN_ICON,
  REDO_ICON,
  EDIT_ICON,
  RESET_ICON,
  REVERT_ICON,
  SAVE_ICON,
} from "../buttons/button-consts";
import FloatingWindow from "../panels/floatingWindow";
import { player } from "../slider/player";
import { Loading } from "../widgets/loading";
import { CircularMenu } from "./circleMenu";
import {
  CIRCLE_MENU_R,
  IMenuItem,
  LIGHT_THEME,
  SECOND_LEVEL_BTN_SIZE,
  SUBMENU_DISPLAY_FIXED,
} from "./menu-consts";
import { VIDEO_VIEW_CONTENT_ID } from "../panels/panel-consts";
import { ICoord } from "../../global-interfaces";
import { store } from "../../store";
import { toggleLoading } from "../../renderers/renderer-tools";
import { jsTool } from "../../../util/jsTool";

class SystemMenu {
  menu: CircularMenu;
  createSystemMenu(menuCenter: ICoord) {
    const sysMenuStruct: IMenuItem = {
      type: BTN_CONTENT_TYPE_STR,
      content: "",
      theme: LIGHT_THEME,
      buttonActionType: BTN_TYPE_MAIN,
      subMenuDisplay: SUBMENU_DISPLAY_FIXED,
      subMenu: [
        {
          type: BTN_CONTENT_TYPE_ICON,
          content: REVERT_ICON, //回退
          buttonActionType: BTN_TYPE_CUSTOM,
          strokeWidth: 1.5,
          percent: 0,
          evts: [{ type: "pointerdown", func: this.revert }],
        },
        {
          type: BTN_CONTENT_TYPE_ICON,
          content: OPEN_ICON, //打开
          buttonActionType: BTN_TYPE_CUSTOM,
          strokeWidth: 1.5,
          percent: 0.125,
          evts: [{ type: "pointerdown", func: this.openProject }],
        },
        {
          type: BTN_CONTENT_TYPE_ICON,
          content: SAVE_ICON, 
          buttonActionType: BTN_TYPE_CUSTOM,
          strokeWidth: 1.5,
          percent: 0.25,
          evts: [{ type: "pointerdown", func: this.saveProject }],
        },
        {
          type: BTN_CONTENT_TYPE_ICON,
          content: EXPORT_ICON, 
          buttonActionType: BTN_TYPE_CUSTOM,
          strokeWidth: 1.5,
          percent: 0.375,
          evts: [{ type: "pointerdown", func: this.exportVideo }],
        },
        // {
        //   type: BTN_CONTENT_TYPE_ICON,
        //   content: REDO_ICON,
        //   buttonActionType: BTN_TYPE_CUSTOM,
        //   strokeWidth: 1.5,
        //   percent: 0.5,
        //   evts: [{ type: "pointerdown", func: this.redo}],
        // },
        {
          type: BTN_CONTENT_TYPE_ICON,
          content: EDIT_ICON,
          buttonActionType: BTN_TYPE_CUSTOM,
          strokeWidth: 1.5,
          percent: 0.5,
          evts: [{ type: "pointerdown", func: this.edit}],
        },
        {
          type: BTN_CONTENT_TYPE_ICON,
          content: RESET_ICON, 
          buttonActionType: BTN_TYPE_CUSTOM,
          strokeWidth: 1.5,
          percent: 0.75,
          evts: [{ type: "pointerdown", func: this.reset }],
        },
      ],
    };
    this.menu = new CircularMenu(
      {
        menuCenter: menuCenter,
        menuStruct: sysMenuStruct,
        showSubMenu: true,
        floating: true,
      },
      true
    );
    document.body.appendChild(this.menu.options.targetSVG);
  }
  destroySysMenu() {
    if (typeof this.menu !== "undefined") {
      this.menu.selectedItem = this.menu.highlightItem;
      this.menu.foldSubMenu();

      setTimeout(() => {
        this.menu.reset();
        if (document.body.contains(this.menu.options.targetSVG)) {
          document.body.removeChild(this.menu.options.targetSVG);
        }
      }, 300);
    }
  }
  judgeSystemMenu(panCenter: ICoord) {
    if (typeof this.menu !== "undefined") {
      const subMenuAngles: number[] = [
        this.menu.subMenuAngles[this.menu.subMenuAngles.length - 1] -
          Math.PI * 2,
        ...this.menu.subMenuAngles,
        this.menu.subMenuAngles[0] + Math.PI * 2,
      ];
      const coordInMenu: ICoord = jsTool.screenToSvgCoords(
        this.menu.options.targetSVG,
        panCenter.x,
        panCenter.y
      );
      const transCoordInMenu: ICoord = {
        x: coordInMenu.x - this.menu.options.menuCenter.x,
        y: coordInMenu.y - this.menu.options.menuCenter.y,
      };
      
      for (let i = 1, len = subMenuAngles.length; i < len - 1; i++) {
        const currentAngle: number = subMenuAngles[i];
        const preAngle: number = subMenuAngles[i - 1];
        const nextAngle: number = subMenuAngles[i + 1];
        if (
          jsTool.pointInSector(
            transCoordInMenu,
            currentAngle - (currentAngle - preAngle) / 2,
            currentAngle + (nextAngle - currentAngle) / 2,
            CIRCLE_MENU_R + SECOND_LEVEL_BTN_SIZE
          )
        ) {
          this.menu.highlightItem = i - 1;
          break;
        }else if(jsTool.pointOutSector(transCoordInMenu, CIRCLE_MENU_R + SECOND_LEVEL_BTN_SIZE)){
          this.menu.highlightItem = -1;
          break;
        }
      }
    }
  }

  openProject() {
    // store.dispatchSystem(initState());
    const floatingWindow: FloatingWindow = new FloatingWindow();
    floatingWindow.createFloatingWindow(FloatingWindow.TYPE_EXAMPLE);
    document
      .getElementById("appWrapper")
      .appendChild(floatingWindow.floatingWindow);
  }

  saveProject() {
    const outputObj = {
      spec: store.getState().spec,
    };

    const file = new Blob([JSON.stringify(outputObj, null, 2)], {
      type: "application/json",
    });
    const fileName = "cast_project.cpro";
    if (window.navigator.msSaveOrOpenBlob)
      // IE10+
      window.navigator.msSaveOrOpenBlob(file, fileName);
    else {
      
      // Others
      var a = document.createElement("a"),
        url = URL.createObjectURL(file);
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  }

  exportLottie() {
    const file = new Blob(
      [JSON.stringify(store.getState().lottieSpec, null, 2)],
      { type: "application/json" }
    );
    const fileName = "animatedChart.json";
    if (window.navigator.msSaveOrOpenBlob)
      window.navigator.msSaveOrOpenBlob(file, fileName);
    else {
      var a = document.createElement("a"),
        url = URL.createObjectURL(file);
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  }

  exportVideo() {
    const targetSVG: any = document
      .getElementById(VIDEO_VIEW_CONTENT_ID)
      .querySelector("svg");
    if (typeof targetSVG !== "undefined" && targetSVG) {
      // Reducer.triger(action.UPDATE_LOADING_STATUS, { il: true, srcDom: document.body, content: Loading.EXPORTING });
      toggleLoading({
        isLoading: true,
        targetEle: document.body,
        content: Loading.EXPORTING,
      });
      setTimeout(() => {
        const canvas: any = document.createElement("canvas");
        let cWidth: number = (canvas.width = parseFloat(
          targetSVG.getAttribute("width")
        ));
        let cHeight: number = (canvas.height = parseFloat(
          targetSVG.getAttribute("height")
        ));
        canvas.width = 1800;
        canvas.height = 1200;
        if (isNaN(cWidth)) {
          cWidth = 1800;
        }
        if (isNaN(cHeight)) {
          cHeight = 1200;
        }
        const context = canvas.getContext("2d");
        context.fillStyle = "#fff";
        context.fillRect(0, 0, cWidth, cHeight);

        const stream = canvas.captureStream();
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        const data: any[] = [];
        recorder.ondataavailable = function (event) {
          if (event.data && event.data.size) {
            data.push(event.data);
          }
        };

        recorder.onstop = () => {
          var url = URL.createObjectURL(new Blob(data, { type: "video/webm" }));
          var a = document.createElement("a");
          a.href = url;
          a.download = "animatedChart.mp4";
          document.body.appendChild(a);
          a.click();
          setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            // Reducer.triger(action.UPDATE_LOADING_STATUS, { il: false });
            toggleLoading({ isLoading: false });
          }, 0);
        };

        recorder.start();
        for (
          let i = 0,
            p = Promise.resolve(),
            len = store.getState().lottieAni.getDuration() * 1000;
          i < len;
          i += 60
        ) {
          p = p.then(
            () =>
              new Promise((resolve) =>
                setTimeout(function () {
                  store
                    .getState()
                    .lottieAni.goToAndStop(
                      Math.ceil(i / (1000 / player.frameRate)),
                      true
                    );
                  const img = new Image(),
                    serialized = new XMLSerializer().serializeToString(
                      targetSVG
                    ),
                    url = URL.createObjectURL(
                      new Blob([serialized], { type: "image/svg+xml" })
                    );
                  img.onload = function () {
                    context.drawImage(img, 0, 0);
                  };
                  img.src = url;
                  resolve();
                  if (i + 60 > len) {
                    recorder.stop();
                  }
                }, 60)
              )
          );
        }
      }, 1);
    }
  }

  revert(): void {
    // Reducer.triger(action.UPDATE_LOADING_STATUS, { il: true, srcDom: document.getElementById(VIDEO_VIEW_CONTENT_ID), content: Loading.LOADING })
    toggleLoading({
      isLoading: true,
      targetEle: document.getElementById(VIDEO_VIEW_CONTENT_ID),
      content: Loading.LOADING,
    });
    setTimeout(() => {
      store.undoState();
      Loading.removeLoading();
    }, 0);
  }

  redo(): void {
    toggleLoading({
      isLoading: true,
      targetEle: document.getElementById(VIDEO_VIEW_CONTENT_ID),
      content: Loading.LOADING,
    });
    // Reducer.triger(action.UPDATE_LOADING_STATUS, { il: true, srcDom: document.getElementById(VIDEO_VIEW_CONTENT_ID), content: Loading.LOADING })
    setTimeout(() => {
      store.redoState();
      Loading.removeLoading();
    }, 1);
  }

  reset(): void {
    location.reload();
  }
  edit(): void {
    
  } 
}
export const sysMenu = new SystemMenu();
