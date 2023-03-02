import "../../assets/style/nav.scss";
import LogoImg from "../../assets/img/logo.png";
import FloatingWindow from "../panels/floatingWindow";
import { Loading } from "../widgets/loading";
import { player } from "../slider/player";
import { INavItemProps } from "./nav-consts";
import { store } from "../../store";
import { VIDEO_VIEW_CONTENT_ID } from "../panels/panel-consts";
import { NON_SKETCH_CLS } from "../../global-consts";
import { toggleLoading } from "../../renderers/renderer-tools";
import { jsTool } from "../../../util/jsTool";
import { updateManualSelect, updateSlectMode } from "../../action/chartAction";


export default class Nav {
  navContainer: HTMLDivElement;
  voiceInput: NavInput;

  public createNav() {
    this.navContainer = document.createElement("div");
    this.navContainer.className = `nav ${NON_SKETCH_CLS}`;

    // create logo contianer
    const logoContainer: HTMLSpanElement = document.createElement("span");
    logoContainer.className = "logo-container";
    const logo: HTMLImageElement = new Image();
    logo.src = LogoImg;
    logoContainer.appendChild(logo);
    const logoText: HTMLSpanElement = document.createElement("span");
    logoText.textContent = "M2-CAST";
    logoText.className = "title-text";
    logoContainer.appendChild(logoText);
    // this.navContainer.appendChild(logoContainer);

    // create buttons
    const openBtn: HTMLSpanElement = new NavBtn().createNavBtn({
      id: 'open',
      classNameStr: 'open',
      title: 'open project',
      evtType: NavBtn.OPEN_PROJECT
    });
    const saveBtn: HTMLSpanElement = new NavBtn().createNavBtn({
      id: 'save',
      classNameStr: 'save',
      title: 'save project',
      evtType: NavBtn.SAVE_PROJECT
    });
    const exportBtn: HTMLSpanElement = new NavBtn().createNavBtn({
      id: 'export',
      classNameStr: 'export',
      title: 'export',
      evtType: NavBtn.EXPORT
    });
    // this.voiceInput = new NavInput();
    this.createSubNav([
      logoContainer,
    ]);

    const revertBtn: HTMLSpanElement = new NavBtn().createNavBtn({
      id: 'revert',
      classNameStr: 'revert',
      title: 'revert',
      evtType: NavBtn.REVERT
    });
    // const redoBtn: HTMLSpanElement = new NavBtn().createNavBtn({
    //   id: 'redo',
    //   classNameStr: 'redo',
    //   title: 'redo',
    //   evtType: NavBtn.REDO
    // });
    const editBtn: HTMLSpanElement = new NavBtn().createNavBtn({
      id: 'edit',
      classNameStr: 'edit',
      title: 'edit',
      evtType: NavBtn.EDIT
    });
    const resetBtn: HTMLSpanElement = new NavBtn().createNavBtn({
      id: 'reset',
      classNameStr: 'reset',
      title: 'reset',
      evtType: NavBtn.RESET
    });
    this.createSubNav([
      openBtn,
      saveBtn,
      exportBtn,
      this.createSeparator(),
      revertBtn,
      editBtn,
      this.createSeparator(),
      resetBtn,
    ])

    // const voiceInput: HTMLDivElement = new NavInput().createInput({
    //     classNameStr: 'voice',
    //     evtType: NavBtn.RESET
    // })
    // this.createSubNav([
    //     voiceInput
    // ])
  }

  public createSubNav(items: any[]) {
    const subNav: HTMLDivElement = document.createElement("div");
    subNav.className = "sub-nav";
    items.forEach((item) => {
      subNav.appendChild(item);
    });
    this.navContainer.appendChild(subNav);
  }

  public createSeparator() {
    const sep: HTMLSpanElement = document.createElement("span");
    sep.className = "separator";
    return sep;
  }
}

export const nav = new Nav();

class NavBtn {
  // static vars
  // static CREATE_NEW: string = 'createNew';
  static OPEN_PROJECT: string = "openProject";
  static SAVE_PROJECT: string = "saveProject";
  static LOAD_EXAMPLES: string = "loadExamples";
  static EXPORT: string = "export";
  static REVERT: string = "revert";
  // static REDO: string = "redo";
  static RESET: string = 'reset';
  static EDIT: string = 'edit';
  /**
   * create buttons whose event listeners are not file related
   * @param props
   */
  createNavBtn(props: INavItemProps): HTMLSpanElement {
    const btn: HTMLSpanElement = document.createElement("span");
    btn.className = "nav-btn";
    btn.setAttribute("title", jsTool.firstLetterUppercase(props.title));
    switch (props.evtType) {
      case NavBtn.OPEN_PROJECT:
        btn.onclick = () => this.openProject();
        break;
      case NavBtn.SAVE_PROJECT:
        btn.onclick = () => this.saveProject();
        break;
      case NavBtn.EXPORT:
        btn.onclick = () => this.exportVideo();
        break;
      case NavBtn.REVERT:
        btn.onclick = () => this.revert();
        break;
      case NavBtn.EDIT:
        btn.onclick = () => this.edit();
        break;
      case NavBtn.RESET:
        btn.onclick = () => location.reload();
        break;
    }
    const icon: HTMLElement = document.createElement("span");
    icon.className = `${props.classNameStr}-icon`;
    btn.appendChild(icon);
    return btn;
  }

  createSubMenu(evtType: string, parentBtn: HTMLSpanElement) {
    switch (evtType) {
      case NavBtn.EXPORT:
        parentBtn.classList.add("active-btn");
        const menuContainer: HTMLDivElement = document.createElement("div");
        const parentBBox: DOMRect = parentBtn.getBoundingClientRect();
        menuContainer.className = "sub-menu-container";
        menuContainer.style.top = `${parentBBox.bottom}px`;
        menuContainer.style.left = `${parentBBox.left}px`;
        const ul: HTMLUListElement = document.createElement("ul");
        ul.appendChild(
          this.createSubMenuItem("Export as Lottie", this.exportLottie)
        );
        ul.appendChild(
          this.createSubMenuItem("Export as mp4", this.exportVideo)
        );
        menuContainer.appendChild(ul);
        document.body.appendChild(menuContainer);

        menuContainer.onmouseleave = (leaveEvt) => {
          menuContainer.remove();
          parentBtn.classList.remove("active-btn");
        };
        break;
    }
  }

  createSubMenuItem(content: string, func: any): HTMLLIElement {
    const item: HTMLLIElement = document.createElement("li");
    item.innerHTML = content;
    item.onclick = () => {
      func();
    };
    return item;
  }

  /**
   * create buttons whose event listeners are file related
   * @param props
   */
  createNavFileBtn(props: INavItemProps) {
    const btn: HTMLSpanElement = document.createElement("span");
    btn.className = "nav-btn";
    btn.setAttribute("title", jsTool.firstLetterUppercase(props.title));
    btn.onclick = () => {
      document.getElementById(props.inputId).click();
    };

    const input: HTMLInputElement = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.id = props.inputId;
    input.style.display = "none";
    btn.appendChild(input);

    const icon: HTMLSpanElement = document.createElement("span");
    icon.className = props.classNameStr + "-icon";
    btn.appendChild(icon);

    return btn;
  }

  // btn listeners
  public openProject() {
    const floatingWindow: FloatingWindow = new FloatingWindow();
    floatingWindow.createFloatingWindow(FloatingWindow.TYPE_EXAMPLE);
    document
      .getElementById("appWrapper")
      .appendChild(floatingWindow.floatingWindow);
      // if(store.getState().selectMode === 'manual'){
      //   store.dispatchSystem(updateSlectMode('intelligent'));
      //   document.getElementsByClassName('confirm-btn-container')[0].setAttribute('style', 'display:none')
      //   document.getElementsByClassName('confirm-btn-container')[0].classList.add('pl')
      //   document.getElementsByClassName('preview-btn-container')[0].classList.remove('dis')
      //   document.getElementsByClassName('multiselect-btn-container')[0].classList.remove('dis')
      //   document.getElementsByClassName('revert-icon')[0].classList.remove('dis');
      // }
  }

  public saveProject() {
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

  public exportLottie() {
    const file = new Blob(
      [JSON.stringify(store.getState().lottieSpec, null, 2)],
      { type: "application/json" }
    );
    const fileName = "animatedChart.json";
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

  public exportVideo() {
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

  revertLock: boolean = false;
  public revert(): void {
    if (this.revertLock) {
      return;
    }
    if (store.getState().selectMarksStep.length == 0) {
      return;
    }
    // let selectMarkStep = store.getState().selectMarksStep;
    // let newLen = selectMarkStep.length - 1;
    // while(selectMarkStep[newLen].length == 0 && newLen > 0){
    //   newLen--;
    // }
    this.revertLock = true;
    // localStorage.clear();
    toggleLoading({
      isLoading: true,
      targetEle: document.getElementById(VIDEO_VIEW_CONTENT_ID),
      content: Loading.LOADING,
    });
    // Reducer.triger(action.UPDATE_LOADING_STATUS, { il: true, srcDom: document.getElementById(VIDEO_VIEW_CONTENT_ID), content: Loading.LOADING })
    setTimeout(() => {
      store.undoState();
      Loading.removeLoading();
      // store.getState().selectMarksStep.length = newLen;
      this.revertLock = false;
    }, 1);
  }

  // public redo(): void {
  //   // Reducer.triger(action.UPDATE_LOADING_STATUS, { il: true, srcDom: document.getElementById(VIDEO_VIEW_CONTENT_ID), content: Loading.LOADING })
  //   setTimeout(() => {
  //     store.redoState();
  //   }, 1);

  public edit(): void {
    if (store.getState().selectMarksStep.length == 0) {
      return;
    }
    //diaplay confirm btn
    document.getElementsByClassName('confirm-btn-container')[0].setAttribute('style', 'display:inline')
    //disabled other btns
    document.getElementsByClassName('preview-btn-container')[0].classList.add('dis')
    document.getElementsByClassName('multiselect-btn-container')[0].classList.add('dis')
    document.getElementsByClassName('revert-icon')[0].classList.add('dis');
    

    // Reducer.triger(action.UPDATE_LOADING_STATUS, { il: true, srcDom: document.getElementById(VIDEO_VIEW_CONTENT_ID), content: Loading.LOADING })
    let previousStep: string[][] = store.getState().selectMarksStep;
    store.undoState();
    store.dispatchSystem(updateSlectMode('manual'));
    let previousStepIndex = store.getState().selectMarksStep.length;
    // let previousStepIndex = previousStep.length - 1;
    // while(previousStep[previousStepIndex].length == 0 && previousStepIndex > 0){
    //   previousStepIndex--;
    // }
    // store.dispatchSystem(updateManualSelect(new Set(previousStep[previousStepIndex]), false));
    
    // precioueStep.forEach((mark: string) => {
    //   addHighlight(document.getElementById(mark));
    // })

  }
}

export const RECOG_VOICE: string = "recogVoice";
class NavInput {
  itemProps: INavItemProps;
  createInput(props: INavItemProps): HTMLDivElement {
    this.itemProps = props;
    const wrapper: HTMLDivElement = document.createElement("div");
    wrapper.className = "nav-input-wrapper";

    const iconWrapper: HTMLSpanElement = document.createElement("span");
    iconWrapper.className = "nav-icon";

    const icon: HTMLElement = document.createElement("span");
    icon.className = `${this.itemProps.classNameStr}-icon`;
    iconWrapper.appendChild(icon);
    wrapper.appendChild(iconWrapper);

    const input: HTMLInputElement = document.createElement("input");
    wrapper.appendChild(input);
    input.id = this.itemProps.id;
    input.className = "default-input";
    input.setAttribute("value", this.itemProps.title);
    input.setAttribute("disabled", "disabled");
    input.onfocus = () => {
      input.value = "";
      input.classList.remove("default-input");
      input.classList.add("user-input");
    };
    input.onblur = () => {
      input.value = this.itemProps.title;
      input.classList.add("default-input");
      input.classList.remove("user-input");
    };

    return wrapper;
  }
  setInput(val: string) {
    document.getElementById(RECOG_VOICE).setAttribute("value", val);
  }
  resetInput() {
    document
      .getElementById(RECOG_VOICE)
      .setAttribute("value", this.itemProps.title);
  }
}
