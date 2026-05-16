import type { ChatRoom } from '../types';

const PLINK_BOT_URL = 'https://mtxzciyxxxeracbvnvib.supabase.co/functions/v1/plink-command';

export type PlinkOperation =
  | { type: 'updateScheduleDate'; fromDate: string; toDate: string }
  | { type: 'deleteByDate'; date: string }
  | { type: 'deleteByKeyword'; section: 'schedule' | 'task' | 'decision' | 'all'; keyword: string }
  | { type: 'updateItemStatus'; section: 'schedule' | 'task' | 'decision'; keyword: string; newStatus: string }
  | { type: 'updatePeriod'; newPeriod: string }
  | { type: 'updateDestination'; newDestination: string }
  | { type: 'updateTitle'; newTitle: string }
  | { type: 'addSchedule'; date: string; title: string; status: string }
  | { type: 'addTask'; title: string }
  | { type: 'addDecision'; question: string; options: string[]; state: string }
  | { type: 'addBudget'; category: string; amount: string; note: string }
  | { type: 'updateBudget'; keyword: string; newAmount?: string; newNote?: string }
  | { type: 'clearSection'; section: 'schedule' | 'task' | 'decision' | 'budget' | 'all' }
  | { type: 'renameItem'; section: 'schedule' | 'task' | 'decision'; keyword: string; newTitle: string };

export type PlinkBotResult = {
  operations: PlinkOperation[];
  reply: string;
};

export async function callPlinkBot(
  command: string,
  room: ChatRoom,
  timeoutMs = 15000,
): Promise<PlinkBotResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const planState = {
      title: room.title,
      destination: room.destination,
      period: room.period,
      scheduleItems: room.scheduleItems,
      tasks: room.tasks,
      decisions: room.decisions,
      budgetItems: room.budgetItems,
    };

    // Send recent non-Plink messages for context
    const recentMessages = room.messages
      .filter((m) => m.sender !== 'Plink')
      .slice(-10)
      .map((m) => ({ sender: m.sender, text: m.text }));

    const response = await fetch(PLINK_BOT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, planState, recentMessages }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return (await response.json()) as PlinkBotResult;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
