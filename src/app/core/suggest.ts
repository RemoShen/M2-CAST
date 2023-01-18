import { ChartSpec } from "canis_toolkit";
import Util from "./util";
import KfGroup from "../../redux/views/vl/kfGroup";
import {
  CATEGORICAL_ATTR,
  EFFECTIVENESS_RANKING,
} from "../consts";
import { ICanisSpec } from "./canisGenerator";
import KfItem from "../../redux/views/vl/kfItem";
import { suggestBox } from "../../redux/views/vl/suggestBox";
import { StateModifier } from "../app-utils";
import {
  ASSCENDING_ORDER,
  DESCENDING_ORDER,
  IOrderInfo,
} from "../../util/markSelection";
import {
  IPath,
  IAttrAndSpec,
  IDataItem,
  IKeyframe,
} from "../../redux/global-interfaces";
import { store } from "../../redux/store";
import {
  updateSelectMarks,
  updateSelectMarksStep,
} from "../../redux/action/chartAction";
import { jsTool } from "../../util/jsTool";
import { updateSuggestSpecs } from "../../redux/action/videoAction";
import {
  APPEND_SPEC_GROUPING,
  REMOVE_CREATE_MULTI_ANI,
  SPLIT_CREATE_MULTI_ANI,
  SPLIT_CREATE_ONE_ANI,
  SPLIT_DATA_NONDATA_ANI,
  UPDATE_SPEC_GROUPING,
} from "../../redux/action/canisAction";
import { util } from "webpack";

export default class Suggest {
  static NUMERIC_CAT_ATTRS: string[] = [
    "Year",
    "year",
    "Month",
    "month",
    "Day",
    "day",
  ];
  static allPaths: IPath[] = [];
  static pathsWithUniqueNextKfs: IPath[];
  static tmpSpecs: IAttrAndSpec[] = [];

  public static generateSpecsFromSuggestion(
    targetKfg: KfGroup,
    selectedMarks: string[],
    filteredPaths: IPath[]
  ) {
    this.tmpSpecs = [];
    if (filteredPaths[0] != undefined) {
      filteredPaths.forEach((tmpPath: IPath) => {
        this.pathToSpec(
          JSON.parse(JSON.stringify(tmpPath)),
          (<KfItem>targetKfg.children[0]).aniId,
          selectedMarks,
          (<KfItem>targetKfg.children[0]).parentObj.marksThisAni(),
          false,
          false
        );
      });
    }
    store.dispatchSystem(updateSuggestSpecs(this.tmpSpecs));
  }

  /**
   * find attributes with different values in the given mark arrays
   * @param markIdArr1
   * @param markIdArr2
   * @param dataEncode
   */
  public static findAttrWithDiffValue(
    markIdArr1: string[],
    markIdArr2: string[],
    dataEncode: boolean
  ): string[] {
    //markIdArr1: first kf data marks   markIdArr2: last kf data marks
    let attrDiffValues: string[] = [];
    const dataAttrArr: string[] = dataEncode
      ? Util.dataAttrs
      : Util.nonDataAttrs;
    const dataTable: Map<string, IDataItem> = dataEncode
      ? Util.filteredDataTable
      : Util.nonDataTable;
    dataAttrArr.forEach((aName: string) => {
      if (Util.attrType[aName] === CATEGORICAL_ATTR) {
        let valueRecord1: Set<string> = new Set(),
          valueRecord2: Set<string> = new Set();
        markIdArr1.forEach((mId: string) => {
          valueRecord1.add(`${dataTable.get(mId)[aName]}`);
        });
        markIdArr2.forEach((mId: string) => {
          valueRecord2.add(`${dataTable.get(mId)[aName]}`);
        });
        if (!jsTool.identicalArrays([...valueRecord1], [...valueRecord2])) {
          attrDiffValues.push(aName);
        }
      }
    });

    return attrDiffValues;
  }

  /**
   * find attributes with different values in the given mark arrays with both data and non-data elements
   * @param markIdArr1
   * @param markIdArr2
   */
  public static findAttrWithMixedDiffValue(
    markIdArr1: string[],
    markIdArr2: string[]
  ): string[] {
    let attrDiffValues: string[] = [];
    const dataAttrArr: string[] = Util.dataAttrs;

    const markIdCategories1: { dataMarks: string[]; nonDataMarks: string[] } = {
      dataMarks: [],
      nonDataMarks: [],
    };
    const markIdCategories2: { dataMarks: string[]; nonDataMarks: string[] } = {
      dataMarks: [],
      nonDataMarks: [],
    };

    markIdArr1.forEach((mId) => {
      if (Util.filteredDataTable.has(mId)) {
        markIdCategories1.dataMarks.push(mId);
      } else {
        const datum = Util.nonDataTable.get(mId);
        if (datum.text !== undefined) {
          dataAttrArr.forEach((aName: string) => {
            if (
              (Util.dataValues.get(aName) as (string | number)[]).includes(
                datum.text
              )
            ) {
              datum[aName] = datum.text;
            }
          });
        }
        markIdCategories1.nonDataMarks.push(mId);
      }
    });
    markIdArr2.forEach((mId) => {
      if (Util.filteredDataTable.has(mId)) {
        markIdCategories2.dataMarks.push(mId);
      } else {
        const datum = Util.nonDataTable.get(mId);
        if (datum.text !== undefined) {
          dataAttrArr.forEach((aName: string) => {
            if (
              (Util.dataValues.get(aName) as (string | number)[]).includes(
                datum.text
              )
            ) {
              datum[aName] = datum.text;
            }
          });
        }
        markIdCategories2.nonDataMarks.push(mId);
      }
    });

    dataAttrArr.forEach((aName: string) => {
      if (Util.attrType[aName] === CATEGORICAL_ATTR) {
        let valueRecord1: Set<string> = new Set(),
          valueRecord2: Set<string> = new Set();
        markIdCategories1.dataMarks.forEach((mId: string) => {
          valueRecord1.add(`${Util.filteredDataTable.get(mId)[aName]}`);
        });
        markIdCategories2.dataMarks.forEach((mId: string) => {
          valueRecord2.add(`${Util.filteredDataTable.get(mId)[aName]}`);
        });
        markIdCategories1.nonDataMarks.forEach((mId: string) => {
          if (Util.nonDataTable.get(mId)[aName] !== undefined) {
            valueRecord1.add(`${Util.nonDataTable.get(mId)[aName]}`);
          }
        });
        markIdCategories2.nonDataMarks.forEach((mId: string) => {
          if (Util.nonDataTable.get(mId)[aName] !== undefined) {
            valueRecord2.add(`${Util.nonDataTable.get(mId)[aName]}`);
          }
        });
        if (!jsTool.identicalArrays([...valueRecord1], [...valueRecord2])) {
          attrDiffValues.push(aName);
        }
      }
    });

    return attrDiffValues;
  }

  public static removeEmptyCell(
    firstKfMarks: string[],
    attrToSec: string[],
    sameAttrs: string[],
    diffAttrs: string[],
    dataEncode: boolean
  ): string[] {
    const tmpMarkRecord: string[] = [];
    const dataTable: Map<string, IDataItem> = dataEncode
      ? Util.filteredDataTable
      : Util.nonDataTable;
    dataTable.forEach((d: IDataItem, mId: string) => {
      let flag: boolean = true;
      sameAttrs.forEach((aName: string) => {
        if (d[aName] !== dataTable.get(firstKfMarks[0])[aName]) {
          flag = false;
        }
      });
      if (flag) {
        tmpMarkRecord.push(mId);
      }
    });
    if (jsTool.identicalArrays(firstKfMarks, tmpMarkRecord)) {
      //remove same attrs from attrToSecs
      diffAttrs.forEach((aName: string) => {
        if (attrToSec.includes(aName)) {
          attrToSec.splice(attrToSec.indexOf(aName), 1);
        }
      });
    }
    return attrToSec;
  }

  public static removeMixedEmptyCell(
    firstKfMarks: string[],
    attrToSec: string[],
    sameAttrs: string[],
    diffAttrs: string[]
  ): string[] {
    const tmpMarkRecord: string[] = [];

    const firstDataKfMarks: string[] = [];
    const firstNonData: IDataItem[] = [];

    firstKfMarks.forEach((mId) => {
      if (Util.filteredDataTable.has(mId)) {
        firstDataKfMarks.push(mId);
      } else {
        firstNonData.push(Util.nonDataTable.get(mId));
      }
    });

    const dataTable: Map<string, IDataItem> = Util.filteredDataTable;
    const nonDataTable: Map<string, IDataItem> = Util.nonDataTable;

    dataTable.forEach((d: IDataItem, mId: string) => {
      let flag: boolean = true;
      sameAttrs.forEach((aName: string) => {
        if (flag && d[aName] !== dataTable.get(firstDataKfMarks[0])[aName]) {
          flag = false;
        }
      });
      if (flag) {
        tmpMarkRecord.push(mId);
      }
    });

    nonDataTable.forEach((d: IDataItem, mId: string) => {
      let flag: boolean = true;
      sameAttrs.forEach((aName: string) => {
        if (
          flag &&
          d[aName] !== undefined &&
          d[aName] !==
            firstNonData.find((datum) => datum[aName] !== undefined)[aName]
        ) {
          flag = false;
        }
      });
      if (flag) {
        tmpMarkRecord.push(mId);
      }
    });

    if (jsTool.identicalArrays(firstDataKfMarks, tmpMarkRecord)) {
      //remove same attrs from attrToSecs
      diffAttrs.forEach((aName: string) => {
        if (attrToSec.includes(aName)) {
          attrToSec.splice(attrToSec.indexOf(aName), 1);
        }
      });
    }
    return attrToSec;
  }

  public static findSameAttrs(select1: string[], select2: string[]){
    let shape1: string[] = [];
    let shape2: string[] = [];
    let color1: string[] = [];
    let color2: string[] = [];
    let colorType: string = ''; 
    let sameAttr: string[] = [];
    if (Util.filteredDataTable.get(select1[0])["OS"] != undefined) {
      colorType = "OS";
    } else if (
      Util.filteredDataTable.get(select1[0])["Country"] != undefined
    ) {
      colorType = "Country";
    } else if (Util.filteredDataTable.get(select1[0])["Cause"] != undefined) {
      colorType = "Cause";
    } else if (Util.filteredDataTable.get(select1[0])["City"] != undefined) {
      colorType = "City";
    }
    select1.forEach((mark: string) => {
      //mshape
      shape1.push(Util.filteredDataTable.get(mark)['mShape'] as string);
      color1.push(Util.filteredDataTable.get(mark)[colorType] as string);
    });
    select2.forEach((mark: string) => {
      //mshape
      shape2.push(Util.filteredDataTable.get(mark)['mShape'] as string);
      color2.push(Util.filteredDataTable.get(mark)[colorType] as string);
    })
    if (jsTool.identicalArrays(shape1, shape2)){
      sameAttr.push('mShape');
    }
    if(jsTool.identicalArrays(color1, color2)){
      sameAttr.push(colorType);
    }
    return sameAttr;
  }

  /**
   * find the same and different attributes of the given marks
   * @param markIdArr
   * @param dataEncode
   */
  public static findSameDiffAttrs(
    markIdArr: string[],
    dataEncode: boolean
  ): [string[], string[]] {
    let sameAttrs: string[] = [],
      diffAttrs: string[] = [];
    const dataAttrArr: string[] = dataEncode
      ? Util.dataAttrs
      : Util.nonDataAttrs;
    const dataTable: Map<string, IDataItem> = dataEncode
      ? Util.filteredDataTable
      : Util.nonDataTable;
    dataAttrArr.forEach((aName: string) => {
      if (Util.attrType[aName] === CATEGORICAL_ATTR) {
        let flag: boolean = true;
        let firstValue: string | number = dataTable.get(markIdArr[0])[aName];
        for (let i = 1, len = markIdArr.length; i < len; i++) {
          if (dataTable.get(markIdArr[i])[aName] !== firstValue) {
            flag = false;
            break;
          }
        }
        if (flag) {
          sameAttrs.push(aName);
        } else {
          diffAttrs.push(aName);
        }
      }
    });
    return [sameAttrs, diffAttrs];
  }

  /**
   * find the same and different attributes of the given marks with both data and non-data elements
   * @param markIdArr
   */
  public static findSameMixedDiffAttrs(
    markIdArr: string[]
  ): [string[], string[]] {
    let sameAttrs: string[] = [],
      diffAttrs: string[] = [];
    const dataAttrArr: string[] = Util.dataAttrs;

    const unifiedData: IDataItem[] = [];

    markIdArr.forEach((mId) => {
      if (Util.filteredDataTable.has(mId)) {
        unifiedData.push(Util.filteredDataTable.get(mId));
      } else {
        const datum = Util.nonDataTable.get(mId);
        if (datum.text !== undefined) {
          dataAttrArr.forEach((aName: string) => {
            if (
              (Util.dataValues.get(aName) as (string | number)[]).includes(
                datum.text
              )
            ) {
              datum[aName] = datum.text;
            }
          });
        }
        unifiedData.push(datum);
      }
    });

    dataAttrArr.forEach((aName: string) => {
      if (Util.attrType[aName] === CATEGORICAL_ATTR) {
        let flag: boolean = true;
        let firstValue: string | number = unifiedData[0][aName];
        for (let i = 1, len = markIdArr.length; i < len; i++) {
          if (unifiedData[i][aName] !== firstValue) {
            flag = false;
            break;
          }
        }
        if (flag) {
          sameAttrs.push(aName);
        } else {
          diffAttrs.push(aName);
        }
      }
    });

    return [sameAttrs, diffAttrs];
  }

  /**
   * order the attribute names according to the effectiveness ranking of visual channels
   * @param attrArr
   */
  public static sortAttrs(attrArr: string[]): Map<string, string[]> {
    let orderedAttrs: Map<string, string[]> = new Map();
    EFFECTIVENESS_RANKING.forEach((channel: string) => {
      attrArr.forEach((aName: string) => {
        let tmpAttrChannel: string[] = ChartSpec.chartUnderstanding[aName];
        if (typeof tmpAttrChannel !== "undefined") {
          if (tmpAttrChannel.includes(channel)) {
            if (typeof orderedAttrs.get(channel) === "undefined") {
              orderedAttrs.set(channel, []);
            }
            orderedAttrs.get(channel).push(aName);
          }
        }
      });
    });
    return orderedAttrs;
  }

  public static assignChannelName(attrArr: string[]): Map<string, string[]> {
    let channelAttrs: Map<string, string[]> = new Map();
    attrArr.forEach((aName: string) => {
      const tmpAttrChannels: string[] = ChartSpec.chartUnderstanding[aName];
      tmpAttrChannels.forEach((tmpAttrChannel: string) => {
        if (typeof channelAttrs.get(tmpAttrChannel) === "undefined") {
          channelAttrs.set(tmpAttrChannel, []);
        }
        channelAttrs.get(tmpAttrChannel).push(aName);
      });
    });
    return channelAttrs;
  }

  /**
   *
   * @param {Map} sortedAttrs : key: visual channel, value : Array<String> attr names
   */
  public static generateAttrCombs(sortedAttrs: Map<string, string[]>) {
    let visualChannelNum: number = sortedAttrs.size;
    let allCombinations: string[][] = [];
    while (visualChannelNum > 0) {
      let count: number = 0;
      let candidateAttrs: string[] = [];
      let multiPosiAttrs: boolean = false,
        positionAttrs: string[] = [];
      for (let [channelName, attrs] of sortedAttrs) {
        candidateAttrs = [...candidateAttrs, ...attrs];
        count++;
        if (
          count === 1 &&
          visualChannelNum !== 1 &&
          channelName === "position" &&
          attrs.length > 1
        ) {
          multiPosiAttrs = true;
          positionAttrs = attrs;
        } else if (count === visualChannelNum) {
          let tmpCombRecord = Util.perm(candidateAttrs);
          if (multiPosiAttrs) {
            //check for attr continuity
            tmpCombRecord = Util.checkConti(tmpCombRecord, positionAttrs);
          }
          const result = tmpCombRecord.map((oneComb: string[]) => [
            ...new Set(oneComb),
          ]);
          result.forEach((oneComb: string[]) => {
            if (
              !allCombinations.find((arr) =>
                arr.every((v, i) => v === oneComb[i])
              )
            ) {
              allCombinations.push(oneComb);
            }
          });
          break;
        }
      }

      visualChannelNum--;
    }
    return allCombinations;
  }

  /**
   *
   * @param sortedAttrs
   * @param valueIdx
   * @param firstKfMarks
   * @param lastKfMarks
   * @param hasOneMark
   */
  public static generateRepeatKfs(
    sortedAttrs: Map<string, string[]>,
    valueIdx: Map<string, number>,
    firstKfMarks: string[],
    lastKfMarks: string[],
    hasOneMark: boolean = false
  ): Array<[string[], Map<string, string[]>, string[]]> {
    let possibleKfs: Array<[string[], Map<string, string[]>, string[]]> = [];

    //get all possible combinations of attrs
    const allCombinations: string[][] = this.generateAttrCombs(sortedAttrs);

    //get values of the attrs in 1st kf
    let valuesFirstKf: Set<string | number> = new Set();
    let mShapes: Set<string> = new Set();
    sortedAttrs.forEach((attrArr: string[], channel: string) => {
      attrArr.forEach((aName: string) => {
        firstKfMarks.forEach((mId: string) => {
          const attrValue: string | number = (Util.filteredDataTable.get(mId) ||
            Util.nonDataTable.get(mId))[aName];
          valuesFirstKf.add(attrValue);
          if (aName === "mShape") {
            mShapes.add(`${attrValue}`);
          }
        });
      });
    });

    allCombinations.forEach((attrComb: string[]) => {
      //attrs to create sections
      let sections: Map<string, string[]> = new Map(); //key: section id, value: mark array
      let sectionIdRecord: (string | number)[][] = [];
      let timeSecIdx: number[] = [];
      let tmpValueIdx: Map<number, number> = new Map();
      attrComb.forEach((aName: string, idx: number) => {
        tmpValueIdx.set(idx, valueIdx.get(aName));
        if (Util.timeAttrs.includes(aName)) {
          timeSecIdx.push(idx);
        }
      });

      let asscendingOrder: boolean = false;
      lastKfMarks.forEach((mId: string, idx: number) => {
        let sectionId: string = "";
        let sepSecIdRecord: Set<string> = new Set();
        let seperateSecId: Set<string> = new Set(); //for ordering section ids
        // let secIsFirstKf: boolean = false;
        attrComb.forEach((aName: string) => {
          let tmpValue: string | number =
            (Util.filteredDataTable.get(mId) || Util.nonDataTable.get(mId))[
              aName
            ] ?? "~~~~";
          sectionId = [...sepSecIdRecord.add(`${tmpValue}`)].join(",");
          if (valuesFirstKf.has(tmpValue)) {
            //check whether this sec is the firstKf
            const isFirstKf: boolean = [...seperateSecId].every(
              (attrVal: string) => {
                return attrVal.includes("000_");
              }
            );
            // const isFirstKf: boolean = seperateSecId.every((attrVal: string) => { return (attrVal.includes('zzz_') || attrVal.includes('000_')) });
            if (isFirstKf) {
              tmpValue = "000_" + tmpValue;
              let orderDirect: number = valueIdx.get(aName);
              if (orderDirect === 1) {
                asscendingOrder = false;
                // secIsFirstKf = false;
                // tmpValue = 'zzz_' + tmpValue;//for ordering
              } else {
                asscendingOrder = true;
                // secIsFirstKf = true;
                // tmpValue = '000_' + tmpValue;//for ordering
              }
            }
          }
          Util.addAttrValue(seperateSecId, `${tmpValue}`);
          // seperateSecId.add(`${tmpValue}`);
        });

        if (typeof sections.get(sectionId) === "undefined") {
          sections.set(sectionId, []);
          if (sectionId.includes("~~~~")) {
            const right = sectionIdRecord.reduceRight((p, v, i) => {
              if (p !== -1) return p;
              if (
                [...sepSecIdRecord]
                  .filter((x) => x !== "~~~~")
                  .every((field) =>
                    v
                      .map((x) => x.toString().replace("000_", ""))
                      .includes(field)
                  )
              )
                return i;
              return -1;
            }, -1);
            if (right === -1) {
              sectionIdRecord.push([...seperateSecId]);
            } else {
              sectionIdRecord.splice(right + 1, 0, [...seperateSecId]);
            }
          } else {
            sectionIdRecord.push([...seperateSecId]);
          }
        }
        sections.get(sectionId).push(mId);
      });

      if (hasOneMark) {
        let flag: boolean = false; //whether this one mark in the 1st kf is a section
        for (let [sectionId, markIdArr] of sections) {
          if (markIdArr.includes(firstKfMarks[0]) && markIdArr.length === 1) {
            flag = true;
            break;
          }
        }
        if (!flag) {
          sections.clear();
          sectionIdRecord = [];
          lastKfMarks.forEach((mId: string) => {
            let sectionId: string = "";
            let sepSecIdRecord: Set<string> = new Set();
            let seperateSecId: Set<string> = new Set();
            attrComb.forEach((aName: string) => {
              let tmpValue: string | number = (Util.filteredDataTable.get(
                mId
              ) || Util.nonDataTable.get(mId))[aName];
              sectionId = [...sepSecIdRecord.add(`${tmpValue}`)].join(",");
              if (valuesFirstKf.has(tmpValue)) {
                tmpValue = "000_" + tmpValue;
                let orderDirect: number = valueIdx.get(aName);
                if (orderDirect === 1) {
                  asscendingOrder = false;
                } else {
                  asscendingOrder = true;
                }
              }
              Util.addAttrValue(seperateSecId, `${tmpValue}`);
            });
            if (hasOneMark) {
              sectionId = `${sectionId},${mId}`;
              seperateSecId.add(mId);
            }
            if (typeof sections.get(sectionId) === "undefined") {
              sections.set(sectionId, []);
              sectionIdRecord.push([...seperateSecId]);
            }
            sections.get(sectionId).push(mId);
          });
        }
      }

      //first round sorting sectionIds
      sectionIdRecord.sort(function (a, b) {
        let diffValueIdx: number = 0;
        let diffAttr: string = "";
        for (let i = 0, len = attrComb.length; i < len; i++) {
          if (a[i] !== b[i]) {
            diffValueIdx = i;
            diffAttr = attrComb[i];
            break;
          }
        }

        let aComp: string | number = a[diffValueIdx],
          bComp: string | number = b[diffValueIdx];
        if ((<string>aComp).includes("000_")) {
          aComp = (<string>aComp).substring(4);
        }
        if ((<string>bComp).includes("000_")) {
          bComp = (<string>bComp).substring(4);
        }
        if (timeSecIdx.includes(diffValueIdx)) {
          aComp = Util.fetchTimeNum(<string>aComp);
          bComp = Util.fetchTimeNum(<string>bComp);
        } else {
          aComp = isNaN(parseFloat(`${aComp}`))
            ? aComp
            : parseFloat(`${aComp}`);
          bComp = isNaN(parseFloat(`${bComp}`))
            ? bComp
            : parseFloat(`${bComp}`);
        }

        if (diffAttr === "mShape") {
          const aCompStr: string = `${aComp}`,
            bCompStr: string = `${bComp}`;
          const aShapeName: string =
            aCompStr.includes("000_") || aCompStr.includes("zzz_")
              ? aCompStr.substring(4)
              : aCompStr;
          const bShapeName: string =
            bCompStr.includes("000_") || bCompStr.includes("zzz_")
              ? bCompStr.substring(4)
              : bCompStr;
          //put the same mark shape as those in the firstKfMarks in the front
          if (mShapes.has(aShapeName) && !mShapes.has(bShapeName)) {
            return -1;
          } else if (!mShapes.has(aShapeName) && mShapes.has(bShapeName)) {
            return 1;
          } else if (!mShapes.has(aShapeName) && !mShapes.has(bShapeName)) {
            if (
              aShapeName.toLocaleLowerCase().includes("link") &&
              !bShapeName.toLocaleLowerCase().includes("link")
            ) {
              return 1;
            } else if (
              !aShapeName.toLocaleLowerCase().includes("link") &&
              bShapeName.toLocaleLowerCase().includes("link")
            ) {
              return -1;
            } else {
              return 0;
            }
          } else {
            return 0;
          }
        }

        if (bComp > aComp) {
          switch (tmpValueIdx.get(diffValueIdx)) {
            case 0:
            case 2:
              return -1;
            case 1:
              return 1;
          }
        } else {
          switch (tmpValueIdx.get(diffValueIdx)) {
            case 0:
            case 2:
              return 1;
            case 1:
              return -1;
          }
        }
      });
      //find the first kf index
      let firstKfIdx: number = -1;
      for (let i = 0, len = sectionIdRecord.length; i < len; i++) {
        // sectionIdRecord.forEach((separaSecIds: (string | number)[], idx: number) => {
        const separaSecIds: (string | number)[] = sectionIdRecord[i];
        if (separaSecIds.every((attrVal: string) => attrVal.includes("000_"))) {
          firstKfIdx = i;
          break;
        }
      }
      if (asscendingOrder) {
        const sectionsBefore: (string | number)[][] = sectionIdRecord.slice(
          0,
          firstKfIdx
        );
        const sectionsAfter: (string | number)[][] =
          sectionIdRecord.slice(firstKfIdx);
        sectionIdRecord = [...sectionsAfter, ...sectionsBefore];
      }
      //remove 000_ and zzz_ added for ordering
      for (let i = 0, len = sectionIdRecord.length; i < len; i++) {
        for (let j = 0, len2 = sectionIdRecord[i].length; j < len2; j++) {
          if ((<string>sectionIdRecord[i][j]).indexOf("_") === 3) {
            const checkStr: string = (<string>sectionIdRecord[i][j]).substring(
              0,
              3
            );
            if (checkStr === "zzz" || !isNaN(parseInt(checkStr))) {
              sectionIdRecord[i][j] = (<string>sectionIdRecord[i][j]).substring(
                4
              );
            }
          }
        }
      }
      if (mShapes.size > 1) {
        //deal with mark shape situations
        const mShapeIdx: number = attrComb.indexOf("mShape");
        let sectionMarksToMerge: string[] = [];
        let valExceptShape: string[] = [];
        let mergeIdxs: [number, (string | number)[]][] = [];
        let mergeSecId: string = [...mShapes].join("+");
        let sectionsToDelete: string[] = [];
        sectionIdRecord.forEach((valComb: (string | number)[], idx: number) => {
          const correspondingSecId: string = valComb.join(",");
          const tmpShape: string = `${valComb[mShapeIdx]}`;
          let tmpValExceptShape: Set<string> = new Set();
          valComb.forEach((val: string | number, valIdx: number) => {
            if (valIdx !== mShapeIdx) {
              tmpValExceptShape.add(`${val}`);
            }
          });
          if (
            !jsTool.identicalArrays(valExceptShape, [...tmpValExceptShape]) ||
            idx === sectionIdRecord.length - 1
          ) {
            if (valExceptShape.length !== 0) {
              //add new section
              valExceptShape.splice(mShapeIdx, 0, mergeSecId);
              const tmpSecId: string = [...new Set(valExceptShape)].join(",");
              sections.set(tmpSecId, sectionMarksToMerge);
            }
            valExceptShape = [...tmpValExceptShape];
            sectionMarksToMerge = sections.get(correspondingSecId);
            sectionsToDelete.push(correspondingSecId);
            let tmpValExceptShapeArr: string[] = [...tmpValExceptShape];
            tmpValExceptShapeArr.splice(mShapeIdx, 0, mergeSecId);
            mergeIdxs.push([idx, [...new Set(tmpValExceptShapeArr)]]);
          } else {
            if (mShapes.has(tmpShape)) {
              sectionsToDelete.push(correspondingSecId);
              sectionMarksToMerge = [
                ...sectionMarksToMerge,
                ...sections.get(correspondingSecId),
              ];
            }
          }
        });
        if (valExceptShape.length !== 0) {
          //add new section
          valExceptShape.splice(mShapeIdx, 0, mergeSecId);
          const tmpSecId: string = [...new Set(valExceptShape)].join(",");
          if (typeof sections.get(tmpSecId) !== "undefined") {
            sectionMarksToMerge = [
              ...new Set([...sectionMarksToMerge, ...sections.get(tmpSecId)]),
            ];
          }
          sections.set(tmpSecId, sectionMarksToMerge);
        }

        mergeIdxs
          .reverse()
          .forEach((secIdxAndId: [number, (string | number)[]]) => {
            sectionIdRecord.splice(
              secIdxAndId[0],
              mShapes.size,
              secIdxAndId[1]
            );
          });
        sectionsToDelete.forEach((secIdToDelete: string) => {
          sections.delete(secIdToDelete);
        });
      }
      let orderedSectionIds: string[] = sectionIdRecord.map((a) => a.join(","));
      possibleKfs.push([attrComb, sections, orderedSectionIds]);
    });

    return possibleKfs;
  }

  /**
   * find the next unique kf after kfStartIdx
   * @param allPath
   * @param kfStartIdx
   */
  public static findNextUniqueKf(
    allPaths: IPath[],
    kfStartIdx: number
  ): number {
    let len: number = 0;
    if (typeof allPaths !== "undefined") {
      allPaths.forEach((p: IPath) => {
        if (p.kfMarks.length > len) {
          len = p.kfMarks.length;
        }
      });
    }
    for (let i = kfStartIdx + 1; i < len; i++) {
      for (let j = 1, len2 = allPaths.length; j < len2; j++) {
        if (
          !jsTool.identicalArrays(
            allPaths[j].kfMarks[i],
            allPaths[0].kfMarks[i]
          )
        ) {
          return i;
        }
      }
    }
    return -1;
  }

  public static findUniqueKfs(
    allPaths: IPath[],
    kfStartIdx: number
  ): { uniqueKfIdxs: number[]; hasNextUniqueKf: boolean } {
    let len: number = 0;
    if (typeof allPaths !== "undefined") {
      allPaths.forEach((p: IPath) => {
        if (p.kfMarks.length > len) {
          len = p.kfMarks.length;
        }
      });
    }
    //pre kfs
    const uniqueKfs: number[] = [];
    for (let i = 0; i <= kfStartIdx; i++) {
      for (let j = 1, len2 = allPaths.length; j < len2; j++) {
        if (
          !jsTool.identicalArrays(
            allPaths[j].kfMarks[i],
            allPaths[0].kfMarks[i]
          )
        ) {
          uniqueKfs.push(i);
          break;
        }
      }
    }
    //next kf
    const nextKf: number = this.findNextUniqueKf(allPaths, kfStartIdx);
    if (nextKf !== -1) {
      uniqueKfs.push(nextKf);
    }
    return { uniqueKfIdxs: uniqueKfs, hasNextUniqueKf: nextKf !== -1 };
  }


  public static generateSuggestionPath(
    selectedMarks: string[],
    firstKfInfoInParent: IKeyframe,
    targetKfg: KfGroup,
    orderInfo: IOrderInfo
  ): boolean {
    //create suggestion list if there is one, judge whether to use current last kf as last kf or the current first as last kf
    const [clsSelMarks, containDataMarkInSel, containNonDataMarkInSel] =
      Util.extractClsFromMarks(selectedMarks);
    const [clsFirstKf, containDataMarkFirstKf, containNonDataMarkFirstKf] =
      Util.extractClsFromMarks(firstKfInfoInParent.marksThisKf);
    let suggestOnFirstKf: boolean = false;
    if (
      jsTool.arrayContained(firstKfInfoInParent.marksThisKf, selectedMarks) &&
      jsTool.identicalArrays(clsSelMarks, clsFirstKf)
    ) {
      //suggest based on first kf in animation
      suggestOnFirstKf = true;
      Suggest.suggestPaths(
        selectedMarks,
        firstKfInfoInParent.marksThisKf,
        orderInfo
      );
    } else {
      //suggest based on all marks in animation
      const marksThisAni: string[] = targetKfg.marksThisAni();
      Suggest.suggestPaths(selectedMarks, marksThisAni, orderInfo);//get suggest info
    }
    return suggestOnFirstKf;
  }

  public static findMarksShape(
    lastkfDataMarks: string[],
    year: string,
    shape: string
  ) {
    let values: string[] = [];
    //get all attrs in each suggest Kfs
    const includedShape: string[] = shape.split("+");
    lastkfDataMarks.forEach((mark: string) => {
      const canYear: boolean =
        Util.filteredDataTable.get(mark)["year"] === year;
      const canShape: boolean =
        includedShape.indexOf(
          Util.filteredDataTable.get(mark)["mShape"] as string
        ) > -1;
      if (canYear && canShape) {
        values.push(mark);
      }
    });
    return values;
  }

  public static findMarksColor(
    lastkfDataMarks: string[],
    year: string,
    color: string,
    shape: string,
    colorAttr: string,
    time: string
  ) {
    let values: string[] = [];
    //get all attrs in each suggest Kfs
    const includedColor: string[] = color.split("+");
    const includedShape: string[] = shape.split("+");
    lastkfDataMarks.forEach((mark: string) => {
      const canYear: boolean = Util.filteredDataTable.get(mark)[time] === year;
      const canColor: boolean =
        includedColor.indexOf(
          Util.filteredDataTable.get(mark)[colorAttr] as string
        ) > -1;
      const canShape: boolean =
        includedShape.indexOf(
          Util.filteredDataTable.get(mark)["mShape"] as string
        ) > -1;
      if (canYear && canColor && canShape) {
        values.push(mark);
      }
    });

    return values;
  }

  public static generateMultikfs(
    selectMarks: string[][],
    lastkfDataMarks: string[],
    allColorShape: boolean,
    colorAttr: string
  ) {
    let possibleKfs: Array<[string[], Map<string, string[]>, string[]]> = [];
    if (allColorShape) {
      let shapeSuggest: string[] = [];
      for (let i = 0; i < selectMarks.length - 1; i++) {
        let temp: string = "";
        selectMarks[i].forEach((mark: string) => {
          temp += Util.filteredDataTable.get(mark)["mShape"];
          temp += "+";
        });
        temp = temp.substring(0, temp.length - 1);
        shapeSuggest.push(temp);
      }
      //posi
      let posiSuggest: number[] = [];
      const allYear: number[] = [];
      const attrComb: string[] = ["year", "mShape"];
      const FirstSelectYear: number = Util.filteredDataTable.get(
        selectMarks[0][0]
      )["year"] as number;
      lastkfDataMarks.forEach((mark: string) => {
        if (
          allYear.indexOf(Util.filteredDataTable.get(mark)["year"] as number) <
          0
        ) {
          allYear.push(Util.filteredDataTable.get(mark)["year"] as number);
        }
      });
      allYear.sort((a, b) => a - b);
      const firstSelectPosi: number = allYear.indexOf(FirstSelectYear);
      posiSuggest = allYear
        .slice(firstSelectPosi)
        .concat(allYear.slice(0, firstSelectPosi));

      let sections: Map<string, string[]> = new Map();
      let resultAttr: string[] = [];

      posiSuggest.forEach((year: number) => {
        shapeSuggest.forEach((shape: string) => {
          const key: string = `${year},${shape}`;
          const value: string[] = this.findMarksShape(
            lastkfDataMarks,
            String(year),
            shape
          );
          sections.set(key, value);
          resultAttr.push(key);
        });
      });
      possibleKfs.push([attrComb, sections, resultAttr]);
      return possibleKfs;
    } else {
      let colorSuggest: string[] = [];
      for (let i = 0; i < selectMarks.length - 1; i++) {
        let temp: string = "";
        selectMarks[i].forEach((mark: string) => {
          temp += Util.filteredDataTable.get(mark)[colorAttr];
          temp += "+";
        });
        temp = temp.substring(0, temp.length - 1);
        colorSuggest.push(temp);
      }
      let shapeSuggest: string[] = [];
      let temp: string = "";
      selectMarks[0].forEach((mark: string) => {
        temp += Util.filteredDataTable.get(mark)["mShape"];
        temp += "+";
      });
      temp = temp.substring(0, temp.length - 1);
      shapeSuggest.push(temp);
      temp = "";
      selectMarks[selectMarks.length - 1].forEach((mark: string) => {
        temp += Util.filteredDataTable.get(mark)["mShape"];
        temp += "+";
      });
      temp = temp.substring(0, temp.length - 1);
      shapeSuggest.push(temp);
      let timeSuggest: string[] = [];
      let attrComb: string[] = [];
      let FirstSelectYear: string;
      let time: string;
      if (colorAttr === "OS") {
        FirstSelectYear = Util.filteredDataTable.get(selectMarks[0][0])[
          "Year"
        ] as string;
        const allYear: string[] = [
          "2009",
          "2010",
          "2011",
          "2012",
          "2013",
          "2014",
          "2015",
          "2016",
        ];
        const firstSelectPosi: number = allYear.indexOf(FirstSelectYear);
        timeSuggest = allYear
          .slice(firstSelectPosi)
          .concat(allYear.slice(0, firstSelectPosi));
        attrComb = ["Year", "OS", "mShape"];
        time = "Year";
      } else if (colorAttr === "Country") {
        FirstSelectYear = Util.filteredDataTable.get(selectMarks[0][0])[
          "Year"
        ] as string;
        const allYear: string[] = [
          "1992",
          "1993",
          "1994",
          "1995",
          "1996",
          "1997",
          "1998",
          "1999",
          "2000",
          "2001",
          "2002",
          "2003",
          "2004",
          "2005",
          "2006",
          "2007",
          "2008",
          "2009",
          "2010",
          "2011",
        ];
        const firstSelectPosi: number = allYear.indexOf(FirstSelectYear);
        timeSuggest = allYear
          .slice(firstSelectPosi)
          .concat(allYear.slice(0, firstSelectPosi));
        attrComb = ["Year", "mShape", "Country"];
        time = "Year";
      } else if (colorAttr === "City") {
        FirstSelectYear = Util.filteredDataTable.get(selectMarks[0][0])[
          "Month"
        ] as string;
        const allYear: string[] = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const firstSelectPosi: number = allYear.indexOf(FirstSelectYear);
        timeSuggest = allYear
          .slice(firstSelectPosi)
          .concat(allYear.slice(0, firstSelectPosi));
        attrComb = ["Month", "City", "mShape"];
        time = "Month";
      } else if (colorAttr === "Cause") {
        FirstSelectYear = Util.filteredDataTable.get(selectMarks[0][0])[
          "Month"
        ] as string;
        const allYear: string[] = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const firstSelectPosi: number = allYear.indexOf(FirstSelectYear);
        timeSuggest = allYear
          .slice(firstSelectPosi)
          .concat(allYear.slice(0, firstSelectPosi));
        attrComb = ["Month", "Cause", "mShape"];
        time = "Month";
      }
      let sections: Map<string, string[]> = new Map();
      let resultAttr: string[] = [];
      timeSuggest.forEach((year: string) => {
        shapeSuggest.forEach((shape: string) => {
          colorSuggest.forEach((color: string) => {
            const key: string = `${year},${color},${shape}`;
            const value: string[] = this.findMarksColor(
              lastkfDataMarks,
              year,
              color,
              shape,
              colorAttr,
              time
            );
            if(value.length != 0){
              sections.set(key, value);
              resultAttr.push(key);
            }
          });
        });
      });
      possibleKfs.push([attrComb, sections, resultAttr]);
      return possibleKfs;
    }
  }

  /**
   * check the numeric order with the mark in first kf (only mark in the first kf)
   * @param firstKfMark
   */
  public static checkNumbericOrder(
    firstKfMark: string
  ): [boolean, { attr: string; order: number; marks: string[] }[]] {
    const firstMarkDatum: IDataItem = Util.filteredDataTable.get(firstKfMark);
    const numericAttrs: string[] = Util.fetchNumericAttrs(firstMarkDatum);
    let hasOrder: boolean = false;
    const result: { attr: string; order: number; marks: string[] }[] = [];
    numericAttrs.forEach((attrName: string) => {
      const orderOfThisAttr: string[] = Util.numericAttrOrder.get(attrName);
      const idxOfCurrentMark: number = orderOfThisAttr.indexOf(firstKfMark);
      if (
        idxOfCurrentMark === 0 ||
        idxOfCurrentMark === orderOfThisAttr.length - 1
      ) {
        hasOrder = true;
        result.push({
          attr: attrName,
          order: idxOfCurrentMark === 0 ? 0 : 1,
          marks: orderOfThisAttr,
        });
      }
    });
    return [hasOrder, result];
  }

  public static suggestPaths(
    firstKfMarks: string[],
    lastKfMarks: string[],
    orderInfo: IOrderInfo
  ) {
    this.allPaths = [];
    const sepFirstKfMarks: { dataMarks: string[]; nonDataMarks: string[] } =
      Util.separateDataAndNonDataMarks(firstKfMarks);
    const sepLastKfMarks: { dataMarks: string[]; nonDataMarks: string[] } =
      Util.separateDataAndNonDataMarks([...Util.filteredDataTable.keys()]);
    const allCls: string[] = Util.extractClsFromMarks(lastKfMarks)[0];
    let allShapeInc: string[] = [];
    let colorAttrInc: string = "";
    sepLastKfMarks.dataMarks.forEach((mark: string) => {
      allShapeInc.push(Util.filteredDataTable.get(mark)["mShape"] as string);
      if (Util.filteredDataTable.get(mark)["OS"] != undefined) {
        colorAttrInc = "OS";
      } else if (Util.filteredDataTable.get(mark)["Country"] != undefined) {
        colorAttrInc = "Country";
      } else if (Util.filteredDataTable.get(mark)["Cause"] != undefined) {
        colorAttrInc = "Cause";
      } else if (Util.filteredDataTable.get(mark)["City"] != undefined) {
        colorAttrInc = "City";
      }else if(Util.filteredDataTable.get(mark)["Male"] != undefined){
        colorAttrInc = 'Male';
      }
    });
    allShapeInc = [...new Set(allShapeInc)];

    if (
      sepFirstKfMarks.dataMarks.length > 0 &&
      sepFirstKfMarks.nonDataMarks.length > 0
    ) {
      //suggest based on data attrs
      const firstKfMixedMarks: string[] = sepFirstKfMarks.dataMarks.concat(
        sepFirstKfMarks.nonDataMarks
      );
      const nodataClsType: number | string = Util.nonDataTable.get(
        sepFirstKfMarks.nonDataMarks[0]
      )._TYPE_IDX;

      // const nodataClsType: number =
      const lastKfMixedMarks: string[] = sepLastKfMarks.dataMarks.concat(
        sepLastKfMarks.nonDataMarks.filter((mId) => {
          if (firstKfMixedMarks.includes(mId)) {
            return true;
          }
          const clsType: number | string = Util.nonDataTable.get(mId)._TYPE_IDX;

          if (
            firstKfMixedMarks.find(
              (refId) =>
                refId.length >= 8 &&
                refId.startsWith(mId.slice(0, mId.length - 3)) &&
                clsType === nodataClsType
            )
          ) {
            return true;
          }
          return false;
        })
      );

      if (jsTool.identicalArrays(firstKfMixedMarks, lastKfMixedMarks)) {
        //refresh current spec
      } else {
        let attrWithDiffValues: string[] = this.findAttrWithMixedDiffValue(
          firstKfMixedMarks,
          lastKfMixedMarks
        );
        const [sameAttrs, diffAttrs] =
          this.findSameMixedDiffAttrs(firstKfMixedMarks);
        let flag: boolean = false;
        if (attrWithDiffValues.length === 0) {
          flag = true;
          const filteredDiffAttrs: string[] = Util.filterAttrs(diffAttrs);
          attrWithDiffValues = [...sameAttrs, ...filteredDiffAttrs];
        }

        //remove empty cell problem
        attrWithDiffValues = this.removeMixedEmptyCell(
          firstKfMarks,
          attrWithDiffValues,
          sameAttrs,
          diffAttrs
        );
        let valueIdx: Map<string, number> = new Map(); //key: attr name, value: index of the value in all values
        attrWithDiffValues.forEach((aName: string) => {
          const targetValue: string | number = Util.filteredDataTable.get(
            sepFirstKfMarks.dataMarks[0]
          )[aName];
          const tmpIdx: number = Util.dataValues
            .get(aName)
            .indexOf(<never>targetValue);
          if (tmpIdx === 0) {
            valueIdx.set(aName, 0); //this value is the 1st in all values
          } else if (tmpIdx === Util.dataValues.get(aName).length - 1) {
            valueIdx.set(aName, 1); //this value is the last in all values
          } else {
            valueIdx.set(aName, 2); //this value is in the middle of all values
          }
        });

        //sortedAttrs: key: channel, value: attr array
        const sortedAttrs: Map<string, string[]> = flag
          ? this.assignChannelName(attrWithDiffValues)
          : this.sortAttrs(attrWithDiffValues);
        const oneMarkInFirstKf: boolean = firstKfMixedMarks.length === 1;

        let allPossibleKfs = this.generateRepeatKfs(
          sortedAttrs,
          valueIdx,
          firstKfMixedMarks,
          lastKfMixedMarks,
          oneMarkInFirstKf
        );
        let repeatKfRecord: any[] = [];
        let filterAllPaths: number[] = [],
          count = 0; //record the index of the path that should be removed: not all selected & not one mark in 1st kf
        allPossibleKfs.forEach((possiblePath: any[]) => {
          let attrComb: string[] = possiblePath[0];
          let sections: Map<string, string[]> = possiblePath[1];
          let orderedSectionIds: string[] = possiblePath[2];
          let repeatKfs = [];
          let allSelected = false;
          let oneMarkFromEachSec = false,
            oneMarkEachSecRecorder: Set<string> = new Set();
          let numberMostMarksInSec = 0,
            selectedMarks: Map<string, string[]> = new Map(); //in case of one mark from each sec

          orderedSectionIds.forEach((sectionId: string) => {
            let tmpSecMarks = sections.get(sectionId);
            if (tmpSecMarks.length > numberMostMarksInSec) {
              numberMostMarksInSec = tmpSecMarks.length;
            }

            //check if marks in 1st kf are one from each sec
            firstKfMarks.forEach((mId: string) => {
              if (tmpSecMarks.includes(mId)) {
                selectedMarks.set(sectionId, [mId]);
                oneMarkEachSecRecorder.add(sectionId);
              }
            });
          });

          if (
            oneMarkEachSecRecorder.size === sections.size &&
            firstKfMarks.length === sections.size
          ) {
            oneMarkFromEachSec = true;
          }

          if (oneMarkFromEachSec) {
            //if the mark is from one section
            for (let i = 0; i < numberMostMarksInSec - 1; i++) {
              let tmpKfMarks = [];
              for (let j = 0; j < orderedSectionIds.length; j++) {
                let tmpSecMarks = sections.get(orderedSectionIds[j]);
                let tmpSelected = selectedMarks.get(orderedSectionIds[j]);
                for (let z = 0; z < tmpSecMarks.length; z++) {
                  if (!tmpSelected.includes(tmpSecMarks[z])) {
                    tmpKfMarks.push(tmpSecMarks[z]);
                    selectedMarks
                      .get(orderedSectionIds[j])
                      .push(tmpSecMarks[z]);
                    break;
                  }
                }
              }
              repeatKfs.push(tmpKfMarks);
            }
          } else {
            for (let i = 0, len = orderedSectionIds.length; i < len; i++) {
              let tmpSecMarks = sections.get(orderedSectionIds[i]);
              let judgeSame = jsTool.identicalArrays(firstKfMarks, tmpSecMarks);
              if (!allSelected && judgeSame && !oneMarkInFirstKf) {
                allSelected = true;
              }
              if (!judgeSame) {
                //dont show the 1st kf twice
                repeatKfs.push(tmpSecMarks);
              }
            }
          }

          let samePath = false;
          for (let i = 0; i < this.allPaths.length; i++) {
            if (jsTool.identicalArrays(repeatKfs, this.allPaths[i].kfMarks)) {
              samePath = true;
              break;
            }
          }
          this.allPaths.push({
            attrComb: attrComb,
            sortedAttrValueComb: orderedSectionIds,
            kfMarks: repeatKfs,
            firstKfMarks: firstKfMixedMarks,
            lastKfMarks: lastKfMixedMarks,
          });
          //check if the selection is one mark from each sec
          if (
            (!allSelected && !oneMarkInFirstKf && !oneMarkFromEachSec) ||
            samePath
          ) {
            filterAllPaths.push(count);
          }
          count++;
        });

        //filter all paths
        filterAllPaths.sort(function (a, b) {
          return b - a;
        });
        for (let i = 0; i < filterAllPaths.length; i++) {
          this.allPaths.splice(filterAllPaths[i], 1);
        }

        //check numeric ordering
        let hasNumericOrder: boolean = false;
        let numericOrders: { attr: string; order: number; marks: string[] }[];
        if (firstKfMixedMarks.length === 1) {
          [hasNumericOrder, numericOrders] = this.checkNumbericOrder(
            firstKfMixedMarks[0]
          );
        }

        if (hasNumericOrder) {
          //generate path according to the order of values of numeric attributes
          numericOrders.forEach(
            (ordering: { attr: string; order: number; marks: string[] }) => {
              let orderedMarks: string[] =
                ordering.order === 0
                  ? ordering.marks
                  : ordering.marks.reverse();
              let orderedKfMarks: string[][] = orderedMarks.map((a: string) => [
                a,
              ]);
              this.allPaths.push({
                attrComb: ["id"],
                sortedAttrValueComb: orderedMarks,
                kfMarks: orderedKfMarks,
                firstKfMarks: firstKfMixedMarks,
                lastKfMarks: lastKfMixedMarks,
                ordering: {
                  attr: ordering.attr,
                  order: ordering.order === 0 ? "asscending" : "descending",
                },
              });
            }
          );
        }

        console.log("all paths", this.allPaths);
      }
    } else if (
      sepFirstKfMarks.dataMarks.length > 0 &&
      sepFirstKfMarks.nonDataMarks.length === 0
    ) {
      if ((colorAttrInc.length > 0 || allShapeInc.length > 1) && colorAttrInc != 'Male') {
        const sepSelectKfMarks: {
          dataMarks: string[];
          nonDataMarks: string[];
        } = Util.separateDataAndNonDataMarks(firstKfMarks);
        const sepAllKfMarks: { dataMarks: string[]; nonDataMarks: string[] } =
          Util.separateDataAndNonDataMarks([...Util.filteredDataTable.keys()]);

        //suggest based on data attrs
        const selectKfDataMarks: string[] = sepSelectKfMarks.dataMarks;
        const allKfDataMarks: string[] = sepAllKfMarks.dataMarks;
        let lastKfDataMarks: string[] = [];
        let possibleKfs: Array<[string[], Map<string, string[]>, string[]]> =
          [];
        let allShape: string[] = [];
        let allColor: string[] = [];
        let colorAttr: string = "";
        const AllselectStepMark = store.getState().selectMarksStep;
        const currentSelect: string[] = store.getState().selection;
        let currentUsedMarks: string[][] = [];
        if (
          store
            .getState()
            .selectMarksStep.find((s) => s instanceof Array && s.length === 0)
        ) {
          let posi: number;
          for (let i = AllselectStepMark.length - 1; i >= 0; i--) {
            if (AllselectStepMark[i].length === 0) {
              posi = i;
              break;
            }
          }
          currentUsedMarks = AllselectStepMark.slice(posi + 1);
        } else {
          currentUsedMarks = AllselectStepMark;
        }

        currentUsedMarks.forEach((selectOneStep: string[]) => {
          selectOneStep.forEach((mark: string) => {
            allShape.push(Util.filteredDataTable.get(mark)["mShape"] as string);
            if (Util.filteredDataTable.get(mark)["OS"] != undefined) {
              allColor.push(Util.filteredDataTable.get(mark)["OS"] as string);
              colorAttr = "OS";
            } else if (
              Util.filteredDataTable.get(mark)["Country"] != undefined
            ) {
              allColor.push(
                Util.filteredDataTable.get(mark)["Country"] as string
              );
              colorAttr = "Country";
            } else if (Util.filteredDataTable.get(mark)["Cause"] != undefined) {
              allColor.push(
                Util.filteredDataTable.get(mark)["Cause"] as string
              );
              colorAttr = "Cause";
            } else if (Util.filteredDataTable.get(mark)["City"] != undefined) {
              allColor.push(Util.filteredDataTable.get(mark)["City"] as string);
              colorAttr = "City";
            }
          });
        });

        allShape = [...new Set(allShape)];
        allColor = [...new Set(allColor)];

        allKfDataMarks.forEach((mark: string) => {
          if (
            allShape.includes(
              Util.filteredDataTable.get(mark)["mShape"] as string
            )
          ) {
            if (
              colorAttr.length > 0 &&
              allColor.includes(
                Util.filteredDataTable.get(mark)[colorAttr] as string
              )
            ) {
              lastKfDataMarks.push(mark);
            } else if (colorAttr.length === 0) {
              lastKfDataMarks.push(mark);
            }
          }
        }); 

        if (currentUsedMarks.length > 1) {
          let flag: boolean;
          let diffAttr = [];
          const sameAttrs: string[]= this.findSameAttrs(currentUsedMarks[0], currentSelect);

          const combineSelect: string[] = currentSelect.concat(
            currentUsedMarks[0]
          );
          if (sameAttrs.indexOf("mShape") > -1 && colorAttr.length === 0) {
            const allColorShape: boolean = true;
            possibleKfs = this.generateMultikfs(
              currentUsedMarks,
              lastKfDataMarks,
              allColorShape,
              colorAttr
            );
            store.dispatchSystem(updateSelectMarksStep([]));
          } else if (
            sameAttrs.indexOf(colorAttr) > -1 &&
            colorAttr.length > 0
          ) {
            const allColorShape: boolean = false;
            possibleKfs = this.generateMultikfs(
              currentUsedMarks,
              lastKfDataMarks,
              allColorShape,
              colorAttr
            );
            store.dispatchSystem(updateSelectMarksStep([]));
          }
        }

        const firstSelectMarks: string[] = currentUsedMarks[0]; 
        const oneMarkInFirstKf: boolean = firstSelectMarks.length === 1;
        possibleKfs.forEach((possiblePath: any[]) => {
          let attrComb: string[] = possiblePath[0];
          let sections: Map<string, string[]> = possiblePath[1];
          let orderedSectionIds: string[] = possiblePath[2];
          let repeatKfs = [];
          let allSelected = false;
          let oneMarkFromEachSec = false,
            oneMarkEachSecRecorder: Set<string> = new Set();
          let numberMostMarksInSec = 0,
            selectedMarks: Map<string, string[]> = new Map();

          orderedSectionIds.forEach((sectionId: string) => {
            let tmpSecMarks = sections.get(sectionId);
            if (tmpSecMarks.length > numberMostMarksInSec) {
              numberMostMarksInSec = tmpSecMarks.length;
            }
            firstSelectMarks.forEach((mId: string) => {
              if (tmpSecMarks.includes(mId)) {
                selectedMarks.set(sectionId, [mId]);
                oneMarkEachSecRecorder.add(sectionId);
              }
            });
          });
          if (
            oneMarkEachSecRecorder.size === sections.size &&
            firstSelectMarks.length === sections.size
          ) {
            oneMarkFromEachSec = true;
          }
          if (oneMarkFromEachSec) {
            //if the mark is from one section
            for (let i = 0; i < numberMostMarksInSec - 1; i++) {
              let tmpKfMarks = [];
              for (let j = 0; j < orderedSectionIds.length; j++) {
                let tmpSecMarks = sections.get(orderedSectionIds[j]);
                let tmpSelected = selectedMarks.get(orderedSectionIds[j]);
                for (let z = 0; z < tmpSecMarks.length; z++) {
                  if (!tmpSelected.includes(tmpSecMarks[z])) {
                    tmpKfMarks.push(tmpSecMarks[z]);
                    selectedMarks
                      .get(orderedSectionIds[j])
                      .push(tmpSecMarks[z]);
                    break;
                  }
                }
              }
              repeatKfs.push(tmpKfMarks);
            }
          } else {
            for (let i = 0, len = orderedSectionIds.length; i < len; i++) {
              let tmpSecMarks = sections.get(orderedSectionIds[i]);
              let judgeSame = jsTool.identicalArrays(
                firstSelectMarks,
                tmpSecMarks
              );
              if (!allSelected && judgeSame && !oneMarkInFirstKf) {
                allSelected = true;
              }
              if (!judgeSame) {
                //dont show the 1st kf twice
                repeatKfs.push(tmpSecMarks);
              }
            }
          }
          this.allPaths.push({
            attrComb: attrComb,
            sortedAttrValueComb: orderedSectionIds,
            kfMarks: repeatKfs,
            firstKfMarks: firstSelectMarks,
            lastKfMarks: lastKfDataMarks,
          });
        });
        console.log("syc suggest", this.allPaths);
      } else {
        //suggest based on data attrs
        const firstKfDataMarks: string[] = sepFirstKfMarks.dataMarks;
        const lastKfDataMarks: string[] = sepLastKfMarks.dataMarks;

        if (jsTool.identicalArrays(firstKfDataMarks, lastKfDataMarks)) {
          //refresh current spec
        } else {
          let attrWithDiffValues: string[] = this.findAttrWithDiffValue(
            firstKfDataMarks,
            lastKfDataMarks,
            true
          );
          const [sameAttrs, diffAttrs] = this.findSameDiffAttrs(
            firstKfDataMarks,
            true
          );
          let flag: boolean = false;
          if (attrWithDiffValues.length === 0) {
            flag = true;
            const filteredDiffAttrs: string[] = Util.filterAttrs(diffAttrs);
            attrWithDiffValues = [...sameAttrs, ...filteredDiffAttrs];
          }

          //remove empty cell problem
          attrWithDiffValues = this.removeEmptyCell(
            firstKfMarks,
            attrWithDiffValues,
            sameAttrs,
            diffAttrs,
            true
          );
          let valueIdx: Map<string, number> = new Map(); //key: attr name, value: index of the value in all values
          attrWithDiffValues.forEach((aName: string) => {
            const targetValue: string | number = Util.filteredDataTable.get(
              firstKfDataMarks[0]
            )[aName];
            const tmpIdx: number = Util.dataValues
              .get(aName)
              .indexOf(<never>targetValue);
            if (tmpIdx === 0) {
              valueIdx.set(aName, 0); //this value is the 1st in all values
            } else if (tmpIdx === Util.dataValues.get(aName).length - 1) {
              valueIdx.set(aName, 1); //this value is the last in all values
            } else {
              valueIdx.set(aName, 2); //this value is in the middle of all values
            }
          });

          //sortedAttrs: key: channel, value: attr array
          const sortedAttrs: Map<string, string[]> = flag
            ? this.assignChannelName(attrWithDiffValues)
            : this.sortAttrs(attrWithDiffValues);
          const oneMarkInFirstKf: boolean = firstKfDataMarks.length === 1;

          let allPossibleKfs = this.generateRepeatKfs(
            sortedAttrs,
            valueIdx,
            firstKfDataMarks,
            lastKfDataMarks,
            oneMarkInFirstKf
          );
          let repeatKfRecord: any[] = [];
          let filterAllPaths: number[] = [],
            count = 0; //record the index of the path that should be removed: not all selected & not one mark in 1st kf
          allPossibleKfs.forEach((possiblePath: any[]) => {
            let attrComb: string[] = possiblePath[0];
            let sections: Map<string, string[]> = possiblePath[1];
            let orderedSectionIds: string[] = possiblePath[2];
            let repeatKfs = [];
            let allSelected = false;
            let oneMarkFromEachSec = false,
              oneMarkEachSecRecorder: Set<string> = new Set();
            let numberMostMarksInSec = 0,
              selectedMarks: Map<string, string[]> = new Map(); //in case of one mark from each sec

            orderedSectionIds.forEach((sectionId: string) => {
              let tmpSecMarks = sections.get(sectionId);
              if (tmpSecMarks.length > numberMostMarksInSec) {
                numberMostMarksInSec = tmpSecMarks.length;
              }

              //check if marks in 1st kf are one from each sec
              firstKfMarks.forEach((mId: string) => {
                if (tmpSecMarks.includes(mId)) {
                  selectedMarks.set(sectionId, [mId]);
                  oneMarkEachSecRecorder.add(sectionId);
                }
              });
            });

            if (
              oneMarkEachSecRecorder.size === sections.size &&
              firstKfMarks.length === sections.size
            ) {
              oneMarkFromEachSec = true;
            }

            if (oneMarkFromEachSec) {
              //if the mark is from one section
              for (let i = 0; i < numberMostMarksInSec - 1; i++) {
                let tmpKfMarks = [];
                for (let j = 0; j < orderedSectionIds.length; j++) {
                  let tmpSecMarks = sections.get(orderedSectionIds[j]);
                  let tmpSelected = selectedMarks.get(orderedSectionIds[j]);
                  for (let z = 0; z < tmpSecMarks.length; z++) {
                    if (!tmpSelected.includes(tmpSecMarks[z])) {
                      tmpKfMarks.push(tmpSecMarks[z]);
                      selectedMarks
                        .get(orderedSectionIds[j])
                        .push(tmpSecMarks[z]);
                      break;
                    }
                  }
                }
                repeatKfs.push(tmpKfMarks);
              }
            } else {
              for (let i = 0, len = orderedSectionIds.length; i < len; i++) {
                let tmpSecMarks = sections.get(orderedSectionIds[i]);
                let judgeSame = jsTool.identicalArrays(
                  firstKfMarks,
                  tmpSecMarks
                );
                if (!allSelected && judgeSame && !oneMarkInFirstKf) {
                  allSelected = true;
                }
                if (!judgeSame) {
                  //dont show the 1st kf twice
                  repeatKfs.push(tmpSecMarks);
                }
              }
            }

            let samePath = false;
            for (let i = 0; i < this.allPaths.length; i++) {
              if (jsTool.identicalArrays(repeatKfs, this.allPaths[i].kfMarks)) {
                samePath = true;
                break;
              }
            }
            // repeatKfRecord.push(repeatKfs);
            this.allPaths.push({
              attrComb: attrComb,
              sortedAttrValueComb: orderedSectionIds,
              kfMarks: repeatKfs,
              firstKfMarks: firstKfDataMarks,
              lastKfMarks: lastKfDataMarks,
            });
            //check if the selection is one mark from each sec
            if (
              (!allSelected && !oneMarkInFirstKf && !oneMarkFromEachSec) ||
              samePath
            ) {
              filterAllPaths.push(count);
            }
            count++;
          });

          //filter all paths
          filterAllPaths.sort(function (a, b) {
            return b - a;
          });
          for (let i = 0; i < filterAllPaths.length; i++) {
            this.allPaths.splice(filterAllPaths[i], 1);
          }

          //check numeric ordering
          let hasNumericOrder: boolean = false;
          let numericOrders: { attr: string; order: number; marks: string[] }[];
          if (firstKfDataMarks.length === 1) {
            [hasNumericOrder, numericOrders] = this.checkNumbericOrder(
              firstKfDataMarks[0]
            );
          }

          if (hasNumericOrder) {
            //generate path according to the order of values of numeric attributes
            numericOrders.forEach(
              (ordering: { attr: string; order: number; marks: string[] }) => {
                let orderedMarks: string[] =
                  ordering.order === 0
                    ? ordering.marks
                    : ordering.marks.reverse();
                let orderedKfMarks: string[][] = orderedMarks.map(
                  (a: string) => [a]
                );
                this.allPaths.push({
                  attrComb: ["id"],
                  sortedAttrValueComb: orderedMarks,
                  kfMarks: orderedKfMarks,
                  firstKfMarks: firstKfDataMarks,
                  lastKfMarks: lastKfDataMarks,
                  ordering: {
                    attr: ordering.attr,
                    order: ordering.order === 0 ? "asscending" : "descending",
                  },
                });
              }
            );
          }

          console.log("all paths", this.allPaths);
        }
      }
    } else if (
      sepFirstKfMarks.dataMarks.length === 0 &&
      sepFirstKfMarks.nonDataMarks.length > 0
    ) {
      //suggest based on non data attrs
      const firstKfNonDataMarks: string[] = sepFirstKfMarks.nonDataMarks;
      const lastKfNonDataMarks: string[] = sepLastKfMarks.nonDataMarks;

      if (!jsTool.identicalArrays(firstKfNonDataMarks, lastKfNonDataMarks)) {
        //count the number of types in first kf
        const typeCount: Map<string, string[]> = new Map();
        const attrValstrs: Set<string> = new Set();
        firstKfNonDataMarks.forEach((mId: string) => {
          let attrValStr: string = "";
          const tmpDatum: IDataItem = Util.nonDataTable.get(mId);
          Object.keys(tmpDatum).forEach((attr: string) => {
            if (Util.isNonDataAttr(attr) && attr !== "text") {
              attrValStr += `*${tmpDatum[attr]}`;
            }
          });
          if (typeof typeCount.get(attrValStr) === "undefined") {
            typeCount.set(attrValStr, []);
          }
          typeCount.get(attrValStr).push(mId);
          attrValstrs.add(attrValStr);
        });
        let oneFromEachType: boolean = true;
        typeCount.forEach((mIds: string[], mType: string) => {
          if (mIds.length > 1) {
            oneFromEachType = false;
          }
        });

        if (oneFromEachType) {
          //fetch all marks with the same attr values
          let suggestionLastKfMarks: Map<string, string[]> = new Map(); //key: attrValStr, value: marks have those attr values
          Util.nonDataTable.forEach((datum: IDataItem, mId: string) => {
            let tmpAttrValStr: string = "";
            Object.keys(datum).forEach((attr: string) => {
              if (Util.isNonDataAttr(attr) && attr !== "text") {
                tmpAttrValStr += `*${datum[attr]}`;
              }
            });
            if (attrValstrs.has(tmpAttrValStr)) {
              // if (tmpAttrValStr === attrValStr) {
              if (
                typeof suggestionLastKfMarks.get(tmpAttrValStr) === "undefined"
              ) {
                suggestionLastKfMarks.set(tmpAttrValStr, []);
              }
              suggestionLastKfMarks.get(tmpAttrValStr).push(mId);
            }
          });

          //sort marks from each type
          let kfBefore: string[][] = [];
          let kfAfter: string[][] = [];
          let targetIdx: number = -100;
          let allLastKfMarks: string[] = [];
          let reverseIdx: boolean = false;

          suggestionLastKfMarks.forEach(
            (mIds: string[], attrValStr: string) => {
              mIds.forEach((mId: string, idx: number) => {
                if (
                  mId === typeCount.get(attrValStr)[0] &&
                  targetIdx === -100
                ) {
                  targetIdx = idx;
                  if (targetIdx === mIds.length - 1) {
                    reverseIdx = true;
                  }
                }
                if (targetIdx === -100 || idx < targetIdx) {
                  if (typeof kfBefore[idx] === "undefined") {
                    kfBefore[idx] = [];
                  }
                  kfBefore[idx].push(mId);
                } else {
                  if (typeof kfAfter[idx - targetIdx] === "undefined") {
                    kfAfter[idx - targetIdx] = [];
                  }
                  kfAfter[idx - targetIdx].push(mId);
                }
                allLastKfMarks.push(mId);
              });
            }
          );
          let tmpKfMarks: string[][] = reverseIdx
            ? [...kfAfter, ...kfBefore.reverse()]
            : [...kfAfter, ...kfBefore];
          let sortedAttrValueComb: string[] = tmpKfMarks.map((mIds: string[]) =>
            mIds.join(",")
          );
          if (typeCount.size === 1) {
            sortedAttrValueComb = tmpKfMarks.map((mIds: string[]) => mIds[0]);
            const attrComb: string[] =
              typeCount.size === 1 ? ["id"] : ["clsIdx"];
            this.allPaths = [
              {
                attrComb: attrComb,
                sortedAttrValueComb: sortedAttrValueComb,
                kfMarks: tmpKfMarks,
                firstKfMarks: firstKfNonDataMarks,
                lastKfMarks: allLastKfMarks,
              },
            ];
          } else {
            let flag = true;
            tmpKfMarks.forEach((mIds: string[]) => {
              let clsIdx: string = null;
              mIds.forEach((mId) => {
                const currentIdx = Util.nonDataTable.get(mId).clsIdx as string;
                clsIdx = clsIdx || currentIdx;
                if (clsIdx != currentIdx) {
                  flag = false;
                }
              });
            });
            if (flag) {
              sortedAttrValueComb = tmpKfMarks.map(
                (mIds: string[]) => `${Util.nonDataTable.get(mIds[0]).clsIdx}`
              );
              const attrComb: string[] =
                typeCount.size === 1 ? ["id"] : ["clsIdx"];
              this.allPaths = [
                {
                  attrComb: attrComb,
                  sortedAttrValueComb: sortedAttrValueComb,
                  kfMarks: tmpKfMarks,
                  firstKfMarks: firstKfNonDataMarks,
                  lastKfMarks: allLastKfMarks,
                },
              ];
            }
          }
        }
      }
    }
    this.filterPathsWithGivenOrder(orderInfo);
  }

  public static filterPathsWithGivenOrder(orderInfo: IOrderInfo) {
    let tmpPathRecorder: IPath[] = [];
    switch (orderInfo.type) {
      case ASSCENDING_ORDER:
      case DESCENDING_ORDER:
        this.allPaths.forEach((p: IPath) => {
          if (p.attrComb.length === 1) {
            tmpPathRecorder.push(p);
          }
        });
        this.allPaths = tmpPathRecorder;
        break;
      default:
        break;
    }
  }

  public static pathToSpec(
    targetPath: IPath,
    aniId: string,
    selectedMarks: string[],
    marksInAni: string[],
    suggestOnFirstKf: boolean,
    updateState: boolean = true
  ) {
    console.log("updatestate", updateState);
    if (updateState) {
      suggestBox.resetProps();
    }

    let actionType: string = "";
    let actionInfo: any = {};
    let stateSelectedMarks: string[] = [];
    if (typeof targetPath === "undefined") {
      //create one animation
      actionType = SPLIT_CREATE_ONE_ANI;
      actionInfo = {
        aniId: aniId,
        newAniSelector: `#${selectedMarks.join(", #")}`,
        attrComb: [],
        attrValueSort: [],
      };
      stateSelectedMarks = selectedMarks;
    } else {
      //extract attr value order
      targetPath.kfMarks.forEach((marksInKf: string[]) => {
        stateSelectedMarks = [...stateSelectedMarks, ...marksInKf];
      });
      const attrValueSort: string[][] = Util.extractAttrValueOrder(
        targetPath.sortedAttrValueComb
      );
      let [
        clsOfMarksInPath,
        containsDataMarkInPath,
        containsNonDataMarkInPath,
      ] = Util.extractClsFromMarks(targetPath.lastKfMarks);
      const [
        clsOfMarksThisAni,
        containsDataMarkInAni,
        containsNonDataMarkInAni,
      ] = Util.extractClsFromMarks(marksInAni);
      if (!suggestOnFirstKf) {
          //marks in current path don't have the same classes as those in current animation
          if (clsOfMarksInPath.length > 1 && !containsNonDataMarkInPath) {
            //create multiple animations
            actionType = SPLIT_CREATE_MULTI_ANI;
            actionInfo = {
              aniId: aniId,
              path: targetPath,
              attrValueSort: attrValueSort,
            };
          } else if (containsDataMarkInPath && containsNonDataMarkInPath) {
            actionType = SPLIT_DATA_NONDATA_ANI;
            actionInfo = {
              aniId: aniId,
              path: targetPath,
              attrValueSort: attrValueSort,
            };
          } else {
            //create one animations
            const attrCombCopy = targetPath.attrComb.slice();
            actionType = SPLIT_CREATE_ONE_ANI;
            actionInfo = {
              aniId: aniId,
              newAniSelector: `#${targetPath.lastKfMarks.join(", #")}`,
              attrComb: attrCombCopy,
              attrValueSort: attrValueSort,
            };
          }
        // }
      } else {
        //the suggestion is based on all marks in current first  kf as the last kf
        if (clsOfMarksInPath.length > 1) {
          actionType = APPEND_SPEC_GROUPING;
          actionInfo = {
            aniId: aniId,
            attrComb: targetPath.attrComb,
            attrValueSort: attrValueSort,
          };
        } else {
          //append grouping to current animation
          actionType = APPEND_SPEC_GROUPING;
          actionInfo = {
            aniId: aniId,
            attrComb: targetPath.attrComb,
            attrValueSort: attrValueSort,
          };
        }
      }
    }

    console.log(
      "going to render path to spec: ",
      actionType,
      actionInfo,
      updateState
    );
    if (updateState) {
      store.dispatchSystem({
        // update spec
        type: actionType,
        payload: {
          infoObj: actionInfo,
        },
      });
      let oldSelectedMarks: string[] = [];
      store
        .getState()
        .selectMarks.forEach((mIds: string[], className: string) => {
          oldSelectedMarks = [...oldSelectedMarks, ...mIds];
        });
      store.dispatchSystem(updateSelectMarks(stateSelectedMarks));
    } else {
      //tmp code
      const attrComb: string[] = [...targetPath.attrComb];
      const tmpPath: IPath = JSON.parse(JSON.stringify(targetPath));
      let tmpSpec = this.generateTmpSpec(actionType, actionInfo);
      this.tmpSpecs.push({ attrComb: attrComb, spec: tmpSpec, path: tmpPath });
    }
  }

  /**
   * tmp function
   * @param actionType
   * @param actionInfo
   */
  public static generateTmpSpec(actionType: string, actionInfo: any) {
    let tmpSpec: ICanisSpec = { charts: [], animations: [] };
    switch (actionType) {
      case SPLIT_CREATE_ONE_ANI:
        tmpSpec = StateModifier.splitCreateOneAni(
          actionInfo.aniId,
          actionInfo.newAniSelector,
          actionInfo.attrComb,
          actionInfo.attrValueSort
        );
        break;
      case SPLIT_DATA_NONDATA_ANI:
        tmpSpec = StateModifier.splitDataNondataAni(
          actionInfo.aniId,
          actionInfo.path,
          actionInfo.attrValueSort
        );
        break;
      case REMOVE_CREATE_MULTI_ANI:
        tmpSpec = StateModifier.removeAndCreateMulti(
          actionInfo.aniId,
          actionInfo.path,
          actionInfo.attrValueSort
        );
        break;
      case UPDATE_SPEC_GROUPING:
        if (actionInfo.attrComb.length > 0) {
          tmpSpec = StateModifier.updateGrouping(
            actionInfo.aniId,
            actionInfo.attrComb,
            actionInfo.attrValueSort
          );
        }
        break;
      case SPLIT_CREATE_MULTI_ANI:
        tmpSpec = StateModifier.splitCreateMultiAni(
          actionInfo.aniId,
          actionInfo.path,
          actionInfo.attrValueSort
        );
        break;
      case APPEND_SPEC_GROUPING:
        tmpSpec = StateModifier.appendGrouping(
          actionInfo.aniId,
          actionInfo.attrComb,
          actionInfo.attrValueSort
        );
        break;
    }
    return tmpSpec;
  }

  public static filterPathsWithSelection(
    selectIdx: number,
    selectMarks: string[]
  ) {
    this.allPaths = this.allPaths.filter((path: IPath) => {
      return jsTool.identicalArrays(path.kfMarks[selectIdx], selectMarks);
    });
  }
}
