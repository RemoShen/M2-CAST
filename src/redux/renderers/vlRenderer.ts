import Util from "../../app/core/util";
import { kfContainer } from "../views/vl/kfContainer";
import KfGroup from "../views/vl/kfGroup";
import KfItem from "../views/vl/kfItem";
import KfOmit from "../views/vl/kfOmit";
import KfTrack from "../views/vl/kfTrack";
import PlusBtn from "../views/vl/plusBtn";
import {
  GROUP_TITLE_HEIHGT,
  KF_BG_LAYER,
  KF_FG_LAYER,
  KF_HEIGHT,
  KF_H_STEP,
  KF_OMIT_LAYER,
  KF_WIDTH,
  KF_W_STEP,
  TRACK_HEIGHT,
} from "../views/vl/vl-consts";
import { jsTool } from "../../util/jsTool";
import { IOrderInfo } from "../../util/markSelection";
import {
  updateHighlightKf,
  updateKfGroupSize,
  updateKfZoomLevel,
} from "../action/vlAction";
import {
  IActivatePlusBtn,
  IKeyframe,
  IKeyframeGroup,
  IOmitPattern,
  ISize,
} from "../global-interfaces";
import { store } from "../store";
import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from "../views/panels/panel-consts";
import { Animation } from "canis_toolkit";
import { CHART_THUMBNAIL_ZOOM_LEVEL } from "../views/vl/vl-consts";
import { resetKeyframeTracks, toggleLoading } from "./renderer-tools";

export const vlRenderer = {
  removeRedundentKfs: (kfgs: IKeyframeGroup[]) => {
    kfgs.forEach((kfg: IKeyframeGroup) => {
      if (kfg != null) {
        var stack: IKeyframeGroup[] = [];
        stack.push(kfg);
        while (stack.length != 0) {
          const tmpKfg: IKeyframeGroup = stack.pop();
          if (tmpKfg.keyframes.length > 0) {
            const recorder: string[][] = [];
            const tmpKfs: IKeyframe[] = [];
            tmpKfg.keyframes.forEach((IKF: IKeyframe) => {
              if (!jsTool.Array2DItem(recorder, IKF.marksThisKf)) {
                recorder.push(IKF.marksThisKf);
                tmpKfs.push(IKF);
              }
            });
            tmpKfg.keyframes = tmpKfs;
          }
          const children: IKeyframeGroup[] = tmpKfg.children;
          for (var i = children.length - 1; i >= 0; i--)
            stack.push(children[i]);
        }
      }
    });
  },

  renderKeyframeTracks: () => {
    const kfgs: IKeyframeGroup[] = store.getState().keyframeGroups;
    vlRenderer.removeRedundentKfs(kfgs);
    // if (state.charts.length === 1) {
    //save kf group info
    kfgs.forEach((kfg: IKeyframeGroup) => {
      KfGroup.allAniGroupInfo.set(kfg.aniId, kfg);
    });

    kfgs.forEach((kfg: IKeyframeGroup, i: number) => {
      KfGroup.leafLevel = 0;
      let treeLevel = 0; //use this to decide the background color of each group
      //top-down to init group and kf
      const rootGroup: KfGroup = vlRenderer.renderKeyframeGroup(
        0,
        kfgs[i - 1],
        1,
        kfg,
        treeLevel
      );
      //bottom-up to update size and position
      // rootGroup.updateGroupPosiAndSize([...KfTrack.aniTrackMapping.get(rootGroup.aniId)][0].availableInsert, 0, false, true);
      KfGroup.allAniGroups.set(rootGroup.aniId, rootGroup);
      // const endKf: KfItem = rootGroup.findLastKf();
      // store.dispatchSystem(updateHighlightKf(endKf));
    });

    const rootGroupBBox: DOMRect = document
      .getElementById(KF_FG_LAYER)
      .getBoundingClientRect();
    store.dispatchSystem(
      updateKfGroupSize({
        width: rootGroupBBox.width,
        height: rootGroupBBox.height,
      })
    );
    store.dispatchSystem(
      updateKfZoomLevel(store.getState().kfZoomLevel + 0.01)
    );
    toggleLoading({ isLoading: false });
    // Reducer.triger(action.UPDATE_LOADING_STATUS, { il: false });
  },
  renderKeyframeGroup: (
    kfgIdx: number,
    previousKfg: IKeyframeGroup,
    totalKfgNum: number,
    kfg: IKeyframeGroup,
    treeLevel: number,
    parentObj?: KfGroup
  ) => {
    //draw group container
    let kfGroup: KfGroup = new KfGroup();
    if (kfgIdx === 0 || kfgIdx === 1 || kfgIdx === totalKfgNum - 1) {
      let targetTrack: KfTrack; //foreground of the track used to put the keyframe group
      if (kfg.newTrack) {
        //judge whether the new track is already in this animation
        if (typeof parentObj !== "undefined") {
          let lastChild: KfGroup;
          for (let i = parentObj.children.length - 1; i >= 0; i--) {
            if (parentObj.children[i] instanceof KfGroup) {
              lastChild = <KfGroup>parentObj.children[i];
              break;
            }
          }
          let allTracksThisAni: KfTrack[] = [
            ...KfTrack.aniTrackMapping.get(kfg.aniId),
          ];
          let lastTrack: KfTrack = KfTrack.allTracks.get(
            lastChild.targetTrackId
          );
          if (typeof lastTrack !== "undefined") {
            allTracksThisAni.forEach((kft: KfTrack) => {
              if (
                kft.trackPosiY - lastTrack.trackPosiY > 0 &&
                kft.trackPosiY - lastTrack.trackPosiY <= TRACK_HEIGHT
              ) {
                targetTrack = kft;
              }
            });
          }
          if (typeof targetTrack === "undefined") {
            targetTrack = new KfTrack();
            let createFakeTrack: boolean = false;
            if (typeof kfg.merge !== "undefined") {
              createFakeTrack = kfg.merge;
            }
            targetTrack.createTrack(createFakeTrack);
          }
        } else {
          targetTrack = new KfTrack();
          let createFakeTrack: boolean = false;
          if (typeof kfg.merge !== "undefined") {
            createFakeTrack = kfg.merge;
          }
          targetTrack.createTrack(createFakeTrack);
        }
      } else {
        if (typeof KfTrack.aniTrackMapping.get(kfg.aniId) !== "undefined") {
          targetTrack = [...KfTrack.aniTrackMapping.get(kfg.aniId)][0]; //this is the group within an existing animation
        } else {
          //target track is the one with the max available insert
          let maxAvailableInsert: number = 0;
          KfTrack.allTracks.forEach((kft: KfTrack, trackId: string) => {
            if (kft.availableInsert >= maxAvailableInsert) {
              maxAvailableInsert = kft.availableInsert;
              targetTrack = kft;
            }
          });
        }
      }
      if (typeof KfTrack.aniTrackMapping.get(kfg.aniId) === "undefined") {
        KfTrack.aniTrackMapping.set(kfg.aniId, new Set());
      }
      KfTrack.aniTrackMapping.get(kfg.aniId).add(targetTrack);
      let minTrackPosiYThisGroup: number = [
        ...KfTrack.aniTrackMapping.get(kfg.aniId),
      ][0].trackPosiY;

      //check whether this is the group of animation, and whether to add a plus button or not
      // let plusBtn: PlusBtn,
      //   addedPlusBtn: boolean = false;
      // if (treeLevel === 0) {
      //   this is the root group
      //   find the keyframes of the first group
      //   const tmpKfs: IKeyframe[] = Util.findFirstKfs(kfg);
      //   let [addingPlusBtn, acceptableMarkClasses] = PlusBtn.detectAdding(kfg, tmpKfs);//judge if add plus button
      //   if (addingPlusBtn) {
      //       addedPlusBtn = addingPlusBtn;
      //       plusBtn = new PlusBtn()
      //       plusBtn.createBtn(kfGroup, tmpKfs, targetTrack, targetTrack.availableInsert, { width: KF_WIDTH - KF_W_STEP, height: KF_HEIGHT - 2 * PlusBtn.PADDING }, acceptableMarkClasses);
      //       targetTrack.availableInsert += PlusBtn.PADDING * 4 + PlusBtn.BTN_SIZE;
      //   }
      // } //plus button
      const previousAniId: string =
        typeof previousKfg === "undefined" ? "" : previousKfg.aniId;
      kfGroup.createGroup(
        kfg,
        previousAniId,
        parentObj ? parentObj : targetTrack,
        targetTrack.trackPosiY - minTrackPosiYThisGroup,
        treeLevel,
        targetTrack.trackId
      );
      if (typeof parentObj !== "undefined" && parentObj.rendered) {
        parentObj.children.push(kfGroup);
      } //add

      // if (addedPlusBtn) {
      //   plusBtn.aniId = kfGroup.aniId;
      //   PlusBtn.plusBtnMapping.set(plusBtn.aniId, plusBtn);
      //   if (treeLevel === 0) {
      //     plusBtn.fakeKfg.marks = kfGroup.marks;
      //     plusBtn.fakeKfg.aniId = kfGroup.aniId;
      //   }
      // }
    } else if (totalKfgNum > 3 && kfgIdx === totalKfgNum - 2) {
      const preChild = parentObj.children[1];
      const preChildTransX: number = jsTool.extractTransNums(
        preChild.container.getAttributeNS(null, "transform")
      ).x; //add
      let kfOmit: KfOmit = new KfOmit();
      // preChildTransX + preChild.totalWidth  (KF_HEIGHT - GROUP_TITLE_HEIHGT * (<KfGroup | KfItem>preChild).treeLevel) / 2
      kfOmit.createOmit(
        KfOmit.KF_GROUP_OMIT,
        preChildTransX + preChild.totalWidth,
        totalKfgNum - 3,
        parentObj,
        false,
        false,
        (KF_HEIGHT -
          GROUP_TITLE_HEIHGT * (<KfGroup | KfItem>preChild).treeLevel) /
          2
      );
      parentObj.children.push(kfOmit); //why comment this out!!!!

      // kfOmit.idxInGroup = parentObj.children.length - 1;//add
      // parentObj.kfOmits.push(kfOmit);//add
    }
    treeLevel++;
    if (treeLevel > KfGroup.leafLevel) {
      KfGroup.leafLevel = treeLevel;
    }
    if (kfg.keyframes.length > 0) {
      kfGroup.kfNum = kfg.keyframes.length;
      //choose the keyframes to draw
      let alignWithAnis: Map<string, number[]> = new Map();
      let alignToAni: number[] = [];
      kfg.keyframes.forEach((k: any, i: number) => {
        if (typeof k.alignWith !== "undefined") {
          k.alignWith.forEach((aniId: string) => {
            if (typeof alignWithAnis.get(aniId) === "undefined") {
              alignWithAnis.set(aniId, [100000, 0]);
            }
            if (i < alignWithAnis.get(aniId)[0]) {
              alignWithAnis.get(aniId)[0] = i;
            }
            if (i > alignWithAnis.get(aniId)[1]) {
              alignWithAnis.get(aniId)[1] = i;
            }
          });
        } else if (typeof k.alignTo !== "undefined") {
          if (typeof KfItem.allKfItems.get(k.alignTo) !== "undefined") {
            if (KfItem.allKfItems.get(k.alignTo).rendered) {
              alignToAni.push(i);
            }
          }
        }
      });

      let kfIdxToDraw: number[] = [0, 1, kfg.keyframes.length - 1];
      let isAlignWith: number = 0; //0 -> neither align with nor align to, 1 -> align with, 2 -> align to
      let kfOmitType: string = KfOmit.KF_OMIT;
      let omitPattern: IOmitPattern[] = [];
      //this group is the align target
      if (alignWithAnis.size > 0) {
        isAlignWith = 1;
        kfOmitType = KfOmit.KF_ALIGN;
        omitPattern.push({
          merge: typeof kfg.merge === "undefined" ? false : kfg.merge,
          timing: kfg.timingRef,
          hasOffset: kfg.offsetIcon,
          hasDuration: true,
        });

        alignWithAnis.forEach((se: number[], aniId: string) => {
          const tmpKfg: IKeyframeGroup = KfGroup.allAniGroupInfo.get(aniId);
          omitPattern.push({
            merge: typeof tmpKfg.merge === "undefined" ? false : tmpKfg.merge,
            timing: tmpKfg.timingRef,
            hasOffset: tmpKfg.offsetIcon,
            hasDuration: true,
          });
          kfIdxToDraw.push(se[0]);
          kfIdxToDraw.push(se[1]);
          if (se[0] + 1 < se[1]) {
            kfIdxToDraw.push(se[0] + 1);
          }
        });
      } else if (alignToAni.length > 0) {
        //this group aligns to other group
        isAlignWith = 2;
        kfIdxToDraw = [...kfIdxToDraw, ...alignToAni];
      }
      kfIdxToDraw = [...new Set(kfIdxToDraw)].sort(
        (a: number, b: number) => a - b
        );
        //rendering kf
      //check whether there should be a plus btn
      let kfPosiX = kfGroup.offsetWidth;
      //
      
      kfg.keyframes.forEach((k: IKeyframe, i: number) => {
        //whether to draw this kf or not
        let kfOmit: KfOmit;
        if (kfIdxToDraw.includes(i)) {
          //whether to draw '...'  then set 'kfGroup'
          if (i > 0 && kfIdxToDraw[kfIdxToDraw.indexOf(i) - 1] !== i - 1) {
            const omitNum: number =
              i - kfIdxToDraw[kfIdxToDraw.indexOf(i) - 1] - 1;
            if (omitNum > 0) {
              kfOmit = new KfOmit();
              if (kfOmitType === KfOmit.KF_ALIGN) {
                kfOmit.omitPattern = omitPattern;
              }
              if (kfg.keyframes[1].hiddenDurationIcon) {
                kfPosiX += (<KfItem>(
                  kfGroup.children[kfGroup.children.length - 1]
                )).durationWidth;
              }
              kfOmit.createOmit(
                kfOmitType,
                kfPosiX,
                omitNum,
                kfGroup,
                kfg.keyframes[1].delayIcon,
                kfg.keyframes[1].durationIcon,
                (<KfItem>kfGroup.children[1]).kfHeight / 2
              );
              if (kfOmit.container != undefined) {
                kfGroup.children.push(kfOmit);
                kfOmit.idxInGroup = kfGroup.children.length - 1;
                kfGroup.kfOmits.push(kfOmit);
                kfPosiX = kfPosiX + kfOmit.totalWidth;
              }
            }
          }
          //draw render
          const kfItem: KfItem = new KfItem();
          let targetSize: ISize = { width: 0, height: 0 };
          if (isAlignWith === 2) {
            const tmpAlignToKf: KfItem = KfItem.allKfItems.get(k.alignTo);
            if (typeof tmpAlignToKf !== "undefined") {
              if (tmpAlignToKf.rendered) {
                const alignedKf: DOMRect =
                  tmpAlignToKf.kfBg.getBoundingClientRect(); //fixed
                targetSize.width =
                  alignedKf.width / store.getState().kfZoomLevel;
                targetSize.height =
                  alignedKf.height / store.getState().kfZoomLevel;
              }
            }
            // if(kfGroup.aniId){
            kfItem.createItem(k, treeLevel, kfGroup, kfPosiX, targetSize);
            // }
          } else {
            if (kfGroup.aniId) {
              kfItem.createItem(k, treeLevel, kfGroup, kfPosiX); 
            }
          }

          if (typeof kfOmit !== "undefined") {
            kfItem.preOmit = kfOmit;
          }
          KfItem.allKfItems.set(k.id, kfItem); //close
          kfGroup.children.push(kfItem);
          // kfItem.idxInGroup = kfGroup.children.length - 1;
          kfPosiX += kfItem.totalWidth;
        }
      });
    } else if (kfg.children.length > 0) {
      //rendering kf group
      kfg.children.forEach((c: any, i: number) => {
        const tmpKfGroup: KfGroup = vlRenderer.renderKeyframeGroup(
          i,
          kfg.children[i - 1],
          kfg.children.length,
          c,
          treeLevel,
          kfGroup
        );
        // kfGroup.children.push(tmpKfGroup);
        // tmpKfGroup.idxInGroup = kfGroup.children.length - 1;
        // kfGroup.kfNum += tmpKfGroup.kfNum;
      });
    }
    return kfGroup;
  },
  renderActivatedPlusBtn: () => {
    const activatePlusBtn: IActivatePlusBtn = store.getState().activatePlusBtn;
    const aniGroupToInsert: string = activatePlusBtn.aniId;
    const selectedMarks: string[] = activatePlusBtn.selection;
    const orderInfo: IOrderInfo = activatePlusBtn.orderInfo;
    const previousKfs: string[][] = activatePlusBtn.previousKfs;
    resetKeyframeTracks(); 
    vlRenderer.renderKeyframeTracks(); 
    KfGroup.insertKfAfterSelection(
      aniGroupToInsert,
      selectedMarks,
      orderInfo,
      previousKfs
    );
  },
  renderHighlightKf: () => {
    const oldKf: KfItem = store.getState().highlightKf.previousHighlightKf;
    const newKf: KfItem = store.getState().highlightKf.currentHighlightKf;
    if (typeof oldKf !== "undefined") {
      oldKf.isHighlighted = false;
    }
    if (typeof newKf !== "undefined") {
      newKf.isHighlighted = true;
    }
  },
  zoomKfContainer: () => {
    let zl: number = store.getState().kfZoomLevel;
    kfContainer.kfTrackScaleContainer.setAttributeNS(
      null,
      "transform",
      `scale(${zl}, ${zl})`
    );
    //set visbility of chart thumbnails
    if (zl === MAX_ZOOM_LEVEL) {
      zl -= 0.001;
    }
    const shownThumbnail: number = Math.floor(
      (zl - MIN_ZOOM_LEVEL) /
        ((MAX_ZOOM_LEVEL - MIN_ZOOM_LEVEL) / (CHART_THUMBNAIL_ZOOM_LEVEL / 2))
    );
    const kfZoomLevel: number = Math.floor(
      (zl - MIN_ZOOM_LEVEL) /
        ((MAX_ZOOM_LEVEL - MIN_ZOOM_LEVEL) / CHART_THUMBNAIL_ZOOM_LEVEL)
    );

    let sortedAniGroupAniIds: string[] = [...KfGroup.allAniGroups.keys()].sort(
      (a: string, b: string) => {
        if (
          KfGroup.allAniGroups.get(a).alignType ===
            Animation.alignTarget.withEle &&
          KfGroup.allAniGroups.get(b).alignType !==
            Animation.alignTarget.withEle
        ) {
          return 1;
        } else if (
          KfGroup.allAniGroups.get(a).alignType !==
            Animation.alignTarget.withEle &&
          KfGroup.allAniGroups.get(b).alignType ===
            Animation.alignTarget.withEle
        ) {
          return -1;
        } else if (
          KfGroup.allAniGroups.get(a).alignType ===
            Animation.alignTarget.withEle &&
          KfGroup.allAniGroups.get(b).alignType ===
            Animation.alignTarget.withEle
        ) {
          const bbox1: DOMRect = KfGroup.allAniGroups
            .get(a)
            .container.getBoundingClientRect();
          const bbox2: DOMRect = KfGroup.allAniGroups
            .get(b)
            .container.getBoundingClientRect();
          return bbox1.top - bbox2.top;
        } else {
          return 0;
        }
      }
    );

    //set visibility of kfgroups and kfitems
    sortedAniGroupAniIds.forEach((aniKfGroupAniId: string) => {
      const aniKfGroup: KfGroup = KfGroup.allAniGroups.get(aniKfGroupAniId);
      aniKfGroup.zoomGroup(kfZoomLevel, shownThumbnail);
      if (aniKfGroup.alignType === Animation.alignTarget.withEle) {
        //check kf positions
        aniKfGroup.updateAlignGroupKfPosis();
      }
    });
  },
  renderKfContainerSliders: () => {
    //reset the transform of kfcontainer
    kfContainer.resetScroll();
    kfContainer.updateKfSlider(store.getState().kfGroupSize);
  },
};
