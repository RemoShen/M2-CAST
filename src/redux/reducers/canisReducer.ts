import { IAction } from "../action/interfaces";
import { IState, store } from "../store";
import {
  APPEND_SPEC_GROUPING,
  MERGE_GROUP,
  REMOVE_CREATE_MULTI_ANI,
  REMOVE_DELAY_BETWEEN_GROUP,
  REMOVE_DELAY_BETWEEN_KF,
  REMOVE_DELAY_UPDATE_TIMING_REF_GROUP,
  REMOVE_LOWESTGROUP,
  REMOVE_SPEC_GROUPING,
  RESET_SPEC,
  SPLIT_CREATE_MULTI_ANI,
  SPLIT_CREATE_ONE_ANI,
  SPLIT_DATA_NONDATA_ANI,
  UPDATE_ALIGN_MERGE,
  UPDATE_ANI_ALIGN_AFTER_ANI,
  UPDATE_ANI_ALIGN_AFTER_ANI_WITH_DELAY,
  UPDATE_ANI_ALIGN_AFTER_KF,
  UPDATE_ANI_ALIGN_WITH_ANI,
  UPDATE_ANI_ALIGN_WITH_KF,
  UPDATE_ANI_OFFSET,
  UPDATE_DELAY_BETWEEN_GROUP,
  UPDATE_DELAY_BETWEEN_KF,
  UPDATE_DELAY_TIMING_REF_BETWEEN_GROUP,
  UPDATE_DURATION,
  UPDATE_EFFECT_AND_DURATION,
  UPDATE_EFFECT_TYPE,
  UPDATE_KF_TIMING_REF,
  UPDATE_SPEC_ANIMATIONS,
  UPDATE_SPEC_CHARTS,
  UPDATE_SPEC_GROUPING,
  UPDATE_TIMEING_REF_BETWEEN_GROUP,
  UPDATE_TIMING_REF_DELAY_KF,
} from "../action/canisAction";
import { KF_POPUP_LAYER } from "../views/vl/vl-consts";
import CanisGenerator, {
  IAnimationSpec,
  ICanisSpec,
  IChartSpec,
} from "../../app/core/canisGenerator";
import Util from "../../app/core/util";
import { Animation, TimingSpec } from "canis_toolkit";
import { StateModifier } from "../../app/app-utils";
import { Numeric } from "d3";
import Suggest from "../../app/core/suggest";
import { filter } from "lodash";
import { jsTool } from "../../util/jsTool";

export const canisReducer = (state: IState, action: IAction) => {
  if (typeof state !== "undefined") {
    if (typeof state.spec !== "undefined") {
      let specCopy: ICanisSpec = JSON.parse(JSON.stringify(state.spec));
      if (Suggest.allPaths.length === 1) {
        const currentSelectStep: string[][] = store.getState().selectMarksStep;
        const AllDataKfMarks: string[] =
          Util.separateDataAndNonDataMarks([...Util.filteredDataTable.keys()]).dataMarks;
        // const NeedToRemove: boolean = jsTool.ifRemove(currentSelectStep);
        currentSelectStep.forEach((selectOneStep: string[]) => {
          let ifDataMark: boolean = true;
          selectOneStep.forEach((mark: string) => {
            if (!AllDataKfMarks.includes(mark)) {
              ifDataMark = false;
            }
          });

          if (ifDataMark) {
            let selector: string = '';
            let markId: number[] = [];
            selectOneStep.forEach((mark: string) => {
              markId.push(parseInt(mark.split('mark')[1]));
            })
            markId.sort((a, b) => a - b);
            markId.forEach((id: number) => {
              selector += `#mark${id}, `
            })
            let pos: number = -1;
            selector = selector.substring(0, selector.length - 2);
            specCopy.animations.forEach((animation: IAnimationSpec, index: number) => {
              if (selectOneStep.length < 5) {
                if (selector === animation.selector) {
                  pos = index;
                }
              }
            });
            if (pos != -1) {
              specCopy.animations.splice(pos, 1);
            }
          }
        });
      }

      const animationsNeedToUpdate: string[] = [];
      switch (action.type) {
        case UPDATE_SPEC_CHARTS:
          document.getElementById(KF_POPUP_LAYER).innerHTML = "";
          const chartSpecs: IChartSpec[] = CanisGenerator.generateChartSpec(
            action.payload.array
          );
          let tmpSpec: ICanisSpec = { charts: chartSpecs, animations: [] };
          const validSpec: boolean = CanisGenerator.validate(tmpSpec);
          if (validSpec) {
            return { ...state, spec: tmpSpec };
          }
          return state;
        case UPDATE_SPEC_ANIMATIONS:
          // const oriSpec = JSON.parse(JSON.stringify(state.spec));
          specCopy.animations = action.payload.array;
          return { ...state, spec: specCopy };
        case RESET_SPEC:
          return { ...state, spec: action.payload.infoObj };
        case UPDATE_ANI_OFFSET:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              CanisGenerator.updateAniOffset(a, action.payload.infoObj.offset);
            }
          });
          return { ...state, spec: specCopy };
        case UPDATE_EFFECT_TYPE:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              action.payload.infoObj.aniIds.includes(
                `${a.chartIdx}_${a.selector}`
              )
            ) {
              let tmpEffect = Util.cloneObj(a.effects[0]);
              CanisGenerator.updateEffectType(
                tmpEffect,
                action.payload.infoObj.effectPropValue
              );
              a.effects = [tmpEffect];
            }
          });
          return { ...state, spec: specCopy };
        case UPDATE_DURATION:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              animationsNeedToUpdate.push(a.selector);
              //find merged aligned animations
              if (typeof a.id !== "undefined") {
                const [alignWithAni, alignToAnis] =
                  CanisGenerator.findMergedAlignAnis(a.id);
                animationsNeedToUpdate.push(...alignToAnis);
              } else if (typeof a.align !== "undefined") {
                if (
                  a.align.type === Animation.alignTarget.withEle &&
                  a.align.merge
                ) {
                  const [alignWithAni, alignToAnis] =
                    CanisGenerator.findMergedAlignAnis(a.align.target);
                  animationsNeedToUpdate.push(
                    ...[alignWithAni, ...alignToAnis]
                  );
                }
              }
            }
          });
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (animationsNeedToUpdate.includes(a.selector)) {
              let tmpEffect = Util.cloneObj(a.effects[0]);
              CanisGenerator.updateDuration(
                tmpEffect,
                action.payload.infoObj.duration
              );
              a.effects = [tmpEffect];
            }
          });
          return { ...state, spec: specCopy };
        case UPDATE_EFFECT_AND_DURATION:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            const currentAniId: string = `${a.chartIdx}_${a.selector}`;
            if (action.payload.infoObj.aniIds.includes(currentAniId)) {
              animationsNeedToUpdate.push(a.selector);
              //find merged aligned animations
              if (typeof a.id !== "undefined") {
                const [alignWithAni, alignToAnis] =
                  CanisGenerator.findMergedAlignAnis(a.id);
                animationsNeedToUpdate.push(...alignToAnis);
              } else if (typeof a.align !== "undefined") {
                if (
                  a.align.type === Animation.alignTarget.withEle &&
                  a.align.merge
                ) {
                  const [alignWithAni, alignToAnis] =
                    CanisGenerator.findMergedAlignAnis(a.align.target);
                  animationsNeedToUpdate.push(
                    ...[alignWithAni, ...alignToAnis]
                  );
                }
              }
            }
          });
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (animationsNeedToUpdate.includes(a.selector)) {
              a.effects = [
                CanisGenerator.initEffect(
                  action.payload.infoObj.effect,
                  action.payload.infoObj.duration
                ),
              ];
            }
          });
          return { ...state, spec: specCopy };
        case UPDATE_DELAY_BETWEEN_KF:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              if (typeof a.grouping === "undefined") {
                a.grouping = {
                  groupBy: "id",
                  delay: action.payload.infoObj.delay,
                };
              } else {
                let oriDelay: number = CanisGenerator.updateKfDelay(
                  a.grouping,
                  action.payload.infoObj.delay
                );
                //save history
              }
            }
          });
          return { ...state, spec: specCopy };
        // state.spec = { ...state.spec, animations: animations };
        case REMOVE_DELAY_BETWEEN_KF:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              CanisGenerator.removeKfDelay(a.grouping);
            }
          });
          return { ...state, spec: specCopy };
        case UPDATE_KF_TIMING_REF:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              CanisGenerator.updateKfRef(
                a.grouping,
                action.payload.infoObj.ref
              );
            }
          });
          return { ...state, spec: specCopy };
        case UPDATE_TIMING_REF_DELAY_KF:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              CanisGenerator.updateKfRefAndDelay(
                a.grouping,
                action.payload.infoObj.ref,
                action.payload.infoObj.delay
              );
            }
          });
          return { ...state, spec: specCopy };
        case REMOVE_LOWESTGROUP:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              //if there is only one level grouping, change timing to start with previous
              let oneLevelGrouping: boolean = false;
              if (typeof a.grouping === "undefined") {
                oneLevelGrouping = true;
              } else {
                if (typeof a.grouping.grouping === "undefined") {
                  oneLevelGrouping = true;
                }
              }
              if (oneLevelGrouping) {
                delete a.grouping;
              } else {
                CanisGenerator.removeLowestGrouping(a.grouping);
              }
            }
          });
          return { ...state, spec: specCopy };
        case UPDATE_DELAY_BETWEEN_GROUP:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              CanisGenerator.updateGroupDelay(
                a.grouping,
                action.payload.infoObj.groupRef,
                action.payload.infoObj.delay
              );
            }
          });
          return { ...state, spec: specCopy };
        case UPDATE_DELAY_TIMING_REF_BETWEEN_GROUP:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              CanisGenerator.updateGroupDelayTiming(
                a.grouping,
                action.payload.infoObj.groupRef,
                action.payload.infoObj.delay,
                action.payload.infoObj.ref
              );
            }
          });
          return { ...state, spec: specCopy };
        case UPDATE_TIMEING_REF_BETWEEN_GROUP:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              CanisGenerator.updateGroupTiming(
                a.grouping,
                action.payload.infoObj.groupRef,
                action.payload.infoObj.ref
              );
            }
          });
          return { ...state, spec: specCopy };
        case REMOVE_DELAY_BETWEEN_GROUP:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              CanisGenerator.removeGroupDelay(
                a.grouping,
                action.payload.infoObj.groupRef
              );
            }
          });
          return { ...state, spec: specCopy };
        case REMOVE_DELAY_UPDATE_TIMING_REF_GROUP:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              CanisGenerator.removeGroupDelayUpdateTiming(
                a.grouping,
                action.payload.infoObj.groupRef,
                action.payload.infoObj.ref
              );
            }
          });
          return { ...state, spec: specCopy };
        case MERGE_GROUP:
          specCopy.animations.forEach((a: IAnimationSpec) => {
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              a.grouping = CanisGenerator.mergeGroup(
                a.grouping,
                action.payload.infoObj.groupRef
              );
            }
          });
          return { ...state, spec: specCopy };
        case UPDATE_ALIGN_MERGE:
          for (let i = 0, len = specCopy.animations.length; i < len; i++) {
            let a: IAnimationSpec = specCopy.animations[i];
            if (
              `${a.chartIdx}_${a.selector}` === action.payload.infoObj.aniId
            ) {
              CanisGenerator.updateMerge(a, action.payload.infoObj.merge);

              let targetDuration: number = 0;
              for (let j = 0; j < len; j++) {
                if (state.spec.animations[j].id === a.align.target) {
                  targetDuration = <number>(
                    state.spec.animations[j].effects[0].duration
                  );
                  break;
                }
              }

              let tmpEffect = Util.cloneObj(a.effects[0]);
              CanisGenerator.updateDuration(tmpEffect, targetDuration);
              a.effects = [tmpEffect];
              break;
            }
          }
          return { ...state, spec: specCopy };
        case SPLIT_CREATE_ONE_ANI:
          return {
            ...state,
            spec: StateModifier.splitCreateOneAni(
              action.payload.infoObj.aniId,
              action.payload.infoObj.newAniSelector,
              action.payload.infoObj.attrComb,
              action.payload.infoObj.attrValueSort,
              specCopy
            ),
          };
        case SPLIT_DATA_NONDATA_ANI:
          return {
            ...state,
            spec: StateModifier.splitDataNondataAni(
              action.payload.infoObj.aniId,
              action.payload.infoObj.path,
              action.payload.infoObj.attrValueSort,
              specCopy
            ),
          };
        case REMOVE_CREATE_MULTI_ANI:
          return {
            ...state,
            spec: StateModifier.removeAndCreateMulti(
              action.payload.infoObj.aniId,
              action.payload.infoObj.path,
              action.payload.infoObj.attrValueSort,
              specCopy
            ),
          };
        case UPDATE_SPEC_GROUPING:
          return {
            ...state,
            spec: StateModifier.updateGrouping(
              action.payload.infoObj.aniId,
              action.payload.infoObj.attrComb,
              action.payload.infoObj.attrValueSort,
              specCopy
            ),
          };
        case REMOVE_SPEC_GROUPING:
          return {
            ...state,
            spec: StateModifier.removeGrouping(action.payload.infoObj.aniId, specCopy),
          };
        case SPLIT_CREATE_MULTI_ANI:
          return {
            ...state,
            spec: StateModifier.splitCreateMultiAni(
              action.payload.infoObj.aniId,
              action.payload.infoObj.path,
              action.payload.infoObj.attrValueSort,
              specCopy
            ),
          };
        case APPEND_SPEC_GROUPING:
          return {
            ...state,
            spec: StateModifier.appendGrouping(
              action.payload.infoObj.aniId,
              action.payload.infoObj.attrComb,
              action.payload.infoObj.attrValueSort,
              specCopy
            ),
          };
        case UPDATE_ANI_ALIGN_AFTER_ANI_WITH_DELAY:
        case UPDATE_ANI_ALIGN_AFTER_ANI:
        case UPDATE_ANI_ALIGN_WITH_ANI:
        case UPDATE_ANI_ALIGN_AFTER_KF:
        case UPDATE_ANI_ALIGN_WITH_KF:
          return {
            ...state,
            spec: updateAniAlign(specCopy, action.type, action.payload.infoObj),
          };
      }
    }
  }
};

const updateAniAlign = (
  spec: ICanisSpec,
  actionType: string,
  actionInfo: { targetAniId: string; currentAniId: string }
) => {
  const animations: IAnimationSpec[] = spec.animations;
  let currentAni: IAnimationSpec;
  let currentAniIdx: number;
  let targetAni: IAnimationSpec;
  let targetAniIdx: number;
  for (let i = 0, len = animations.length; i < len; i++) {
    let a: IAnimationSpec = animations[i];
    if (`${a.chartIdx}_${a.selector}` === actionInfo.currentAniId) {
      currentAni = a;
      currentAniIdx = i;
    }
    if (`${a.chartIdx}_${a.selector}` === actionInfo.targetAniId) {
      targetAni = a;
      targetAniIdx = i;
    }
  }
  let targetAniId: string;
  switch (actionType) {
    case UPDATE_ANI_ALIGN_AFTER_ANI_WITH_DELAY:
      if (typeof currentAni.align !== "undefined") {
        const alignedOnData: boolean =
          typeof Animation.animations.get(actionInfo.currentAniId)
            .alignOnData === "undefined"
            ? false
            : Animation.animations.get(actionInfo.currentAniId).alignOnData;
        //remove align and set grouping for this ani
        delete currentAni.align;
        if (alignedOnData) {
          currentAni.grouping = targetAni.grouping;
        } else {
          currentAni.grouping = {
            groupBy: "id",
            reference: TimingSpec.timingRef.previousEnd,
          };
        }
      }
      currentAni.reference = TimingSpec.timingRef.previousEnd;
      currentAni.offset = 300;
      break;
    case UPDATE_ANI_ALIGN_AFTER_ANI:
      if (typeof currentAni.align !== "undefined") {
        const alignedOnData: boolean =
          typeof Animation.animations.get(actionInfo.currentAniId)
            .alignOnData === "undefined"
            ? false
            : Animation.animations.get(actionInfo.currentAniId).alignOnData;
        //remove align and set grouping for this ani
        delete currentAni.align;
        if (alignedOnData) {
          currentAni.grouping = targetAni.grouping;
        } else {
          currentAni.grouping = {
            groupBy: "id",
            reference: TimingSpec.timingRef.previousEnd,
          };
        }
      }
      currentAni.reference = TimingSpec.timingRef.previousEnd;
      currentAni.offset = 0;
      break;
    case UPDATE_ANI_ALIGN_WITH_ANI:
      currentAni.reference = TimingSpec.timingRef.previousStart;
      if (typeof currentAni.align !== "undefined") {
        delete currentAni.align;
        // currentAni.grouping = targetAni.grouping;
        // let targetDuration = 0;
        // let currentDuration = 0;
        // if(targetAni.grouping){
        //     targetDuration
        // }
      }
      break;
    case UPDATE_ANI_ALIGN_AFTER_KF:
      if (typeof targetAni.id === "undefined") {
        targetAni.id = actionInfo.targetAniId;
      }
      animations[targetAniIdx] = targetAni;
      targetAniId = targetAni.id;
      currentAni.align = { type: "element", target: targetAniId, merge: false };
      currentAni.reference = TimingSpec.timingRef.previousEnd;
      break;
    case UPDATE_ANI_ALIGN_WITH_KF:
      console.log("targetani00", targetAni);

      if (typeof targetAni.id === "undefined") {
        targetAni.id = actionInfo.targetAniId;
      }
      animations[targetAniIdx] = targetAni;
      targetAniId = targetAni.id;
      currentAni.align = { type: "element", target: targetAniId, merge: false };
      currentAni.reference = TimingSpec.timingRef.previousStart;
      break;
  }
  animations.splice(currentAniIdx, 1);
  for (let i = 0, len = animations.length; i < len; i++) {
    let a: IAnimationSpec = animations[i];
    if (`${a.chartIdx}_${a.selector}` === actionInfo.targetAniId) {
      animations.splice(i + 1, 0, currentAni);
      break;
    }
  }
  return spec;
};
