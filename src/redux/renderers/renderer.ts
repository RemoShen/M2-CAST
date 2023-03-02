import { appRenderer } from "./appRenderer";
import { canisRenderer } from "./canisRenderer";
import { chartRenderer } from "./chartRenderer";
import { voiceRenderer } from "./voiceRenderer";
import { videoRenderer } from "./videoRenderer";
import { vlRenderer } from "./vlRenderer";

const combineRenderers = (renderers: { [key: string]: any }) => {
  let result: any = {};
  Object.keys(renderers).forEach((key: string) => {
    result = { ...result, ...renderers[key] };
  });
  return result;
};

export const renderer = combineRenderers({
  app: appRenderer,
  // voice: voiceRenderer, //语音交互的更新
  chart: chartRenderer,
  canis: canisRenderer,
  vl: vlRenderer,
  video: videoRenderer,
});
