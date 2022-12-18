declare global {
  interface Window {
    MSPointerEvent: PointerEvent;
  }

  interface Navigator {
    msSaveOrOpenBlob: Function;
  }
}

export {};

