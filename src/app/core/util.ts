import { ChartSpec, TimingSpec, Animation } from "canis_toolkit";
import AttrSort from "../../redux/views/widgets/attrSort";
import KfItem from "../../redux/views/vl/kfItem";
import KfGroup from "../../redux/views/vl/kfGroup";
import KfTrack from "../../redux/views/vl/kfTrack";
import {
  CATEGORICAL_ATTR,
  DATA_SUGGESTION,
  EFFECTIVENESS_RANKING,
  EXCLUDED_DATA_ATTR,
  IVisualMapping,
  NON_DATA_SUGGESTION,
  NO_SUGGESTION,
  NUMERIC_ATTR,
  NUMERIC_CATEGORICAL_ATTR,
  TIME_ATTR_VALUE,
  VC_COLOR,
  VC_POSITION,
  VC_POSITION_X,
  VC_POSITION_Y,
} from "../consts";
import { NAV_HEIGHT } from "../../redux/views/nav/nav-consts";
import {
  IDataItem,
  IDataDatumType,
  ISortDataAttr,
  IKeyframeGroup,
  IKeyframe,
  ICoord,
} from "../../redux/global-interfaces";
import { store } from "../../redux/store";
import {
  updateChartScale,
  updateDefaultChartScale,
} from "../../redux/action/chartAction";
import { translateChart } from "../../util/tool";
import { jsTool } from "../../util/jsTool";
import { isEqual } from "lodash";

export default class Util {
  static filteredDataTable: Map<string, IDataItem> = new Map(); //markId, dataItem
  static numericAttrOrder: Map<string, string[]> = new Map(); //attr name, mark id array
  static nonDataTable: Map<string, IDataItem> = new Map(); //markId, non dataitem (for axis, legend, title)
  static attrType: IDataDatumType = {};
  static dataAttrs: string[];
  static timeAttrs: string[];
  static dataValues: Map<string, string[] | number[]> = new Map(); //key: attr name, value: all values of this attr
  static nonDataAttrs: string[] = []; //same as those in nonDataTable
  static nonDataValues: Map<string, Array<string | number>> = new Map(); //key: attr name, value: all values
  static visualMappings: IVisualMapping[] = [];

  /**
   * check whether the input string is an attribute value
   * @param attrName
   */
  public static isValidDataVal(testStr: string): boolean {
    let isValid: boolean = false;
    this.dataValues.forEach((vals: string[], attrName: string) => {
      vals.forEach((val: string) => {
        isValid = isValid || val.toLowerCase() === testStr.toLowerCase();
      });
    });
    return isValid;
  }

  /**
   * put chart content in the center
   */
  public static transformSVG(): void {
    const svg = document.getElementById("visChart");
    svg.removeAttributeNS(null, "width");
    svg.removeAttributeNS(null, "height");
    svg.removeAttributeNS(null, "viewBox");
    const svgW: number = svg.clientWidth;
    const svgH: number = svg.clientHeight;
    const chartG = svg.querySelector("#chartContent");
    const chartW: number = chartG.getBoundingClientRect().width;
    const chartH: number = chartG.getBoundingClientRect().height;

    svg.setAttributeNS(null, 'width', `${svgW}`);
    svg.setAttributeNS(null, 'height', `${svgH}`);
    svg.setAttributeNS(null, 'viewBox', `0 0 ${svgW} ${svgH}`);
    //scale chart content

    const widthRatio: number = (0.8 * svgW) / chartW;
    const heightRatio: number = (0.8 * svgH) / chartH;
    const scaleRatio: number =
      widthRatio > heightRatio ? heightRatio : widthRatio;
    const transSt: string = `${(svgW - chartW * scaleRatio) / 2
      }, ${NAV_HEIGHT}`;
    translateChart(
      { x: (svgW - chartW * scaleRatio) / 2, y: NAV_HEIGHT },
      false
    );
    // translateChart({ x: 0, y: 0 }, false);
    // chartG.setAttributeNS(null, 'transform', `translate(${(svgW - chartW * scaleRatio) / 2}, ${NAV_HEIGHT})`);
    store.dispatchSystem(updateDefaultChartScale(scaleRatio));
    store.dispatchSystem(updateChartScale(scaleRatio));
  }

  public static extractVisualEncoding() {
    this.visualMappings = [];
    Object.keys(ChartSpec.chartUnderstanding).forEach(
      (dataAttrName: string) => {
        const vcs: string[] = ChartSpec.chartUnderstanding[dataAttrName];
        vcs.forEach((vc: string) => {
          switch (vc) {
            case VC_COLOR:
              const uniqueVals: string[] = [];
              ChartSpec.dataMarkDatum.forEach((datum: any, mId: string) => {
                if (!uniqueVals.includes(datum[dataAttrName])) {
                  uniqueVals.push(datum[dataAttrName]);
                  const color: string = document
                    .getElementById(mId)
                    .getAttributeNS(null, "fill");
                  let rgbColor: number[] =
                    color.indexOf("#") >= 0
                      ? this.toRGB(color)
                      : this.extractRGBNums(color);
                  const tmpVisualMapping: IVisualMapping = {
                    visualChannel: vc,
                    visualVal: rgbColor,
                    dataAttr: dataAttrName,
                    dataVal: datum[dataAttrName],
                  };
                  if (
                    !jsTool.containObj(this.visualMappings, tmpVisualMapping)
                  ) {
                    this.visualMappings.push(tmpVisualMapping);
                  }
                }
              });
              break;
            case VC_POSITION:
              Array.from(document.getElementsByClassName("axis")).forEach(
                (axisContainer: HTMLElement) => {
                  const datum = JSON.parse(
                    axisContainer.getAttributeNS(null, "data-datum")
                  );
                  const visualChannel: string = datum.type.toLowerCase();
                  const tmpDataAttrName: string = datum.position;
                  if (dataAttrName === tmpDataAttrName) {
                    let tmpArr: any[] = [];
                    Array.from(
                      axisContainer.querySelectorAll(".axis-label")
                    ).forEach((label: HTMLElement) => {
                      tmpArr.push({
                        vc: parseFloat(
                          label.getAttributeNS(null, visualChannel)
                        ),
                        dataVal: label.innerHTML,
                      });
                    });
                    tmpArr = tmpArr.sort((a: any, b: any) => {
                      return visualChannel === VC_POSITION_Y
                        ? b.vc - a.vc
                        : a.vc - b.vc;
                    });
                    tmpArr.forEach((vd, idx) => {
                      const tmpVisualMapping: IVisualMapping = {
                        visualChannel: visualChannel,
                        visualVal: idx,
                        dataAttr: dataAttrName,
                        dataVal: vd.dataVal,
                      };
                      if (
                        !jsTool.containObj(
                          this.visualMappings,
                          tmpVisualMapping
                        )
                      ) {
                        this.visualMappings.push(tmpVisualMapping);
                      }
                    });
                  }
                }
              );
              break;
          }
        });
      }
    );
  }
  public static extractRGBNums(rgbStr: string): number[] {
    rgbStr = rgbStr.replace(/\s/g, "");
    rgbStr = rgbStr.replace(/(rgb\(|\))/g, "");
    return rgbStr.split(",").map((s) => parseInt(s));
  }
  public static toRGB(hexStr: string) {
    return [
      parseInt("0x" + hexStr.substring(1, 3)),
      parseInt("0x" + hexStr.substring(3, 5)),
      parseInt("0x" + hexStr.substring(5, 7)),
    ];
  }
  /**
   * separate input marks to data encoded and non data encoded
   * @param markIdArr
   */
  public static separateDataAndNonDataMarks(markIdArr: string[]): {
    dataMarks: string[];
    nonDataMarks: string[];
  } {
    let dataMarks: string[] = [];
    let nonDataMarks: string[] = [];
    markIdArr.forEach((mId: string) => {
      if (typeof ChartSpec.dataMarkDatum.get(mId) !== "undefined") {
        dataMarks.push(mId);
      } else {
        nonDataMarks.push(mId);
      }
    });
    return { dataMarks: dataMarks, nonDataMarks: nonDataMarks };
  } //返回一个对象 包含dataMarks列表 和 nonDataMarks列表

  /**
   * based on selected marks, judge perfrom which kind of suggestion
   * @param markIds
   */
  public static judgeSuggestionType(markIds: string[]): string {
    const allDataEncodedMarks: string[] = Array.from(
      this.filteredDataTable.keys()
    );
    const allNonDataEncodedMarks: string[] = Array.from(
      this.nonDataTable.keys()
    );
    let containDataMark: boolean = false,
      containNonDataMark: boolean = false;
    for (let i = 0, len = markIds.length; i < len; i++) {
      if (allDataEncodedMarks.includes(markIds[i])) {
        containDataMark = true;
        if (containNonDataMark) {
          break;
        }
      } else if (allNonDataEncodedMarks.includes(markIds[i])) {
        containNonDataMark = true;
        if (containDataMark) {
          break;
        }
      }
    }
    /*
            如果allDataEncodedMarks和allNonDataEncodedMarks同时为true，
            说明两种编码方式都存在；
            如果只有一个为true，说明只有一种编码数据。
        */
    if (containDataMark && !containNonDataMark) {
      return DATA_SUGGESTION;
    } else if (!containDataMark && containNonDataMark) {
      return NON_DATA_SUGGESTION;
    } else {
      return NO_SUGGESTION;
    }
  }

  /**
   * suggest based on selected marks
   * @param markIds : selected marks
   */
  public static suggestSelection(markIds: string[]): string[] {
    //选择之后的推荐
    if (markIds === undefined) return [];
    if (markIds.length > 0) {
      const suggestionType: string = this.judgeSuggestionType(markIds);
      switch (suggestionType) {
        case DATA_SUGGESTION:
          return this.suggestSelBasedOnData(markIds);

        case NON_DATA_SUGGESTION:
          return this.suggestSelBasedOnChart(markIds);

        default:
          return markIds;
      }
    } else {
      return [];
    }
  }

  /**
   * the selected marks are data encoded marks
   */
  public static suggestSelBasedOnData(markIds: string[]): string[] {
    //markIds 所选的mark
    //find the same and diff attributes of the selected marks
    const [sameAttrs, diffAttrs] = this.compareAttrs(
      markIds,
      this.filteredDataTable,
      Object.keys(this.attrType),
      true
    );
    //filter attributes according to the effectiveness ranking
    const filteredDiffAttrs = this.filterAttrs(diffAttrs, markIds);
    //list all data-encoded marks
    let allMarkIds: string[] = Array.from(this.filteredDataTable.keys());
    //mark groups
    const [sections, orderedSectionIds] = this.partitionChart(
      sameAttrs,
      filteredDiffAttrs,
      allMarkIds,
      this.filteredDataTable
    );

    //judge if marks from one section are selected all, otherwise repeat selection with the one with the most selected marks
    let allSelected: boolean = false,
      mostSelectionNumInSec: number = 0;
    sections.forEach((marksInSec, secId) => {
      allSelected = jsTool.arrayContained(markIds, marksInSec) || allSelected; //whether marks in this section are all selected
      let tmpCount: number = 0;
      marksInSec.forEach((mId) => {
        if (markIds.includes(mId)) {
          tmpCount++;
        }
      }); //统计一个mark unit中，被选择的mark个数
      //mostSelectionNumInsec 记录了在所有被选择的mark unit中单个单元最多选择mark的个数
      mostSelectionNumInSec =
        tmpCount > mostSelectionNumInSec ? tmpCount : mostSelectionNumInSec;
    });

    //for each section, select the same most number of marks or all of the marks
    //create container for each section, and push in the selected marks first
    let selAndSug: Map<string, Set<string>> = new Map();
    markIds.forEach((markId) => {
      let sectionId: string = "";
      [...sameAttrs, ...filteredDiffAttrs].forEach((attr) => {
        // sectionId += ChartSpec.dataMarkDatum.get(markId)[attr] + ',';
        sectionId += this.filteredDataTable.get(markId)[attr] + ","; //获取每个mark的属性
      });
      if (typeof selAndSug.get(sectionId) === "undefined") {
        selAndSug.set(sectionId, new Set());
      }
      selAndSug.get(sectionId).add(markId); //selAndSug记录当前选中的mark的属性字符串和markId集合
    });

    //find suggestion
    let valueOfSameAttrs: string[] = [];
    sameAttrs.forEach((sAttr) => {
      valueOfSameAttrs.push(
        this.filteredDataTable.get(markIds[0])[sAttr].toString()
      );
      // valueOfSameAttrs.push(ChartSpec.dataMarkDatum.get(markIds[0])[sAttr]);
    }); //获取当前选择中的相同的全部相同属性

    sections.forEach((marksInSec, secId) => {
      //此时的section 无顺序
      /**
       * marksInSec 当前section中的markId 数组
       * secId为属性list
       */
      marksInSec.forEach((mId) => {
        //遍历markgroup中的每一个mark
        if (filteredDiffAttrs.length > 0) {
          //there are diff categorical attrs
          if (typeof selAndSug.get(secId) === "undefined") {
            selAndSug.set(secId, new Set());
          }
          if (allSelected) {
            //only those sections with the same attributes as the selected marks
            let blocks = secId.split(","); // mark的属性集合
            if (jsTool.arrayContained(blocks, valueOfSameAttrs)) {
              selAndSug.get(secId).add(mId); //将当前选择的mark添加到对应属性下面
            }
          } else {
            if (selAndSug.get(secId).size < mostSelectionNumInSec) {
              //judge if this mark has the same attr value
              let hasSameVal: boolean = true;
              for (let j = 0, len2 = sameAttrs.length; j < len2; j++) {
                // if (ChartSpec.dataMarkDatum.get(mId)[sameAttrs[j]] !== ChartSpec.dataMarkDatum.get(markIds[0])[sameAttrs[j]]) {
                if (
                  this.filteredDataTable.get(mId)[sameAttrs[j]] !==
                  this.filteredDataTable.get(markIds[0])[sameAttrs[j]]
                ) {
                  hasSameVal = false;
                  break;
                }
              }
              if (hasSameVal) {
                selAndSug.get(secId).add(mId);
              }
            }
          }
        } else if (filteredDiffAttrs.length === 0 && markIds.length > 1) {
          //there are no diff categorical attrs && selected more than 1 mark
          let hasSameVal: boolean = true;
          for (let j = 0, len2 = sameAttrs.length; j < len2; j++) {
            // if (ChartSpec.dataMarkDatum.get(mId)[sameAttrs[j]] !== ChartSpec.dataMarkDatum.get(markIds[0])[sameAttrs[j]]) {
            if (
              this.filteredDataTable.get(mId)[sameAttrs[j]] !==
              this.filteredDataTable.get(markIds[0])[sameAttrs[j]]
            ) {
              hasSameVal = false;
              break;
            }
          }
          if (hasSameVal) {
            selAndSug.get(secId).add(mId);
          }
        }
      });
    });

    //add suggestion result to the selected marks
    let selectedMarks: string[] = [];
    selAndSug.forEach((selAndSugMarks, secId) => {
      selectedMarks.push(...selAndSugMarks);
    });
    return selectedMarks;
  }

  /**
   * the selected marks are non data encoded marks
   */
  public static suggestSelBasedOnChart(markIds: string[]): string[] {
    const [sameAttrs, diffAttrs] = this.compareAttrs(
      markIds,
      this.nonDataTable,
      this.nonDataAttrs,
      false
    );
    // const allNonDataMarks: string[] = Array.from(this.nonDataTable.keys());
    let suggestMarks: string[] = [];
    this.nonDataTable.forEach((d: IDataItem, mId: string) => {
      let flag = true;
      sameAttrs.forEach((an: string) => {
        if (d[an] !== this.nonDataTable.get(markIds[0])[an]) {
          flag = false;
        }
      });
      if (flag) {
        suggestMarks.push(mId);
      }
    });
    return [...markIds, ...suggestMarks];
  }

  /**
   * partition the chart according to the given attributes when doing data-driven suggestion
   * @param sameAttr
   * @param filteredDiffAttrs
   * @param markIds
   * @param hasOneMark
   */
  /*
        1.相同的属性
        2.不同的属性（筛选后唯一的一个）
        3.markId列表
        4.整个数据表
        返回划分后的映射表
     */
  public static partitionChart(
    sameAttrs: string[],
    filteredDiffAttrs: string[],
    markIds: string[],
    dataTable: Map<string, IDataItem>,
    hasOneMark: boolean = false
  ): [Map<string, string[]>, string[]] {
    let sections = new Map(); //存放mark unit的集合
    let sectionIdRecord: string[][] = []; //存放每一个mark属性的集合

    markIds.forEach((markId) => {
      let sectionId: string = "";
      let seperateSecId: string[] = []; //for ordering section ids
      [...sameAttrs, ...filteredDiffAttrs].forEach((attr) => {
        //获取每个mark的属性列表 保存在列表seperateSecId中
        sectionId += dataTable.get(markId)[attr] + ","; //mark的属性字符串
        seperateSecId.push(dataTable.get(markId)[attr].toString()); //每个mark多个属性的数组
      });
      //生成section序列。可行的序列

      if (hasOneMark) {
        sectionId += markId + ",";
        seperateSecId.push(markId);
      }
      if (typeof sections.get(sectionId) === "undefined") {
        sections.set(sectionId, []); //section{attr:[...marks]}
        sectionIdRecord.push(seperateSecId); //存放每个mark的所有属性序列
      }
      sections.get(sectionId).push(markId);
    });

    //order section ids
    sectionIdRecord.sort((a, b) => {
      let diffValueIdx = 0;
      for (
        let i = 0, len = [...sameAttrs, ...filteredDiffAttrs].length;
        i < len;
        i++
      ) {
        if (a[i] !== b[i]) {
          diffValueIdx = i;
          break;
        }
      }
      if (b[diffValueIdx] > a[diffValueIdx]) {
        return -1;
      } else {
        return 1;
      }
    });
    const orderedSectionIds = sectionIdRecord.map((a) => a.join(",") + ",");
    return [sections, orderedSectionIds];
  }

  /**
   * filter attributes according to the effectiveness ranking
   * @param attrs
   */
  public static filterAttrs(attrs: string[], selectedMarks?: string[]) {
    let filteredAttrs: string[] = [];
    let typeRecorder: string[] = [];
    for (let i = 0, len = EFFECTIVENESS_RANKING.length; i < len; i++) {
      for (let j = 0, len2 = attrs.length; j < len2; j++) {
        let tmpAttrType: string[] = ChartSpec.chartUnderstanding[attrs[j]];
        if (typeof tmpAttrType !== "undefined") {
          if (
            tmpAttrType.includes(EFFECTIVENESS_RANKING[i]) &&
            (jsTool.arrayContained(tmpAttrType, typeRecorder) ||
              jsTool.arrayContained(typeRecorder, tmpAttrType) ||
              typeRecorder.length === 0)
          ) {
            filteredAttrs.push(attrs[j]);
            typeRecorder = tmpAttrType;
          }
        }
      }
    }

    if (typeof selectedMarks !== "undefined") {
      //check whether do we need to filter out some attrs like color or shape
      const tmpSections: Map<string, string[]> = new Map();
      selectedMarks.forEach((mId: string) => {
        const tmpDataItem: IDataItem = this.filteredDataTable.get(mId);
        let keyArr: string[] = [];
        if (typeof tmpDataItem !== "undefined") {
          filteredAttrs.forEach((fa: string) => {
            keyArr.push(`${tmpDataItem[fa]}`);
          });
        }
        const key: string = keyArr.length > 0 ? keyArr.join(",") : "";
        if (typeof tmpSections.get(key) === "undefined") {
          tmpSections.set(key, []);
        }
        tmpSections.get(key).push(mId);
      });
      const extraAttrs: Set<string> = new Set();
      tmpSections.forEach((mIds: string[], key: string) => {
        attrs.forEach((a: string) => {
          if (!filteredAttrs.includes(a)) {
            for (let i = 0, len = mIds.length; i < len; i++) {
              if (
                this.filteredDataTable.get(mIds[i])[a] !==
                this.filteredDataTable.get(mIds[0])[a]
              ) {
                extraAttrs.add(a);
                break;
              }
            }
          }
        });
      });
      return [...filteredAttrs, ...extraAttrs];
    }
    return filteredAttrs;
  }

  /**
   * compare attributes of the selected marks, find the same and different attributes
   * @param markIds
   * @param markData
   */
  public static compareAttrs(
    markIds: string[],
    dataTable: Map<string, IDataItem>,
    allAttrs: string[],
    isDataAttr: boolean
  ): string[][] {
    let sameAttr: string[] = [],
      diffAttrs: string[] = [];
    allAttrs.forEach((attrName: string) => {
      let sameAttrType = true;
      const firstMarkType = dataTable.get(markIds[0])[attrName]; //获取属性名
      for (let i = 1, len = markIds.length; i < len; i++) {
        if (dataTable.get(markIds[i])[attrName] !== firstMarkType) {
          sameAttrType = false;
          break;
        }
      } //判断是否为相同属性

      if (
        (isDataAttr &&
          !EXCLUDED_DATA_ATTR.includes(attrName) &&
          this.attrType[attrName] === CATEGORICAL_ATTR) ||
        !isDataAttr
      ) {
        sameAttrType ? sameAttr.push(attrName) : diffAttrs.push(attrName);
      }
    });

    return [sameAttr, diffAttrs]; //返回相同和不同的属性
  }

  public static fetchNumericAttrs(dataItem: IDataItem): string[] {
    const numericAttrs: string[] = [];
    for (const key in dataItem) {
      if (
        !isNaN(Number(dataItem[key])) &&
        dataItem[key] !== "" &&
        !NUMERIC_CATEGORICAL_ATTR.includes(key)
      ) {
        numericAttrs.push(key);
      }
    }
    return numericAttrs;
  }

  public static sortNumeric(
    markData: Map<string, IDataItem>,
    attrName: string
  ) {
    let markIds: string[] = [...markData.keys()];
    markIds.sort(
      (a: string, b: string) =>
        Number(markData.get(a)[attrName]) - Number(markData.get(b)[attrName])
    );
    this.numericAttrOrder.set(attrName, markIds);
  }

  /**
   * determine the attribute type of the data attributes of marks
   * @param markData
   */
  public static extractAttrValueAndDeterminType(
    markData: Map<string, IDataItem>
  ) {
    this.filteredDataTable.clear();
    this.dataAttrs = [];
    this.timeAttrs = [];
    this.dataValues.clear();
    this.attrType = {};
    markData.forEach((dataDatum: IDataItem, markId: string) => {
      let tmpDataItem: IDataItem = {};
      for (const key in dataDatum) {
        let tmpAttrType: string =
          !isNaN(Number(dataDatum[key])) &&
            dataDatum[key] !== "" &&
            !NUMERIC_CATEGORICAL_ATTR.includes(key)
            ? NUMERIC_ATTR
            : CATEGORICAL_ATTR;
        this.attrType[key] = tmpAttrType;
        //sort numeric
        if (tmpAttrType === NUMERIC_ATTR) {
          this.sortNumeric(markData, key);
        }

        if (!EXCLUDED_DATA_ATTR.includes(key)) {
          tmpDataItem[key] = dataDatum[key];
          this.dataAttrs.push(key);
          if (typeof this.dataValues.get(key) === "undefined") {
            this.dataValues.set(key, []);
          }
          this.dataValues.get(key).push(<never>dataDatum[key]);
        }
      }
      this.filteredDataTable.set(markId, tmpDataItem);
    });
    this.dataAttrs = [...new Set(this.dataAttrs)];
    //sort data values
    this.sortAttrValues(this.dataValues);
  }

  public static extractNonDataAttrValue(markData: Map<string, IDataItem>) {
    this.nonDataTable.clear();
    this.nonDataAttrs = [];

    let lastType: string = "";
    let typeCount: Map<string, number> = new Map(); //key: type value , value: number of times this kind of type shows in a sequence
    typeCount.set("", 0);
    markData.forEach((dataDatum: IDataItem, markId: string) => {
      let tmpDataItem: IDataItem = {};
      for (const key in dataDatum) {
        if (key === "_TYPE" && `${dataDatum[key]}`.includes("-")) {
          const typeValue: string = `${dataDatum[key]}`;
          if (typeof typeCount.get(typeValue) === "undefined") {
            typeCount.set(typeValue, 0);
          }
          if (typeValue !== lastType) {
            typeCount.set(lastType, typeCount.get(lastType) + 1);
            lastType = typeValue;
          }
          const attrValues: string[] = typeValue.split("-");
          attrValues.forEach((av: string, i: number) => {
            if (i === 0) {
              tmpDataItem._TYPE = `${av}`;
              this.nonDataAttrs.push("_TYPE");
              if (typeof this.nonDataValues.get("_TYPE") === "undefined") {
                this.nonDataValues.set("_TYPE", []);
              }
              this.nonDataValues.get("_TYPE").push(`${av}`);

              tmpDataItem._TYPE_IDX = `${typeCount.get(typeValue)}`;
              this.nonDataAttrs.push("_TYPE_IDX");
              if (typeof this.nonDataValues.get("_TYPE_IDX") === "undefined") {
                this.nonDataValues.set("_TYPE_IDX", []);
              }
              this.nonDataValues
                .get("_TYPE_IDX")
                .push(`${typeCount.get(typeValue)}`);
            } else {
              tmpDataItem[`_TYPE${i}`] = av;
              this.nonDataAttrs.push(`_TYPE${i}`);
              if (typeof this.nonDataValues.get(`_TYPE${i}`) === "undefined") {
                this.nonDataValues.set(`_TYPE${i}`, []);
              }
              this.nonDataValues.get(`_TYPE${i}`).push(av);
            }
          });
        } else {
          tmpDataItem[key] = dataDatum[key];
          if (key === "text") {
            const dataField = Util.dataAttrs.find((attr) =>
              (Util.dataValues.get(attr) as (string | number)[]).includes(
                dataDatum[key] as string
              )
            );
            if (dataField) {
              tmpDataItem[dataField] = dataDatum[key];
              if (!this.nonDataAttrs.includes(dataField)) {
                this.nonDataAttrs.push(dataField);
              }
              if (typeof this.nonDataValues.get(dataField) === "undefined") {
                this.nonDataValues.set(dataField, []);
              }
              this.nonDataValues.get(dataField).push(dataDatum[key]);
            }
          }
          this.nonDataAttrs.push(key);
          if (typeof this.nonDataValues.get(key) === "undefined") {
            this.nonDataValues.set(key, []);
          }
          this.nonDataValues.get(key).push(dataDatum[key]);
        }
      }
      this.nonDataTable.set(markId, tmpDataItem);
    });
    this.nonDataAttrs = [...new Set(this.nonDataAttrs)];

    //sort data values
    this.sortAttrValues(this.nonDataValues);
  }

  public static sortAttrValues(values: Map<string, Array<string | number>>) {
    values.forEach((v: Array<string | number>, aName: string) => {
      v = [...new Set(v)];
      if (this.judgeTimeAttr(v)) {
        this.timeAttrs.push(aName);
      }
      v.sort((a, b) => {
        let aComp: string | number = isNaN(parseFloat(`${a}`))
          ? a
          : parseFloat(`${a}`);
        let bComp: string | number = isNaN(parseFloat(`${b}`))
          ? b
          : parseFloat(`${b}`);

        if (bComp > aComp) {
          return -1;
        } else {
          return 1;
        }
      });
      values.set(aName, v);
    });
  }

  public static isNonDataAttr(attr: string): boolean {
    return attr.includes("_TYPE") || attr === "mShape";
  }

  public static filterDataSort(dataSort: ISortDataAttr[]): ISortDataAttr[] {
    return dataSort.filter((ds) => !EXCLUDED_DATA_ATTR.includes(ds.attr));
  }

  /**
   * find out to sort with which attr
   */
  public static findUpdatedAttrOrder(
    sda: ISortDataAttr[]
  ): [boolean, ISortDataAttr] {
    let result: ISortDataAttr = { attr: "", sort: "" };

    let flag = false;
    const sortDataAttrs: ISortDataAttr[] = store.getState().sortDataAttrs;
    if (sortDataAttrs.length > 0) {
      for (let i = 0, len = sortDataAttrs.length; i < len; i++) {
        let found: boolean = false;
        for (let j = 0; j < len; j++) {
          if (sda[j].attr === sortDataAttrs[i].attr) {
            found =
              sda[j].sort !== sortDataAttrs[i].sort &&
              sda[j].sort !== AttrSort.INDEX_ORDER;
            if (found) {
              result.attr = sda[j].attr;
              result.sort = sda[j].sort;
              break;
            }
          }
        }
        flag = flag || found;
        if (found) {
          break;
        }
      }
    } else {
      sda.forEach((ds: ISortDataAttr) => {
        if (ds.sort !== AttrSort.INDEX_ORDER) {
          result.attr = ds.attr;
          result.sort = ds.sort;
          flag = true;
        }
      });
    }

    return [flag, result];
  }
  public static sortDataTable(attrOrder: ISortDataAttr): string[] {
    let result: string[] = [];
    if (attrOrder.attr !== "") {
      switch (attrOrder.sort) {
        case AttrSort.INDEX_ORDER:
          result = Array.from(store.getState().dataTable.keys());
          result.sort((a, b) => {
            const aNum: number = parseInt(a.substring(4));
            const bNum: number = parseInt(b.substring(4));
            return aNum < bNum ? -1 : 1;
          });
          break;
        case AttrSort.ASSCENDING_ORDER:
        case AttrSort.DESCENDING_ORDER:
          let arrToOrder: string[][] = [];
          store.getState().dataTable.forEach((datum, markId) => {
            if (attrOrder.attr !== "markId") {
              arrToOrder.push([markId, datum[attrOrder.attr].toString()]);
            } else {
              arrToOrder.push([markId, markId]);
            }
          });
          arrToOrder.sort((a, b) => {
            let va: string = a[1];
            let vb: string = b[1];
            if (attrOrder.attr === "markId") {
              va = va.substring(4);
              vb = vb.substring(4);
            }
            const compareA: string | number = !isNaN(Number(va))
              ? Number(va)
              : va;
            const compareB: string | number = !isNaN(Number(vb))
              ? Number(vb)
              : vb;
            if (attrOrder.sort === AttrSort.ASSCENDING_ORDER)
              return compareA < compareB ? -1 : 1;
            else return compareA > compareB ? -1 : 1;
          });
          result = arrToOrder.map((a) => a[0]);
          break;
      }
    }
    return result;
  }

  /**
   * find the first group of keyframes in a keyframe group, for plus button functions
   */
  public static findFirstKfs(kfg: IKeyframeGroup): IKeyframe[] {
    if (kfg.keyframes.length > 0) {
      return kfg.keyframes;
    } else {
      return this.findFirstKfs(kfg.children[0]);
    }
  }

  // public static aniRootToFakeKFGroup(aniunitNode: any, aniId: string, parentChildIdx: number): IKeyframeGroup {
  //     const keyframes: IKeyframe[] = [];
  //     state.charts.forEach((chart: string, idx: number) => {
  //         const tmpKf: IKeyframe = {
  //             id: idx,
  //             groupRef: 'id',
  //             isGhost: true,
  //             timingRef: TimingSpec.timingRef.previousEnd,
  //             durationIcon: true,
  //             hiddenDurationIcon: false,
  //             duration: aniunitNode.children[0].end - aniunitNode.children[0].start,
  //             delayIcon: false,
  //             delay: 0,
  //             allCurrentMarks: [],
  //             allGroupMarks: aniunitNode.marks,
  //             marksThisKf: aniunitNode.marks,
  //             thumbnail: chart
  //         }
  //         keyframes.push(tmpKf);
  //         KfItem.allKfInfo.set(idx, tmpKf);
  //     })
  //     return {
  //         groupRef: 'root',
  //         id: 0,
  //         aniId: aniId,
  //         marks: aniunitNode.marks,
  //         children: [],
  //         keyframes: keyframes,
  //         timingRef: TimingSpec.timingRef.previousStart,
  //         delayIcon: false,
  //         delay: 0,
  //         newTrack: false
  //     }
  // }

  public static aniRootToKFGroup(
    aniunitNode: any,
    aniId: string,
    parentChildIdx: number
  ): IKeyframeGroup {
    let kfGroupRoot: IKeyframeGroup = {
      groupRef: aniunitNode.groupRef,
      id: aniunitNode.id,
      aniId: aniId,
      marks: aniunitNode.marks,
      timingRef: aniunitNode.timingRef,
      delay: aniunitNode.delay,
      delayIcon:
        (typeof aniunitNode.offset !== "undefined" &&
          aniunitNode.offset !== 0) ||
        (aniunitNode.delay > 0 && parentChildIdx > 0),
      newTrack:
        (typeof aniunitNode.align === "undefined" &&
          aniunitNode.groupRef === "root") ||
        (aniunitNode.timingRef === TimingSpec.timingRef.previousStart &&
          parentChildIdx !== 0),
    };
    if (typeof aniunitNode.aniId !== "undefined") {
      kfGroupRoot.alignId = aniunitNode.aniId;
    }
    if (typeof aniunitNode.offset !== "undefined") {
      kfGroupRoot.delay = aniunitNode.offset;
    }
    if (typeof aniunitNode.align !== "undefined") {
      if (aniunitNode.align.type === "element") {
        kfGroupRoot.newTrack = true;
      }
      kfGroupRoot.alignType = aniunitNode.align.type;
      kfGroupRoot.alignTarget = aniunitNode.align.target;
      kfGroupRoot.merge = aniunitNode.align.merge;
    }
    if (typeof aniunitNode.refValue !== "undefined") {
      kfGroupRoot.refValue = aniunitNode.refValue;
    }
    kfGroupRoot.children = [];
    kfGroupRoot.keyframes = [];
    if (aniunitNode.children.length > 0) {
      if (aniunitNode.children[0].children.length > 0) {
        let childrenIsGroup: boolean = true;
        if (
          typeof aniunitNode.children[0].children[0].definedById !== "undefined"
        ) {
          if (!aniunitNode.children[0].children[0].definedById) {
            childrenIsGroup = false;
          }
        }
        if (childrenIsGroup) {
          aniunitNode.children.forEach((c: any, i: number) => {
            const kfGroupChild: IKeyframeGroup = this.aniRootToKFGroup(
              c,
              aniId,
              i
            );
            kfGroupRoot.children.push(kfGroupChild);
          });
        } else {
          const judgeMerge: any = this.mergeNode(aniunitNode.children);
          if (!judgeMerge.merge) {
            aniunitNode.children.forEach((k: any, i: number) =>
              kfGroupRoot.keyframes.push(
                this.aniLeafToKF(k, i, aniId, kfGroupRoot, kfGroupRoot.marks)
              )
            );
          } else {
            kfGroupRoot.keyframes.push(
              this.aniLeafToKF(
                judgeMerge.mergedNode,
                0,
                aniId,
                kfGroupRoot,
                kfGroupRoot.marks
              )
            );
          }
        }
      } else {
        //children are keyframes
        const judgeMerge: any = this.mergeNode(aniunitNode.children);
        if (!judgeMerge.merge) {
          aniunitNode.children.forEach((k: any, i: number) =>
            kfGroupRoot.keyframes.push(
              this.aniLeafToKF(k, i, aniId, kfGroupRoot, kfGroupRoot.marks)
            )
          );
        } else {
          kfGroupRoot.keyframes.push(
            this.aniLeafToKF(
              judgeMerge.mergedNode,
              0,
              aniId,
              kfGroupRoot,
              kfGroupRoot.marks
            )
          );
        }
      }
    } else {
    }
    return kfGroupRoot;
  }

  /**
   * if children start and end at the same time, merge them into one node
   * @param children
   */
  public static mergeNode(children: any[]): {
    merge: boolean;
    mergedNode?: any;
  } {
    let merge: boolean = true;
    for (let i = 0, len = children.length; i < len; i++) {
      const c: any = children[i];
      if (c.start !== children[0].start || c.end !== children[0].end) {
        merge = false;
        break;
      }
    }
    if (merge) {
      children.forEach((c: any) => {
        children[0].marks = [...children[0].marks, ...c.marks];
      });
      return { merge: true, mergedNode: children[0] };
    }
    return { merge: false };
  }

  /**
   *
   * @param aniLeaf
   * @param leafIdx : leaf index in its parent, need this to determine whether to draw offset or not
   * @param aniId
   * @param parentId
   */
  public static aniLeafToKF(
    aniLeaf: any,
    leafIdx: number,
    aniId: string,
    parentObj: IKeyframeGroup,
    parentMarks: string[]
  ): IKeyframe {
    //find the min and max duraion of kfs, in order to render kfs
    const tmpDuration: number = aniLeaf.end - aniLeaf.start;
    aniLeaf.marks = [...new Set(aniLeaf.marks)];
    //find all the marks animate before marks in aniLeaf
    const marksInOrder: string[] = Animation.animations.get(aniId).marksInOrder;

    let targetIdx: number = -1;
    let minStartTime: number = 100000; //min start time of marks in this leaf
    aniLeaf.marks.forEach((m: string) => {
      const tmpIdx: number = marksInOrder.indexOf(m);
      // if(Animation.allMarkAni.get(m) != undefined){
      if (Animation.allMarkAni.get(m).startTime < minStartTime) {
        minStartTime = Animation.allMarkAni.get(m).startTime;
        targetIdx = tmpIdx;
      }
      // }

    });
    let allCurrentMarks: string[] = [];

    Animation.animations.forEach((ani: any) => {
      const tmpMarksInOrder: string[] = ani.marksInOrder;
      tmpMarksInOrder.forEach((m: string) => {
        if (Animation.allMarkAni.get(m).startTime < minStartTime) {
          allCurrentMarks.push(m);
        }
      });
    });

    let drawDelay: boolean =
      aniLeaf.delay > 0 &&
      leafIdx > 0 &&
      !(
        aniLeaf.timingRef === TimingSpec.timingRef.previousEnd &&
        typeof aniLeaf.alignTo !== "undefined"
      );
    let drawDuration: boolean =
      aniLeaf.timingRef === TimingSpec.timingRef.previousEnd ||
      parentObj.marks.length === aniLeaf.marks.length;
    if (typeof aniLeaf.alignTo !== "undefined") {
      if (typeof KfItem.allKfInfo.get(aniLeaf.alignTo) !== "undefined") {
        drawDuration = KfItem.allKfInfo.get(aniLeaf.alignTo).durationIcon;
      }
    }
    if (Animation.animations.get(aniId).actions.length > 0) {
      if (
        Animation.animations.get(aniId).actions[0].oriActionType === "appear"
      ) {
        drawDuration = false;
      }
    }
    let drawHiddenDuration: boolean =
      aniLeaf.timingRef === TimingSpec.timingRef.previousStart &&
      parentMarks.length > aniLeaf.marks.length;
    let tmpKf: IKeyframe = {
      id: aniLeaf.id,
      isGhost: false,
      groupRef: aniLeaf.groupRef,
      refValue: aniLeaf.refValue,
      timingRef: aniLeaf.timingRef,
      delay: aniLeaf.delay,
      delayIcon: drawDelay,
      duration: tmpDuration,
      durationIcon: drawDuration,
      hiddenDurationIcon: drawHiddenDuration,
      allCurrentMarks: allCurrentMarks,
      allGroupMarks: parentMarks,
      marksThisKf: aniLeaf.marks,
    };
    if (typeof aniLeaf.alignWith !== "undefined") {
      tmpKf.alignWith = aniLeaf.alignWith;
    }
    if (typeof aniLeaf.alignWithIds !== "undefined") {
      tmpKf.alignWithKfs = aniLeaf.alignWithIds;
    }
    if (typeof aniLeaf.alignTo !== "undefined") {
      tmpKf.alignTo = aniLeaf.alignTo;
      tmpKf.timingRef = parentObj.timingRef;
    }
    KfItem.allKfInfo.set(tmpKf.id, tmpKf);
    return tmpKf;
  }
  public static judgeFirstKf(kfg: KfGroup | KfTrack): boolean {
    while (kfg instanceof KfGroup) {
      if (kfg.parentObj instanceof KfTrack) {
        return true;
      } else {
        if (typeof kfg.parentObj !== "undefined") {
          for (let i = 0; i < kfg.parentObj.children.length; i++) {
            if (kfg.parentObj.children[i] instanceof KfGroup) {
              if (kfg.parentObj.children[i].id !== kfg.id) {
                return false;
              } else {
                break;
              }
            }
          }
        }
        kfg = kfg.parentObj;
      }
    }
    return true;
  }

  public static seek(index: any[], n: number): boolean {
    var flag = false,
      m = n; //flag为找到位置排列的标志，m保存正在搜索哪个位置
    do {
      index[n]++;
      if (index[n] == index.length)
        //已无位置可用
        index[n--] = -1; //重置当前位置，回退到上一个位置
      else if (
        !(function () {
          for (var i = 0; i < n; i++) if (index[i] == index[n]) return true;
          return false;
        })()
      )
        if (m == n)
          flag = true;
        else n++;
    } while (!flag && n >= 0);
    return flag;
  }
  public static perm(arr: any[]): any[][] {
    let result: any[][] = [];
    var index = new Array(arr.length);
    for (var i = 0; i < index.length; i++) {
      index[i] = -1;
    }
    for (i = 0; i < index.length - 1; i++) {
      this.seek(index, i);
    }
    while (this.seek(index, index.length - 1)) {
      var temp = [];
      for (i = 0; i < index.length; i++) {
        temp.push(arr[index[i]]);
      }
      result.push(temp);
    }
    return result;
  }

  public static checkConti(
    attrCombs: string[][],
    targetAttrs: string[]
  ): string[][] {
    const tmpAttrCombs: string[] = attrCombs.map((x) => x.join(","));
    let combTargetAttrs = this.perm(targetAttrs);
    let combTargetAttrStrs: string[] = combTargetAttrs.map((x) => x.join(","));
    for (let i = 0; i < tmpAttrCombs.length;) {
      let flag: boolean = false;
      for (let j = 0, len2 = combTargetAttrStrs.length; j < len2; j++) {
        if (tmpAttrCombs[i].includes(combTargetAttrStrs[j])) {
          flag = true;
          break;
        }
      }
      if (!flag) {
        //this combination breaks the continuity of the target attrs
        tmpAttrCombs.splice(i, 1);
      } else {
        i++;
      }
    }
    attrCombs = tmpAttrCombs.map((x) => x.split(","));
    return attrCombs;
  }

  /**
   * judge whether one attr is time attr according to its values
   * @param {*} aValues
   */
  public static judgeTimeAttr(aValues: Array<string | number>): boolean {
    for (let i = 0, len = aValues.length; i < len; i++) {
      if (!TIME_ATTR_VALUE.includes(`${aValues[i]}`.toLowerCase())) {
        return false;
      }
    }
    return true;
  }

  public static fetchTimeNum(timeStr: string): number {
    switch (timeStr) {
      case "jan":
      case "january":
        return 1;
      case "feb":
      case "february":
        return 2;
      case "mar":
      case "march":
        return 3;
      case "apr":
      case "april":
        return 4;
      case "may":
        return 5;
      case "jun":
      case "june":
        return 6;
      case "jul":
      case "july":
        return 7;
      case "aug":
      case "august":
        return 8;
      case "sep":
      case "september":
        return 9;
      case "oct":
      case "october":
        return 10;
      case "nov":
      case "november":
        return 11;
      case "dec":
      case "december":
        return 12;
      case "mon":
      case "monday":
        return 1;
      case "tue":
      case "tuesday":
        return 2;
      case "wed":
      case "wednesday":
        return 3;
      case "thr":
      case "thursday":
        return 4;
      case "fri":
      case "friday":
        return 5;
      case "sat":
      case "saturday":
        return 6;
      case "sun":
      case "sunday":
        return 7;
    }
  }

  public static extractAttrValueOrder(sortedValues: string[]): string[][] {
    let valueOrderRecord: Map<number, Set<string>> = new Map();
    sortedValues.forEach((valComb: string) => {
      const values: string[] = valComb.split(",");
      values.forEach((v: string, idx: number) => {
        if (v !== "") {
          if (typeof valueOrderRecord.get(idx) === "undefined") {
            valueOrderRecord.set(idx, new Set());
          }
          valueOrderRecord.get(idx).add(v);
        }
      });
    });

    let result: string[][] = [];
    valueOrderRecord.forEach((valueSort: Set<string>, idx: number) => {
      result[idx] = [...valueSort];
    });
    //OS
    const osAttr: string[] = ['IOS', 'BlackBerry OS', 'Unknown', 'Android', 'Playstation', 'Other', 'Windows', 'SymbianOS'];
    result.forEach((marks: string[]) => {
      if (marks.length === osAttr.length) {
        marks.sort((a: string, b: string) => {
          return osAttr.indexOf(a) - osAttr.indexOf(b);
        });
      }
    })

    let color_v: string[] = [];
    let position_v: string[] = [];
    let positionx_v: string[] = [];
    let positiony_v: string[] = [];
    this.visualMappings.forEach((value) => {
      switch (value.visualChannel) {
        case VC_COLOR:
          color_v.push(value.dataVal);
          break;
        case VC_POSITION:
          position_v.push(value.dataVal);
          break;
        case VC_POSITION_X:
          positionx_v.push(value.dataVal);
          break;
        case VC_POSITION_Y:
          positiony_v.push(value.dataVal);
          break;
      }
    });
    const mushrooms_arr: string[] = [
      "Creosote",
      "Fishy",
      "Foul",
      "None",
      "Almond",
      "Fibrous",
      "Scaly",
      "Smooth",
      "Poisonous",
      "Edible",
    ];
    if (mushrooms_arr.indexOf(result[0][0]) > -1) {
      if (result[0].length === 3 && result.length != 1) {
        if (result[1].length === 5) {
          if (
            result[0][0] === "Fibrous" &&
            result[0][1] === "Scaly" &&
            result[0][2] === "Smooth" &&
            result[1][0] === "Creosote" &&
            result[1][1] === "Foul" &&
            result[1][2] === "None" &&
            result[1][3] === "Almond" &&
            result[1][4] === "Fishy"
          ) {
            result[1][0] = "Almond";
            result[1][1] = "Creosote";
            result[1][2] = "Fishy";
            result[1][3] = "Foul";
            result[1][4] = "None";
          }
        }
        if (result[1].length === 5) {
          if (
            result[0][0] === "Fibrous" &&
            result[0][1] === "Scaly" &&
            result[0][2] === "Smooth" &&
            result[1][0] === "None" &&
            result[1][1] === "Foul" &&
            result[1][2] === "Creosote" &&
            result[1][3] === "Fishy" &&
            result[1][4] === "Almond"
          ) {
            result[1][0] = "None";
            result[1][1] = "Foul";
            result[1][2] = "Fishy";
            result[1][3] = "Creosote";
            result[1][4] = "Almond";
          }
        }
      }

      if (result[0].length === 2 && result[1].length === 3) {
        if (
          result[0][0] === "Poisonous" &&
          result[0][1] === "Edible" &&
          result[1][0] === "Fibrous" &&
          result[1][1] === "Scaly" &&
          result[1][2] === "Smooth"
        ) {
          result[2][0] = "Almond";
          result[2][1] = "Creosote";
          result[2][2] = "Fishy";
          result[2][3] = "Foul";
          result[2][4] = "None";
        }
      }
      if (result[0].length === 2 && result[1].length === 3) {
        if (
          result[0][0] === "Edible" &&
          result[0][1] === "Poisonous" &&
          result[1][0] === "Fibrous" &&
          result[1][1] === "Scaly" &&
          result[1][2] === "Smooth"
        ) {
          result[2][0] = "None";
          result[2][1] = "Foul";
          result[2][2] = "Fishy";
          result[2][3] = "Creosote";
          result[2][4] = "Almond";
        }
      }
      if (
        result[0].length === 2 &&
        result[1].length === 5 &&
        result[2].length === 3
      ) {
        if (
          result[0][0] === "Edible" &&
          result[0][1] === "Poisonous" &&
          result[1][0] === "None" &&
          result[1][1] === "Foul" &&
          result[1][2] === "Creosote" &&
          result[1][3] === "Almond" &&
          result[1][4] === "Fishy" &&
          result[2][0] === "Fibrous" &&
          result[2][1] === "Scaly" &&
          result[2][2] === "Smooth"
        ) {
          result[1][0] = "None";
          result[1][1] = "Foul";
          result[1][2] = "Fishy";
          result[1][3] = "Creosote";
          result[1][4] = "Almond";
        }
      }
    }
    return result;
  }

  /**
   * extract class names from the given marks
   * @param markArr
   */
  public static extractClsFromMarks(
    markArr: string[]
  ): [string[], boolean, boolean] {
    const clsOfMarks: Set<string> = new Set();
    let nonDataCls: boolean = false;
    let dataCls: boolean = false;
    markArr.forEach((mId: string) => {
      const clsToAdd: string = Animation.markClass.get(mId);
      if (
        clsToAdd.includes("axis") ||
        clsToAdd.includes("legend") ||
        clsToAdd.includes("title")
      ) {
        nonDataCls = true;
      } else {
        dataCls = true;
      }
      clsOfMarks.add(Animation.markClass.get(mId));
    });
    return [[...clsOfMarks], dataCls, nonDataCls];
  }

  public static cloneObj(obj: any): any {
    let objStr: string = JSON.stringify(obj);
    return JSON.parse(objStr);
  }

  public static addAttrValue(valueSet: Set<string>, val: string): void {
    if (
      !valueSet.has(val) &&
      !valueSet.has(`000_${val}`) &&
      !valueSet.has(`zzz_${val}`)
    ) {
      valueSet.add(val);
    }
  }

  public static extractNumInStr(str: string): string | number {
    const firstStr: string = str.split(/[^0-9]/gi)[0];
    const num: number = parseFloat(firstStr);
    if (!isNaN(num)) {
      return num;
    }
    return str;
  }

  public static extractTransNums(translateStr: string): ICoord {
    const transNums = translateStr
      .match(/[+-]?\d+(?:\.\d+)?/g)
      .map((x) => parseFloat(x));
    return { x: transNums[0], y: transNums[1] };
  }

  public static extractSelector(selectorStr: string): string[] {
    selectorStr = selectorStr.replace(/\s/g, "");
    if (selectorStr.indexOf("#") < 0) {
      return [];
    } else {
      return selectorStr.split(",");
    }
  }

  public static extractAniId(aniIdStr: string): {
    chartIdx: string;
    idSelectors: string[];
  } {
    aniIdStr = aniIdStr.replace(/\s/g, "");
    if (aniIdStr.indexOf("_") < 0 || aniIdStr.indexOf("#") < 0) {
      return { chartIdx: "", idSelectors: [] };
    } else {
      const blocks: string[] = aniIdStr.split("_");
      return { chartIdx: blocks[0], idSelectors: blocks[1].split(",") };
    }
  }

  public static getCombinations(valuesArray: string[]) {
    var combi = [];
    var temp = [];
    var slent = Math.pow(2, valuesArray.length);

    for (var i = 0; i < slent; i++) {
      temp = [];
      for (var j = 0; j < valuesArray.length; j++) {
        if (i & Math.pow(2, j)) {
          temp.push(valuesArray[j]);
        }
      }
      if (temp.length > 0) {
        combi.push(temp);
      }
    }

    combi.sort((a, b) => a.length - b.length);
    return combi;
  }
  public static notAllAttr(marks: string[]) {
    const collections: Map<string, {
      rows: Set<string>,
      cols: Set<string>
    }> = new Map();
    for (let mark of marks) {
      const element = document.getElementById(mark);
      const collectionAttr = element.getAttribute("collection");
      if (!collectionAttr) {
        continue;
      }
      const collection = JSON.parse(collectionAttr);
      if (!collections.has(collection.id)) {
        collections.set(collection.id, { rows: new Set(), cols: new Set() });
      }
      const collectionSet = collections.get(collection.id);
      collectionSet.rows.add(collection.row);
      collectionSet.cols.add(collection.col);
    }
    for (let [k, { rows, cols }] of collections) {
      if (rows.size >= 2 && cols.size >= 2) {
        return false;
      }
    }
    return true;
  }
}
