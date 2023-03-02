import { Ava } from "../../app/core/Ava";
import { nav } from "../views/nav/nav";
import { store } from "../store";

export const voiceRenderer = {
  toggleVoice: () => {
    store.getState().voiceAwake
      ? voiceRenderer.voiceListening()
      : voiceRenderer.resetVoice();
  },

  voiceListening: () => {
    nav.voiceInput.setInput("I am listening...");
    Ava.listen();
  },

  resetVoice: () => {
    nav.voiceInput.resetInput();
    Ava.resetEar();
  },
};
