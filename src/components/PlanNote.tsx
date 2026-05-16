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
  onAddScheduleItem?: () => void;
  onAddTaskItem?: () => void;
  onAddDecisionItem?: () => void;
  onAddBudgetItem?: () => void;
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
  onAddScheduleItem,
  onAddTaskItem,
  onAddDecisionItem,
  onAddBudgetItem,
}: PlanNoteProps) {
  const [editingSections, setEditingSections] = useState<Record<EditableSection, boolean>>({
    schedule: false,
    tasks: false,
    decisions: false,
    budget: false,
  });
  const [activeNoteTab, setActiveNoteTab] = useState<NoteTab>('briefing');
  const [showDetails, setShowDetails] = useState(false);
  const total = budgetItems.reduce((sum, item) => sum + parseKoreanAmount(item.amount), 0);
  const openCandidates = analysisCandidates.filter((candidate) => candidate.status !== 'confirmed');
  const confirmedSchedules = scheduleItems.filter((item) => item.status !== '대화 필요');
  const confirmedTasks = tasks.filter((task) => task.title !== '친구들에게 채팅방 링크 공유');
  const confirmedDecisions = decisions.filter((decision) => decision.state !== '대화 전');
  const validBudgets = budgetItems.filter((item) => item.amount !== '0원');
  const confirmedScheduleCount = confirmedSchedules.length;
  const confirmedTaskCount = confirmedTasks.length;
  const confirmedDecisionCount = confirmedDecisions.length;
  const validBudgetCount = validBudgets.length;
  const hasBriefedContent =
    confirmedScheduleCount + confirmedTaskCount + confirmedDecisionCount + validBudgetCount + linkItems.length > 0;
  const briefingSummary = hasBriefedContent
    ? `${room.destination} 계획에서 일정 ${confirmedScheduleCount}개, 할 일 ${confirmedTaskCount}개, 결정 ${confirmedDecisionCount}개, 예산 ${validBudgetCount}개가 정리됐어요.`
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
        <p className="eyebrow">지금 정리 중인</p>
        <h2>{room.destination} 계획 노트</h2>
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
          {hasBriefedContent && (
            <div className="dynamic-summary">
              {confirmedSchedules.length > 0 && (
                <div className="summary-group">
                  <span className="summary-badge schedule">📅 일정</span>
                  {sortAndGroupScheduleItems(confirmedSchedules).slice(0, 4).map(({ date, items }) => (
                    <div className="schedule-time-group" key={date}>
                      <span className="schedule-time-label">{date}</span>
                      <div className="schedule-time-items">
                        {items.map((item) => (
                          <div className="summary-row" key={item.id}>
                            <strong>{item.title}</strong>
                            <em>{item.status}</em>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {confirmedTasks.length > 0 && (
                <div className="summary-group">
                  <span className="summary-badge task">✅ 할 일 ({confirmedTasks.filter((t) => t.done).length}/{confirmedTasks.length})</span>
                  {confirmedTasks.slice(0, 3).map((task) => (
                    <div className={`summary-row checklist-row${task.done ? ' done' : ''}`} key={task.id}>
                      <span>{task.done ? '✓' : '○'}</span>
                      <strong>{task.title}</strong>
                      <small>{task.owner}</small>
                    </div>
                  ))}
                </div>
              )}
              {confirmedDecisions.length > 0 && (
                <div className="summary-group">
                  <span className="summary-badge decision">🗳️ 결정</span>
                  {confirmedDecisions.slice(0, 3).map((decision) => (
                    <div className="summary-row" key={decision.id}>
                      <strong>{decision.question}</strong>
                      <em className={decision.state === '확정' ? 'confirmed' : ''}>{decision.state}</em>
                    </div>
                  ))}
                </div>
              )}
              {validBudgets.length > 0 && (
                <div className="summary-group">
                  <span className="summary-badge budget">💰 예산</span>
                  {validBudgets.slice(0, 3).map((item) => (
                    <div className="summary-row" key={item.id}>
                      <span>{item.category}</span>
                      <strong>{item.amount}</strong>
                    </div>
                  ))}
                  {total > 0 && (
                    <div className="summary-row budget-total-row">
                      <span>합계</span>
                      <strong>{total.toLocaleString('ko-KR')}원</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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

        {/* 확정된 항목 한 문장 요약 */}
        {(() => {
          const confirmed = analysisCandidates.filter((c) => c.status === 'confirmed');
          if (confirmed.length === 0) return null;
          const counts: Record<string, number> = {};
          for (const c of confirmed) {
            const label = { schedule: '일정', task: '할 일', decision: '결정', budget: '예산', insight: '인사이트' }[c.type] ?? c.type;
            counts[label] = (counts[label] ?? 0) + 1;
          }
          const summary = Object.entries(counts).map(([label, n]) => `${label} ${n}개`).join(', ');
          const firstName = confirmed[0].title;
          return (
            <p className="candidate-confirmed-summary">
              ✓ {firstName}{confirmed.length > 1 ? ` 외 ${confirmed.length - 1}개` : ''} — {summary}가 계획 노트에 반영됐어요.
            </p>
          );
        })()}

        <div className="candidate-list">
          {openCandidates.length === 0 && <p className="candidate-empty">새로 검토할 후보가 없습니다.</p>}
          {(() => {
            const typeOrder: AnalysisCandidate['type'][] = ['schedule', 'task', 'decision', 'budget', 'insight'];
            const typeLabel: Record<string, string> = { schedule: '📅 일정', task: '✅ 할 일', decision: '🤔 결정', budget: '💰 예산', insight: '💡 인사이트' };
            const grouped = typeOrder
              .map((type) => ({ type, items: openCandidates.filter((c) => c.type === type) }))
              .filter(({ items }) => items.length > 0);

            return grouped.map(({ type, items }) => (
              <div className="candidate-group" key={type}>
                <div className="candidate-group-header">
                  <span className="candidate-group-label">{typeLabel[type]}</span>
                  {items.length > 1 && (
                    <button
                      className="candidate-group-confirm-all"
                      onClick={() => items.forEach((c) => onConfirmAnalysisCandidate?.(c.id))}
                      type="button"
                    >
                      전체 확정
                    </button>
                  )}
                </div>
                {items.map((candidate) => (
                  <article className={`candidate-item ${candidate.status}`} key={candidate.id}>
                    <div>
                      <strong>{candidate.title}</strong>
                      <p>{candidate.detail}</p>
                      <small>{candidate.sourceText}</small>
                    </div>
                    <div className="candidate-actions">
                      <button onClick={() => onConfirmAnalysisCandidate?.(candidate.id)} type="button">확정</button>
                      <button onClick={() => onHoldAnalysisCandidate?.(candidate.id)} type="button">
                        {candidate.status === 'held' ? '다시 검토' : '보류'}
                      </button>
                      <button className="danger" onClick={() => onDeleteAnalysisCandidate?.(candidate.id)} type="button">삭제</button>
                    </div>
                  </article>
                ))}
              </div>
            ));
          })()}
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
              {onAddScheduleItem && <button className="note-add-button" onClick={onAddScheduleItem} type="button">+ 추가</button>}
            </div>
            <div className="timeline">
              {[...scheduleItems].sort((a, b) => parseScheduleMinutes(a.date) - parseScheduleMinutes(b.date)).map((item) => (
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
              {onAddTaskItem && <button className="note-add-button" onClick={onAddTaskItem} type="button">+ 추가</button>}
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
              {onAddDecisionItem && <button className="note-add-button" onClick={onAddDecisionItem} type="button">+ 추가</button>}
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
              {onAddBudgetItem && <button className="note-add-button" onClick={onAddBudgetItem} type="button">+ 추가</button>}
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

// ── Schedule sort & grouping helpers ────────────────────────────────────────

/** Convert a date/time label to a sortable number (minutes since midnight) */
function parseScheduleMinutes(date: string): number {
  // 오후 N시 → PM
  const pmMatch = date.match(/오후\s*(\d{1,2})시/);
  if (pmMatch) {
    const h = parseInt(pmMatch[1]);
    return ((h === 12 ? 12 : h + 12) * 60);
  }
  // 오전 N시 → AM
  const amMatch = date.match(/오전\s*(\d{1,2})시/);
  if (amMatch) {
    const h = parseInt(amMatch[1]);
    return ((h === 12 ? 0 : h) * 60);
  }
  // N시 without AM/PM marker — treat as-is (0-23)
  const hourMatch = date.match(/^(\d{1,2})시$/);
  if (hourMatch) {
    return parseInt(hourMatch[1]) * 60;
  }
  // Day-of-week: Mon–Sun → 1400–1820 (so they sort after clock times)
  const days = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
  const dayIdx = days.findIndex((d) => date.includes(d));
  if (dayIdx >= 0) return 1400 + dayIdx * 60;
  // Catch-all: unknown labels go last
  return 9999;
}

/**
 * Parse Korean amount strings to a number.
 * Handles: "36만원", "3.6만원", "360,000원", "360000원", "1억 2천만원", "5천원", "500원" etc.
 */
export function parseKoreanAmount(str: string): number {
  if (!str || str === '0원' || str === '0') return 0;
  const s = str.replace(/\s/g, '').replace(/,/g, '');
  let total = 0;

  const eok = s.match(/(\d+(?:\.\d+)?)억/);
  const man = s.match(/(\d+(?:\.\d+)?)만/);
  const cheon = s.match(/(\d+(?:\.\d+)?)천/);
  const baek = s.match(/(\d+(?:\.\d+)?)백/);

  if (eok) total += parseFloat(eok[1]) * 100_000_000;
  if (man) total += parseFloat(man[1]) * 10_000;
  if (cheon) total += parseFloat(cheon[1]) * 1_000;
  if (baek) total += parseFloat(baek[1]) * 100;

  if (total > 0) return Math.round(total);

  // plain number fallback: "360000원", "500"
  const plain = s.replace(/[^0-9]/g, '');
  return plain ? Number(plain) : 0;
}

export function sortAndGroupScheduleItems<T extends { date: string; id: number; title: string }>(
  items: T[],
): Array<{ date: string; items: T[] }> {
  const sorted = [...items].sort((a, b) => parseScheduleMinutes(a.date) - parseScheduleMinutes(b.date));
  const groups: Array<{ date: string; items: T[] }> = [];
  for (const item of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === item.date) {
      last.items.push(item);
    } else {
      groups.push({ date: item.date, items: [item] });
    }
  }
  return groups;
}

