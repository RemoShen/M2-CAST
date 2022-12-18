// import { state } from './state'
// import Canis, { ChartSpec, Animation, TimingSpec } from 'canis_toolkit'
// import CanisGenerator, { canis, ICanisSpec } from './core/canisGenerator'
// import Util from './core/util'
// import Reducer from './reducer'
// import * as action from './action'
// import Lottie from '../../node_modules/lottie-web/build/player/lottie'
// import { Player, player } from '../redux/views/slider/player'
// import KfItem from '../components/vl/kfItem'
// import KfTrack from '../components/vl/kfTrack'
// import KfGroup from '../components/vl/kfGroup'
// import { kfContainer } from '../components/vl/kfContainer'
// import KfOmit from '../components/vl/kfOmit'
// import PlusBtn from '../components/vl/plusBtn'
// import { SuggestBox } from '../components/vl/suggestBox'
// import { sketchCanvas } from '../redux/views/panels/sketchCanvas'
// import { DARK_COLOR, FIRST_LEVEL_BTN_SIZE_BIG, IMenuItem, ISubMenuItem, LIGHT_COLOR, LIGHT_THEME } from '../components/menu/menu-consts'
// import { BTN_CONTENT_TYPE_ICON, BTN_CONTENT_TYPE_STR, BTN_TYPE_DATA, BTN_TYPE_MAIN, BTN_TYPE_PREVIEW, DATA_ICON, DEFAULT_BTN_SIZE, ISVGBtn, MID_FONT } from '../components/buttons/button-consts'
// import { GROUP_TITLE_HEIHGT, KF_BG_LAYER, KF_FG_LAYER, KF_HEIGHT, KF_H_STEP, KF_OMIT_LAYER, KF_WIDTH, KF_W_STEP, TRACK_HEIGHT } from '../components/vl/vl-consts'
// import { SVGBtn } from '../components/buttons/svgButton'
// import { TXT_BUBBLE_CLS } from '../redux/views/bubble/txtBubble'
// import { IOrderInfo } from '../util/markSelection'
// import { nav } from '../components/nav/nav'
// import { Ava } from '../components/Ava'
// import { CHART_VIEW_CONTENT_ID, DATA, DATA_MENU_ID, LASSO, MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL, SINGLE, VIDEO_VIEW_CONTENT_ID, ZOOM_PANEL_ID } from '../redux/views/panels/panel-consts'
// import { SELECTION_FRAME, SUGGESTION_FRAME, NON_SKETCH_CLS, SUGGESTION_FRAME_CLS } from '../redux/global-consts'
// import { IAttrAndSpec, ICoord, IDataItem, IKeyframe, IKeyframeGroup, IOmitPattern, ISize, ISortDataAttr } from '../redux/global-interfaces'
// import { updateSelection } from '../redux/action/chartAction'
// import { updateLoading } from '../redux/action/appAction'
// import { Array2DItem } from '../util/tool'
// import { updateLottieAni,  } from '../redux/action/videoAction'
// import { createDashBox, createSvgElement, updateProps } from '../util/svgManager'
// import { jsTool } from '../util/jsTool'

/**
 * render html according to the state
 */
export default class Renderer {
  // /**
  //  * test rendering spec
  //  * @param spec
  //  */
  // public static async renderSpec(spec: ICanisSpec, callback: any = () => { }) {
  //     console.trace('going to render spec: ', spec.animations);
  //     //render video widgets first
  //     //render video
  //     const lottieSpec = await canis.renderSpec(spec, () => {
  //         if (spec.animations[0].selector === '.mark') {//special triger, can not triger action
  //             state.spec.animations[0].selector = `#${Animation.allMarks.join(', #')}`;
  //         }
  //         Util.extractAttrValueAndDeterminType(ChartSpec.dataMarkDatum);
  //         Util.extractNonDataAttrValue(ChartSpec.nonDataMarkDatum);
  //         const dataOrder: string[] = Array.from(Util.filteredDataTable.keys());
  //         const dataTable: Map<string, IDataItem> = Util.filteredDataTable;
  //         const sortDataAttrs: ISortDataAttr[] = ['markId', ...Object.keys(Util.attrType)].map(attrName => {
  //             const sortType: string = attrName === 'markId' ? AttrSort.ASSCENDING_ORDER : AttrSort.INDEX_ORDER;
  //             return {
  //                 attr: attrName,
  //                 sort: sortType
  //             }
  //         })
  //         //these actions are coupling with others, so they are not recorded in history
  //         Reducer.triger(action.UPDATE_DATA_ORDER, dataOrder);
  //         Reducer.triger(action.UPDATE_DATA_TABLE, dataTable);
  //         Reducer.triger(action.UPDATE_DATA_SORT, sortDataAttrs);
  //     });
  //     // Reducer.triger(action.UPDATE_SELECTION, []);
  //     // store.dispatch(updateSelection([]));
  //     const svg: HTMLElement = document.getElementById('visChart');
  //     if (svg) {
  //         //translate chart content
  //         Util.transformSVG();
  //         Util.extractVisualEncoding();
  //         const selectionBox: SVGRectElement = createSvgElement({
  //             tag: 'rect', para: {
  //                 id: SELECTION_FRAME,
  //                 fill: 'none',
  //                 stroke: '#2196f3',
  //                 strokeWidth: '2'
  //             }, flag: true
  //         });
  //         svg.appendChild(selectionBox);
  //         const suggestionBox: SVGRectElement = createSvgElement({
  //             tag: 'rect', para: {
  //                 id: SUGGESTION_FRAME,
  //                 fill: 'none',
  //                 stroke: '#676767',
  //                 strokeWidth: '1',
  //                 strokeDasharray: '2 2'
  //             }, flag: true
  //         });
  //         svg.appendChild(suggestionBox);
  //         // store.dispatch(updateChartScale(1));
  //         store.renderState(defaultState);
  //         store.saveState();
  //     }
  //     //render video view
  //     Reducer.triger(action.UPDATE_LOTTIE_SPEC, lottieSpec);
  //     player.resetPlayer({
  //         frameRate: canis.frameRate,
  //         currentTime: 0,
  //         totalTime: canis.duration()
  //     })
  //     // if (state.charts.length > 1) {//remove the visChart and add multi-charts
  //     //     if (document.getElementById('visChart')) {
  //     //         document.getElementById('visChart').remove();
  //     //     }
  //     //     this.renderMultiCharts();
  //     // }
  //     callback();
  // }
  // public static async renderSuggestSpec(spec: ICanisSpec, autoPlay: boolean, isPreview: boolean) {
  //     console.log('going to render suggest spec: ', spec.animations);
  //     const oldChartContainer = document.getElementById(CHART_VIEW_CONTENT_ID);
  //     oldChartContainer.id = `tmp${CHART_VIEW_CONTENT_ID}`;
  //     const tmpContainer = document.createElement('div');
  //     tmpContainer.id = CHART_VIEW_CONTENT_ID;
  //     document.body.appendChild(tmpContainer);
  //     //render video
  //     const lottieSpec = await canis.renderSpec(spec, () => {
  //         document.body.removeChild(document.getElementById(CHART_VIEW_CONTENT_ID));
  //         document.getElementById(`tmp${CHART_VIEW_CONTENT_ID}`).id = CHART_VIEW_CONTENT_ID;
  //     });
  //     player.resetPlayer({
  //         frameRate: canis.frameRate,
  //         currentTime: 0,
  //         totalTime: canis.duration()
  //     })
  //     if (isPreview) {
  //         let startTime: number = 10000000, endTime: number = 0;
  //         (SuggestBox.preUniqueIdx === -1 ? state.previewPath.firstKfMarks : state.previewPath.kfMarks[SuggestBox.preUniqueIdx]).forEach((mId: string) => {
  //             if (Animation.allMarkAni.get(mId).startTime < startTime) {
  //                 startTime = Animation.allMarkAni.get(mId).startTime;
  //             }
  //         })
  //         state.previewPath.kfMarks[SuggestBox.currentUniqueIdx].forEach((mId: string) => {
  //             const tmpStart: number = Animation.allMarkAni.get(mId).startTime;
  //             const tmpDuration: number = Animation.allMarkAni.get(mId).totalDuration;
  //             if (tmpStart + tmpDuration > endTime) {
  //                 endTime = tmpStart + tmpDuration;
  //             }
  //         })
  //         //render video view
  //         this.renderVideoRange(startTime, endTime, lottieSpec);
  //     } else {
  //         this.renderVideo(autoPlay, lottieSpec);
  //     }
  // }
  // public static renderPreviewBtns() {
  //     console.log('rendering preview btns: ', state.suggestSpecs);
  //     const containerId = 'previewBtnContainer';
  //     if (document.getElementById(containerId)) {
  //         document.getElementById(containerId).remove();
  //         Array.from(document.getElementsByClassName(TXT_BUBBLE_CLS)).forEach(tb => tb.remove());
  //     }
  //     const padding: number = 10;
  //     const r: number = DEFAULT_BTN_SIZE;
  //     const container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  //     container.id = containerId;
  //     container.classList.add('preview-btn-container', NON_SKETCH_CLS);
  //     const containerW: number = padding * 2 + r * 2;
  //     const containerH: number = state.suggestSpecs.length * 2 * r + (state.suggestSpecs.length + 1) * padding;
  //     const chartBBox: DOMRect = document.getElementById('chartContent').getBoundingClientRect();
  //     container.setAttributeNS(null, 'style', `left:${chartBBox.left - containerW}px; top: ${chartBBox.bottom - containerH}px; border-radius: ${containerW / 2}px`);
  //     container.setAttributeNS(null, 'width', `${containerW}`);
  //     container.setAttributeNS(null, 'height', `${containerH}`);
  //     document.body.appendChild(container);
  //     state.suggestSpecs.forEach((attrAndSpec: IAttrAndSpec, idx: number) => {
  //         const buttonProps: ISVGBtn = {
  //             center: { x: r + padding, y: (idx + 1) * padding + (idx * 2 + 1) * r },
  //             r: r,
  //             appearAni: false,
  //             startFill: LIGHT_COLOR,
  //             endFill: DARK_COLOR,
  //             innerContent: {
  //                 type: BTN_CONTENT_TYPE_STR,
  //                 fontSize: MID_FONT,
  //                 content: `SUG. ${idx + 1}`
  //             },
  //             values: attrAndSpec,
  //             events: []
  //         }
  //         const btn: SVGBtn = new SVGBtn(container, false, buttonProps);
  //         container.appendChild(btn.container);
  //         btn.bindPressing(BTN_TYPE_PREVIEW);
  //     })
  // }
  // public static renderMultiCharts() {
  //     //create container
  //     const multiChartContainer: HTMLDivElement = ViewContent.createMultiChartContainer();
  //     //render charts, remove the visChart id in each chart since it might confuse the compiler
  //     let currentRow: HTMLDivElement;
  //     for (let i = 0, len = state.charts.length; i < len && i < 9; i++) {
  //         const chartItemContainer: HTMLDivElement = document.createElement('div');
  //         chartItemContainer.className = 'chart-item-container';
  //         if (i < 8) {
  //             const chart: string = state.charts[i].replace('id="visChart"', '');
  //             chartItemContainer.innerHTML = chart;
  //         } else {
  //             chartItemContainer.innerHTML = `<p>+${state.charts.length - 8} charts<br>...</p>`;
  //         }
  //         if (i % 3 === 0) {
  //             currentRow = document.createElement('div');
  //             currentRow.className = 'row-chart-container';
  //             multiChartContainer.appendChild(currentRow);
  //         }
  //         currentRow.appendChild(chartItemContainer);
  //     }
  // }
  // public static renderLoading(wrapper: HTMLElement, content: string) {
  //     const loadingBlock: Loading = new Loading();
  //     loadingBlock.createLoading(wrapper, content);
  // }
  // public static removeLoading() {
  //     Loading.removeLoading();
  // }
  // public static switchMode() {
  //     player.togglePlayMode();
  // }
  // public static resizeVideoLayer(): void {
  //     ViewWindow.resizeVideoLayer();
  // }
  // public static renderVideoRange(startTime: number, endTime: number, lottieSpec: any = store.getState().lottieSpec) {
  //     document.getElementById(VIDEO_VIEW_CONTENT_ID).innerHTML = '';
  //     store.dispatch(updateLottieAni(Lottie.loadAnimation({
  //         container: document.getElementById(VIDEO_VIEW_CONTENT_ID),
  //         renderer: 'svg',
  //         loop: false,
  //         autoplay: false,
  //         animationData: lottieSpec // the animation data
  //     })));
  //     //start to play animation
  //     player.playing = true;
  //     console.log('rendering range: ', startTime, endTime);
  //     player.playRange(startTime, endTime);
  // }
  // public static renderVideo(autoPlay: boolean, lottieSpec: any = store.getState().lottieSpec): void {
  //     document.getElementById(VIDEO_VIEW_CONTENT_ID).innerHTML = '';
  //     store.dispatch(updateLottieAni(Lottie.loadAnimation({
  //         container: document.getElementById(VIDEO_VIEW_CONTENT_ID),
  //         renderer: 'svg',
  //         loop: false,
  //         autoplay: false,
  //         animationData: lottieSpec // the animation data
  //     })));
  //     //start to play animation
  //     if (autoPlay) {
  //         player.playing = true;
  //         store.dispatch(updatePlaying(true));
  //     }
  // }
  // public static renderKfContainerSliders(kfgSize: ISize) {
  //     //reset the transform of kfcontainer
  //     kfContainer.resetScroll();
  //     kfContainer.updateKfSlider(kfgSize);
  // }
  // public static renderStaticKf(staticMarks: string[]) {
  //     //reset
  //     document.getElementById(KF_BG_LAYER).innerHTML = '';
  //     document.getElementById(KF_FG_LAYER).innerHTML = '';
  //     document.getElementById(KF_OMIT_LAYER).innerHTML = '';
  //     const placeHolder: SVGRectElement = <SVGRectElement>createSvgElement({
  //         tag: 'rect', para: {
  //             fill: '#00000000',
  //             width: '1',
  //             height: '18'
  //         }, flag: true
  //     });
  //     document.getElementById(KF_FG_LAYER).appendChild(placeHolder);
  //     KfTrack.reset();
  //     KfGroup.reset();
  //     KfOmit.reset();
  //     const firstTrack: KfTrack = new KfTrack();
  //     firstTrack.createTrack();
  // }
  // public static removeGhostKf(kfgs: IKeyframeGroup[]) {
  //     console.log('removeing ghost: ', kfgs);
  //     const resultKfgs: IKeyframeGroup[] = [];
  //     kfgs.forEach((kfg: IKeyframeGroup) => {
  //         if (kfg != null) {
  //             var stack: IKeyframeGroup[] = [];
  //             stack.push(kfg);
  //             while (stack.length != 0) {
  //                 const tmpKfg: IKeyframeGroup = stack.pop();
  //                 if (tmpKfg.keyframes.length > 0) {
  //                     tmpKfg.keyframes = tmpKfg.keyframes.filter((IKF: IKeyframe) => {
  //                         return !IKF.isGhost;
  //                     })
  //                 }
  //                 const children: IKeyframeGroup[] = tmpKfg.children;
  //                 for (var i = children.length - 1; i >= 0; i--)
  //                     stack.push(children[i]);
  //             }
  //         }
  //     })
  // }
  // public static removeRedundentKfs(kfgs: IKeyframeGroup[]) {
  //     kfgs.forEach((kfg: IKeyframeGroup) => {
  //         if (kfg != null) {
  //             var stack: IKeyframeGroup[] = [];
  //             stack.push(kfg);
  //             while (stack.length != 0) {
  //                 const tmpKfg: IKeyframeGroup = stack.pop();
  //                 if (tmpKfg.keyframes.length > 0) {
  //                     const recorder: string[][] = [];
  //                     const tmpKfs: IKeyframe[] = [];
  //                     tmpKfg.keyframes.forEach((IKF: IKeyframe) => {
  //                         if (!Array2DItem(recorder, IKF.marksThisKf)) {
  //                             recorder.push(IKF.marksThisKf);
  //                             tmpKfs.push(IKF);
  //                         }
  //                     })
  //                     tmpKfg.keyframes = tmpKfs;
  //                 }
  //                 const children: IKeyframeGroup[] = tmpKfg.children;
  //                 for (var i = children.length - 1; i >= 0; i--)
  //                     stack.push(children[i]);
  //             }
  //         }
  //     })
  // }
  // public static renderKeyframeTracks(kfgs: IKeyframeGroup[]): void {
  //     this.removeRedundentKfs(kfgs);
  //     console.log('after remove ghost: ', kfgs);
  //     // if (state.charts.length === 1) {
  //     //save kf group info
  //     kfgs.forEach((kfg: IKeyframeGroup) => {
  //         KfGroup.allAniGroupInfo.set(kfg.aniId, kfg);
  //     })
  //     kfgs.forEach((kfg: IKeyframeGroup, i: number) => {
  //         KfGroup.leafLevel = 0;
  //         let treeLevel = 0;//use this to decide the background color of each group
  //         //top-down to init group and kf
  //         const rootGroup: KfGroup = this.renderKeyframeGroup(0, kfgs[i - 1], 1, kfg, treeLevel);
  //         //bottom-up to update size and position
  //         // rootGroup.updateGroupPosiAndSize([...KfTrack.aniTrackMapping.get(rootGroup.aniId)][0].availableInsert, 0, false, true);
  //         KfGroup.allAniGroups.set(rootGroup.aniId, rootGroup);
  //         const endKf: KfItem = rootGroup.findLastKf();
  //         Reducer.triger(action.UPDATE_HIGHLIGHT_KF, endKf);
  //     })
  //     // } else {
  //     //     const rootGroup: KfGroup = this.renderKeyframeGroup(0, undefined, 1, kfgs[0], 0);
  //     //     // rootGroup.updateGroupPosiAndSize([...KfTrack.aniTrackMapping.get(rootGroup.aniId)][0].availableInsert, 0, false, true);
  //     //     KfGroup.allAniGroups.set(rootGroup.aniId, rootGroup);
  //     // }
  //     //update align id
  //     // KfGroup.allAniGroups.forEach((tmpAniGroup: KfGroup, tmpAniId: string) => {
  //     //     if (typeof tmpAniGroup.alignTarget !== 'undefined') {
  //     //         KfGroup.allAniGroups.forEach((tmpAniGroup2: KfGroup, tmpAniId2: string) => {
  //     //             if (tmpAniGroup2.alignId === tmpAniGroup.alignTarget) {
  //     //                 KfGroup.allAniGroups.get(tmpAniId2).alignId = tmpAniGroup2.aniId;
  //     //                 KfGroup.allAniGroups.get(tmpAniId).alignTarget = tmpAniGroup2.aniId;
  //     //             }
  //     //         })
  //     //     }
  //     // })
  //     const rootGroupBBox: DOMRect = document.getElementById(KF_FG_LAYER).getBoundingClientRect();
  //     Reducer.triger(action.UPDATE_KEYFRAME_CONTAINER_SLIDER, { width: rootGroupBBox.width, height: rootGroupBBox.height });
  //     Reducer.triger(action.KEYFRAME_ZOOM_LEVEL, store.getState().kfZoomLevel);
  //     store.dispatch(updateLoading({ isLoading: false }));
  //     // Reducer.triger(action.UPDATE_LOADING_STATUS, { il: false });
  // }
  // public static renderKeyframeGroup(kfgIdx: number, previousKfg: IKeyframeGroup, totalKfgNum: number, kfg: IKeyframeGroup, treeLevel: number, parentObj?: KfGroup): KfGroup {
  //     console.log('rendering kfg:', kfg);
  //     //draw group container
  //     let kfGroup: KfGroup = new KfGroup();
  //     if (kfgIdx === 0 || kfgIdx === 1 || kfgIdx === totalKfgNum - 1) {
  //         let targetTrack: KfTrack; //foreground of the track used to put the keyframe group
  //         if (kfg.newTrack) {
  //             //judge whether the new track is already in this animation
  //             if (typeof parentObj !== 'undefined') {
  //                 let lastChild: KfGroup;
  //                 for (let i = parentObj.children.length - 1; i >= 0; i--) {
  //                     if (parentObj.children[i] instanceof KfGroup) {
  //                         lastChild = <KfGroup>parentObj.children[i];
  //                         break;
  //                     }
  //                 }
  //                 let allTracksThisAni: KfTrack[] = [...KfTrack.aniTrackMapping.get(kfg.aniId)];
  //                 let lastTrack: KfTrack = KfTrack.allTracks.get(lastChild.targetTrackId);
  //                 if (typeof lastTrack !== 'undefined') {
  //                     allTracksThisAni.forEach((kft: KfTrack) => {
  //                         if (kft.trackPosiY - lastTrack.trackPosiY > 0 && kft.trackPosiY - lastTrack.trackPosiY <= TRACK_HEIGHT) {
  //                             targetTrack = kft;
  //                         }
  //                     })
  //                 }
  //                 if (typeof targetTrack === 'undefined') {
  //                     targetTrack = new KfTrack();
  //                     let createFakeTrack: boolean = false;
  //                     if (typeof kfg.merge !== 'undefined') {
  //                         createFakeTrack = kfg.merge;
  //                     }
  //                     targetTrack.createTrack(createFakeTrack);
  //                 }
  //             } else {
  //                 targetTrack = new KfTrack();
  //                 let createFakeTrack: boolean = false;
  //                 if (typeof kfg.merge !== 'undefined') {
  //                     createFakeTrack = kfg.merge;
  //                 }
  //                 targetTrack.createTrack(createFakeTrack);
  //             }
  //         } else {
  //             if (typeof KfTrack.aniTrackMapping.get(kfg.aniId) !== 'undefined') {
  //                 targetTrack = [...KfTrack.aniTrackMapping.get(kfg.aniId)][0];//this is the group within an existing animation
  //             } else {
  //                 //target track is the one with the max available insert
  //                 let maxAvailableInsert: number = 0;
  //                 KfTrack.allTracks.forEach((kft: KfTrack, trackId: string) => {
  //                     if (kft.availableInsert >= maxAvailableInsert) {
  //                         maxAvailableInsert = kft.availableInsert;
  //                         targetTrack = kft;
  //                     }
  //                 })
  //             }
  //         }
  //         if (typeof KfTrack.aniTrackMapping.get(kfg.aniId) === 'undefined') {
  //             KfTrack.aniTrackMapping.set(kfg.aniId, new Set());
  //         }
  //         KfTrack.aniTrackMapping.get(kfg.aniId).add(targetTrack);
  //         let minTrackPosiYThisGroup: number = [...KfTrack.aniTrackMapping.get(kfg.aniId)][0].trackPosiY;
  //         //check whether this is the group of animation, and whether to add a plus button or not
  //         let plusBtn: PlusBtn, addedPlusBtn: boolean = false;
  //         if (treeLevel === 0) {//this is the root group
  //             //find the keyframes of the first group
  //             const tmpKfs: IKeyframe[] = Util.findFirstKfs(kfg);
  //             let [addingPlusBtn, acceptableMarkClasses] = PlusBtn.detectAdding(kfg, tmpKfs);
  //             if (addingPlusBtn) {
  //                 addedPlusBtn = addingPlusBtn;
  //                 plusBtn = new PlusBtn()
  //                 plusBtn.createBtn(kfGroup, tmpKfs, targetTrack, targetTrack.availableInsert, { width: KF_WIDTH - KF_W_STEP, height: KF_HEIGHT - 2 * KF_H_STEP }, acceptableMarkClasses);
  //                 targetTrack.availableInsert += PlusBtn.PADDING * 4 + PlusBtn.BTN_SIZE;
  //             }
  //         }
  //         const previousAniId: string = typeof previousKfg === 'undefined' ? '' : previousKfg.aniId
  //         kfGroup.createGroup(kfg, previousAniId, parentObj ? parentObj : targetTrack, targetTrack.trackPosiY - minTrackPosiYThisGroup, treeLevel, targetTrack.trackId);
  //         if (typeof parentObj !== 'undefined') {
  //             parentObj.children.push(kfGroup);
  //         }
  //         if (addedPlusBtn) {
  //             plusBtn.aniId = kfGroup.aniId;
  //             PlusBtn.plusBtnMapping.set(plusBtn.aniId, plusBtn);
  //             if (treeLevel === 0) {
  //                 plusBtn.fakeKfg.marks = kfGroup.marks;
  //                 plusBtn.fakeKfg.aniId = kfGroup.aniId;
  //             }
  //         }
  //     } else if (totalKfgNum > 3 && kfgIdx === totalKfgNum - 2) {
  //         const preChild = parentObj.children[1];
  //         const preChildTransX: number = jsTool.extractTransNums(preChild.container.getAttributeNS(null, 'transform')).x;
  //         console.log('pre child group x: ', preChild, preChild.container.getAttributeNS(null, 'transform'), preChild.totalWidth);
  //         let kfOmit: KfOmit = new KfOmit();
  //         kfOmit.createOmit(KfOmit.KF_GROUP_OMIT, preChildTransX + preChild.totalWidth, totalKfgNum - 3, parentObj, false, false, (KF_HEIGHT - GROUP_TITLE_HEIHGT * (<KfGroup | KfItem>preChild).treeLevel) / 2);
  //         parentObj.children.push(kfOmit);//why comment this out!!!!
  //         // kfOmit.idxInGroup = parentObj.children.length - 1;
  //         // parentObj.kfOmits.push(kfOmit);
  //     }
  //     treeLevel++;
  //     if (treeLevel > KfGroup.leafLevel) {
  //         KfGroup.leafLevel = treeLevel;
  //     }
  //     if (kfg.keyframes.length > 0) {
  //         kfGroup.kfNum = kfg.keyframes.length;
  //         //choose the keyframes to draw
  //         let alignWithAnis: Map<string, number[]> = new Map();
  //         let alignToAni: number[] = [];
  //         kfg.keyframes.forEach((k: any, i: number) => {
  //             if (typeof k.alignWith !== 'undefined') {
  //                 k.alignWith.forEach((aniId: string) => {
  //                     if (typeof alignWithAnis.get(aniId) === 'undefined') {
  //                         alignWithAnis.set(aniId, [100000, 0]);
  //                     }
  //                     if (i < alignWithAnis.get(aniId)[0]) {
  //                         alignWithAnis.get(aniId)[0] = i;
  //                     }
  //                     if (i > alignWithAnis.get(aniId)[1]) {
  //                         alignWithAnis.get(aniId)[1] = i;
  //                     }
  //                 })
  //             } else if (typeof k.alignTo !== 'undefined') {
  //                 if (typeof KfItem.allKfItems.get(k.alignTo) !== 'undefined') {
  //                     if (KfItem.allKfItems.get(k.alignTo).rendered) {
  //                         alignToAni.push(i);
  //                     }
  //                 }
  //             }
  //         })
  //         let kfIdxToDraw: number[] = [0, 1, kfg.keyframes.length - 1];
  //         let isAlignWith: number = 0;//0 -> neither align with nor align to, 1 -> align with, 2 -> align to
  //         let kfOmitType: string = KfOmit.KF_OMIT;
  //         let omitPattern: IOmitPattern[] = [];
  //         //this group is the align target
  //         if (alignWithAnis.size > 0) {
  //             isAlignWith = 1;
  //             kfOmitType = KfOmit.KF_ALIGN;
  //             omitPattern.push({
  //                 merge: typeof kfg.merge === 'undefined' ? false : kfg.merge,
  //                 timing: kfg.timingRef,
  //                 hasOffset: kfg.offsetIcon,
  //                 hasDuration: true
  //             })
  //             alignWithAnis.forEach((se: number[], aniId: string) => {
  //                 const tmpKfg: IKeyframeGroup = KfGroup.allAniGroupInfo.get(aniId);
  //                 omitPattern.push({
  //                     merge: typeof tmpKfg.merge === 'undefined' ? false : tmpKfg.merge,
  //                     timing: tmpKfg.timingRef,
  //                     hasOffset: tmpKfg.offsetIcon,
  //                     hasDuration: true
  //                 });
  //                 kfIdxToDraw.push(se[0]);
  //                 kfIdxToDraw.push(se[1]);
  //                 if (se[0] + 1 < se[1]) {
  //                     kfIdxToDraw.push(se[0] + 1);
  //                 }
  //             })
  //         } else if (alignToAni.length > 0) {
  //             //this group aligns to other group
  //             isAlignWith = 2;
  //             kfIdxToDraw = [...kfIdxToDraw, ...alignToAni];
  //         }
  //         kfIdxToDraw = [...new Set(kfIdxToDraw)].sort((a: number, b: number) => a - b);
  //         //rendering kf
  //         //check whether there should be a plus btn
  //         let kfPosiX = kfGroup.offsetWidth;
  //         kfg.keyframes.forEach((k: IKeyframe, i: number) => {
  //             //whether to draw this kf or not
  //             let kfOmit: KfOmit;
  //             if (kfIdxToDraw.includes(i)) {
  //                 //whether to draw '...'
  //                 if (i > 0 && kfIdxToDraw[kfIdxToDraw.indexOf(i) - 1] !== i - 1) {
  //                     const omitNum: number = i - kfIdxToDraw[kfIdxToDraw.indexOf(i) - 1] - 1;
  //                     if (omitNum > 0) {
  //                         kfOmit = new KfOmit();
  //                         if (kfOmitType === KfOmit.KF_ALIGN) {
  //                             kfOmit.omitPattern = omitPattern;
  //                         }
  //                         if (kfg.keyframes[1].hiddenDurationIcon) {
  //                             kfPosiX += (<KfItem>kfGroup.children[kfGroup.children.length - 1]).durationWidth;
  //                         }
  //                         kfOmit.createOmit(kfOmitType, kfPosiX, omitNum, kfGroup, kfg.keyframes[1].delayIcon, kfg.keyframes[1].durationIcon, (<KfItem>kfGroup.children[1]).kfHeight / 2);
  //                         kfGroup.children.push(kfOmit);
  //                         // kfOmit.idxInGroup = kfGroup.children.length - 1;
  //                         // kfGroup.kfOmits.push(kfOmit);
  //                         kfPosiX += kfOmit.totalWidth;
  //                     }
  //                 }
  //                 //draw render
  //                 const kfItem: KfItem = new KfItem();
  //                 let targetSize: ISize = { width: 0, height: 0 }
  //                 if (isAlignWith === 2) {
  //                     const tmpAlignToKf: KfItem = KfItem.allKfItems.get(k.alignTo);
  //                     if (typeof tmpAlignToKf !== 'undefined') {
  //                         if (tmpAlignToKf.rendered) {
  //                             const alignedKf: DOMRect = tmpAlignToKf.kfBg.getBoundingClientRect();//fixed
  //                             targetSize.width = alignedKf.width / store.getState().kfZoomLevel;
  //                             targetSize.height = alignedKf.height / store.getState().kfZoomLevel;
  //                         }
  //                     }
  //                     kfItem.createItem(k, treeLevel, kfGroup, kfPosiX, targetSize);
  //                 } else {
  //                     kfItem.createItem(k, treeLevel, kfGroup, kfPosiX);
  //                 }
  //                 if (typeof kfOmit !== 'undefined') {
  //                     kfItem.preOmit = kfOmit;
  //                 }
  //                 // KfItem.allKfItems.set(k.id, kfItem);
  //                 kfGroup.children.push(kfItem);
  //                 // kfItem.idxInGroup = kfGroup.children.length - 1;
  //                 kfPosiX += kfItem.totalWidth;
  //             }
  //         })
  //     } else if (kfg.children.length > 0) {
  //         //rendering kf group
  //         kfg.children.forEach((c: any, i: number) => {
  //             const tmpKfGroup: KfGroup = this.renderKeyframeGroup(i, kfg.children[i - 1], kfg.children.length, c, treeLevel, kfGroup);
  //             // kfGroup.children.push(tmpKfGroup);
  //             // tmpKfGroup.idxInGroup = kfGroup.children.length - 1;
  //             // kfGroup.kfNum += tmpKfGroup.kfNum;
  //         });
  //     }
  //     return kfGroup;
  // }
  // public static renderDataAttrs(sdaArr: ISortDataAttr[]): void {
  //     if (sdaArr.length > 0) {
  //         // document.getElementById('attrBtnContainer').innerHTML = '';
  //         // document.getElementById('sortInputContainer').innerHTML = '';
  //         // sdaArr.forEach(sda => {
  //         //     if (sda.attr !== 'markId') {
  //         //         const attrBtn: AttrBtn = new AttrBtn();
  //         //         attrBtn.createAttrBtn(sda.attr);
  //         //         document.getElementById('attrBtnContainer').appendChild(attrBtn.btn);
  //         //         const attrSort: AttrSort = new AttrSort();
  //         //         attrSort.createAttrSort(sda.attr);
  //         //         document.getElementById('sortInputContainer').appendChild(attrSort.selectInput);
  //         //     }
  //         // })
  //     }
  // }
  // public static renderDataMenu(da: string[]) {
  //     const dataMenu = document.getElementById(DATA_MENU_ID);
  //     console.log('rendering data menu: ', da, dataMenu);
  //     if (dataMenu !== null) {
  //         dataMenu.remove();
  //     }
  //     // if (dataMenu === null) {
  //     const dataMenuCenter: ICoord = {
  //         x: FIRST_LEVEL_BTN_SIZE_BIG + 10,
  //         y: FIRST_LEVEL_BTN_SIZE_BIG + 40 + NAV_HEIGHT
  //     }
  //     const menuList: ISubMenuItem[] = da.map(a => {
  //         const dataVals = new Set();
  //         state.dataTable.forEach((val: IDataItem, mId: string) => {
  //             if (a === 'markId') {
  //                 dataVals.add(<never>mId)
  //             } else {
  //                 dataVals.add(<never>val[a])
  //             }
  //         })
  //         return {
  //             type: BTN_CONTENT_TYPE_STR,
  //             content: a,
  //             value: <string[] | number[]>[...dataVals],
  //             buttonActionType: BTN_TYPE_DATA,
  //             // evts: [{
  //             //     type: CANCEL_DATA_SELECT, func: (e: any) => {
  //             //         console.log(e.target);
  //             //         if (e.direction === 8) {//up
  //             //             console.log('canceling data selection');
  //             //         } else {
  //             //             console.log('error recog');
  //             //         }
  //             //     }
  //             // }]
  //             evts: [{ type: 'pointerdown', func: () => { console.log('test button') } }]
  //         }
  //     })
  //     const dataMenuStruct: IMenuItem = {
  //         type: BTN_CONTENT_TYPE_ICON,
  //         content: DATA_ICON,
  //         theme: LIGHT_THEME,
  //         buttonActionType: BTN_TYPE_MAIN,
  //         subMenu: menuList
  //     }
  //     const menu: ListMenu = new ListMenu({ menuCenter: dataMenuCenter, menuStruct: dataMenuStruct, showSubMenu: false, floating: true });
  //     menu.container.setAttributeNS(null, 'id', DATA_MENU_ID);
  //     document.getElementById(CHART_VIEW_CONTENT_ID).parentNode.appendChild(menu.options.targetSVG);
  //     // } else {
  //     // }
  // }
  // /**
  //  * set the selection tool status
  //  * @param t
  //  */
  // public static renderChartTool(t: string): void {
  //     switch (t) {
  //         case SINGLE:
  //             // (<HTMLElement>document.getElementsByClassName('arrow-icon')[0]).click();
  //             break;
  //         case LASSO:
  //             (<HTMLElement>document.getElementsByClassName('lasso-icon')[0]).click();
  //             break;
  //         case DATA:
  //             (<HTMLElement>document.getElementsByClassName('table-icon')[0]).click();
  //             break;
  //     }
  // }
  // public static zoomKfContainer(zl: number): void {
  //     kfContainer.kfTrackScaleContainer.setAttributeNS(null, 'transform', `scale(${zl}, ${zl})`);
  //     //set visbility of chart thumbnails
  //     if (zl === MAX_ZOOM_LEVEL) {
  //         zl -= 0.001;
  //     }
  //     const shownThumbnail: number = Math.floor((zl - MIN_ZOOM_LEVEL) / ((MAX_ZOOM_LEVEL - MIN_ZOOM_LEVEL) / (CHART_THUMBNAIL_ZOOM_LEVEL / 2)));
  //     const kfZoomLevel: number = Math.floor((zl - MIN_ZOOM_LEVEL) / ((MAX_ZOOM_LEVEL - MIN_ZOOM_LEVEL) / CHART_THUMBNAIL_ZOOM_LEVEL));
  //     let sortedAniGroupAniIds: string[] = [...KfGroup.allAniGroups.keys()].sort((a: string, b: string) => {
  //         if (KfGroup.allAniGroups.get(a).alignType === Animation.alignTarget.withEle && KfGroup.allAniGroups.get(b).alignType !== Animation.alignTarget.withEle) {
  //             return 1;
  //         } else if (KfGroup.allAniGroups.get(a).alignType !== Animation.alignTarget.withEle && KfGroup.allAniGroups.get(b).alignType === Animation.alignTarget.withEle) {
  //             return -1;
  //         } else if (KfGroup.allAniGroups.get(a).alignType === Animation.alignTarget.withEle && KfGroup.allAniGroups.get(b).alignType === Animation.alignTarget.withEle) {
  //             const bbox1: DOMRect = KfGroup.allAniGroups.get(a).container.getBoundingClientRect();
  //             const bbox2: DOMRect = KfGroup.allAniGroups.get(b).container.getBoundingClientRect();
  //             return bbox1.top - bbox2.top;
  //         } else {
  //             return 0;
  //         }
  //         return -1;
  //     })
  //     //set visibility of kfgroups and kfitems
  //     sortedAniGroupAniIds.forEach((aniKfGroupAniId: string) => {
  //         const aniKfGroup: KfGroup = KfGroup.allAniGroups.get(aniKfGroupAniId);
  //         aniKfGroup.zoomGroup(kfZoomLevel, shownThumbnail);
  //         if (aniKfGroup.alignType === Animation.alignTarget.withEle) {//check kf positions
  //             aniKfGroup.updateAlignGroupKfPosis();
  //         }
  //     })
  // }
  // /**
  //  * set the style of the selected marks and the highlight box
  //  * @param selection
  //  */
  // public static renderSelectedMarks(): void {
  //     let allSelectedMarks: string[] = [];
  //     state.selectedMarks.forEach((mIds: string[], className: string) => {
  //         allSelectedMarks = [...allSelectedMarks, ...mIds];
  //     })
  //     let selectionBox: HTMLElement = document.getElementById(SELECTION_FRAME);
  //     //find the boundary of the selected marks
  //     let minX = 10000, minY = 10000, maxX = -10000, maxY = -10000;
  //     Array.from(document.getElementsByClassName('mark')).forEach((m: HTMLElement) => {
  //         const markId: string = m.id;
  //         if (allSelectedMarks.includes(markId)) {
  //             m.classList.remove('non-framed-mark');
  //             if (store.getState().selection.includes(markId)) {//this is a selected mark
  //                 const tmpBBox = (<SVGGraphicsElement><unknown>m).getBBox();
  //                 minX = tmpBBox.x < minX ? tmpBBox.x : minX;
  //                 minY = tmpBBox.y < minY ? tmpBBox.y : minY;
  //                 maxX = tmpBBox.x + tmpBBox.width > maxX ? (tmpBBox.x + tmpBBox.width) : maxX;
  //                 maxY = tmpBBox.y + tmpBBox.height > maxY ? (tmpBBox.y + tmpBBox.height) : maxY;
  //             }
  //         } else {//this is not a selected mark
  //             m.classList.add('non-framed-mark');
  //         }
  //     })
  //     if (store.getState().selection.length === 0) {//no mark is selected
  //         if (selectionBox) {
  //             //reset highlightselectionbox
  //             updateProps(selectionBox, {
  //                 x: '0',
  //                 y: '0',
  //                 width: '0',
  //                 height: '0'
  //             })
  //         }
  //         //reset all marks to un-selected
  //         // Array.from(document.getElementsByClassName('non-framed-mark')).forEach((m: HTMLElement) => m.classList.remove('non-framed-mark'))
  //     } else {
  //         if (selectionBox) {
  //             const chartContent: HTMLElement = document.getElementById('chartContent');
  //             const chartContentTrans: ICoord = Util.extractTransNums(chartContent.getAttributeNS(null, 'transform'));
  //             //set the highlightSelectionFrame
  //             updateProps(selectionBox, {
  //                 x: ((minX * store.getState().chartScaleRatio - 5 + chartContentTrans.x)).toString(),
  //                 y: ((minY * store.getState().chartScaleRatio - 5 + chartContentTrans.y)).toString(),
  //                 width: ((maxX - minX) * store.getState().chartScaleRatio + 10).toString(),
  //                 height: ((maxY - minY) * store.getState().chartScaleRatio + 10).toString()
  //             })
  //         }
  //     }
  // }
  // public static renderSuggestedMarks(): void {
  //     console.log('rendering suggested marks: ', state.suggestedMarks);
  //     if (state.suggestedMarks.length === 0) {//there are no marks to be confirmed
  //         Array.from(document.getElementsByClassName(SUGGESTION_FRAME_CLS)).forEach((sf: HTMLElement) => {
  //             sf.remove();
  //         })
  //     } else {
  //         const that = this;
  //         const suggestionBox: SVGRectElement = createDashBox();
  //         let minX = 10000, minY = 10000, maxX = -10000, maxY = -10000;
  //         Array.from(document.getElementsByClassName('mark')).forEach((m: HTMLElement) => {
  //             if (state.suggestedMarks.includes(m.id)) {
  //                 m.classList.add('suggest-mark');
  //                 const tmpBBox = (<SVGGraphicsElement><unknown>m).getBBox();
  //                 minX = tmpBBox.x < minX ? tmpBBox.x : minX;
  //                 minY = tmpBBox.y < minY ? tmpBBox.y : minY;
  //                 maxX = tmpBBox.x + tmpBBox.width > maxX ? (tmpBBox.x + tmpBBox.width) : maxX;
  //                 maxY = tmpBBox.y + tmpBBox.height > maxY ? (tmpBBox.y + tmpBBox.height) : maxY;
  //             } else {//this is not a selected mark
  //                 m.classList.remove('suggest-mark');
  //             }
  //         })
  //         const chartContent: HTMLElement = document.getElementById('chartContent');
  //         const chartContentTrans: ICoord = Util.extractTransNums(chartContent.getAttributeNS(null, 'transform'));
  //         updateProps(suggestionBox, {
  //             x: `${minX * store.getState().chartScaleRatio - 5 + chartContentTrans.x}`,
  //             y: `${minY * store.getState().chartScaleRatio - 5 + chartContentTrans.y}`,
  //             width: `${(maxX - minX) * store.getState().chartScaleRatio + 10}`,
  //             height: `${(maxY - minY) * store.getState().chartScaleRatio + 10}`
  //         })
  //     }
  // }
  // public static renderMarksToConfirm(): void {
  //     console.log('rendering marks to confirm: ', state.marksToConfirm);
  //     // let suggestionBox: HTMLElement = document.getElementById(SUGGESTION_FRAME);
  //     let allMarksToConfirm: string[] = [];
  //     state.marksToConfirm.forEach((markGroup: string[]) => {
  //         allMarksToConfirm = [...allMarksToConfirm, ...markGroup];
  //     })
  //     if (state.marksToConfirm.length === 0) {//there are no marks to be confirmed
  //         Array.from(document.getElementsByClassName(SUGGESTION_FRAME_CLS)).forEach((sf: HTMLElement) => {
  //             sf.remove();
  //         })
  //     } else {
  //         const that = this;
  //         state.marksToConfirm.forEach((markGroup: string[]) => {
  //             const confirmBox: SVGRectElement = that.createDashBox();
  //             let minX = 10000, minY = 10000, maxX = -10000, maxY = -10000;
  //             Array.from(document.getElementsByClassName('mark')).forEach((m: HTMLElement) => {
  //                 if (markGroup.includes(m.id)) {
  //                     m.classList.add('suggest-mark');
  //                     const tmpBBox = (<SVGGraphicsElement><unknown>m).getBBox();
  //                     minX = tmpBBox.x < minX ? tmpBBox.x : minX;
  //                     minY = tmpBBox.y < minY ? tmpBBox.y : minY;
  //                     maxX = tmpBBox.x + tmpBBox.width > maxX ? (tmpBBox.x + tmpBBox.width) : maxX;
  //                     maxY = tmpBBox.y + tmpBBox.height > maxY ? (tmpBBox.y + tmpBBox.height) : maxY;
  //                 }
  //                 if (!allMarksToConfirm.includes(m.id)) {//this is not a selected mark
  //                     m.classList.remove('suggest-mark');
  //                 }
  //             })
  //             const chartContent: HTMLElement = document.getElementById('chartContent');
  //             const chartContentTrans: ICoord = Util.extractTransNums(chartContent.getAttributeNS(null, 'transform'));
  //             //set the highlightSelectionFrame
  //             updateProps(confirmBox, {
  //                 x: `${minX * store.getState().chartScaleRatio - 5 + chartContentTrans.x}`,
  //                 y: `${minY * store.getState().chartScaleRatio - 5 + chartContentTrans.y}`,
  //                 width: `${(maxX - minX) * store.getState().chartScaleRatio + 10}`,
  //                 height: `${(maxY - minY) * store.getState().chartScaleRatio + 10}`
  //             })
  //         })
  //     }
  // }
  // public static renderActivatedPlusBtn(aniGroupToInsert: string, selectedMarks: string[], orderInfo: IOrderInfo, previousKfs: string[][]) {
  //     console.log('render activate plus button', orderInfo);
  //     this.renderStaticKf([]);
  //     console.log('going to render kfgs!!!!: ', state.keyframeGroups);
  //     this.renderKeyframeTracks(state.keyframeGroups);
  //     // suggestBox.removeSuggestBox();
  //     KfGroup.insertKfAfterSelection(aniGroupToInsert, selectedMarks, orderInfo, previousKfs);
  // }
  // public static renderSketchCanvas(pointerCoord: ICoord) {
  //     if (store.getState().sketching.isSketching) {
  //         sketchCanvas.startDrawing(pointerCoord);
  //     } else {
  //         sketchCanvas.hideCanvas();
  //     }
  // }
  // public static toggleSystemTouch() {
  //     dragging.set({ enable: !state.systemTouch });
  //     zoomChart.set({ enable: !state.systemTouch });
  // }
  // public static renderHighlightKf(oldKf: KfItem, newKf: KfItem) {
  //     if (typeof oldKf !== 'undefined') {
  //         oldKf.isHighlighted = false;
  //     }
  //     if (typeof newKf !== 'undefined') {
  //         newKf.isHighlighted = true;
  //     }
  // }
  // public static voiceListening() {
  //     nav.voiceInput.setInput('I am listening...');
  //     Ava.listen();
  // }
  // public static resetVoice() {
  //     nav.voiceInput.resetInput();
  //     Ava.resetEar();
  // }
}
