const DEFAULT_CONFIRMATION_RATIO = 0.82;

export function getSlideTravel(trackWidth: number, thumbWidth: number, gutter: number) {
  return Math.max(0, trackWidth - thumbWidth - gutter * 2);
}

export function clampSlideOffset(offset: number, maxTravel: number) {
  return Math.min(Math.max(0, offset), Math.max(0, maxTravel));
}

export function isSlideConfirmed(
  offset: number,
  maxTravel: number,
  confirmationRatio = DEFAULT_CONFIRMATION_RATIO,
) {
  return maxTravel > 0 && offset >= maxTravel * confirmationRatio;
}
