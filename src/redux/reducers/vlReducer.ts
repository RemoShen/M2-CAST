import Util from "../../app/core/util";
import KfGroup from "../views/vl/kfGroup";
import KfItem from "../views/vl/kfItem";
import PlusBtn from "../views/vl/plusBtn";
import { IAction } from "../action/interfaces";
import {
  UPDATE_ACTIVATE_PLUS_BTN,
  UPDATE_HIGHLIGHT_KF,
  UPDATE_KEYFRAME_TRACKS,
  UPDATE_KFGROUP_SIZE,
  UPDATE_KF_ZOOM_LEVEL,
} from "../action/vlAction";
import { IKeyframeGroup } from "../global-interfaces";
import { IState, store } from "../store";

export const vlReducer = (state: IState, action: IAction) => {
  switch (action.type) {
    // case UPDATE_STATIC_MARKS:
    //     return { ...state, staticMarks: action.payload.array };
    case UPDATE_KEYFRAME_TRACKS:
      if (!store.systemChanging) {
        PlusBtn.allPlusBtn = [];
        KfItem.allKfItems.clear();
        KfItem.allKfInfo.clear();
        KfGroup.allActions.clear();
        KfGroup.allAniGroups.clear();
        KfGroup.allKfGroups.clear();
        KfGroup.groupIdx = 0;
        KfGroup.allKfGroupInsertIdxes.clear();
        KfGroup.allAniGroupInfo.clear();
      }
      const rootGroup: IKeyframeGroup[] = [];
      [...action.payload.map].forEach((a: any) => {
        let aniId: string = a[0];
        KfGroup.allActions.set(aniId, a[1].actions[0]);
        rootGroup.push(Util.aniRootToKFGroup(a[1].root, aniId, -1));
      });
      //if os bar and link
      rootGroup.forEach((group: IKeyframeGroup) => {
        if(group.children != undefined){
          if(group.children.length > 0 && group.keyframes.length === 0 && (group.children[0].groupRef === 'Year' || group.children[0].groupRef === 'Month')){
            group.children.forEach((child) => {
              group.keyframes.push(child.keyframes[0]);
            })
            let totalLength = group.children.length;
            for(let i = 0; i< totalLength; i++){
              group.children.pop();
            }
          }
        }
      })
      if (rootGroup.length > 0) {
        rootGroup[0].newTrack = false;
      }
      return { ...state, keyframeGroups: rootGroup };
    case UPDATE_ACTIVATE_PLUS_BTN:
      return { ...state, activatePlusBtn: action.payload.infoObj };
    case UPDATE_HIGHLIGHT_KF:
      const oldKf: KfItem =
        typeof store.getState().highlightKf === "undefined"
          ? undefined
          : store.getState().highlightKf.currentHighlightKf;
      return {
        ...state,
        highlightKf: {
          previousHighlightKf: oldKf,
          currentHighlightKf: action.payload.infoObj,
        },
      };
    case UPDATE_KF_ZOOM_LEVEL:
      return { ...state, kfZoomLevel: action.payload.number };
    case UPDATE_KFGROUP_SIZE:
      return { ...state, kfGroupSize: action.payload.infoObj };
    // case UPDATE_MARKS_IN_NEW_KFG:
    //     return { ...state, marksInNewCreateKFG: action.payload.array };
  }
};
