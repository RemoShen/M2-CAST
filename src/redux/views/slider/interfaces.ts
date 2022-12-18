export interface IPlayerProps {
  frameRate: number;
  currentTime: number;
  totalTime: number;
}

export interface ISlider {
  sliderType: number;
  domain?: number[] | string[];
  default?: number | string;
  hideSlider?: boolean;
  trackWidth?: number;
  sliderWidth?: number;
  showTicks?: boolean;
  showCurrentVal?: boolean;
}
