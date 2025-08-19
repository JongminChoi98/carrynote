import { Dimensions, PixelRatio } from "react-native";
const { width, height } = Dimensions.get("window");

const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

export const scale = (size: number) => (width / guidelineBaseWidth) * size;
export const vScale = (size: number) => (height / guidelineBaseHeight) * size;
export const mScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const font = (size: number) =>
  PixelRatio.roundToNearestPixel(mScale(size));
