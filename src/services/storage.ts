import { createShareCode } from './roomActions';
import type { ChatRoom, InfoLogEntry, Profile } from '../types';

const ROOMS_KEY = 'plantalk.rooms';
const PROFILE_KEY = 'plantalk.profile';
const INFO_LOG_KEY = 'plantalk.infoLogs';
const LEGACY_SAMPLE_ROOM_IDS = new Set(['jeju', 'bangkok', 'osaka']);

export function loadRooms(fallback: ChatRoom[]) {
  const rooms = readJson<ChatRoom[]>(ROOMS_KEY);
  return Array.isArray(rooms) ? rooms.filter((room) => !LEGACY_SAMPLE_ROOM_IDS.has(room.id)).map(normalizeRoom) : fallback;
}

export function saveRooms(rooms: ChatRoom[]) {
  writeJson(ROOMS_KEY, rooms);
}

export function loadProfile() {
  const profile = readJson<Profile>(PROFILE_KEY);
  if (!profile) return null;
  return normalizeProfile(profile);
}

export function saveProfile(profile: Profile) {
  writeJson(PROFILE_KEY, profile);
}

export function loadInfoLogs() {
  const logs = readJson<InfoLogEntry[]>(INFO_LOG_KEY);
  return Array.isArray(logs) ? logs : [];
}

export function appendInfoLog(entry: Omit<InfoLogEntry, 'id' | 'createdAt'>) {
  const nextEntry: InfoLogEntry = {
    ...entry,
    id: createShareCode('room').replace('room_', 'log_'),
    createdAt: new Date().toISOString(),
  };

  writeJson(INFO_LOG_KEY, [nextEntry, ...loadInfoLogs()].slice(0, 200));
}

export function findRoomByShareCode(rooms: ChatRoom[], shareCode: string) {
  return rooms.find((room) => room.shareCode === shareCode);
}

function normalizeProfile(profile: Profile): Profile {
  return {
    ...profile,
    userCode: profile.userCode ?? createShareCode('user'),
  };
}

function normalizeRoom(room: ChatRoom): ChatRoom {
  const shareCode = room.shareCode ?? createShareCode('room');
  const createdByUserCode = room.createdByUserCode ?? 'user_legacy';

  return {
    ...room,
    shareCode,
    createdByUserCode,
    joinedUserCodes: room.joinedUserCodes ?? [createdByUserCode],
    analysisCandidates: room.analysisCandidates ?? [],
  };
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
