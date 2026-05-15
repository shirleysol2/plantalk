import { describe, expect, it } from 'vitest';
import { addMessageToRoom, createRoom, getInitials } from './roomActions';

describe('room actions', () => {
  it('creates a new room with starter plan data', () => {
    const room = createRoom({
      title: '부산 주말여행',
      destination: 'Busan',
      period: '6월 7일~6월 8일',
      nickname: '솔',
    });

    expect(room.title).toBe('부산 주말여행');
    expect(room.destination).toBe('Busan');
    expect(room.messages[0].text).toContain('부산 주말여행');
    expect(room.finalPlan.title).toBe('Busan 여행 계획');
    expect(room.members[0].name).toBe('솔');
  });

  it('adds a chat message and extracts planning hints into the room plan', () => {
    const room = createRoom({
      title: '부산 주말여행',
      destination: 'Busan',
      period: '6월 7일~6월 8일',
      nickname: '솔',
    });

    const updated = addMessageToRoom(room, {
      nickname: '솔',
      text: '토요일 10시에 기차 예약하고 숙소는 해운대로 확정하자. 예산은 1인 200000원 정도!',
    });

    expect(updated.messages).toHaveLength(2);
    expect(updated.messages[1].mine).toBe(true);
    expect(updated.scheduleItems.some((item) => item.title.includes('토요일 10시'))).toBe(true);
    expect(updated.tasks.some((task) => task.title.includes('기차 예약'))).toBe(true);
    expect(updated.decisions.some((decision) => decision.question.includes('숙소'))).toBe(true);
    expect(updated.budgetItems.some((budget) => budget.amount === '200,000원')).toBe(true);
  });

  it('creates readable initials from a nickname', () => {
    expect(getInitials('솔')).toBe('솔');
    expect(getInitials('Plan Talk')).toBe('PT');
  });
});
