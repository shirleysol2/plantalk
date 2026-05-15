import type { ChatRoom, Profile } from '../types';

const ROOMS_KEY = 'plantalk.rooms';
const PROFILE_KEY = 'plantalk.profile';
const LEGACY_SAMPLE_ROOM_IDS = new Set(['jeju', 'bangkok', 'osaka']);

export function loadRooms(fallback: ChatRoom[]) {
  const rooms = readJson<ChatRoom[]>(ROOMS_KEY);
  return Array.isArray(rooms) ? rooms.filter((room) => !LEGACY_SAMPLE_ROOM_IDS.has(room.id)) : fallback;
}

export function saveRooms(rooms: ChatRoom[]) {
  writeJson(ROOMS_KEY, rooms);
}

export function loadProfile() {
  return readJson<Profile>(PROFILE_KEY);
}

export function saveProfile(profile: Profile) {
  writeJson(PROFILE_KEY, profile);
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
