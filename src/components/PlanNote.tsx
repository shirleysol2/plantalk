import {
  CalendarCheck2,
  CheckCircle2,
  Circle,
  Clock3,
  Coins,
  Link2,
  ListTodo,
  MapPinned,
  MoreVertical,
  Send,
  Sparkles,
  Trash2,
  Vote,
} from 'lucide-react';
import { useState } from 'react';
import type { AnalysisCandidate, BudgetItem, ChatRoom, DecisionItem, FinalPlan, LinkItem, ScheduleItem, TaskItem } from '../types';

type PlanNoteProps = {
  room: ChatRoom;
  rooms: ChatRoom[];
  activeRoomId: string;
  finalPlan: FinalPlan;
  analysisCandidates: AnalysisCandidate[];
  linkItems: LinkItem[];
  scheduleItems: ScheduleItem[];
  tasks: TaskItem[];
  decisions: DecisionItem[];
  budgetItems: BudgetItem[];
  onSelectRoom: (roomId: string) => void;
  onCopyRoomLink: (room: ChatRoom) => void;
  onToggleTask: (taskId: number) => void;
  onUpdateScheduleItem?: (itemId: number, updates: Partial<ScheduleItem>) => void;
  onDeleteScheduleItem?: (itemId: number) => void;
  onUpdateTaskItem?: (taskId: number, updates: Partial<TaskItem>) => void;
  onDeleteTaskItem?: (taskId: number) => void;
  onUpdateDecisionItem?: (decisionId: number, updates: Partial<DecisionItem>) => void;
  onDeleteDecisionItem?: (decisionId: number) => void;
  onUpdateBudgetItem?: (itemId: number, updates: Partial<BudgetItem>) => void;
  onDeleteBudgetItem?: (itemId: number) => void;
  onConfirmAnalysisCandidate?: (candidateId: number) => void;
  onHoldAnalysisCandidate?: (candidateId: number) => void;
  onDeleteAnalysisCandidate?: (candidateId: number) => void;
  onAnalyzeRoom?: () => void;
};

type EditableSection = 'schedule' | 'tasks' | 'decisions' | 'budget';
type NoteTab = 'briefing' | 'links';

export function PlanNote({
  room,
  rooms,
  activeRoomId,
  finalPlan,
  analysisCandidates,
  linkItems,
  scheduleItems,
  tasks,
  decisions,
  budgetItems,
  onSelectRoom,
  onCopyRoomLink,
  onToggleTask,
  onUpdateScheduleItem,
  onDeleteScheduleItem,
  onUpdateTaskItem,
  onDeleteTaskItem,
  onUpdateDecisionItem,
  onDeleteDecisionItem,
  onUpdateBudgetItem,
  onDeleteBudgetItem,
  onConfirmAnalysisCandidate,
  onHoldAnalysisCandidate,
  onDeleteAnalysisCandidate,
  onAnalyzeRoom,
}: PlanNoteProps) {
  const [editingSections, setEditingSections] = useState<Record<EditableSection, boolean>>({
    schedule: false,
    tasks: false,
    decisions: false,
    budget: false,
  });
  const [activeNoteTab, setActiveNoteTab] = useState<NoteTab>('briefing');
  const [showDetails, setShowDetails] = useState(false);
  const total = budgetItems.reduce((sum, item) => sum + Number(item.amount.replace(/[^0-9]/g, '')), 0);
  const openCandidates = analysisCandidates.filter((candidate) => candidate.status !== 'confirmed');
  const confirmedScheduleCount = scheduleItems.filter((item) => item.status !== '대화 필요').length;
  const confirmedTaskCount = tasks.filter((task) => task.title !== '친구들에게 채팅방 링크 공유').length;
  const confirmedDecisionCount = decisions.filter((decision) => decision.state !== '대화 전').length;
  const validBudgetCount = budgetItems.filter((item) => item.amount !== '0원').length;
  const hasBriefedContent =
    confirmedScheduleCount + confirmedTaskCount + confirmedDecisionCount + validBudgetCount + linkItems.length > 0;
  const travelBriefing = buildTravelBriefing(room, scheduleItems, decisions);
  const briefingSummary = hasBriefedContent
    ? `${room.destination} 계획에서 확정된 날짜, 장소, 숙소와 일차별 일정을 채팅 기준으로 정리했어요. 검토 중인 내용은 아래 분석 후보에서 따로 확인할 수 있어요.`
    : finalPlan.summary;
  const briefingShareText = hasBriefedContent
    ? `${room.title} 브리핑: 일정 ${confirmedScheduleCount}, 할 일 ${confirmedTaskCount}, 결정 ${confirmedDecisionCount}, 예산 ${validBudgetCount}, 링크 ${linkItems.length}`
    : finalPlan.shareText;
  const isEditing = (section: EditableSection) => editingSections[section];
  const toggleSectionEdit = (section: EditableSection) => {
    setEditingSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const renderSectionEditButton = (section: EditableSection) => (
    <button
      aria-label={`${isEditing(section) ? '수정 완료' : '수정하기'}`}
      aria-pressed={isEditing(section)}
      className={`section-edit-button ${isEditing(section) ? 'active' : ''}`}
      onClick={() => toggleSectionEdit(section)}
      type="button"
    >
      <MoreVertical size={16} />
      <span>{isEditing(section) ? '완료' : '수정하기'}</span>
    </button>
  );

  return (
    <div className="plan-note">
      <div className="panel-heading">
        <p className="eyebrow">방금 정리된</p>
        <h2>{room.destination} 일정표</h2>
        <button aria-label="공유 링크 복사" className="inline-link-button" onClick={() => onCopyRoomLink(room)} type="button">
          <Link2 size={16} />
        </button>
      </div>

      <div className="plan-room-switcher" aria-label="계획 노트 채팅방 선택">
        {rooms.map((item) => (
          <button
            className={activeRoomId === item.id ? 'active' : ''}
            key={item.id}
            onClick={() => onSelectRoom(item.id)}
            type="button"
          >
            <span>{item.destination.slice(0, 1)}</span>
            {item.title}
          </button>
        ))}
      </div>

      <div className="note-tabs" role="tablist" aria-label="계획 노트 보기">
        <button
          aria-selected={activeNoteTab === 'briefing'}
          className={activeNoteTab === 'briefing' ? 'active' : ''}
          onClick={() => setActiveNoteTab('briefing')}
          role="tab"
          type="button"
        >
          브리핑
        </button>
        <button
          aria-selected={activeNoteTab === 'links'}
          className={activeNoteTab === 'links' ? 'active' : ''}
          onClick={() => setActiveNoteTab('links')}
          role="tab"
          type="button"
        >
          URL 히스토리
          <span>{linkItems.length}</span>
        </button>
      </div>

      {activeNoteTab === 'briefing' ? (
        <section className="briefing-card">
          <div className="briefing-status">
            <span>{finalPlan.status}</span>
            <strong>{finalPlan.period}</strong>
          </div>
          <div className="briefing-title">
            <CalendarCheck2 size={22} />
            <div>
              <h3>{finalPlan.title}</h3>
              <p>{finalPlan.members} · 1인 예상 {total.toLocaleString('ko-KR')}원</p>
            </div>
          </div>
          <p className="briefing-summary">{briefingSummary}</p>
          <div className="travel-briefing-list" aria-label="여행 브리핑 핵심 정보">
            <div>
              <span>확정 날짜</span>
              <strong>{travelBriefing.date}</strong>
            </div>
            <div>
              <span>장소</span>
              <strong>{travelBriefing.place}</strong>
            </div>
            <div>
              <span>숙소</span>
              <strong>{travelBriefing.stay}</strong>
            </div>
          </div>
          <div className="briefing-metrics" aria-label="브리핑 요약 지표">
            <span>
              <strong>{confirmedScheduleCount}</strong>
              일정
            </span>
            <span>
              <strong>{confirmedTaskCount}</strong>
              할 일
            </span>
            <span>
              <strong>{confirmedDecisionCount}</strong>
              결정
            </span>
            <span>
              <strong>{validBudgetCount}</strong>
              예산
            </span>
            <span>
              <strong>{linkItems.length}</strong>
              링크
            </span>
          </div>
          <div className="day-brief-list">
            {travelBriefing.itinerary.map((day) => (
              <article className="day-brief" key={day.id}>
                <span>{day.day}</span>
                <strong>{day.title}</strong>
                <p>{day.route}</p>
                <div>
                  {day.highlights.map((highlight) => (
                    <em key={highlight}>{highlight}</em>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="share-briefing">
            <Send size={16} />
            <span>{briefingShareText}</span>
          </div>
        </section>
      ) : (
        <section className="plan-card link-history-card">
          <div className="card-title">
            <Link2 size={18} />
            <h3>URL 히스토리</h3>
          </div>
          <div className="link-history-list">
            {linkItems.length === 0 && <p className="candidate-empty">아직 채팅에서 발견한 URL이 없습니다.</p>}
            {linkItems.map((link) => (
              <a href={link.url} key={link.id} rel="noreferrer" target="_blank">
                <span>{link.siteName}</span>
                <strong>{link.title}</strong>
                <small>{link.url}</small>
              </a>
            ))}
          </div>
        </section>
      )}

      {(openCandidates.length > 0 || activeNoteTab === 'briefing') && (
        <section className="plan-card analysis-card">
        <div className="card-title">
          <Sparkles size={18} />
          <h3>분석 후보</h3>
          <span className="candidate-count">{openCandidates.length}</span>
          <button className="analysis-run-button" onClick={onAnalyzeRoom} type="button">
            <Sparkles size={14} />
            브리핑
          </button>
        </div>
        <div className="candidate-list">
          {openCandidates.length === 0 && <p className="candidate-empty">새로 검토할 후보가 없습니다.</p>}
          {openCandidates.map((candidate) => (
            <article className={`candidate-item ${candidate.status}`} key={candidate.id}>
              <div>
                <span className={`candidate-type ${candidate.type}`}>{candidate.type}</span>
                <strong>{candidate.title}</strong>
                <p>{candidate.detail}</p>
                <small>{candidate.sourceText}</small>
              </div>
              <div className="candidate-actions">
                <button onClick={() => onConfirmAnalysisCandidate?.(candidate.id)} type="button">
                  확정
                </button>
                <button onClick={() => onHoldAnalysisCandidate?.(candidate.id)} type="button">
                  {candidate.status === 'held' ? '다시 검토' : '보류'}
                </button>
                <button className="danger" onClick={() => onDeleteAnalysisCandidate?.(candidate.id)} type="button">
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      )}

      <section className="detail-toggle-card">
        <button aria-expanded={showDetails} onClick={() => setShowDetails((current) => !current)} type="button">
          <MoreVertical size={16} />
          {showDetails ? '상세 편집 닫기' : '상세 편집'}
        </button>
        <p>일정, 할 일, 결정, 예산 원본 목록은 필요할 때만 열어서 수정해요.</p>
      </section>

      {showDetails && (
        <>
          <section className="plan-card accent">
            <div className="card-title">
              <MapPinned size={18} />
              <h3>일정</h3>
              {renderSectionEditButton('schedule')}
            </div>
            <div className="timeline">
              {scheduleItems.map((item) => (
                <div className="timeline-item" key={item.id}>
                  <input
                    aria-label="일정 날짜"
                    disabled={!isEditing('schedule') || !onUpdateScheduleItem}
                    onChange={(event) => onUpdateScheduleItem?.(item.id, { date: event.target.value })}
                    value={item.date}
                  />
                  <input
                    aria-label="일정 제목"
                    disabled={!isEditing('schedule') || !onUpdateScheduleItem}
                    onChange={(event) => onUpdateScheduleItem?.(item.id, { title: event.target.value })}
                    value={item.title}
                  />
                  <input
                    aria-label="일정 상태"
                    disabled={!isEditing('schedule') || !onUpdateScheduleItem}
                    onChange={(event) => onUpdateScheduleItem?.(item.id, { status: event.target.value })}
                    value={item.status}
                  />
                  {isEditing('schedule') && onDeleteScheduleItem && (
                    <button
                      aria-label="일정 삭제"
                      className="note-icon-button danger"
                      onClick={() => onDeleteScheduleItem(item.id)}
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="plan-card">
            <div className="card-title">
              <ListTodo size={18} />
              <h3>할 일</h3>
              {renderSectionEditButton('tasks')}
            </div>
            <div className="task-list">
              {tasks.map((task) => (
                <div className={`task-item ${task.done ? 'done' : ''}`} key={task.id}>
                  <button aria-label="할 일 완료 토글" className="note-check-button" onClick={() => onToggleTask(task.id)} type="button">
                    {task.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  <input
                    aria-label="할 일 제목"
                    disabled={!isEditing('tasks') || !onUpdateTaskItem}
                    onChange={(event) => onUpdateTaskItem?.(task.id, { title: event.target.value })}
                    value={task.title}
                  />
                  <input
                    aria-label="할 일 담당자"
                    disabled={!isEditing('tasks') || !onUpdateTaskItem}
                    onChange={(event) => onUpdateTaskItem?.(task.id, { owner: event.target.value })}
                    value={task.owner}
                  />
                  {isEditing('tasks') && onDeleteTaskItem && (
                    <button aria-label="할 일 삭제" className="note-icon-button danger" onClick={() => onDeleteTaskItem(task.id)} type="button">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="plan-card">
            <div className="card-title">
              <Vote size={18} />
              <h3>결정 필요</h3>
              {renderSectionEditButton('decisions')}
            </div>
            <div className="decision-list">
              {decisions.map((decision) => (
                <div className="decision-item" key={decision.id}>
                  <div className="note-row">
                    <input
                      aria-label="결정 질문"
                      disabled={!isEditing('decisions') || !onUpdateDecisionItem}
                      onChange={(event) => onUpdateDecisionItem?.(decision.id, { question: event.target.value })}
                      value={decision.question}
                    />
                    {isEditing('decisions') && onDeleteDecisionItem && (
                      <button
                        aria-label="결정사항 삭제"
                        className="note-icon-button danger"
                        onClick={() => onDeleteDecisionItem(decision.id)}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <input
                    aria-label="결정 선택지"
                    disabled={!isEditing('decisions') || !onUpdateDecisionItem}
                    onChange={(event) =>
                      onUpdateDecisionItem?.(decision.id, {
                        options: event.target.value
                          .split(',')
                          .map((option) => option.trim())
                          .filter(Boolean),
                      })
                    }
                    value={decision.options.join(', ')}
                  />
                  <div className="note-row">
                    <input
                      aria-label="결정 상태"
                      disabled={!isEditing('decisions') || !onUpdateDecisionItem}
                      onChange={(event) => onUpdateDecisionItem?.(decision.id, { state: event.target.value })}
                      value={decision.state}
                    />
                    {isEditing('decisions') && onUpdateDecisionItem && (
                      <button
                        className="note-confirm-button"
                        disabled={decision.state === '확정'}
                        onClick={() => onUpdateDecisionItem(decision.id, { state: '확정' })}
                        type="button"
                      >
                        확정
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="plan-card">
            <div className="card-title">
              <Coins size={18} />
              <h3>예산</h3>
              {renderSectionEditButton('budget')}
            </div>
            <div className="budget-total">
              <Clock3 size={16} />
              <span>1인 예상 {total.toLocaleString('ko-KR')}원</span>
            </div>
            <div className="budget-grid">
              {budgetItems.map((item) => (
                <div className="budget-item" key={item.id}>
                  <div className="note-row">
                    <input
                      aria-label="예산 항목"
                      disabled={!isEditing('budget') || !onUpdateBudgetItem}
                      onChange={(event) => onUpdateBudgetItem?.(item.id, { category: event.target.value })}
                      value={item.category}
                    />
                    {isEditing('budget') && onDeleteBudgetItem && (
                      <button
                        aria-label="예산 삭제"
                        className="note-icon-button danger"
                        onClick={() => onDeleteBudgetItem(item.id)}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <input
                    aria-label="예산 금액"
                    disabled={!isEditing('budget') || !onUpdateBudgetItem}
                    onChange={(event) => onUpdateBudgetItem?.(item.id, { amount: event.target.value })}
                    value={item.amount}
                  />
                  <input
                    aria-label="예산 메모"
                    disabled={!isEditing('budget') || !onUpdateBudgetItem}
                    onChange={(event) => onUpdateBudgetItem?.(item.id, { note: event.target.value })}
                    value={item.note}
                  />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function buildTravelBriefing(room: ChatRoom, scheduleItems: ScheduleItem[], decisions: DecisionItem[]) {
  const sourceTexts = room.messages
    .filter((message) => message.sender !== 'Plink' && message.sender !== 'PlanTalk')
    .map((message) => message.text.replace(/https?:\/\/[^\s<>"']+/g, '').trim())
    .filter(Boolean);
  const stay =
    decisions.find((decision) => /숙소|호텔|펜션|airbnb|에어비앤비/i.test(decision.question) && decision.state !== '대화 전')
      ?.question ??
    sourceTexts.find((text) => /숙소|호텔|펜션|airbnb|에어비앤비/i.test(text) && /확정|예약|정하|하자|좋/.test(text)) ??
    '대화에서 아직 확정 전';
  const confirmedSchedules = scheduleItems.filter((item) => item.status !== '대화 필요');
  const dayPlans = collectDayPlans(sourceTexts);
  const fallbackPlans = confirmedSchedules.slice(0, 4).map((item, index) => ({
    id: `schedule-${item.id}`,
    day: dayLabelFromText(`${item.date} ${item.title}`) ?? `${index + 1}일차`,
    title: item.title,
    route: `${item.date} · ${item.status}`,
    highlights: ['일정', item.status],
  }));

  return {
    date: room.period || room.finalPlan.period,
    place: room.destination,
    stay: compactText(stay, 42),
    itinerary: dayPlans.length > 0 ? dayPlans : fallbackPlans.length > 0 ? fallbackPlans : room.finalPlan.days.slice(0, 4),
  };
}

function collectDayPlans(texts: string[]) {
  return texts
    .map((text, index) => {
      const day = dayLabelFromText(text);
      if (!day) return null;
      return {
        id: `message-${index}`,
        day,
        title: compactText(text, 34),
        route: '채팅에서 언급된 일정',
        highlights: ['채팅 기반', /확정|하자|좋/.test(text) ? '확정 후보' : '일정'],
      };
    })
    .filter((item): item is { id: string; day: string; title: string; route: string; highlights: string[] } => Boolean(item));
}

function dayLabelFromText(text: string) {
  if (/1일차|첫날|첫째날|첫째 날/.test(text)) return '1일차';
  if (/2일차|둘째날|둘째 날/.test(text)) return '2일차';
  if (/3일차|셋째날|셋째 날/.test(text)) return '3일차';
  if (/마지막날|마지막 날/.test(text)) return '마지막날';
  if (/토요일|토욜/.test(text)) return '토요일';
  if (/일요일|일욜/.test(text)) return '일요일';
  if (/금요일|금욜/.test(text)) return '금요일';
  return null;
}

function compactText(text: string, maxLength: number) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}...` : cleaned;
}
