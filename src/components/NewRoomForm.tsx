import { CalendarDays, Plus, X } from 'lucide-react';
import { FormEvent, useState } from 'react';

type PlanType = 'trip' | 'gathering' | 'study' | 'project' | 'couple' | 'other';

const PLAN_TYPES: { type: PlanType; emoji: string; label: string; topicPlaceholder: string; titleHint: string }[] = [
  { type: 'trip',      emoji: '✈️', label: '여행',     topicPlaceholder: '어디로? (제주도, 도쿄…)',    titleHint: '여행' },
  { type: 'gathering', emoji: '🍻', label: '모임',     topicPlaceholder: '무슨 모임? (회식, 번개…)',   titleHint: '모임' },
  { type: 'study',     emoji: '📚', label: '스터디',   topicPlaceholder: '스터디 주제 (알고리즘…)',    titleHint: '스터디' },
  { type: 'project',   emoji: '💼', label: '팀플',     topicPlaceholder: '프로젝트 이름',               titleHint: '팀플' },
  { type: 'couple',    emoji: '💑', label: '커플',     topicPlaceholder: '어디서? (홍대, 제주…)',       titleHint: '데이트' },
  { type: 'other',     emoji: '📋', label: '기타',     topicPlaceholder: '장소 또는 주제',              titleHint: '계획' },
];

type NewRoomFormProps = {
  compact?: boolean;
  ctaLabel?: string;
  defaultPlanType?: PlanType;
  onCreateRoom: (input: { title: string; destination: string; period: string }) => void;
};

export function NewRoomForm({ compact = false, ctaLabel = '채팅방 만들기', defaultPlanType, onCreateRoom }: NewRoomFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [planType, setPlanType] = useState<PlanType>(defaultPlanType ?? 'trip');
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [period, setPeriod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const selectedType = PLAN_TYPES.find((t) => t.type === planType) ?? PLAN_TYPES[0];

  const updateDateRange = (nextStartDate: string, nextEndDate: string) => {
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
    const formattedPeriod = formatDateRange(nextStartDate, nextEndDate);
    if (formattedPeriod) setPeriod(formattedPeriod);
  };

  const handleStartDateChange = (nextStartDate: string) => {
    const nextEndDate = endDate && nextStartDate > endDate ? nextStartDate : endDate;
    updateDateRange(nextStartDate, nextEndDate);
  };

  const handleEndDateChange = (nextEndDate: string) => {
    updateDateRange(startDate, nextEndDate);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !destination.trim() || !period.trim()) return;

    onCreateRoom({
      title: title.trim(),
      destination: destination.trim(),
      period: period.trim(),
    });
    setTitle('');
    setDestination('');
    setPeriod('');
    setStartDate('');
    setEndDate('');
    setIsCalendarOpen(false);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button className={`new-room-toggle ${compact ? 'compact' : ''}`} onClick={() => setIsOpen(true)} type="button">
        <Plus size={17} />
        {ctaLabel}
      </button>
    );
  }

  return (
    <form className={`new-room-form ${compact ? 'compact' : ''}`} onSubmit={handleSubmit}>
      <div className="new-room-form-header">
        <strong>새 채팅방</strong>
        <button aria-label="닫기" onClick={() => setIsOpen(false)} type="button">
          <X size={16} />
        </button>
      </div>

      {/* Plan type picker */}
      <div className="plan-type-picker" role="group" aria-label="플랜 유형 선택">
        {PLAN_TYPES.map((t) => (
          <button
            key={t.type}
            className={`plan-type-chip ${planType === t.type ? 'active' : ''}`}
            onClick={() => setPlanType(t.type)}
            type="button"
            aria-pressed={planType === t.type}
          >
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      <input
        aria-label="방 이름"
        placeholder={`방 이름 예: 5월 ${selectedType.label}`}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <input
        aria-label="장소 또는 주제"
        placeholder={selectedType.topicPlaceholder}
        value={destination}
        onChange={(event) => setDestination(event.target.value)}
      />
      <div className="period-input-wrap">
        <input
          aria-label="일정"
          placeholder="일정 예: 6월 7일~6월 8일"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        />
        <button
          aria-expanded={isCalendarOpen}
          aria-label="캘린더로 일정 선택"
          className="calendar-toggle-button"
          onClick={() => setIsCalendarOpen((current) => !current)}
          type="button"
        >
          <CalendarDays size={16} />
        </button>
      </div>
      {isCalendarOpen && (
        <div className="calendar-range-panel">
          <label>
            시작
            <input
              aria-label="시작일"
              type="date"
              value={startDate}
              onChange={(event) => handleStartDateChange(event.currentTarget.value)}
              onInput={(event) => handleStartDateChange(event.currentTarget.value)}
            />
          </label>
          <label>
            종료
            <input
              aria-label="종료일"
              min={startDate}
              type="date"
              value={endDate}
              onChange={(event) => handleEndDateChange(event.currentTarget.value)}
              onInput={(event) => handleEndDateChange(event.currentTarget.value)}
            />
          </label>
        </div>
      )}
      <button type="submit">만들기</button>
    </form>
  );
}

function formatDateRange(startDate: string, endDate: string) {
  if (!startDate && !endDate) return '';
  if (startDate && !endDate) return formatDateLabel(startDate);
  if (!startDate && endDate) return formatDateLabel(endDate);
  if (startDate === endDate) return formatDateLabel(startDate);
  return `${formatDateLabel(startDate)}-${formatDateLabel(endDate)}`;
}

function formatDateLabel(date: string) {
  const [, month, day] = date.split('-').map(Number);
  if (!month || !day) return date;
  return `${month}/${day}`;
}
