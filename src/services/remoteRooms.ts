import type { ChatRoom, InfoLogEntry } from '../types';
import { syncRoomMembersFromMessages } from './roomActions';

const SUPABASE_URL = 'https://mtxzciyxxxeracbvnvib.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hT2HzwWSK-DJJ_jCwMCTBg_Ad88ppjE';

const roomsEndpoint = `${SUPABASE_URL}/rest/v1/plantalk_rooms`;
const logsEndpoint = `${SUPABASE_URL}/rest/v1/plantalk_info_logs`;

export async function loadRemoteRoom(shareCode: string) {
  const response = await fetch(`${roomsEndpoint}?share_code=eq.${encodeURIComponent(shareCode)}&select=room&limit=1`, {
    method: 'GET',
    headers: supabaseHeaders(),
  });

  if (!response.ok) return null;

  const rows = (await response.json()) as Array<{ room: ChatRoom }>;
  return rows[0]?.room ? normalizeRemoteRoom(rows[0].room) : null;
}

export async function saveRemoteRoom(room: ChatRoom) {
  const response = await fetch(roomsEndpoint, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      share_code: room.shareCode,
      room,
    }),
  });

  return response.ok;
}

export async function appendRemoteInfoLog(entry: Omit<InfoLogEntry, 'id' | 'createdAt'>) {
  const response = await fetch(logsEndpoint, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify({
      user_code: entry.userCode,
      room_code: entry.roomCode,
      action: entry.action,
      message: entry.message,
    }),
  });

  return response.ok;
}

function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
}

function normalizeRemoteRoom(room: ChatRoom): ChatRoom {
  return syncRoomMembersFromMessages({
    ...room,
    analysisCandidates: room.analysisCandidates ?? [],
    linkItems: room.linkItems ?? [],
  });
}
