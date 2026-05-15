import type { AnalysisCandidate, ChatRoom, Message, MessageApplyTarget } from '../types';
import { localPlanAnalysisAgent } from './planAnalysisAgent';

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

type ApplyMessageInput = {
  message: Pick<Message, 'text'>;
  target: MessageApplyTarget;
  nickname: string;
};

type ConfirmCandidateInput = {
  candidateId: number;
  nickname: string;
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
    sender: 'Plink',
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
    analysisCandidates: [],
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

  const analysisCandidates = [
    ...(room.analysisCandidates ?? []),
    ...localPlanAnalysisAgent.analyzeMessage({
      message,
      destination: room.destination,
      nickname,
    }).map((candidate, index) => ({
      ...candidate,
      id: nextId(room.analysisCandidates ?? []) + index,
    })),
  ];

  return updateCandidateReviewStatus({
    ...room,
    lastMessage: cleanText,
    messages: [...room.messages, message],
    analysisCandidates,
  });
}

export function applyMessageToRoom(room: ChatRoom, { message, target, nickname }: ApplyMessageInput): ChatRoom {
  const cleanText = message.text.trim();
  if (!cleanText) return room;

  const scheduleItems =
    target === 'schedule'
      ? [...room.scheduleItems, { id: nextId(room.scheduleItems), ...manualSchedule(cleanText) }]
      : room.scheduleItems;
  const tasks =
    target === 'task' ? [...room.tasks, { id: nextId(room.tasks), ...manualTask(cleanText, nickname) }] : room.tasks;
  const decisions =
    target === 'decision'
      ? [...room.decisions, { id: nextId(room.decisions), ...manualDecision(cleanText) }]
      : room.decisions;
  const budgetItems =
    target === 'budget'
      ? [...room.budgetItems.filter((item) => item.amount !== '0원'), { id: nextId(room.budgetItems), ...manualBudget(cleanText) }]
      : room.budgetItems;

  return {
    ...room,
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

export function confirmAnalysisCandidate(room: ChatRoom, { candidateId, nickname }: ConfirmCandidateInput): ChatRoom {
  const candidate = (room.analysisCandidates ?? []).find((item) => item.id === candidateId);
  if (!candidate || candidate.status === 'confirmed') return room;

  const nextRoom = applyCandidateToRoom(room, candidate, nickname);
  return refreshFinalPlan({
    ...nextRoom,
    analysisCandidates: nextRoom.analysisCandidates.map((item) =>
      item.id === candidateId ? { ...item, status: 'confirmed' } : item,
    ),
  });
}

export function holdAnalysisCandidate(room: ChatRoom, candidateId: number): ChatRoom {
  return updateCandidateReviewStatus({
    ...room,
    analysisCandidates: (room.analysisCandidates ?? []).map((item) =>
      item.id === candidateId ? { ...item, status: item.status === 'held' ? 'pending' : 'held' } : item,
    ),
  });
}

export function deleteAnalysisCandidate(room: ChatRoom, candidateId: number): ChatRoom {
  return updateCandidateReviewStatus({
    ...room,
    analysisCandidates: (room.analysisCandidates ?? []).filter((item) => item.id !== candidateId),
  });
}

function applyCandidateToRoom(room: ChatRoom, candidate: AnalysisCandidate, nickname: string): ChatRoom {
  if (candidate.type === 'schedule') {
    return {
      ...room,
      scheduleItems: [
        ...room.scheduleItems,
        {
          id: nextId(room.scheduleItems),
          date: inferCandidateDate(candidate.title),
          title: candidate.title,
          status: /변경/.test(candidate.detail) ? '변경' : /확정/.test(candidate.detail) ? '확정' : '후보',
        },
      ],
    };
  }

  if (candidate.type === 'task') {
    return {
      ...room,
      tasks: [
        ...room.tasks,
        {
          id: nextId(room.tasks),
          title: candidate.title,
          owner: nickname,
          done: /완료/.test(candidate.detail),
        },
      ],
    };
  }

  if (candidate.type === 'decision' || candidate.type === 'insight') {
    return {
      ...room,
      decisions: [
        ...room.decisions,
        {
          id: nextId(room.decisions),
          question: candidate.title,
          options: /확정/.test(candidate.detail) ? ['확정'] : ['좋아요', '다시 논의'],
          state: candidate.type === 'insight' ? '검토 필요' : /확정/.test(candidate.detail) ? '확정' : '결정 필요',
        },
      ],
    };
  }

  if (candidate.type === 'budget') {
    return {
      ...room,
      budgetItems: [
        ...room.budgetItems.filter((item) => item.amount !== '0원'),
        {
          id: nextId(room.budgetItems),
          category: candidate.title,
          amount: candidate.detail,
          note: '분석 후보 확정',
        },
      ],
    };
  }

  return room;
}

function inferCandidateDate(title: string) {
  const match = title.match(/월요일|화요일|수요일|목요일|금요일|토요일|일요일|오전|오후|Day\s?\d|[0-9]{1,2}시/);
  return match?.[0] ?? '분석 확정';
}

function refreshFinalPlan(room: ChatRoom): ChatRoom {
  return updateCandidateReviewStatus({
    ...room,
    finalPlan: {
      ...room.finalPlan,
      status: '확정 정리',
      summary: buildSummary(room.destination, room.scheduleItems.length, room.tasks.length, room.decisions.length),
      shareText: `${room.title} 계획 업데이트: 일정 ${room.scheduleItems.length}개, 할 일 ${room.tasks.length}개, 결정사항 ${room.decisions.length}개`,
    },
  });
}

function updateCandidateReviewStatus(room: ChatRoom): ChatRoom {
  const activeCandidates = (room.analysisCandidates ?? []).filter((candidate) => candidate.status !== 'confirmed');
  const status = activeCandidates.some((candidate) => candidate.status === 'pending')
    ? '검토 중'
    : activeCandidates.length > 0
      ? '보류 있음'
      : hasConfirmedPlanData(room)
        ? '확정 정리'
        : '작성 중';

  return {
    ...room,
    finalPlan: {
      ...room.finalPlan,
      status,
    },
  };
}

function hasConfirmedPlanData(room: ChatRoom) {
  return (
    room.scheduleItems.length > 1 ||
    room.tasks.length > 1 ||
    room.decisions.length > 1 ||
    room.budgetItems.some((item) => item.amount !== '0원')
  );
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
    status: /변경|바꾸|수정|대신/.test(text) ? '변경' : /확정|완료/.test(text) ? '확정' : '후보',
  };
}

function inferTask(text: string, owner: string) {
  const match = text.match(/([^.!?。]*(예약|확인|찾아|공유|저장)[^.!?。]*)/);
  if (!match) return null;

  return {
    title: match[1].trim().slice(0, 34),
    owner,
    done: /완료|끝|했어|했다|확인했/.test(text),
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

function manualSchedule(text: string) {
  return inferSchedule(text) ?? { date: '수동 반영', title: text.slice(0, 34), status: /확정|완료/.test(text) ? '확정' : '후보' };
}

function manualTask(text: string, owner: string) {
  return {
    title: text.slice(0, 34),
    owner,
    done: /완료|끝|했어|했다|확인했/.test(text),
  };
}

function manualDecision(text: string) {
  return {
    question: text.slice(0, 34),
    options: /확정|완료|정했/.test(text) ? ['확정'] : ['좋아요', '다시 논의'],
    state: /확정|완료|정했/.test(text) ? '확정' : '결정 필요',
  };
}

function manualBudget(text: string) {
  return inferBudget(text) ?? { category: '예산', amount: '0원', note: text.slice(0, 34) };
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
