import { describe, expect, it } from 'vitest';

import { classifyRealtimeSnapshot } from '@/data/realtime-sync';

describe('classifyRealtimeSnapshot', () => {
  it('treats a server-confirmed snapshot as authoritative', () => {
    expect(classifyRealtimeSnapshot({ fromCache: false, hasPendingWrites: false })).toBe('server');
  });

  it('falls back to SQLite when Firestore only has cached data', () => {
    expect(classifyRealtimeSnapshot({ fromCache: true, hasPendingWrites: false })).toBe('sqlite');
  });

  it('waits for the server before applying Firestore writes to SQLite', () => {
    expect(classifyRealtimeSnapshot({ fromCache: false, hasPendingWrites: true })).toBe('pending');
  });
});
