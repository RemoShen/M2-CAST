import "../../assets/style/slider/player.scss";
import Slider from "./slider";
import { VIDEO_VIEW_CONTENT_ID } from "../panels/panel-consts";
import { NON_SKETCH_CLS } from "../../global-consts";
import { store } from "../../store";
import { IPlayerProps } from "./interfaces";
import { NUMERIC_SLIDER, SLIDER_MIN_WIDTH } from "./slider-consts";
import { toggleVideoMode, updatePreviewing } from "../../action/videoAction";

export class Player {
  static PLAY_BTN_ID: string = "playBtn";
  static TOTAL_TIME_SPAN_ID: string = "totalTime";
  static CURRENT_TIME_SPAN_ID: string = "currentTime";

  //lottieJSON:any
  widget: HTMLDivElement;
  playing: boolean;
  shown: boolean;
  frameRate: number;
  _currentTime: number;
  _totalTime: number;
  animationInterval: any;

  //component
  playBtnWrapper: HTMLDivElement;
  slider: Slider;
  timeWrapper: HTMLDivElement;

  constructor() {
    this._currentTime = 0;
    this._totalTime = 0;
    this.frameRate = 10;
    this.playing = false;
    this.createPlayer();
    this.hidePlayer();
  }

  set currentTime(time: number) {
    this._currentTime = time;
    this.renderCurrentTime();
  }
  get currentTime(): number {
    return this._currentTime;
  }
  set totalTime(time: number) {
    this._totalTime = time;
    this.renderTotalTime();
  }
  get totalTime(): number {
    return this._totalTime;
  }

  public createPlayer(): void {
    this.widget = document.createElement("div");
    // this.widget.style.minWidth = (0.98 * window.innerWidth / 2).toString() + 'px';
    this.playBtnWrapper = document.createElement("div");
    this.playBtnWrapper.id = "playBtnWrapper";
    this.playBtnWrapper.className = `play-btn-wrapper ${NON_SKETCH_CLS}`;
    this.playBtnWrapper.title = "Play";
    const playCheck: HTMLInputElement = document.createElement("input");
    playCheck.type = "checkbox";
    playCheck.value = "None";
    playCheck.id = Player.PLAY_BTN_ID;
    playCheck.name = "check";
    playCheck.checked = true;
    this.playBtnWrapper.appendChild(playCheck);
    const playLabel: HTMLLabelElement = document.createElement("label");
    playLabel.setAttribute("for", "playBtn");
    playLabel.setAttribute("tabindex", "1");
    this.playBtnWrapper.appendChild(playLabel);
    playCheck.onclick = (e) => {
      if (this.playing) {
        this.pauseAnimation();
      } else {
        this.playAnimation();
      }
    };
    this.widget.appendChild(this.playBtnWrapper);

    this.slider = new Slider({
      sliderType: NUMERIC_SLIDER,
      domain: [0, 1],
      default: 0,
      hideSlider: true,
      sliderWidth: SLIDER_MIN_WIDTH,
      trackWidth: 2,
      showTicks: false,
      showCurrentVal: false,
    });
    this.slider.createWidget();
    this.slider.callbackFunc = this.renderFrame;
    this.widget.appendChild(this.slider.sliderContainer);

    this.timeWrapper = document.createElement("div");
    this.timeWrapper.className = "time-span-wrapper";
    const currentTimeSpan: HTMLSpanElement = document.createElement("span");
    currentTimeSpan.id = Player.CURRENT_TIME_SPAN_ID;
    currentTimeSpan.innerText = this.formatTime(this.currentTime);
    const splitSpan: HTMLSpanElement = document.createElement("span");
    splitSpan.innerText = "/";
    const totalTimeSpan: HTMLSpanElement = document.createElement("span");
    totalTimeSpan.id = Player.TOTAL_TIME_SPAN_ID;
    totalTimeSpan.innerText = this.formatTime(this.totalTime);
    this.timeWrapper.appendChild(currentTimeSpan);
    this.timeWrapper.appendChild(splitSpan);
    this.timeWrapper.appendChild(totalTimeSpan);
    this.widget.appendChild(this.timeWrapper);
  }

  public showPlayer() {
    this.shown = true;
    const widgetWidth: number = this.widget.getBoundingClientRect().width;
    this.slider.containerWidth = widgetWidth - 270;
    this.playBtnWrapper.style.opacity = "1";
    this.slider.fadeInSlider();
    this.timeWrapper.style.opacity = "1";
  }

  public hidePlayer() {
    this.shown = false;
    this.playBtnWrapper.style.opacity = "0";
    this.slider.fadeOutSlider();
    this.timeWrapper.style.opacity = "0";
  }

  /**
   * 00:00.00
   * @param time : time in ms
   */
  public formatTime(time: number): string {
    const minNum: number = Math.floor(time / 60000);
    const secNum: number = Math.floor((time - minNum * 60000) / 1000);
    const msNum: number = Math.floor(
      (time - minNum * 60000 - secNum * 1000) / 10
    );
    const minStr: string =
      minNum < 10 ? "0" + minNum.toString() : minNum.toString();
    const secStr: string =
      secNum < 10 ? "0" + secNum.toString() : secNum.toString();
    const msStr: string =
      msNum < 10 ? "0" + msNum.toString() : msNum.toString();
    return minStr + ":" + secStr + "." + msStr;
  }

  public renderTotalTime() {
    document.getElementById(Player.TOTAL_TIME_SPAN_ID).innerHTML =
      this.formatTime(this.totalTime);
  }

  public renderCurrentTime() {
    document.getElementById(Player.CURRENT_TIME_SPAN_ID).innerHTML =
      this.formatTime(this.currentTime);
  }

  public resizePlayer(cw: number): void {
    this.slider.containerWidth = cw;
  }

  public updateTimeDomain() {
    this.slider.updateDomain([0, this.totalTime]);
  }

  public resetPlayer(props: IPlayerProps) {
    this.frameRate = props.frameRate;
    this.currentTime = props.currentTime;
    this.totalTime = props.totalTime;
    this.updateTimeDomain();
  }

  /**
   *
   * @param time : ms
   */
  public renderFrame(time: number, play: boolean = false) {
    player.currentTime = time;
    if (typeof store.getState().lottieAni !== "undefined") {
      play
        ? store
            .getState()
            .lottieAni.goToAndPlay(
              Math.ceil(time / (1000 / player.frameRate)),
              true
            )
        : store
            .getState()
            .lottieAni.goToAndStop(
              Math.ceil(time / (1000 / player.frameRate)),
              true
            );
    }
  }

  /**
   *
   * @param startTime : ms
   * @param endTime :ms
   */
  public playRange(startTime: number, endTime: number) {
    const duration: number = endTime - startTime;
    // player.currentTime = startTime;
    // if (typeof state.lottieAni !== 'undefined') {
    //     state.lottieAni.goToAndPlay(Math.ceil(startTime / (1000 / player.frameRate)), true);
    //     setTimeout(() => {
    //         this.pauseAnimation();
    //     }, duration);
    // }
    // this.renderFrame(startTime);
    this.currentTime = startTime;
    this.playAnimation([startTime, endTime]);
    console.log("playing from: ", startTime, endTime, duration);
    setTimeout(() => {
      this.pauseAnimation();
      // store.getState().isPreviewing && store.dispatchSystem(updatePreviewing(store.getState().previewPath, { charts: [], animations: [] }, false, Suggest.allPaths.length !== 1));
    }, duration);
  }

  public isPlayMode(): boolean {
    const videolayer: HTMLElement = document.getElementById(
      VIDEO_VIEW_CONTENT_ID
    );
    if (videolayer.classList.contains("ele-under")) {
      return false;
    }
    return true;
  }

  public togglePlayMode() {
    const chartLayer: HTMLElement = document.getElementById("chartContent");
    chartLayer &&
      (store.getState().showVideo
        ? chartLayer.classList.add("ele-under")
        : chartLayer.classList.remove("ele-under"));
    const videolayer: HTMLElement = document.getElementById(
      VIDEO_VIEW_CONTENT_ID
    );
    videolayer &&
      (store.getState().showVideo
        ? videolayer.classList.remove("ele-under")
        : videolayer.classList.add("ele-under"));
    if (store.getState().showVideo) {
      this.showPlayer();
      this.playAnimation();
    } else {
      this.pauseAnimation();
      this.hidePlayer();
    }
  }

  public playAnimation(timeRange: [number, number] = [0, this.totalTime]) {
    console.log("time_total", this.totalTime, timeRange);
    (<HTMLInputElement>document.getElementById(Player.PLAY_BTN_ID)).checked =
      false;
    //check current mode
    // if (!this.isPlayMode) {
    //     this.togglePlayMode();
    // }
    // Reducer.triger(action.UPDATE_ISPLAYING, true);
    this.playing = true;
    if (this.currentTime === timeRange[1]) {
      this.currentTime = timeRange[0];
      //lottile animations
      if (store.getState().lottieAni) {
        store.getState().lottieAni.stop();
      }
    } else {
      this.currentTime =
        Math.floor(this.currentTime / (1000 / this.frameRate)) *
        (1000 / this.frameRate);
      console.log("currenttime", this.currentTime);
    }
    this.playing = true;
    if (store.getState().lottieAni) {
      console.log("lottieani", store.getState().lottieAni);
      store.getState().lottieAni.play();
    }
    if (document.getElementById("playBtnWrapper")) {
      document.getElementById("playBtnWrapper").title = "Stop";
    }
    this.animationInterval = setInterval(() => {
      this.slider.moveSlider(this.currentTime);
      const nextTimePoint: number = this.currentTime + 1000 / this.frameRate;
      if (nextTimePoint > this.totalTime) {
        //播放逻辑
        this.pauseAnimation();
        store.getState().isPreviewing &&
          store.dispatchSystem(
            updatePreviewing(store.getState().previewPath, null, false, true)
          );
      } else {
        this.currentTime = nextTimePoint;
      }
    }, 1000 / this.frameRate);
  }

  public pauseAnimation() {
    //暂停动画
    (<HTMLInputElement>document.getElementById(Player.PLAY_BTN_ID)).checked =
      true;
    this.playing = false;
    if (store.getState().lottieAni) {
      store.getState().lottieAni.pause();
    }
    if (document.getElementById("playBtnWrapper")) {
      document.getElementById("playBtnWrapper").title = "Play";
    }
    clearInterval(this.animationInterval);
    this.animationInterval = "undefined";
  }
}

export let player = new Player();
