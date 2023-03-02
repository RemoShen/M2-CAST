import { ICoord } from "../../global-interfaces";

export interface IViewBtnProp {
  title?: string;
  clickEvtType: string;
  clickEvt?: () => void;
  iconClass: string;
}
export interface EXpng{
  markId: string;
  png: string;
}
export interface Example {
  id: string;
  currentTrace: ICoord[][];
  allMarksPngFileName: EXpng[];
  previousMarks: string[];
  gtMarks: string[];
  dataDatum: any;
  collection: any;
}