import { IAction } from "./interfaces";

export const TOGGLE_VOICE: string = "TOGGLE_VOICE";
export const toggleVoice = (v: boolean) => {
  return {
    type: TOGGLE_VOICE,
    payload: {
      flag: v,
    },
  } as IAction;
};
