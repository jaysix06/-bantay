import { describe, expect, it, vi } from 'vitest';

import { returnFromProductResult } from '@/screens/product-result/navigation';

describe('returnFromProductResult', () => {
  it('returns to the previous screen when navigation history is available', () => {
    const router = {
      back: vi.fn(),
      canGoBack: vi.fn(() => true),
      replace: vi.fn(),
    };

    returnFromProductResult(router);

    expect(router.back).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('returns to the scanner when the product screen was opened directly', () => {
    const router = {
      back: vi.fn(),
      canGoBack: vi.fn(() => false),
      replace: vi.fn(),
    };

    returnFromProductResult(router);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/scan');
  });
});
