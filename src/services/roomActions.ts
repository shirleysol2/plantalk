import type { AnalysisCandidate, ChatRoom, LinkItem, LinkItemCategory, Message, MessageApplyTarget } from '../types';
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
    text: `${title} 채팅방이 만들어졌어요! 🎉\n\n대화를 나누면 일정·할 일·결정·예산이 계획 노트에 자동으로 정리돼요.\n\n저 @Plink 에게 이렇게 말해보세요:\n• "@Plink 일정 추가해줘"\n• "@Plink 할 일 넣어줘"\n• "@Plink 예산 30만원으로 잡아줘"\n• "@Plink 지금 뭐가 정리됐어?"`,
    extraction: { label: '방 생성', tone: 'schedule' },
  };

  return {
    id: roomId,
    shareCode,
    createdByUserCode: userCode,
    joinedUserCodes: [userCode],
    title,
    subtitle: '',
    destination,
    period,
    coverTone: 'sky',
    unread: 0,
    lastMessage: firstMessage.text,
    messages: [firstMessage],
    analysisCandidates: [],
    linkItems: [],
    scheduleItems: [{ id: 1, date: '준비 중', title: `${destination} 일정 잡기`, status: '대화 필요' }],
    tasks: [{ id: 1, title: '멤버들에게 채팅방 링크 공유', owner: nickname, done: false }],
    decisions: [{ id: 1, question: '핵심 결정사항', options: ['옵션 A', '옵션 B'], state: '대화 전' }],
    budgetItems: [{ id: 1, category: '예산', amount: '0원', note: '대화에서 업데이트' }],
    finalPlan: {
      title: `${destination} 계획`,
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

  // @plink command messages are instructions, not plan content — skip analysis
  const isCommand = /^@plink/i.test(cleanText);

  const message: Message = {
    id: nextId(room.messages),
    sender: nickname,
    senderUserCode: userCode,
    initials: getInitials(nickname),
    time: formatTime(),
    text: cleanText,
    mine: true,
    extraction: isCommand ? { label: '@Plink', tone: 'decision' } : inferExtraction(cleanText),
  };
  const analysisCandidates = isCommand
    ? (room.analysisCandidates ?? [])
    : [
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
  const messages = [...roomWithMember.messages, message];
  const linkItems = mergeLinkItems(roomWithMember.linkItems ?? [], extractLinkItemsFromMessage(message, roomWithMember.linkItems ?? []));

  return updateCandidateReviewStatus({
    ...roomWithMember,
    lastMessage: cleanText,
    messages,
    analysisCandidates,
    linkItems,
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

export function applyPlinkOperations(
  room: ChatRoom,
  operations: import('./plinkBot').PlinkOperation[],
  nickname: string,
  summaryStyle?: string,
): ChatRoom {
  let r = room;

  for (const op of operations) {
    switch (op.type) {
      case 'updateScheduleDate':
        r = {
          ...r,
          scheduleItems: r.scheduleItems.map((i) =>
            i.date === op.fromDate ? { ...i, date: op.toDate } : i,
          ),
        };
        break;

      case 'deleteByDate':
        r = {
          ...r,
          scheduleItems: r.scheduleItems.filter((i) => i.date !== op.date),
        };
        break;

      case 'deleteByKeyword': {
        const kw = op.keyword;
        r = {
          ...r,
          scheduleItems: op.section === 'schedule' || op.section === 'all'
            ? r.scheduleItems.filter((i) => !i.title.includes(kw))
            : r.scheduleItems,
          tasks: op.section === 'task' || op.section === 'all'
            ? r.tasks.filter((i) => !i.title.includes(kw))
            : r.tasks,
          decisions: op.section === 'decision' || op.section === 'all'
            ? r.decisions.filter((i) => !i.question.includes(kw))
            : r.decisions,
        };
        break;
      }

      case 'updateItemStatus': {
        const kw = op.keyword;
        const st = op.newStatus;
        if (op.section === 'schedule') {
          r = { ...r, scheduleItems: r.scheduleItems.map((i) => i.title.includes(kw) ? { ...i, status: st } : i) };
        } else if (op.section === 'task') {
          r = { ...r, tasks: r.tasks.map((i) => i.title.includes(kw) ? { ...i, done: st === '완료' || st === '확정' } : i) };
        } else if (op.section === 'decision') {
          r = { ...r, decisions: r.decisions.map((i) => i.question.includes(kw) ? { ...i, state: st } : i) };
        }
        break;
      }

      case 'updatePeriod':
        r = { ...r, period: op.newPeriod };
        break;

      case 'updateDestination': {
        const updatedTitle = r.title.includes(r.destination)
          ? r.title.replace(r.destination, op.newDestination)
          : r.title;
        r = { ...r, destination: op.newDestination, title: updatedTitle };
        break;
      }

      case 'updateTitle':
        r = { ...r, title: op.newTitle };
        break;

      case 'addDecision':
        r = {
          ...r,
          decisions: [
            ...r.decisions,
            { id: nextId(r.decisions), question: op.question, options: op.options ?? [], state: op.state || '결정 필요' },
          ],
        };
        break;

      case 'addBudget':
        r = {
          ...r,
          budgetItems: [
            ...r.budgetItems.filter((i) => i.amount !== '0원'),
            { id: nextId(r.budgetItems), category: op.category, amount: op.amount, note: op.note || '' },
          ],
        };
        break;

      case 'updateBudget': {
        const kw = op.keyword;
        r = {
          ...r,
          budgetItems: r.budgetItems.map((i) =>
            i.category.includes(kw) || i.note.includes(kw)
              ? { ...i, ...(op.newAmount ? { amount: op.newAmount } : {}), ...(op.newNote ? { note: op.newNote } : {}) }
              : i,
          ),
        };
        break;
      }

      case 'clearSection':
        r = {
          ...r,
          scheduleItems: op.section === 'schedule' || op.section === 'all' ? [] : r.scheduleItems,
          tasks: op.section === 'task' || op.section === 'all' ? [] : r.tasks,
          decisions: op.section === 'decision' || op.section === 'all' ? [] : r.decisions,
          budgetItems: op.section === 'budget' || op.section === 'all' ? [] : r.budgetItems,
        };
        break;

      case 'addSchedule':
        r = {
          ...r,
          scheduleItems: [
            ...r.scheduleItems,
            { id: nextId(r.scheduleItems), date: op.date, title: op.title, status: op.status || '후보' },
          ],
        };
        break;

      case 'addTask':
        r = {
          ...r,
          tasks: [...r.tasks, { id: nextId(r.tasks), title: op.title, owner: nickname, done: false }],
        };
        break;

      case 'renameItem': {
        const kw = op.keyword;
        if (op.section === 'schedule') {
          r = { ...r, scheduleItems: r.scheduleItems.map((i) => i.title.includes(kw) ? { ...i, title: op.newTitle } : i) };
        } else if (op.section === 'task') {
          r = { ...r, tasks: r.tasks.map((i) => i.title.includes(kw) ? { ...i, title: op.newTitle } : i) };
        } else if (op.section === 'decision') {
          r = { ...r, decisions: r.decisions.map((i) => i.question.includes(kw) ? { ...i, question: op.newTitle } : i) };
        }
        break;
      }
    }
  }

  return refreshFinalPlan(r, summaryStyle);
}

export function isBriefingCommand(text: string) {
  return /(브리핑|정리해서\s*보여|정리해\s*줘|계획\s*정리|요약해\s*줘)/i.test(text.trim());
}

export function isPlinkMention(text: string) {
  return /@plink/i.test(text);
}

export function handlePlinkMentionCommand(
  room: ChatRoom,
  { text, nickname, summaryStyle }: { text: string; nickname: string; summaryStyle?: string },
): { room: ChatRoom; reply: string } {
  const command = text.replace(/@plink\s*/i, '').trim();
  let updatedRoom = room;
  const changes: string[] = [];

  // ── 1. 시각 변경: "2시 → 오후 2시로", "2시라고 되어 있는거 오후2시로 바꿔줘"
  //   Strategy: find first plain "N시" + find (오전|오후) N시 anywhere after it
  const plainTimeMatch = command.match(/(오전|오후)?\s*(\d{1,2})시(?!간)/);
  const qualifiedTimeMatch = command.match(/(오전|오후)\s*(\d{1,2})시(?!간)/);
  const isTimeChange =
    plainTimeMatch &&
    qualifiedTimeMatch &&
    // "오후 N시" must appear AFTER the plain time in the string
    command.indexOf(qualifiedTimeMatch[0]) > command.indexOf(plainTimeMatch[0]) + plainTimeMatch[0].length - 1 &&
    // and the command contains a "change" intent word
    /(바꿔|변경|수정|으로|로\s*해|로\s*바)/i.test(command);

  if (isTimeChange && plainTimeMatch && qualifiedTimeMatch) {
    const oldAmPm = plainTimeMatch[1];
    const oldHour = plainTimeMatch[2];
    const newAmPm = qualifiedTimeMatch[1];
    const newHour = qualifiedTimeMatch[2];
    const oldDate = oldAmPm ? `${oldAmPm} ${oldHour}시` : `${oldHour}시`;
    const newDate = `${newAmPm} ${newHour}시`;
    // Only apply if the two dates are meaningfully different
    if (oldDate !== newDate) {
      const count = updatedRoom.scheduleItems.filter((i) => i.date === oldDate).length;
      updatedRoom = {
        ...updatedRoom,
        scheduleItems: updatedRoom.scheduleItems.map((item) =>
          item.date === oldDate ? { ...item, date: newDate } : item,
        ),
      };
      if (count > 0) changes.push(`일정 ${count}개의 시각을 "${oldDate}" → "${newDate}"로 변경했어요.`);
      else changes.push(`"${oldDate}" 시각의 일정이 없어요. 현재 등록된 일정을 확인해 주세요.`);
    }
  }

  // ── 2. 시각 기반 삭제: "N시에 기록된 것들 빼줘", "N시 항목 다 지워봐"
  //   Matches a time first, then a remove-intent word
  const timeDeleteMatch = !isTimeChange && command.match(
    /(\d{1,2})시(?!간)[^]*?(삭제|지워|빼|제거|없애|치워|다\s*지|다\s*빼|모두\s*지|모두\s*빼)/,
  );
  if (timeDeleteMatch) {
    const targetDate = `${timeDeleteMatch[1]}시`;
    // Also match "오전 N시" / "오후 N시" variants
    const ampmVariants = [`${targetDate}`, `오전 ${targetDate}`, `오후 ${targetDate}`];
    const before = updatedRoom.scheduleItems.length;
    updatedRoom = {
      ...updatedRoom,
      scheduleItems: updatedRoom.scheduleItems.filter((i) => !ampmVariants.some((v) => i.date === v || i.date.endsWith(targetDate))),
    };
    const deleted = before - updatedRoom.scheduleItems.length;
    if (deleted > 0) changes.push(`"${targetDate}" 일정 항목 ${deleted}개를 삭제했어요.`);
    else changes.push(`"${targetDate}" 시각의 일정이 없어요.`);
  }

  // ── 3. 키워드 기반 삭제: "부산 밀면 삭제", "X 지워줘/빼줘/없애줘"
  const keywordDeleteMatch = !isTimeChange && !timeDeleteMatch && command.match(
    /^(.+?)\s+(삭제|지워|빼줘|없애|제거|치워)/,
  );
  if (keywordDeleteMatch) {
    const keyword = keywordDeleteMatch[1].trim();
    const before = {
      s: updatedRoom.scheduleItems.length,
      t: updatedRoom.tasks.length,
      d: updatedRoom.decisions.length,
    };
    updatedRoom = {
      ...updatedRoom,
      scheduleItems: updatedRoom.scheduleItems.filter((i) => !i.title.includes(keyword)),
      tasks: updatedRoom.tasks.filter((i) => !i.title.includes(keyword)),
      decisions: updatedRoom.decisions.filter((i) => !i.question.includes(keyword)),
    };
    const deleted =
      (before.s - updatedRoom.scheduleItems.length) +
      (before.t - updatedRoom.tasks.length) +
      (before.d - updatedRoom.decisions.length);
    if (deleted > 0) changes.push(`"${keyword}" 관련 항목 ${deleted}개를 삭제했어요.`);
  }

  // ── 4. 상태/확정 변경: "부산 밀면 확정", "X 완료로 바꿔"
  const statusMatch = !isTimeChange && !timeDeleteMatch && !keywordDeleteMatch &&
    command.match(/^(.+?)\s+(확정|완료|취소|보류|검토)(?:\s*으로|\s*로)?/);
  if (statusMatch) {
    const keyword = statusMatch[1].trim();
    const newStatus = statusMatch[2];
    let updated = 0;
    updatedRoom = {
      ...updatedRoom,
      scheduleItems: updatedRoom.scheduleItems.map((i) => {
        if (i.title.includes(keyword)) { updated++; return { ...i, status: newStatus }; }
        return i;
      }),
      decisions: updatedRoom.decisions.map((d) => {
        if (d.question.includes(keyword)) { updated++; return { ...d, state: newStatus === '확정' ? '확정' : newStatus }; }
        return d;
      }),
      tasks: updatedRoom.tasks.map((t) => {
        if (t.title.includes(keyword)) { updated++; return { ...t, done: newStatus === '완료' || newStatus === '확정' }; }
        return t;
      }),
    };
    if (updated > 0) changes.push(`"${keyword}" 항목을 "${newStatus}"로 변경했어요.`);
  }

  // ── 5. 여행지 변경: "제주도로 바꿔줘", "여행지 부산으로", "제주도 계획 노트로 바꿔줘"
  const destinationMatch = !isTimeChange && !timeDeleteMatch && !keywordDeleteMatch && !statusMatch &&
    command.match(/^(.{1,10}?)\s*(계획\s*노트로|으로|로)\s*(바꿔|변경|수정|해줘|해)/) ||
    command.match(/(여행지|장소|목적지)\s*[은는을]?\s*(.{1,10}?)\s*(로|으로|으로\s*바꿔|로\s*바꿔|로\s*변경)/);
  if (destinationMatch) {
    const newDest = (destinationMatch[1] ?? destinationMatch[2] ?? '').replace(/\s*(계획|노트|여행|여행지|장소|목적지)\s*/g, '').trim();
    if (newDest && newDest.length >= 2 && !/바꿔|변경|수정|삭제|추가/.test(newDest)) {
      const syncedTitle = updatedRoom.title.includes(updatedRoom.destination)
        ? updatedRoom.title.replace(updatedRoom.destination, newDest)
        : updatedRoom.title;
      updatedRoom = { ...updatedRoom, destination: newDest, title: syncedTitle };
      changes.push(`여행지를 "${newDest}"(으)로 변경했어요.`);
    }
  }

  // ── 5-1. 계획 기간 변경: "7/1 3박4일", "5/1~5/4"
  const dateRangeMatch = command.match(/(\d{1,2})\/(\d{1,2})\s*[~\-]\s*(\d{1,2})\/(\d{1,2})/);
  const periodChangeMatch = command.match(/(\d{1,2}\/\d{1,2})\s+(\d+박\d+일)/);
  const startDateMatch = !isTimeChange && command.match(/(\d{1,2})\/(\d{1,2})\s+(\d+박)/);

  if (dateRangeMatch) {
    const [, m1, d1, m2, d2] = dateRangeMatch;
    const newPeriod = `${m1}/${d1} - ${m2}/${d2}`;
    updatedRoom = { ...updatedRoom, period: newPeriod };
    changes.push(`여행 기간을 ${newPeriod}로 변경했어요.`);
  } else if (periodChangeMatch) {
    const [, startDate, nights] = periodChangeMatch;
    const [m, d] = startDate.split('/').map(Number);
    const nightCount = parseInt(nights);
    const end = new Date(new Date().getFullYear(), m - 1, d + nightCount);
    const newPeriod = `${m}/${d} - ${end.getMonth() + 1}/${end.getDate()} (${nights})`;
    updatedRoom = { ...updatedRoom, period: newPeriod };
    changes.push(`여행 기간을 ${newPeriod}로 변경했어요.`);
  } else if (startDateMatch) {
    const [, m, d, nights] = startDateMatch;
    const nightCount = parseInt(nights);
    const end = new Date(new Date().getFullYear(), parseInt(m) - 1, parseInt(d) + nightCount);
    const newPeriod = `${m}/${d} - ${end.getMonth() + 1}/${end.getDate()} (${nights})`;
    updatedRoom = { ...updatedRoom, period: newPeriod };
    changes.push(`여행 기간을 ${newPeriod}로 변경했어요.`);
  }

  // ── 6. 제목 변경: "제목 바꿔줘 제주도 여름 여행", "계획 이름을 X로"
  const titleMatch = !isTimeChange && !timeDeleteMatch && !keywordDeleteMatch && !statusMatch &&
    command.match(/(제목|이름|타이틀)\s*[은는을]?\s*(.{2,20}?)\s*(로|으로|으로\s*바꿔|로\s*바꿔|로\s*변경)/);
  if (titleMatch) {
    const newTitle = titleMatch[2].trim();
    if (newTitle) {
      updatedRoom = { ...updatedRoom, title: newTitle };
      changes.push(`계획 제목을 "${newTitle}"(으)로 변경했어요.`);
    }
  }

  // ── 7. 일괄 계획 정리 (긴 텍스트 / 줄바꿈 여러 개)
  const isBulkPlan = command.split('\n').length >= 3 || (command.length > 80 && /일정|계획|예약|숙소|이동/.test(command));
  if (isBulkPlan) {
    const briefedRoom = generateRoomBriefing(updatedRoom, { nickname, summaryStyle });
    return { room: briefedRoom, reply: '계획 내용을 분석해서 계획 노트에 정리했어요.' };
  }

  const finalRoom = refreshFinalPlan(updatedRoom, summaryStyle);

  if (changes.length > 0) {
    return { room: finalRoom, reply: changes.join('\n') + '\n\n계획 노트에서 확인해 주세요.' };
  }

  // 인식 못한 경우 — 힌트 보여줌
  return {
    room: finalRoom,
    reply: `명령을 이해하지 못했어요. 이렇게 말해보세요:\n• "제주도로 바꿔줘" (여행지 변경)\n• "기간 7/1~7/4로 바꿔줘"\n• "오후 3시에 한강 피크닉 추가해줘"\n• "밀면 삭제"\n• "공항 일정 확정"`,
  };
}

function refreshFinalPlanPublic(room: ChatRoom, summaryStyle = '꼼꼼하게'): ChatRoom {
  return refreshFinalPlan(room, summaryStyle);
}

export function generateRoomBriefing(room: ChatRoom, { nickname, summaryStyle }: AnalyzeRoomInput): ChatRoom {
  const syncedRoom = syncRoomMembersFromMessages(room);
  const analyzedRoom = analyzeRoomConversation(syncRoomLinksFromMessages(syncedRoom), { nickname, summaryStyle });
  const pendingCandidates = (analyzedRoom.analysisCandidates ?? []).filter((candidate) => candidate.status === 'pending');
  const appliedRoom = pendingCandidates.reduce((currentRoom, candidate) => {
    const nextRoom = applyCandidateToRoom(currentRoom, candidate, nickname);
    return {
      ...nextRoom,
      analysisCandidates: nextRoom.analysisCandidates.map((item) =>
        item.id === candidate.id ? { ...item, status: 'confirmed' } : item,
      ),
    };
  }, analyzedRoom);

  return refreshFinalPlan(appliedRoom, summaryStyle);
}

export function sharePlanBriefingToChat(room: ChatRoom, { nickname, summaryStyle }: AnalyzeRoomInput): ChatRoom {
  const briefedRoom = generateRoomBriefing(room, { nickname, summaryStyle });
  const briefingText = buildChatBriefingText(briefedRoom);
  const message: Message = {
    id: nextId(briefedRoom.messages),
    sender: 'Plink',
    initials: 'P',
    time: formatTime(),
    text: briefingText,
    cta: {
      label: '계획 노트 보기',
      action: 'open_plan',
    },
    extraction: { label: '브리핑', tone: 'schedule' },
  };

  return updateCandidateReviewStatus({
    ...briefedRoom,
    lastMessage: briefingText,
    messages: [...briefedRoom.messages, message],
  }, summaryStyle);
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

function keywordSimilarity(a: string, b: string): number {
  const words = (s: string) => new Set(s.toLowerCase().replace(/[()]/g, '').split(/\s+/).filter((w) => w.length > 1));
  const wA = words(a);
  const wB = words(b);
  if (wA.size === 0 || wB.size === 0) return 0;
  const overlap = [...wA].filter((w) => wB.has(w)).length;
  return overlap / Math.min(wA.size, wB.size);
}

function applyCandidateToRoom(room: ChatRoom, candidate: AnalysisCandidate, nickname: string): ChatRoom {
  if (candidate.type === 'schedule') {
    const isDuplicate = room.scheduleItems.some(
      (item) => item.status !== '대화 필요' && (item.title === candidate.title || keywordSimilarity(item.title, candidate.title) > 0.6),
    );
    if (isDuplicate) return room;
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
    const isDuplicate = room.tasks.some(
      (task) => task.title === candidate.title || keywordSimilarity(task.title, candidate.title) > 0.5,
    );
    if (isDuplicate) return room;
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
    const isDuplicate = room.decisions.some(
      (decision) => decision.state !== '대화 전' && (decision.question === question || keywordSimilarity(decision.question, question) > 0.4),
    );
    if (isDuplicate) return room;
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
    const isDuplicate = room.budgetItems.some(
      (item) => keywordSimilarity(item.category, candidate.title) > 0.6 || (item.amount !== '0원' && item.amount === candidate.detail),
    );
    if (isDuplicate) return room;
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
  const match = title.match(/월요일|화요일|수요일|목요일|금요일|토요일|일요일|오전\s*\d{1,2}시|오후\s*\d{1,2}시|Day\s?\d|[0-9]{1,2}시(?!간)/);
  return match?.[0]?.trim() ?? '분석 확정';
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
    room.budgetItems.some((item) => item.amount !== '0원') ||
    (room.linkItems ?? []).length > 0
  );
}

function buildFinalPlan(room: ChatRoom, summaryStyle: string) {
  const confirmedSchedule = room.scheduleItems.filter((item) => item.status !== '대화 필요');
  const confirmedTasks = room.tasks.filter((task) => task.title !== '친구들에게 채팅방 링크 공유');
  const confirmedDecisions = room.decisions.filter((decision) => decision.state !== '대화 전');
  const confirmedBudgets = room.budgetItems.filter((item) => item.amount !== '0원');
  const planLinks = room.linkItems ?? [];
  const firstTitle =
    confirmedSchedule[0]?.title ??
    confirmedDecisions[0]?.question ??
    confirmedTasks[0]?.title ??
    confirmedBudgets[0]?.category ??
    planLinks[0]?.title;

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
    ...planLinks.slice(0, 3).map((link, index) => ({
      id: 80 + index,
      day: '링크',
      title: link.title,
      route: `${link.siteName} · ${linkCategoryLabel(link.category)}`,
      highlights: ['URL', linkCategoryLabel(link.category)],
    })),
  ];

  return {
    ...room.finalPlan,
    title: `${room.destination} 여행 계획`,
    period: room.period,
    members: `${room.members.length}명`,
    summary: buildStyledSummary(room, summaryStyle, firstTitle),
    shareText: buildStyledShareText(room, summaryStyle),
    days: days.length > 0 ? days : room.finalPlan.days,
  };
}

function buildStyledSummary(room: ChatRoom, summaryStyle: string, firstTitle?: string) {
  const linkCount = (room.linkItems ?? []).length;
  const scheduleCount = room.scheduleItems.filter((item) => item.status !== '대화 필요').length;
  const taskCount = room.tasks.filter((task) => task.title !== '친구들에게 채팅방 링크 공유').length;
  const decisionCount = room.decisions.filter((decision) => decision.state !== '대화 전').length;
  const budgetCount = room.budgetItems.filter((item) => item.amount !== '0원').length;
  const baseCounts = `일정 ${scheduleCount}개, 할 일 ${taskCount}개, 결정사항 ${decisionCount}개, 예산 ${budgetCount}개, 링크 ${linkCount}개`;
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
  const linkText = (room.linkItems ?? []).length > 0 ? `, 링크 ${(room.linkItems ?? []).length}개` : '';
  const scheduleCount = room.scheduleItems.filter((item) => item.status !== '대화 필요').length;
  const taskCount = room.tasks.filter((task) => task.title !== '친구들에게 채팅방 링크 공유').length;
  const decisionCount = room.decisions.filter((decision) => decision.state !== '대화 전').length;
  if (summaryStyle === '결정사항 위주') {
    return `${room.title} 결정사항 업데이트: ${decisionCount}개 결정/검토 항목이 정리됐어요.`;
  }
  if (summaryStyle === '짧고 빠르게') {
    return `${room.title}: 일정 ${scheduleCount}, 할 일 ${taskCount}, 결정 ${decisionCount}${linkText}`;
  }
  return `${room.title} 계획 업데이트: 일정 ${scheduleCount}개, 할 일 ${taskCount}개, 결정사항 ${decisionCount}개${linkText}`;
}

export function extractLinkItemsFromMessage(message: Message, existingLinks: LinkItem[] = []): LinkItem[] {
  const urls = Array.from(message.text.matchAll(/https?:\/\/[^\s<>"']+/g), (match) => normalizeUrl(match[0])).filter(Boolean);
  const existingUrlSet = new Set(existingLinks.map((item) => item.url));
  const uniqueUrls = Array.from(new Set(urls)).filter((url) => !existingUrlSet.has(url));

  return uniqueUrls.map((url, index) => {
    const siteName = getSiteName(url);
    const category = inferLinkCategory(url, message.text);
    return {
      id: nextId(existingLinks) + index,
      url,
      siteName,
      title: buildLinkTitle(siteName, category, message.text),
      category,
      sourceMessageId: message.id,
      sourceText: message.text,
    };
  });
}

function syncRoomLinksFromMessages(room: ChatRoom): ChatRoom {
  const linkItems = room.messages.reduce(
    (links, message) => mergeLinkItems(links, extractLinkItemsFromMessage(message, links)),
    room.linkItems ?? [],
  );

  return { ...room, linkItems };
}

function mergeLinkItems(existingLinks: LinkItem[], nextLinks: LinkItem[]) {
  const existingUrlSet = new Set(existingLinks.map((item) => item.url));
  return [...existingLinks, ...nextLinks.filter((link) => !existingUrlSet.has(link.url))];
}

function normalizeUrl(url: string) {
  return url.replace(/[),.?!\]}]+$/g, '');
}

function getSiteName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function inferLinkCategory(url: string, text: string): LinkItemCategory {
  const haystack = `${url} ${text}`.toLowerCase();
  if (/예약|reservation|booking|ticket|티켓/.test(haystack)) return 'reservation';
  if (/map|maps|지도|place|kakao|naver/.test(haystack)) return 'map';
  if (/flight|air|항공|기차|ktx|train|렌트|rental|교통/.test(haystack)) return 'transport';
  if (/hotel|airbnb|숙소|호텔|펜션|stay/.test(haystack)) return 'stay';
  if (/restaurant|food|맛집|식당|카페|cafe/.test(haystack)) return 'food';
  if (/plan|itinerary|trip|일정|코스|여행/.test(haystack)) return 'plan';
  return 'other';
}

function buildLinkTitle(siteName: string, category: LinkItemCategory, text: string) {
  const label = linkCategoryLabel(category);
  const context = text.replace(/https?:\/\/[^\s<>"']+/g, '').trim().slice(0, 26);
  return context ? `${label}: ${context}` : `${siteName} 링크`;
}

function linkCategoryLabel(category: LinkItemCategory) {
  const labels: Record<LinkItemCategory, string> = {
    reservation: '예약',
    map: '지도',
    transport: '교통',
    stay: '숙소',
    food: '맛집',
    plan: '계획',
    other: '참고',
  };
  return labels[category];
}

function buildCandidateSummary(room: ChatRoom, candidateCount: number, summaryStyle: string) {
  if (summaryStyle === '짧고 빠르게') return `AI 분석 후보 ${candidateCount}개가 검토 대기 중입니다.`;
  if (summaryStyle === '결정사항 위주') return `결정에 영향을 줄 AI 분석 후보 ${candidateCount}개를 확인해야 합니다.`;
  return `${room.destination} 대화에서 AI 분석 후보 ${candidateCount}개를 찾았어요. 확정하면 계획 노트와 브리핑에 반영됩니다.`;
}

function buildChatBriefingText(room: ChatRoom) {
  const confirmedSchedule = room.scheduleItems.filter((item) => item.status !== '대화 필요');
  const confirmedTasks = room.tasks.filter((task) => task.title !== '친구들에게 채팅방 링크 공유');
  const confirmedDecisions = room.decisions.filter((decision) => decision.state !== '대화 전');
  const confirmedBudgets = room.budgetItems.filter((item) => item.amount !== '0원');
  const linkItems = room.linkItems ?? [];
  const stay =
    confirmedDecisions.find((decision) => /숙소|호텔|펜션|airbnb|에어비앤비/i.test(decision.question))?.question ??
    room.messages
      .map((message) => message.text)
      .find((text) => /숙소|호텔|펜션|airbnb|에어비앤비/i.test(text) && /확정|예약|정하|하자|좋/.test(text));
  const dayLines = buildBriefingDayLines(room, confirmedSchedule);
  const lines = [
    `${room.title} 브리핑을 정리했어요.`,
    `확정 날짜: ${room.period || room.finalPlan.period}`,
    `장소: ${room.destination}`,
    `숙소: ${stay ? compactBriefingText(stay, 42) : '아직 확정 전'}`,
    ...dayLines,
    `정리된 항목: 일정 ${confirmedSchedule.length}개 · 할 일 ${confirmedTasks.length}개 · 결정 ${confirmedDecisions.length}개 · 예산 ${confirmedBudgets.length}개 · 링크 ${linkItems.length}개`,
  ];

  return lines.join('\n');
}

function buildBriefingDayLines(room: ChatRoom, confirmedSchedule: ChatRoom['scheduleItems']) {
  const messagePlans = room.messages
    .filter((message) => message.sender !== 'Plink' && message.sender !== 'PlanTalk')
    .map((message) => message.text.replace(/https?:\/\/[^\s<>"']+/g, '').trim())
    .map((text) => {
      const day = inferBriefingDayLabel(text);
      return day ? `${day}: ${compactBriefingText(text, 42)}` : null;
    })
    .filter((line): line is string => Boolean(line));

  if (messagePlans.length > 0) return messagePlans.slice(0, 4);

  return confirmedSchedule.slice(0, 4).map((item, index) => {
    const day = inferBriefingDayLabel(`${item.date} ${item.title}`) ?? `${index + 1}일차`;
    return `${day}: ${compactBriefingText(item.title, 42)}`;
  });
}

function inferBriefingDayLabel(text: string) {
  if (/1일차|첫날|첫째날|첫째 날/.test(text)) return '1일차';
  if (/2일차|둘째날|둘째 날/.test(text)) return '2일차';
  if (/3일차|셋째날|셋째 날/.test(text)) return '3일차';
  if (/마지막날|마지막 날/.test(text)) return '마지막날';
  if (/금요일|금욜/.test(text)) return '금요일';
  if (/토요일|토욜/.test(text)) return '토요일';
  if (/일요일|일욜/.test(text)) return '일요일';
  return null;
}

function compactBriefingText(text: string, maxLength: number) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}...` : cleaned;
}

function inferExtraction(text: string): Message['extraction'] {
  if (/예산|비용|원/.test(text)) return { label: '예산 업데이트', tone: 'budget' };
  if (/확정|어때|정하자|숙소|코스/.test(text)) return { label: '결정 필요', tone: 'decision' };
  if (/예약|확인|찾아|공유|저장/.test(text)) return { label: '할 일 생성', tone: 'task' };
  return { label: '일정 후보', tone: 'schedule' };
}

function inferSchedule(text: string) {
  const match = text.match(/(월요일|화요일|수요일|목요일|금요일|토요일|일요일|오전\s*\d{1,2}시|오후\s*\d{1,2}시|Day\s?\d|[0-9]{1,2}시(?!간))[^.!?。]*/);
  if (!match) return null;

  return {
    date: match[1].trim(),
    title: match[0].trim().slice(0, 28),
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
