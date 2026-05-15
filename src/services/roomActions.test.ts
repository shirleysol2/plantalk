import { describe, expect, it } from 'vitest';
import {
  addMessageToRoom,
  analyzeRoomConversation,
  applyMessageToRoom,
  confirmAnalysisCandidate,
  createRoom,
  deleteAnalysisCandidate,
  getInitials,
  holdAnalysisCandidate,
  isMessageMineForUser,
} from './roomActions';
import { analyzeMessageWithLocalAgent } from './planAnalysisAgent';
import type { AnalysisCandidate, Message } from '../types';

describe('analyzeMessageWithLocalAgent', () => {
  const baseMessage: Message = {
    id: 10,
    sender: '민지',
    initials: '민',
    time: '오후 2:10',
    text: '토요일 오전에는 성산일출봉 가고 렌트카 120,000원 확인하자',
  };

  it('creates review candidates without confirming plan data', () => {
    const candidates = analyzeMessageWithLocalAgent({
      message: baseMessage,
      destination: '제주',
      nickname: '민지',
    });

    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'schedule',
          title: expect.stringContaining('토요일'),
          sourceMessageId: 10,
          status: 'pending',
        }),
        expect.objectContaining({
          type: 'task',
          title: expect.stringContaining('확인'),
          sourceMessageId: 10,
          status: 'pending',
        }),
        expect.objectContaining({
          type: 'budget',
          title: '예산 후보',
          detail: '120,000원',
          sourceMessageId: 10,
          status: 'pending',
        }),
      ]),
    );
  });

  it('creates an insight candidate when the message suggests unresolved choices', () => {
    const candidates = analyzeMessageWithLocalAgent({
      message: {
        ...baseMessage,
        id: 11,
        text: '숙소는 서귀포랑 제주 시내 중에 아직 못 정했어',
      },
      destination: '제주',
      nickname: '민지',
    });

    expect(candidates).toContainEqual(
      expect.objectContaining({
        type: 'insight',
        title: '결정 필요',
        detail: expect.stringContaining('숙소'),
        status: 'pending',
      }),
    );
  });
});

describe('room actions', () => {
  it('creates a new room with starter plan data', () => {
    const room = createRoom({
      title: '부산 주말여행',
      destination: 'Busan',
      period: '6월 7일~6월 8일',
      nickname: '솔',
      userCode: 'user_abc123',
    });

    expect(room.title).toBe('부산 주말여행');
    expect(room.destination).toBe('Busan');
    expect(room.messages[0].text).toContain('부산 주말여행');
    expect(room.finalPlan.title).toBe('Busan 여행 계획');
    expect(room.members[0].name).toBe('솔');
    expect(room.shareCode).toMatch(/^room_[a-z0-9]{8}$/);
    expect(room.createdByUserCode).toBe('user_abc123');
    expect(room.joinedUserCodes).toEqual(['user_abc123']);
  });

  it('adds a chat message and queues planning hints for confirmation', () => {
    const room = createRoom({
      title: '부산 주말여행',
      destination: 'Busan',
      period: '6월 7일~6월 8일',
      nickname: '솔',
      userCode: 'user_abc123',
    });

    const updated = addMessageToRoom(room, {
      nickname: '솔',
      userCode: 'user_abc123',
      text: '토요일 10시에 기차 예약하고 숙소는 해운대로 확정하자. 예산은 1인 200000원 정도!',
    });

    expect(updated.messages).toHaveLength(2);
    expect(updated.messages[1].senderUserCode).toBe('user_abc123');
    expect(isMessageMineForUser(updated.messages[1], { nickname: '솔', userCode: 'user_abc123' })).toBe(true);
    expect(isMessageMineForUser(updated.messages[1], { nickname: '민지', userCode: 'user_other' })).toBe(false);
    expect(updated.finalPlan.status).toBe('검토 중');
    expect(updated.analysisCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'schedule', title: expect.stringContaining('토요일 10시'), status: 'pending' }),
        expect.objectContaining({ type: 'task', title: expect.stringContaining('기차 예약'), status: 'pending' }),
        expect.objectContaining({ type: 'decision', title: '숙소 선택', status: 'pending' }),
        expect.objectContaining({ type: 'budget', detail: '200,000원', status: 'pending' }),
      ]),
    );
    expect(updated.scheduleItems).toHaveLength(room.scheduleItems.length);
    expect(updated.tasks).toHaveLength(room.tasks.length);
    expect(updated.decisions).toHaveLength(room.decisions.length);
    expect(updated.budgetItems).toHaveLength(room.budgetItems.length);
  });

  it('keeps completion hints in candidates until the user confirms them', () => {
    const room = createRoom({
      title: '부산 주말여행',
      destination: 'Busan',
      period: '6월 7일~6월 8일',
      nickname: '솔',
      userCode: 'user_abc123',
    });

    const updated = addMessageToRoom(room, {
      nickname: '솔',
      userCode: 'user_abc123',
      text: '기차 예약 완료했고 숙소는 해운대로 확정했어.',
    });

    expect(updated.analysisCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'task', detail: '완료된 할 일 후보' }),
        expect.objectContaining({ type: 'decision', detail: '확정 가능한 결정 후보' }),
      ]),
    );
    expect(updated.tasks).toHaveLength(room.tasks.length);
    expect(updated.decisions).toHaveLength(room.decisions.length);
  });

  it('records schedule changes as pending analysis candidates', () => {
    const room = createRoom({
      title: '부산 주말여행',
      destination: 'Busan',
      period: '6월 7일~6월 8일',
      nickname: '솔',
      userCode: 'user_abc123',
    });

    const updated = addMessageToRoom(room, {
      nickname: '솔',
      userCode: 'user_abc123',
      text: '토요일 3시로 일정 변경하자.',
    });

    expect(updated.analysisCandidates.some((item) => item.type === 'schedule' && item.detail === '변경 일정 후보')).toBe(true);
    expect(updated.scheduleItems).toHaveLength(room.scheduleItems.length);
  });

  it('manually applies a chat message to a selected plan section', () => {
    const room = createRoom({
      title: '부산 주말여행',
      destination: 'Busan',
      period: '6월 7일~6월 8일',
      nickname: '솔',
      userCode: 'user_abc123',
    });
    const message = {
      id: 99,
      sender: '솔',
      initials: '솔',
      time: '오후 3:00',
      text: '숙소 예약 확인하기',
    };

    const updated = applyMessageToRoom(room, { message, target: 'task', nickname: '솔' });

    expect(updated.tasks.some((task) => task.title === '숙소 예약 확인하기')).toBe(true);
    expect(updated.lastMessage).toBe(room.lastMessage);
  });

  it('creates readable initials from a nickname', () => {
    expect(getInitials('솔')).toBe('솔');
    expect(getInitials('Plan Talk')).toBe('PT');
  });
});

describe('analysis candidate actions', () => {
  function roomWithCandidate(candidate: AnalysisCandidate) {
    return {
      ...createRoom({
        title: '제주 준비',
        destination: '제주',
        period: '5월 20일-22일',
        nickname: '지수',
        userCode: 'user_1',
      }),
      analysisCandidates: [candidate],
    };
  }

  it('confirms a schedule candidate into the schedule list and briefing', () => {
    const room = roomWithCandidate({
      id: 1,
      type: 'schedule',
      title: '토요일 오전 성산일출봉',
      detail: '일정 후보',
      sourceMessageId: 2,
      sourceText: '토요일 오전에는 성산일출봉 가자',
      status: 'pending',
    });

    const updated = confirmAnalysisCandidate(room, { candidateId: 1, nickname: '지수', summaryStyle: '꼼꼼하게' });

    expect(updated.scheduleItems).toContainEqual(
      expect.objectContaining({
        title: '토요일 오전 성산일출봉',
        status: '후보',
      }),
    );
    expect(updated.analysisCandidates[0]).toEqual(expect.objectContaining({ status: 'confirmed' }));
    expect(updated.finalPlan.summary).toContain('토요일 오전 성산일출봉');
    expect(updated.finalPlan.days).toContainEqual(
      expect.objectContaining({
        title: '토요일 오전 성산일출봉',
        route: expect.stringContaining('일정 후보'),
        highlights: expect.arrayContaining(['일정']),
      }),
    );
    expect(updated.finalPlan.shareText).toContain('계획 업데이트');
  });

  it('uses the selected AI summary style when generating the briefing', () => {
    const room = roomWithCandidate({
      id: 1,
      type: 'decision',
      title: '숙소 선택',
      detail: '확정 가능한 결정 후보',
      sourceMessageId: 2,
      sourceText: '숙소는 해운대로 확정했어',
      status: 'pending',
    });

    const updated = confirmAnalysisCandidate(room, {
      candidateId: 1,
      nickname: '지수',
      summaryStyle: '결정사항 위주',
    });

    expect(updated.finalPlan.summary).toContain('결정된 내용');
    expect(updated.finalPlan.shareText).toContain('결정사항');
  });

  it('confirms task, decision, insight, and budget candidates into matching plan sections', () => {
    const room = {
      ...createRoom({
        title: '제주 준비',
        destination: '제주',
        period: '5월 20일-22일',
        nickname: '지수',
        userCode: 'user_1',
      }),
      analysisCandidates: [
        {
          id: 1,
          type: 'task',
          title: '렌트카 확인',
          detail: '완료된 할 일 후보',
          sourceMessageId: 3,
          sourceText: '렌트카 확인했어',
          status: 'pending',
        },
        {
          id: 2,
          type: 'decision',
          title: '숙소 선택',
          detail: '확정 가능한 결정 후보',
          sourceMessageId: 4,
          sourceText: '숙소 확정했어',
          status: 'pending',
        },
        {
          id: 3,
          type: 'insight',
          title: '결정 필요',
          detail: '숙소는 아직 못 정했어',
          sourceMessageId: 5,
          sourceText: '숙소는 아직 못 정했어',
          status: 'pending',
        },
        {
          id: 4,
          type: 'budget',
          title: '예산 후보',
          detail: '120,000원',
          sourceMessageId: 6,
          sourceText: '렌트카 120,000원',
          status: 'pending',
        },
      ] as AnalysisCandidate[],
    };

    const withTask = confirmAnalysisCandidate(room, { candidateId: 1, nickname: '지수' });
    const withDecision = confirmAnalysisCandidate(withTask, { candidateId: 2, nickname: '지수' });
    const withInsight = confirmAnalysisCandidate(withDecision, { candidateId: 3, nickname: '지수' });
    const withBudget = confirmAnalysisCandidate(withInsight, { candidateId: 4, nickname: '지수' });

    expect(withBudget.tasks).toContainEqual(expect.objectContaining({ title: '렌트카 확인', done: true }));
    expect(withBudget.decisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ question: '숙소 선택', state: '확정' }),
        expect.objectContaining({ question: '결정 필요', state: '검토 필요' }),
      ]),
    );
    expect(withBudget.budgetItems).toContainEqual(expect.objectContaining({ category: '예산 후보', amount: '120,000원' }));
  });

  it('holds and deletes candidates without changing confirmed plan lists', () => {
    const room = roomWithCandidate({
      id: 2,
      type: 'task',
      title: '렌트카 확인',
      detail: '할 일 후보',
      sourceMessageId: 3,
      sourceText: '렌트카 확인하자',
      status: 'pending',
    });

    const held = holdAnalysisCandidate(room, 2);
    const pending = holdAnalysisCandidate(held, 2);
    const deleted = deleteAnalysisCandidate(pending, 2);

    expect(held.analysisCandidates[0].status).toBe('held');
    expect(held.finalPlan.status).toBe('보류 있음');
    expect(pending.analysisCandidates[0].status).toBe('pending');
    expect(pending.finalPlan.status).toBe('검토 중');
    expect(held.tasks).toHaveLength(room.tasks.length);
    expect(deleted.analysisCandidates).toHaveLength(0);
    expect(deleted.finalPlan.status).toBe('작성 중');
    expect(deleted.tasks).toHaveLength(room.tasks.length);
  });

  it('analyzes the whole conversation on demand with the selected AI summary style', () => {
    const room = {
      ...createRoom({
        title: '제주 준비',
        destination: '제주',
        period: '5월 20일-22일',
        nickname: '지수',
        userCode: 'user_1',
      }),
      messages: [
        {
          id: 1,
          sender: '민지',
          senderUserCode: 'user_2',
          initials: '민',
          time: '오후 2:10',
          text: '토요일 오전에는 성산일출봉 가고 렌트카 120,000원 확인하자',
        },
      ],
      analysisCandidates: [],
    };

    const updated = analyzeRoomConversation(room, {
      nickname: '지수',
      summaryStyle: '짧고 빠르게',
    });

    expect(updated.analysisCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'schedule', sourceMessageId: 1 }),
        expect.objectContaining({ type: 'budget', sourceMessageId: 1 }),
      ]),
    );
    expect(updated.finalPlan.summary).toContain('후보');
  });

  it('rebuilds an existing confirmed briefing when the AI summary style changes', () => {
    const room = roomWithCandidate({
      id: 1,
      type: 'decision',
      title: '숙소 선택',
      detail: '확정 가능한 결정 후보',
      sourceMessageId: 2,
      sourceText: '숙소는 해운대로 확정했어',
      status: 'pending',
    });
    const confirmed = confirmAnalysisCandidate(room, { candidateId: 1, nickname: '지수', summaryStyle: '꼼꼼하게' });

    const updated = analyzeRoomConversation(confirmed, {
      nickname: '지수',
      summaryStyle: '결정사항 위주',
    });

    expect(updated.finalPlan.summary).toContain('결정된 내용');
  });
});
