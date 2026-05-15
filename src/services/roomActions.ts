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
  userCode?: string;
  text: string;
  summaryStyle?: string;
};

type ApplyMessageInput = {
  message: Pick<Message, 'text'>;
  target: MessageApplyTarget;
  nickname: string;
  summaryStyle?: string;
};

type ConfirmCandidateInput = {
  candidateId: number;
  nickname: string;
  summaryStyle?: string;
};

type AnalyzeRoomInput = {
  nickname: string;
  summaryStyle?: string;
};

type RoomMemberInput = {
  nickname: string;
  userCode: string;
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

export function isMessageMineForUser(message: Message, profile: { nickname: string; userCode: string }) {
  if (message.senderUserCode) return message.senderUserCode === profile.userCode;
  return Boolean(message.mine && message.sender === profile.nickname);
}

export function addMessageToRoom(room: ChatRoom, { nickname, userCode, text, summaryStyle }: AddMessageInput): ChatRoom {
  const cleanText = text.trim();
  if (!cleanText) return room;

  const message: Message = {
    id: nextId(room.messages),
    sender: nickname,
    senderUserCode: userCode,
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
      summaryStyle,
    }).map((candidate, index) => ({
      ...candidate,
      id: nextId(room.analysisCandidates ?? []) + index,
    })),
  ];

  const roomWithMember = userCode ? joinRoomAsMember(room, { nickname, userCode }) : room;

  return updateCandidateReviewStatus({
    ...roomWithMember,
    lastMessage: cleanText,
    messages: [...roomWithMember.messages, message],
    analysisCandidates,
  }, summaryStyle);
}

export function joinRoomAsMember(room: ChatRoom, { nickname, userCode }: RoomMemberInput): ChatRoom {
  const joinedUserCodes = room.joinedUserCodes.includes(userCode) ? room.joinedUserCodes : [...room.joinedUserCodes, userCode];
  const members = room.members.some((member) => member.name === nickname)
    ? room.members
    : [
        ...room.members,
        {
          id: nextId(room.members),
          name: nickname,
          initials: getInitials(nickname),
          role: '참여자',
        },
      ];

  return {
    ...room,
    joinedUserCodes,
    members,
    finalPlan: {
      ...room.finalPlan,
      members: `${members.length}명`,
    },
  };
}

export function syncRoomMembersFromMessages(room: ChatRoom): ChatRoom {
  return room.messages
    .filter((message) => message.sender !== 'Plink' && message.sender !== 'PlanTalk')
    .reduce((currentRoom, message) => {
      const userCode = message.senderUserCode ?? `sender_${message.sender}`;
      return joinRoomAsMember(currentRoom, { nickname: message.sender, userCode });
    }, room);
}

export function applyMessageToRoom(room: ChatRoom, { message, target, nickname, summaryStyle }: ApplyMessageInput): ChatRoom {
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

  return refreshFinalPlan({
    ...room,
    scheduleItems,
    tasks,
    decisions,
    budgetItems,
  }, summaryStyle);
}

export function confirmAnalysisCandidate(room: ChatRoom, { candidateId, nickname, summaryStyle }: ConfirmCandidateInput): ChatRoom {
  const candidate = (room.analysisCandidates ?? []).find((item) => item.id === candidateId);
  if (!candidate || candidate.status === 'confirmed') return room;

  const nextRoom = applyCandidateToRoom(room, candidate, nickname);
  return refreshFinalPlan({
    ...nextRoom,
    analysisCandidates: nextRoom.analysisCandidates.map((item) =>
      item.id === candidateId ? { ...item, status: 'confirmed' } : item,
    ),
  }, summaryStyle);
}

export function analyzeRoomConversation(room: ChatRoom, { nickname, summaryStyle }: AnalyzeRoomInput): ChatRoom {
  const existingCandidateKeys = new Set(
    (room.analysisCandidates ?? []).map((candidate) => `${candidate.sourceMessageId}:${candidate.type}:${candidate.title}`),
  );
  const newCandidates = room.messages
    .filter((message) => message.sender !== 'Plink')
    .flatMap((message) =>
      localPlanAnalysisAgent
        .analyzeMessage({
          message,
          destination: room.destination,
          nickname,
          summaryStyle,
        })
        .filter((candidate) => !existingCandidateKeys.has(`${candidate.sourceMessageId}:${candidate.type}:${candidate.title}`)),
    )
    .map((candidate, index) => ({
      ...candidate,
      id: nextId(room.analysisCandidates ?? []) + index,
    }));

  const nextRoom = {
    ...room,
    analysisCandidates: [...(room.analysisCandidates ?? []), ...newCandidates],
  };

  return hasConfirmedPlanData(nextRoom)
    ? refreshFinalPlan(nextRoom, summaryStyle)
    : updateCandidateReviewStatus(nextRoom, summaryStyle);
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
    const question = readableCandidateTitle(candidate);
    return {
      ...room,
      decisions: [
        ...room.decisions,
        {
          id: nextId(room.decisions),
          question,
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

function readableCandidateTitle(candidate: AnalysisCandidate) {
  if (candidate.title === '대화 메모' || candidate.title === '결정 필요' || candidate.title === '계획 결정') {
    return candidate.sourceText.slice(0, 34);
  }

  return candidate.title;
}

function inferCandidateDate(title: string) {
  const match = title.match(/월요일|화요일|수요일|목요일|금요일|토요일|일요일|오전|오후|Day\s?\d|[0-9]{1,2}시/);
  return match?.[0] ?? '분석 확정';
}

function refreshFinalPlan(room: ChatRoom, summaryStyle = '꼼꼼하게'): ChatRoom {
  const finalPlan = buildFinalPlan(room, summaryStyle);
  return updateCandidateReviewStatus({
    ...room,
    finalPlan,
  }, summaryStyle);
}

function updateCandidateReviewStatus(room: ChatRoom, summaryStyle = '꼼꼼하게'): ChatRoom {
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
      summary: activeCandidates.length > 0 && !hasConfirmedPlanData(room)
        ? buildCandidateSummary(room, activeCandidates.length, summaryStyle)
        : room.finalPlan.summary,
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

function buildFinalPlan(room: ChatRoom, summaryStyle: string) {
  const confirmedSchedule = room.scheduleItems.filter((item) => item.status !== '대화 필요');
  const confirmedTasks = room.tasks.filter((task) => task.title !== '친구들에게 채팅방 링크 공유');
  const confirmedDecisions = room.decisions.filter((decision) => decision.state !== '대화 전');
  const confirmedBudgets = room.budgetItems.filter((item) => item.amount !== '0원');
  const firstTitle =
    confirmedSchedule[0]?.title ?? confirmedDecisions[0]?.question ?? confirmedTasks[0]?.title ?? confirmedBudgets[0]?.category;

  const days = [
    ...confirmedSchedule.slice(0, 3).map((item, index) => ({
      id: index + 1,
      day: item.date,
      title: item.title,
      route: `${item.status} · 일정 후보에서 확정`,
      highlights: ['일정', item.status],
    })),
    ...confirmedDecisions.slice(0, 2).map((decision, index) => ({
      id: 20 + index,
      day: '결정',
      title: decision.question,
      route: `${decision.state} · ${decision.options.join(' / ')}`,
      highlights: ['결정', decision.state],
    })),
    ...confirmedTasks.slice(0, 2).map((task, index) => ({
      id: 40 + index,
      day: '할 일',
      title: task.title,
      route: `${task.owner} 담당 · ${task.done ? '완료' : '진행 필요'}`,
      highlights: ['할 일', task.owner],
    })),
    ...confirmedBudgets.slice(0, 2).map((budget, index) => ({
      id: 60 + index,
      day: '예산',
      title: budget.category,
      route: `${budget.amount} · ${budget.note}`,
      highlights: ['예산', budget.amount],
    })),
  ];

  return {
    ...room.finalPlan,
    members: `${room.members.length}명`,
    summary: buildStyledSummary(room, summaryStyle, firstTitle),
    shareText: buildStyledShareText(room, summaryStyle),
    days: days.length > 0 ? days : room.finalPlan.days,
  };
}

function buildStyledSummary(room: ChatRoom, summaryStyle: string, firstTitle?: string) {
  const baseCounts = `일정 ${room.scheduleItems.length}개, 할 일 ${room.tasks.length}개, 결정사항 ${room.decisions.length}개`;
  if (summaryStyle === '결정사항 위주') {
    const decisions = room.decisions.filter((decision) => decision.state !== '대화 전');
    const decisionText = decisions.map((decision) => `${decision.question}(${decision.state})`).join(', ') || firstTitle || '아직 확정된 결정 없음';
    return `결정된 내용: ${decisionText}. 현재 ${baseCounts}가 정리되어 있어요.`;
  }
  if (summaryStyle === '짧고 빠르게') {
    return `${room.destination} 계획 업데이트: ${firstTitle ? `${firstTitle} 포함, ` : ''}${baseCounts}.`;
  }
  return `${room.destination} 계획에 ${firstTitle ? `${firstTitle} 등 ` : ''}확정된 내용이 반영됐어요. 현재 ${baseCounts}와 예산 ${room.budgetItems.length}개가 브리핑되어 있어요.`;
}

function buildStyledShareText(room: ChatRoom, summaryStyle: string) {
  if (summaryStyle === '결정사항 위주') {
    return `${room.title} 결정사항 업데이트: ${room.decisions.length}개 결정/검토 항목이 정리됐어요.`;
  }
  if (summaryStyle === '짧고 빠르게') {
    return `${room.title}: 일정 ${room.scheduleItems.length}, 할 일 ${room.tasks.length}, 결정 ${room.decisions.length}`;
  }
  return `${room.title} 계획 업데이트: 일정 ${room.scheduleItems.length}개, 할 일 ${room.tasks.length}개, 결정사항 ${room.decisions.length}개`;
}

function buildCandidateSummary(room: ChatRoom, candidateCount: number, summaryStyle: string) {
  if (summaryStyle === '짧고 빠르게') return `AI 분석 후보 ${candidateCount}개가 검토 대기 중입니다.`;
  if (summaryStyle === '결정사항 위주') return `결정에 영향을 줄 AI 분석 후보 ${candidateCount}개를 확인해야 합니다.`;
  return `${room.destination} 대화에서 AI 분석 후보 ${candidateCount}개를 찾았어요. 확정하면 계획 노트와 브리핑에 반영됩니다.`;
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
