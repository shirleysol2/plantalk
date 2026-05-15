import type { ChatRoom, Profile } from '../types';

const ROOMS_KEY = 'plantalk.rooms';
const PROFILE_KEY = 'plantalk.profile';

export function loadRooms(fallback: ChatRoom[]) {
  return readJson<ChatRoom[]>(ROOMS_KEY) ?? fallback;
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
