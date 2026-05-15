import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadProfile, loadRooms } from './storage';
import { createRoom } from './roomActions';

describe('storage', () => {
  const fallbackRooms = [
    createRoom({
      title: '부산 주말여행',
      destination: 'Busan',
      period: '6월 7일~6월 8일',
      nickname: '솔',
      userCode: 'user_abc123',
    }),
  ];

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps an empty saved room list as a valid start state', () => {
    const localStorage = {
      getItem: vi.fn(() => '[]'),
      setItem: vi.fn(),
    };

    vi.stubGlobal('window', { localStorage });

    expect(loadRooms(fallbackRooms)).toEqual([]);
  });

  it('falls back to starter rooms when saved rooms are malformed', () => {
    const localStorage = {
      getItem: vi.fn(() => '{"id":"not-a-list"}'),
      setItem: vi.fn(),
    };

    vi.stubGlobal('window', { localStorage });

    expect(loadRooms(fallbackRooms)).toBe(fallbackRooms);
  });

  it('removes legacy sample rooms from saved rooms', () => {
    const savedRooms = [
      { ...fallbackRooms[0], id: 'jeju' },
      { ...fallbackRooms[0], id: 'user-room', title: '내 여행' },
    ];
    const localStorage = {
      getItem: vi.fn(() => JSON.stringify(savedRooms)),
      setItem: vi.fn(),
    };

    vi.stubGlobal('window', { localStorage });

    expect(loadRooms(fallbackRooms).map((room) => room.id)).toEqual(['user-room']);
  });

  it('adds a user code to legacy saved profiles', () => {
    const localStorage = {
      getItem: vi.fn(() => JSON.stringify({ nickname: '솔', image: '✈️' })),
      setItem: vi.fn(),
    };

    vi.stubGlobal('window', { localStorage });

    const profile = loadProfile();

    expect(profile?.nickname).toBe('솔');
    expect(profile?.userCode).toMatch(/^user_[a-z0-9]{8}$/);
  });
});
