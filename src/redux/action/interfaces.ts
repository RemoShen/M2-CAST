enum keyValue {
  number,
  flag,
  array,
  map,
  infoObj,
}

export interface IAction {
  type: string;
  payload?: { [key in keyof typeof keyValue]?: any };
}
