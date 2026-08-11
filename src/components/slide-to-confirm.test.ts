import { describe, expect, it } from 'vitest';

import {
  clampSlideOffset,
  getSlideTravel,
  isSlideConfirmed,
} from './slide-to-confirm-logic';

describe('slide-to-confirm geometry', () => {
  it('reserves both track gutters when calculating thumb travel', () => {
    expect(getSlideTravel(300, 56, 4)).toBe(236);
  });

  it('never returns negative travel for an undersized track', () => {
    expect(getSlideTravel(48, 56, 4)).toBe(0);
  });

  it('clamps the thumb between the start and end of the track', () => {
    expect(clampSlideOffset(-12, 236)).toBe(0);
    expect(clampSlideOffset(120, 236)).toBe(120);
    expect(clampSlideOffset(280, 236)).toBe(236);
  });

  it('confirms only after the thumb crosses 82 percent of its travel', () => {
    expect(isSlideConfirmed(193, 236)).toBe(false);
    expect(isSlideConfirmed(194, 236)).toBe(true);
    expect(isSlideConfirmed(0, 0)).toBe(false);
  });
});
