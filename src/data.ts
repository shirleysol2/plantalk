import type { BudgetItem, DecisionItem, FinalPlan, Member, Message, ScheduleItem, TaskItem } from './types';

export const messages: Message[] = [
  {
    id: 1,
    sender: '민지',
    initials: '민',
    time: '오전 10:12',
    text: '제주 2박 3일이면 금요일 밤 비행기 타고 일요일 저녁에 돌아오는 게 제일 낫지 않아?',
    extraction: { label: '일정 후보', tone: 'schedule' },
  },
  {
    id: 2,
    sender: '나',
    initials: '나',
    time: '오전 10:14',
    text: '좋아. 그럼 이번 주 금요일 밤 항공권부터 찾아볼게.',
    mine: true,
    extraction: { label: '할 일 생성', tone: 'task' },
  },
  {
    id: 3,
    sender: '지수',
    initials: '지',
    time: '오전 10:18',
    text: '숙소는 제주시 쪽이 편할까? 아니면 서귀포 쪽이 동선 예쁠 것 같기도 해.',
    extraction: { label: '결정 필요', tone: 'decision' },
  },
  {
    id: 4,
    sender: '현',
    initials: '현',
    time: '오전 10:21',
    text: '렌트까지 하면 1인 40만원 초반 정도로 잡으면 될 듯!',
    extraction: { label: '예산 업데이트', tone: 'budget' },
  },
  {
    id: 5,
    sender: '나',
    initials: '나',
    time: '오전 10:25',
    text: '일요일까지 숙소 위치 정하고, 동쪽 코스 맛집 후보도 같이 모아보자.',
    mine: true,
    extraction: { label: '마감 추가', tone: 'schedule' },
  },
  {
    id: 6,
    sender: 'PlanTalk',
    initials: 'P',
    time: '오전 11:02',
    text: '제주 2박 3일 일정이 확정됐어요. Day별 브리핑과 준비 체크리스트를 계획 노트에 정리했어요.',
    extraction: { label: '확정 브리핑', tone: 'schedule' },
  },
];

export const scheduleItems: ScheduleItem[] = [
  { id: 1, date: 'Day 1', title: '제주시 도착, 동문시장 저녁', status: '확정' },
  { id: 2, date: 'Day 2', title: '성산 일출봉, 우도, 월정리', status: '확정' },
  { id: 3, date: 'Day 3', title: '애월 카페, 공항 복귀', status: '확정' },
];

export const taskItems: TaskItem[] = [
  { id: 1, title: '항공권 예약 캡처 공유', owner: '나', done: true },
  { id: 2, title: '렌트카 가격 확인', owner: '현', done: true },
  { id: 3, title: '숙소 체크인 정보 저장', owner: '지수', done: true },
  { id: 4, title: '동쪽 맛집 예약 가능 여부 확인', owner: '민지', done: false },
];

export const decisions: DecisionItem[] = [
  { id: 1, question: '숙소 위치', options: ['제주시'], state: '확정' },
  { id: 2, question: '이동 방식', options: ['렌트카'], state: '확정' },
];

export const budgetItems: BudgetItem[] = [
  { id: 1, category: '항공', amount: '160,000원', note: '금요일 밤 출발 기준' },
  { id: 2, category: '숙소', amount: '140,000원', note: '2박 4인 분할' },
  { id: 3, category: '렌트', amount: '70,000원', note: '보험 포함 예상' },
  { id: 4, category: '식비', amount: '55,000원', note: '카페 포함 여유분' },
];

export const members: Member[] = [
  { id: 1, name: '나', initials: '나', role: '계획 정리' },
  { id: 2, name: '민지', initials: '민', role: '맛집 담당' },
  { id: 3, name: '지수', initials: '지', role: '숙소 담당' },
  { id: 4, name: '현', initials: '현', role: '이동 담당' },
];

export const summaryStyles = ['꼼꼼하게', '짧고 빠르게', '결정사항 위주'];

export const finalPlan: FinalPlan = {
  title: '제주 2박 3일 확정 일정',
  period: '5월 24일 금요일 - 5월 26일 일요일',
  members: '4명',
  status: '확정',
  summary: '제주시 숙소를 거점으로 첫날은 가볍게 도착, 둘째 날은 동쪽 코스 집중, 마지막 날은 애월에서 천천히 마무리하는 일정이에요.',
  shareText: '금 밤 제주 도착 → 토 동쪽 코스 → 일 애월 카페 후 복귀. 1인 예상 425,000원, 렌트카 이동으로 확정!',
  days: [
    {
      id: 1,
      day: 'Day 1',
      title: '도착과 체크인',
      route: '제주공항 → 렌트카 픽업 → 제주시 숙소 → 동문시장',
      highlights: ['20:10 제주 도착', '21:00 숙소 체크인', '동문시장 야식'],
    },
    {
      id: 2,
      day: 'Day 2',
      title: '동쪽 코스',
      route: '성산 일출봉 → 우도 → 월정리 → 제주시',
      highlights: ['성산 브런치', '우도 반나절', '월정리 카페'],
    },
    {
      id: 3,
      day: 'Day 3',
      title: '느린 마무리',
      route: '애월 해안도로 → 카페 → 제주공항',
      highlights: ['11:00 체크아웃', '애월 카페', '18:30 김포행'],
    },
  ],
};
