export type RealtimeSnapshotSource = 'server' | 'sqlite' | 'pending';

export function classifyRealtimeSnapshot(metadata: {
  fromCache: boolean;
  hasPendingWrites: boolean;
}): RealtimeSnapshotSource {
  if (metadata.fromCache) return 'sqlite';
  if (metadata.hasPendingWrites) return 'pending';
  return 'server';
}
