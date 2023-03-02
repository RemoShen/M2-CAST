enum keyValue {
  number,
  flag,
  array,
  map,
  infoObj,
  string,
  set,
  needComplete
}

export interface IAction {
  type: string;
  payload?: { [key in keyof typeof keyValue]?: any };
}
export interface ManualStep {
  marks: Set<string>;
  steps: string[];
}
