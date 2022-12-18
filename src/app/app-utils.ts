import { TimingSpec } from "canis_toolkit";
import { IPath } from "../redux/global-interfaces";
import { store } from "../redux/store";
import { jsTool } from "../util/jsTool";
import CanisGenerator, {
  IAnimationSpec,
  ICanisSpec,
} from "./core/canisGenerator";
import { compareAniAndSelector } from "./core/tool";
import Util from "./core/util";

export const StateModifier = {
  splitCreateOneAni: (
    aniId: string,
    newAniSelector: string,
    attrComb: string[],
    attrValueSort: string[][],
    specCopy?: ICanisSpec
  ) => {
    if (!specCopy) {
      specCopy = JSON.parse(JSON.stringify(store.getState().spec));
    }
    const animations: IAnimationSpec[] = specCopy.animations;

    const targetAni: { chartIdx: string; idSelectors: string[] } =
      Util.extractAniId(aniId);
    for (let i = 0, len = animations.length; i < len; i++) {
      let a: IAnimationSpec = animations[i];
      const tmpSelectors: string[] = Util.extractSelector(a.selector);
      if (
        `${a.chartIdx}` === targetAni.chartIdx &&
        jsTool.identicalArrays(targetAni.idSelectors, tmpSelectors)
      ) {
        // if (`${a.chartIdx}_${a.selector}` === aniId) {
        const newAni: IAnimationSpec = {
          selector: newAniSelector,
          effects: a.effects,
          chartIdx: a.chartIdx,
        };

        if (typeof a.reference !== "undefined") {
          newAni.reference = a.reference;
        }
        if (typeof a.offset !== "undefined") {
          newAni.offset = a.offset;
        }
        if (attrComb.length > 0) {
          CanisGenerator.createGrouping(newAni, attrComb, attrValueSort);
        }

        a.reference = TimingSpec.timingRef.previousEnd;
        CanisGenerator.removeMarksFromSelector(a, newAniSelector.split(", "));
        if (a.selector === "") {
          animations.splice(i, 1);
        }
        animations.splice(i, 0, newAni);
        break;
      }
    }
    return { ...specCopy, animations: animations };
  },
  splitDataNondataAni: (
    aniId: string,
    path: IPath,
    attrValueSort: string[][],
    specCopy?: ICanisSpec
  ) => {
    if (!specCopy) {
      specCopy = JSON.parse(JSON.stringify(store.getState().spec));
    }
    const animations: IAnimationSpec[] = specCopy.animations;

    const dataMarks = [path.firstKfMarks]
      .concat(path.kfMarks)
      .map((x) => x.filter((mid) => Util.filteredDataTable.has(mid)));
    const nonDataMarks = [path.firstKfMarks]
      .concat(path.kfMarks)
      .map((x) => x.filter((mid) => Util.nonDataTable.has(mid)));

    console.log(Util.nonDataTable);
    [
      {
        newAniSelector: dataMarks
          .filter((x) => x.length)
          .map((x) => "#" + x.join(", #"))
          .join(", "),
        attrComb: path.attrComb,
        attrValueSort,
      },
      {
        newAniSelector: nonDataMarks
          .filter((x) => x.length)
          .map((x) => "#" + x.join(", #"))
          .join(", "),
        attrComb: ["clsIdx"],
        attrValueSort: [
          (Util.nonDataValues.get("clsIdx") as string[])
            .filter((x) =>
              nonDataMarks
                .flatMap((x) => x)
                .map((mid) => Util.nonDataTable.get(mid).clsIdx)
                .includes(x)
            )
            .sort(
              (a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10)
            ),
        ],
      },
    ].forEach(({ newAniSelector, attrComb, attrValueSort }, idx) => {
      const targetAni: { chartIdx: string; idSelectors: string[] } =
        Util.extractAniId(aniId);
      for (let i = 0, len = animations.length; i < len; i++) {
        let a: IAnimationSpec = animations[i];
        const tmpSelectors: string[] = Util.extractSelector(a.selector);
        if (
          `${a.chartIdx}` === targetAni.chartIdx &&
          jsTool.identicalArrays(targetAni.idSelectors, tmpSelectors)
        ) {
          // if (`${a.chartIdx}_${a.selector}` === aniId) {
          const newAni: IAnimationSpec = {
            selector: newAniSelector,
            effects: a.effects,
            chartIdx: a.chartIdx,
          };

          if (typeof a.reference !== "undefined") {
            newAni.reference =
              idx === 0 ? a.reference : TimingSpec.timingRef.previousStart;
          }
          if (typeof a.offset !== "undefined") {
            newAni.offset = a.offset;
          }
          console.log("grouping0");

          if (attrComb.length > 0) {
            CanisGenerator.createGrouping(newAni, attrComb, attrValueSort);
          }
          console.log("grouping1");

          a.reference = TimingSpec.timingRef.previousEnd;
          CanisGenerator.removeMarksFromSelector(a, newAniSelector.split(", "));
          if (a.selector === "") {
            animations.splice(i, 1);
          }
          aniId = a.chartIdx + "_" + a.selector;
          animations.splice(i, 0, newAni);
          break;
        }
      }
    });
    return { ...specCopy, animations: animations };
  },
  splitCreateMultiAni: (
    aniId: string,
    path: IPath,
    attrValueSort: string[][],
    specCopy?: ICanisSpec
  ) => {
    //input path info
    const { pathCopy, attrValueSortCopy } = JSON.parse(
      JSON.stringify({
        pathCopy: path,
        attrValueSortCopy: attrValueSort, //wrong!
      })
    ) as { pathCopy: IPath; attrValueSortCopy: string[][] };
    if (!specCopy) {
      specCopy = JSON.parse(JSON.stringify(store.getState().spec));
    }
    //extract marks with same shape
    const shapeAttrIdx: number = pathCopy.attrComb.indexOf("mShape");
    if (shapeAttrIdx >= 0) {
      const shapeMarkMap: Map<string, string[]> = new Map();
      pathCopy.attrComb.splice(shapeAttrIdx, 1);
      attrValueSortCopy.splice(shapeAttrIdx, 1); //get the first

      const kfMarks: string[][] = [pathCopy.firstKfMarks, ...pathCopy.kfMarks];
      pathCopy.sortedAttrValueComb.forEach(
        (attrValueComb: string, idx: number) => {
          const shape: string = attrValueComb.split(",")[shapeAttrIdx];
          if (typeof shapeMarkMap.get(shape) === "undefined") {
            shapeMarkMap.set(shape, []);
          }
          shapeMarkMap.get(shape).push(...kfMarks[idx]);
        }
      );

      const animations: IAnimationSpec[] = specCopy.animations;

      for (let i = 0, len = animations.length; i < len; i++) {
        let a: IAnimationSpec = animations[i];
        let insertIdx: number = i;
        if (a.selector === "") {
          animations.splice(i, 1);
        }
        if (compareAniAndSelector(a, aniId)) {
          console.log("compare_true");

          // if (`${a.chartIdx}_${a.selector}` === aniId) {
          //create multiple animations
          let selectorRecorder: string[] = [];
          let alignTarget: string;
          [...shapeMarkMap].forEach(
            (shapeMarks: [string, string[]], idx: number) => {
              const newSelector: string = `#${shapeMarks[1].join(", #")}`;
              selectorRecorder.push(...newSelector.split(", "));
              const newAni: IAnimationSpec = {
                selector: newSelector,
                effects: a.effects,
                chartIdx: a.chartIdx,
              };
              if (idx === 0) {
                alignTarget = `${newAni.chartIdx}_${newAni.selector}`;
                if (typeof a.reference !== "undefined") {
                  newAni.reference = a.reference;
                }
                if (typeof a.offset !== "undefined") {
                  newAni.offset = a.offset;
                }
                newAni.id = aniId;
              } else {
                newAni.reference = TimingSpec.timingRef.previousEnd;
                if (shapeAttrIdx !== 0) {
                  newAni.align = {
                    target: aniId,
                    type: "element",
                    merge: true,
                  };
                }
                newAni.reference = TimingSpec.timingRef.previousEnd;
                // newAni.align = { target: alignTarget, type: 'element', merge: true };
              }
              if (pathCopy.attrComb.length > 0) {
                CanisGenerator.createGrouping(
                  newAni,
                  pathCopy.attrComb,
                  attrValueSortCopy
                );
              }
              animations.splice(insertIdx, 0, newAni);
              insertIdx++;
            }
          );

          a.reference = TimingSpec.timingRef.previousEnd;
          CanisGenerator.removeMarksFromSelector(a, selectorRecorder);
          if (a.selector === "") {
            animations.splice(i, 1);
          }
          break;
        }
      }
      if(animations[animations.length - 1].selector === ''){
        animations.pop();
      }
      return { ...specCopy, animations: animations };
    } else {
      const shapeMarkMap: Map<string, string[][]> = new Map();
      // if no mShape in list, then brute force the shape
      const kfMarks: string[][] = [pathCopy.firstKfMarks, ...pathCopy.kfMarks];
      const allShapes = (Util.dataValues.get("mShape") as string[]).concat(
        Util.nonDataValues.get("mShape") as string[]
      );

      const markShapeMapping = new Map<string, string>();

      path.lastKfMarks.forEach((mId) => {
        markShapeMapping.set(
          mId,
          (Util.filteredDataTable.get(mId) ?? Util.nonDataTable.get(mId))
            ?.mShape as string
        );
      });

      allShapes.forEach((shape: string, idx: number) => {
        if (typeof shapeMarkMap.get(shape) === "undefined") {
          shapeMarkMap.set(shape, []);
        }
        kfMarks.forEach((kfMark) => {
          shapeMarkMap
            .get(shape)
            .push(kfMark.filter((mId) => markShapeMapping.get(mId) === shape));
        });
      });

      const animations: IAnimationSpec[] = specCopy.animations;

      for (let i = 0, len = animations.length; i < len; i++) {
        let a: IAnimationSpec = animations[i];
        let insertIdx: number = i;
        if (compareAniAndSelector(a, aniId)) {
          console.log("compare_true");

          // if (`${a.chartIdx}_${a.selector}` === aniId) {
          //create multiple animations
          let selectorRecorder: string[] = [];
          let alignTarget: string;
          let realIdx = 0;
          [...shapeMarkMap].forEach(
            (shapeMarks: [string, string[][]], idx: number) => {
              if (!shapeMarks[1].length || !shapeMarks[1][0].length) {
                if (a.selector === "") {
                  animations.splice(i, 1);
                }
                return;
              }
              const newSelector: string = `#${shapeMarks[1]
                .flatMap((x) => x)
                .join(", #")}`;
              selectorRecorder.push(...newSelector.split(", "));
              const newAni: IAnimationSpec = {
                selector: newSelector,
                effects: a.effects,
                chartIdx: a.chartIdx,
              };
              if (realIdx === 0) {
                alignTarget = `${newAni.chartIdx}_${newAni.selector}`;
                if (typeof a.reference !== "undefined") {
                  newAni.reference = a.reference;
                }
                if (typeof a.offset !== "undefined") {
                  newAni.offset = a.offset;
                }
                newAni.id = alignTarget;
              } else {
                newAni.reference = TimingSpec.timingRef.previousStart;
                if (realIdx !== 0) {
                  newAni.align = {
                    target: alignTarget,
                    type: "element",
                    merge: true,
                  };
                }
                // newAni.align = { target: alignTarget, type: 'element', merge: true };
              }
              if (pathCopy.attrComb.length > 0) {
                CanisGenerator.createGrouping(
                  newAni,
                  [
                    "axis-label",
                    "Title",
                    "legend-text",
                    "legend-value",
                    "title",
                    "axis-tick",
                    "axis-domain",
                    "legend-symbol",
                  ].includes(shapeMarks[0])
                    ? ["text"]
                    : pathCopy.attrComb,
                  attrValueSortCopy
                );
              }
              animations.splice(insertIdx, 0, newAni);
              insertIdx++;
              realIdx++;
            }
          );

          a.reference = TimingSpec.timingRef.previousEnd;
          // if (alignTarget) {
          //   a.align = { target: alignTarget, type: "element", merge: true };
          // }
          CanisGenerator.removeMarksFromSelector(a, selectorRecorder);
          if (a.selector === "") {
            animations.splice(i, 1);
          }
          break;
        }
      }
      return { ...specCopy, animations: animations };
    }
  },
  removeAndCreateMulti: (
    aniId: string,
    path: IPath,
    attrValueSort: string[][],
    specCopy?: ICanisSpec
  ) => {
    if (!specCopy) {
      specCopy = JSON.parse(JSON.stringify(store.getState().spec));
    }
    const { pathCopy, attrValueSortCopy } = JSON.parse(
      JSON.stringify({
        pathCopy: path,
        attrValueSortCopy: attrValueSort,
      })
    );
    const shapeAttrIdx: number = pathCopy.attrComb.indexOf("mShape");
    pathCopy.attrComb.splice(shapeAttrIdx, 1);
    attrValueSortCopy.splice(shapeAttrIdx, 1);
    const shapeMarkMap: Map<string, string[]> = new Map();
    const kfMarks: string[][] = [pathCopy.firstKfMarks, ...pathCopy.kfMarks];
    pathCopy.sortedAttrValueComb.forEach(
      (attrValueComb: string, idx: number) => {
        const shape: string = attrValueComb.split(",")[shapeAttrIdx];
        if (typeof shapeMarkMap.get(shape) === "undefined") {
          shapeMarkMap.set(shape, []);
        }
        shapeMarkMap.get(shape).push(...kfMarks[idx]);
      }
    );
    const animations: IAnimationSpec[] = specCopy.animations;
    for (let i = 0, len = animations.length; i < len; i++) {
      let a: IAnimationSpec = animations[i];
      let insertIdx: number = i;
      if (`${a.chartIdx}_${a.selector}` === aniId) {
        // if(compareAniAndSelector(a, aniId)){
        //create multiple animations
        let selectorRecorder: string[] = [];
        [...shapeMarkMap].forEach(
          (shapeMarks: [string, string[]], idx: number) => {
            const newSelector: string = `#${shapeMarks[1].join(", #")}`;
            selectorRecorder.push(...newSelector.split(", "));
            const newAni: IAnimationSpec = {
              selector: newSelector,
              effects: a.effects,
              chartIdx: a.chartIdx,
            };
            if (idx === 0) {
              if (typeof a.reference !== "undefined") {
                newAni.reference = a.reference;
              }
              if (typeof a.offset !== "undefined") {
                newAni.offset = a.offset;
              }
              newAni.id = aniId;
            } else {
              newAni.reference = TimingSpec.timingRef.previousEnd;
              if (shapeAttrIdx > 0) {
                newAni.align = { target: aniId, type: "element", merge: true };
              }
            }
            if (pathCopy.attrComb.length > 0) {
              CanisGenerator.createGrouping(
                newAni,
                pathCopy.attrComb,
                attrValueSortCopy
              );
            }
            animations.splice(insertIdx, 0, newAni);
            insertIdx++;
          }
        );
        animations.splice(insertIdx, 1);
        break;
      }
    }
    return { ...specCopy, animations: animations };
  },
  updateGrouping: (
    aniId: string,
    attrComb: string[],
    attrValueSort: string[][],
    specCopy?: ICanisSpec
  ) => {
    if (!specCopy) {
      specCopy = JSON.parse(JSON.stringify(store.getState().spec));
    }
    const { attrCombCopy, attrValueSortCopy } = JSON.parse(
      JSON.stringify({
        attrCombCopy: attrComb,
        attrValueSortCopy: attrValueSort,
      })
    );
    const animations: IAnimationSpec[] = specCopy.animations;
    animations.forEach((a: IAnimationSpec) => {
      if (`${a.chartIdx}_${a.selector}` === aniId) {
        CanisGenerator.updateGrouping(a, attrCombCopy, attrValueSortCopy);
      }
    });
    return { ...specCopy, animations: animations };
  },
  removeGrouping: (aniId: string, specCopy?: ICanisSpec) => {
    if (!specCopy) {
      specCopy = JSON.parse(JSON.stringify(store.getState().spec));
    }
    const animations: IAnimationSpec[] = specCopy.animations;
    for (let i = 0, len = animations.length; i < len; i++) {
      let a: IAnimationSpec = animations[i];
      if (`${a.chartIdx}_${a.selector}` === aniId) {
        delete a.grouping;
        break;
      }
    }
    return { ...specCopy, animations: animations };
  },
  appendGrouping: (
    aniId: string,
    attrComb: string[],
    attrValueSort: string[][],
    specCopy?: ICanisSpec
  ) => {
    if (!specCopy) {
      specCopy = JSON.parse(JSON.stringify(store.getState().spec));
    }
    const { attrCombCopy, attrValueSortCopy } = JSON.parse(
      JSON.stringify({
        attrCombCopy: attrComb,
        attrValueSortCopy: attrValueSort,
      })
    );
    const animations: IAnimationSpec[] = specCopy.animations;
    for (let i = 0, len = animations.length; i < len; i++) {
      let a: IAnimationSpec = animations[i];
      if (`${a.chartIdx}_${a.selector}` === aniId) {
        CanisGenerator.appendGrouping(a, attrCombCopy, attrValueSortCopy);
        break;
      }
    }
    return { ...specCopy, animations: animations };
  },
};
