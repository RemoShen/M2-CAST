import Artyom from "./artyom";
import { VC_COLOR, VC_POSITION_X, VC_POSITION_Y } from "../consts";
import Util from "./util";
import wordsToNumbers from "words-to-numbers";
import { tip } from "../../redux/views/widgets/tip";
import { NUMERIC_SLIDER } from "../../redux/views/slider/slider-consts";
import { store } from "../../redux/store";
import {
  updateDuration,
  updateEffectAndDuration,
  updateEffectType,
} from "../../redux/action/canisAction";
import Slider from "../../redux/views/slider/slider";
import { markSelection } from "../../util/markSelection";
import {
  SPEECH_CMDS,
  POSITION_RANGE,
  effectTypes,
  MINMAX_SHAPE_RANGE,
  COLOR_RANGE,
  idxMapping,
  GENERAL_SELECT_RANGE,
  EFFECT_TIME_RANGE,
  MS_TIME_RANGE,
  S_TIME_RANGE,
  GENERAL_RANGE,
} from "../../mil/recognizer/recognizer-consts";
import KfGroup from "../../redux/views/vl/kfGroup";

class SpeechTalk {
  talker: any;
  init() {
    this.talker = new SpeechSynthesisUtterance();
    this.talker.text = "Hello, I'm Ava.";
    this.talker.lang = "en-US";
    this.talker.rate = 1.0; //0.1 - 10
    this.talker.onend = (e: any) => {
      console.log("Ava finished talking in " + e.elapsedTime + " seconds.");
    };
  }
  speak(txt: string) {
    this.talker.text = txt;
    speechSynthesis.speak(this.talker);
  }
}

class SpeechRecog {
  static recognizer: Artyom = new Artyom();
  mouth: SpeechTalk;

  createAwaker(mouth: SpeechTalk) {
    //a continuous recognizer
    // SpeechRecog.recognizer.fatality();
    // SpeechRecog.recognizer = new Artyom();
    // console.log('init awaker', mouth, SpeechRecog.recognizer);
    // this.mouth = mouth;
    // setTimeout(() => {
    //     SpeechRecog.recognizer.initialize({
    //         lang: "en-US",// More languages are documented in the library
    //         continuous: true,//if you have https connection, you can activate continuous mode
    //         debug: true,//Show everything in the console
    //         listen: true // Start listening when this function is triggered
    //     });
    //     const that = this;
    //     SpeechRecog.recognizer.addCommands({
    //         indexes: ['ava', 'eva'],
    //         action: (i: number) => {
    //             SpeechRecog.recognizer.fatality();
    //             SpeechRecog.recognizer = new Artyom();
    //             that.mouth.speak("Yes?");
    //             setTimeout(() => {
    //                 const oneTimeComd: SpeechRecog = new SpeechRecog();
    //                 oneTimeComd.createOneTimeCmd(this.mouth);
    //                 Reducer.triger(VOICE_AWAKE, true);
    //             }, 400);
    //         }
    //     });
    // }, 250);
  }

  createOneTimeCmd(mouth: SpeechTalk) {
    SpeechRecog.recognizer.fatality();
    SpeechRecog.recognizer = new Artyom();
    // console.log('init ear', mouth);
    this.mouth = mouth;
    // SpeechRecog.recognizer = new Artyom();
    setTimeout(() => {
      SpeechRecog.recognizer
        .initialize({
          lang: "en-US", // More languages are documented in the library
          continuous: true, //if you have https connection, you can activate continuous mode
          debug: true, //Show everything in the console
          listen: true, // Start listening when this function is triggered
        })
        .then(() => {
          console.log("ready to hear");
        });
      const that = this;
      SpeechRecog.recognizer.addCommands({
        smart: true, // We need to say that this command is smart !
        // indexes: ['select *', '*'],
        indexes: [...SPEECH_CMDS, "*"],
        action: (i: number, wildcard: string) => {
          console.log(
            "recognized: ",
            i,
            wildcard,
            SPEECH_CMDS[i],
            POSITION_RANGE,
            effectTypes
          );
          if (i >= MINMAX_SHAPE_RANGE[0] && i <= MINMAX_SHAPE_RANGE[1]) {
          } else if (i >= COLOR_RANGE[0] && i <= COLOR_RANGE[1]) {
            markSelection.selectByVisualChannel(VC_COLOR, wildcard);
          } else if (i >= POSITION_RANGE[0] && i <= POSITION_RANGE[1]) {
            const idx: number | string =
              wildcard === "last" ? wildcard : idxMapping.get(wildcard);
            if (i === POSITION_RANGE[0]) {
              //row
              markSelection.selectByVisualChannel(VC_POSITION_Y, idx);
            } else {
              //column
              markSelection.selectByVisualChannel(VC_POSITION_X, idx);
            }
          } else if (i === GENERAL_SELECT_RANGE[0]) {
            that.generalSelecting(wildcard);
          } else if (i >= EFFECT_TIME_RANGE[0] && i <= EFFECT_TIME_RANGE[1]) {
            const tmpBlocks: string[] = SPEECH_CMDS[i].split(" ");
            const splitIdx: number = tmpBlocks.indexOf("for");
            const aniType: string = tmpBlocks.slice(0, splitIdx).join(" ");
            const oriTime: number = <number>wordsToNumbers(wildcard);
            //time in ms
            const time: number =
              tmpBlocks[splitIdx + 2] === "second" ||
              tmpBlocks[splitIdx + 2] === "seconds"
                ? oriTime * 1000
                : oriTime;

            if (
              typeof store.getState().highlightKf.currentHighlightKf !==
              "undefined"
            ) {
              console.log(
                "specify effect and time by speech: ",
                store.getState().highlightKf.currentHighlightKf,
                aniType,
                time
              );
              store.dispatch(
                updateEffectAndDuration(
                  [store.getState().highlightKf.currentHighlightKf.aniId],
                  aniType,
                  time
                )
              );
            } else {
              //update all
              const allAniIds: string[] = [...KfGroup.allAniGroups.keys()];
              store.dispatch(updateEffectAndDuration(allAniIds, aniType, time));
            }
          } else if (i >= MS_TIME_RANGE[0] && i <= MS_TIME_RANGE[1]) {
            that.specifyTiming(parseInt(wildcard));
          } else if (i >= S_TIME_RANGE[0] && i <= S_TIME_RANGE[1]) {
            const time: number = parseInt(`${wordsToNumbers(wildcard)}`) * 1000;
            that.specifyTiming(time);
          } else if (i === GENERAL_RANGE[0] && effectTypes.includes(wildcard)) {
            if (
              typeof store.getState().highlightKf.currentHighlightKf !==
              "undefined"
            ) {
              // Reducer.triger(UPDATE_EFFECT_TYPE, { aniIds: [store.getState().highlightKf.currentHighlightKf.aniId], effectPropValue: wildcard })
              store.dispatch(
                updateEffectType(
                  [store.getState().highlightKf.currentHighlightKf.aniId],
                  wildcard
                )
              );
            }
          } else {
            tip.show("No matching commands.");
          }
        },
      });
    }, 250);
  }

  reset() {
    SpeechRecog.recognizer.fatality();
    SpeechRecog.recognizer = new Artyom();
  }

  generalSelecting(attrVal: string) {
    if (Util.isValidDataVal(attrVal)) {
      markSelection.selectByData(attrVal, []);
    }
  }

  specifyTiming(time: number, aniId?: string) {
    if (typeof Slider.activeSlider !== "undefined") {
      Slider.activeSlider.options.sliderType === NUMERIC_SLIDER &&
        Slider.activeSlider.moveSlider(time);
    } else {
      if (typeof aniId !== "undefined") {
        // Reducer.triger(UPDATE_DURATION, { aniId: aniId, duration: time });
        store.dispatch(updateDuration(aniId, time));
      }
    }
  }
}

export const Ava = {
  ear: new SpeechRecog(),
  mouth: new SpeechTalk(),
  init: () => {
    Ava.mouth.init();
    Ava.ear.createAwaker(Ava.mouth);
  },
  listen: () => {
    console.log("i am listening");
    Ava.ear.createOneTimeCmd(Ava.mouth);
  },
  resetEar: () => {
    console.log("i am reset");
    Ava.ear.reset();
  },
};
