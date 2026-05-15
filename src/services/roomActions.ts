import type { ChatRoom, Message } from '../types';

type CreateRoomInput = {
  title: string;
  destination: string;
  period: string;
  nickname: string;
  userCode: string;
};

type AddMessageInput = {
  nickname: string;
  text: string;
};

export function getInitials(name: string) {
  const trimmed = name.trim();

  if (!trimmed) return '?';

  const words = trimmed.split(/\s+/);
  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  return Array.from(trimmed)[0];
}

export function createRoom({ title, destination, period, nickname, userCode }: CreateRoomInput): ChatRoom {
  const roomId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const shareCode = createShareCode('room');
  const firstMessage: Message = {
    id: 1,
    sender: 'PlanTalk',
    initials: 'P',
    time: formatTime(),
    text: `${title} 채팅방이 만들어졌어요. 대화하면 계획 노트가 이 방 기준으로 정리돼요.`,
    extraction: { label: '방 생성', tone: 'schedule' },
  };

  return {
    id: roomId,
    shareCode,
    createdByUserCode: userCode,
    joinedUserCodes: [userCode],
    title,
    subtitle: '새롭게 떠나는',
    destination,
    period,
    coverTone: 'sky',
    unread: 0,
    lastMessage: firstMessage.text,
    messages: [firstMessage],
    scheduleItems: [{ id: 1, date: '준비 중', title: `${destination} 여행 일정 잡기`, status: '대화 필요' }],
    tasks: [{ id: 1, title: '친구들에게 채팅방 링크 공유', owner: nickname, done: false }],
    decisions: [{ id: 1, question: '여행 핵심 코스', options: ['맛집', '휴식', '관광'], state: '대화 전' }],
    budgetItems: [{ id: 1, category: '예산', amount: '0원', note: '대화에서 업데이트' }],
    finalPlan: {
      title: `${destination} 여행 계획`,
      period,
      members: '1명',
      status: '작성 중',
      summary: '아직 대화가 많지 않아요. 일정, 예약, 예산 이야기를 나누면 이 계획 노트가 채워져요.',
      shareText: `${title} 계획을 만드는 중이에요.`,
      days: [
        {
          id: 1,
          day: 'Plan',
          title: '대화로 일정 만들기',
          route: '채팅 → 자동 정리 → 확정 브리핑',
          highlights: ['일정 후보', '예약 할 일', '예산'],
        },
      ],
    },
    members: [{ id: 1, name: nickname, initials: getInitials(nickname), role: '방 만든 사람' }],
  };
}

export function createShareCode(prefix: 'room' | 'user') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10).padEnd(8, '0')}`;
}

export function addMessageToRoom(room: ChatRoom, { nickname, text }: AddMessageInput): ChatRoom {
  const cleanText = text.trim();
  if (!cleanText) return room;

  const message: Message = {
    id: nextId(room.messages),
    sender: nickname,
    initials: getInitials(nickname),
    time: formatTime(),
    text: cleanText,
    mine: true,
    extraction: inferExtraction(cleanText),
  };

  const inferredSchedule = inferSchedule(cleanText);
  const inferredTask = inferTask(cleanText, nickname);
  const inferredDecision = inferDecision(cleanText);
  const inferredBudget = inferBudget(cleanText);

  const scheduleItems = inferredSchedule
    ? [...room.scheduleItems, { id: nextId(room.scheduleItems), ...inferredSchedule }]
    : room.scheduleItems;
  const tasks = inferredTask ? [...room.tasks, { id: nextId(room.tasks), ...inferredTask }] : room.tasks;
  const decisions = inferredDecision
    ? [...room.decisions, { id: nextId(room.decisions), ...inferredDecision }]
    : room.decisions;
  const budgetItems = inferredBudget
    ? [...room.budgetItems.filter((item) => item.amount !== '0원'), { id: nextId(room.budgetItems), ...inferredBudget }]
    : room.budgetItems;

  return {
    ...room,
    lastMessage: cleanText,
    messages: [...room.messages, message],
    scheduleItems,
    tasks,
    decisions,
    budgetItems,
    finalPlan: {
      ...room.finalPlan,
      summary: buildSummary(room.destination, scheduleItems.length, tasks.length, decisions.length),
      shareText: `${room.title} 계획 업데이트: 일정 ${scheduleItems.length}개, 할 일 ${tasks.length}개, 결정사항 ${decisions.length}개`,
    },
  };
}

function inferExtraction(text: string): Message['extraction'] {
  if (/예산|비용|원/.test(text)) return { label: '예산 업데이트', tone: 'budget' };
  if (/확정|어때|정하자|숙소|코스/.test(text)) return { label: '결정 필요', tone: 'decision' };
  if (/예약|확인|찾아|공유|저장/.test(text)) return { label: '할 일 생성', tone: 'task' };
  return { label: '일정 후보', tone: 'schedule' };
}

function inferSchedule(text: string) {
  const match = text.match(/(월요일|화요일|수요일|목요일|금요일|토요일|일요일|오전|오후|Day\s?\d|[0-9]{1,2}시)[^.!?。]*/);
  if (!match) return null;

  return {
    date: match[1],
    title: match[0].slice(0, 28),
    status: /확정/.test(text) ? '확정' : '후보',
  };
}

function inferTask(text: string, owner: string) {
  const match = text.match(/([^.!?。]*(예약|확인|찾아|공유|저장)[^.!?。]*)/);
  if (!match) return null;

  return {
    title: match[1].trim().slice(0, 34),
    owner,
    done: false,
  };
}

function inferDecision(text: string) {
  if (!/숙소|코스|이동|확정|정하자|어때/.test(text)) return null;

  return {
    question: /숙소/.test(text) ? '숙소 선택' : '계획 결정',
    options: /숙소/.test(text) ? ['후보 확인', '확정'] : ['좋아요', '다시 논의'],
    state: /확정/.test(text) ? '확정' : '결정 필요',
  };
}

function inferBudget(text: string) {
  const match = text.match(/([0-9][0-9,]*)\s*원/);
  if (!match) return null;

  const amount = Number(match[1].replace(/,/g, '')).toLocaleString('ko-KR');
  return {
    category: '예산',
    amount: `${amount}원`,
    note: '채팅에서 감지',
  };
}

function buildSummary(destination: string, scheduleCount: number, taskCount: number, decisionCount: number) {
  return `${destination} 계획이 대화에 맞춰 업데이트됐어요. 현재 일정 ${scheduleCount}개, 할 일 ${taskCount}개, 결정사항 ${decisionCount}개가 정리되어 있어요.`;
}

function nextId(items: Array<{ id: number }>) {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

function formatTime() {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}
