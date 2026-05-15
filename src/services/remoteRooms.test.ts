import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoom } from './roomActions';
import { loadRemoteRoom, saveRemoteRoom } from './remoteRooms';

describe('remote rooms', () => {
  const room = createRoom({
    title: '부산 주말여행',
    destination: 'Busan',
    period: '6월 7일~6월 8일',
    nickname: '솔',
    userCode: 'user_abc123',
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads a room snapshot by share code', async () => {
    const fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [{ room }],
    }));
    vi.stubGlobal('fetch', fetch);

    await expect(loadRemoteRoom(room.shareCode)).resolves.toEqual(room);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/rest/v1/plantalk_rooms?share_code=eq.${room.shareCode}`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('saves a room snapshot with upsert semantics', async () => {
    const fetch = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    vi.stubGlobal('fetch', fetch);

    await saveRemoteRoom(room);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/v1/plantalk_rooms'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ share_code: room.shareCode, room }),
      }),
    );
  });
});
