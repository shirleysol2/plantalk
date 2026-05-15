# Analysis Briefing Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a chat analysis candidate inbox so users can confirm extracted planning items and have confirmed results update the Plan Note briefing.

**Architecture:** Introduce an analysis candidate model on `ChatRoom`, a focused local plan analysis agent, and room actions for candidate confirmation, holding, and deletion. The Plan Note renders candidates as a review queue while confirmed plan lists remain the source of truth for the final briefing.

**Tech Stack:** Vite, React, TypeScript, plain CSS, Vitest-style service tests through the existing npm test setup.

---

## File Structure

- `src/types.ts`: Add candidate and analysis agent input types.
- `src/services/planAnalysisAgent.ts`: Create local analyzer functions that convert a message into review candidates.
- `src/services/roomActions.ts`: Use the analyzer when messages are sent and add actions to confirm, hold, and delete candidates.
- `src/services/roomActions.test.ts`: Add tests for candidate creation and candidate lifecycle behavior.
- `src/components/PlanNote.tsx`: Render the candidate inbox and call candidate actions.
- `src/App.tsx`: Wire candidate actions into active room state updates.
- `src/styles.css`: Style the candidate inbox, compact candidate cards, and action buttons.

## Task 1: Add Analysis Candidate Types

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add candidate types near the existing planning item types**

Add this after `Message`:

```ts
export type AnalysisCandidateType = 'schedule' | 'task' | 'decision' | 'budget' | 'insight';

export type AnalysisCandidateStatus = 'pending' | 'confirmed' | 'held';

export type AnalysisCandidate = {
  id: number;
  type: AnalysisCandidateType;
  title: string;
  detail: string;
  sourceMessageId: number;
  sourceText: string;
  status: AnalysisCandidateStatus;
};

export type AnalyzeMessageInput = {
  message: Message;
  destination: string;
  nickname: string;
};
```

- [ ] **Step 2: Add candidates to `ChatRoom`**

Add this property in `ChatRoom` after `messages`:

```ts
  analysisCandidates: AnalysisCandidate[];
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run build
```

Expected: TypeScript fails because existing room objects do not include `analysisCandidates`. This confirms the type is connected.

## Task 2: Create Local Plan Analysis Agent

**Files:**
- Create: `src/services/planAnalysisAgent.ts`
- Test: `src/services/roomActions.test.ts`

- [ ] **Step 1: Add tests for generated candidates**

Append these imports to `src/services/roomActions.test.ts`:

```ts
import { analyzeMessageWithLocalAgent } from './planAnalysisAgent';
import type { Message } from '../types';
```

Add this test block:

```ts
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
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npm test -- src/services/roomActions.test.ts
```

Expected: FAIL because `src/services/planAnalysisAgent.ts` does not exist.

- [ ] **Step 3: Implement the local analyzer**

Create `src/services/planAnalysisAgent.ts`:

```ts
import type { AnalysisCandidate, AnalyzeMessageInput } from '../types';

type CandidateSeed = Omit<AnalysisCandidate, 'id' | 'sourceMessageId' | 'sourceText' | 'status'>;

export function analyzeMessageWithLocalAgent({ message, destination }: AnalyzeMessageInput): AnalysisCandidate[] {
  const cleanText = message.text.trim();
  if (!cleanText) return [];

  return buildCandidateSeeds(cleanText, destination).map((candidate, index) => ({
    ...candidate,
    id: Date.now() + index,
    sourceMessageId: message.id,
    sourceText: cleanText,
    status: 'pending',
  }));
}

function buildCandidateSeeds(text: string, destination: string): CandidateSeed[] {
  const candidates: CandidateSeed[] = [];
  const schedule = inferScheduleCandidate(text);
  const task = inferTaskCandidate(text);
  const decision = inferDecisionCandidate(text, destination);
  const budget = inferBudgetCandidate(text);
  const insight = inferInsightCandidate(text);

  if (schedule) candidates.push(schedule);
  if (task) candidates.push(task);
  if (decision) candidates.push(decision);
  if (budget) candidates.push(budget);
  if (insight) candidates.push(insight);

  if (candidates.length === 0 && text.length > 12) {
    candidates.push({
      type: 'insight',
      title: '대화 메모',
      detail: `${text.slice(0, 42)}${text.length > 42 ? '...' : ''}`,
    });
  }

  return candidates;
}

function inferScheduleCandidate(text: string): CandidateSeed | null {
  const match = text.match(/(월요일|화요일|수요일|목요일|금요일|토요일|일요일|오전|오후|Day\s?\d|[0-9]{1,2}시)[^.!?。]*/);
  if (!match) return null;

  return {
    type: 'schedule',
    title: match[0].trim().slice(0, 34),
    detail: /확정|완료/.test(text) ? '확정 일정 후보' : '일정 후보',
  };
}

function inferTaskCandidate(text: string): CandidateSeed | null {
  const match = text.match(/([^.!?。]*(예약|확인|찾아|공유|저장|정리)[^.!?。]*)/);
  if (!match) return null;

  return {
    type: 'task',
    title: match[1].trim().slice(0, 34),
    detail: /완료|끝|했어|했다|확인했/.test(text) ? '완료된 할 일 후보' : '할 일 후보',
  };
}

function inferDecisionCandidate(text: string, destination: string): CandidateSeed | null {
  if (!/숙소|코스|이동|확정|정하자|어때/.test(text)) return null;

  return {
    type: 'decision',
    title: /숙소/.test(text) ? '숙소 선택' : `${destination} 계획 결정`,
    detail: /확정|완료|정했/.test(text) ? '확정 가능한 결정 후보' : '결정 검토 후보',
  };
}

function inferBudgetCandidate(text: string): CandidateSeed | null {
  const match = text.match(/([0-9][0-9,]*)\s*원/);
  if (!match) return null;

  const amount = Number(match[1].replace(/,/g, '')).toLocaleString('ko-KR');
  return {
    type: 'budget',
    title: '예산 후보',
    detail: `${amount}원`,
  };
}

function inferInsightCandidate(text: string): CandidateSeed | null {
  if (!/아직|못 정|고민|둘 중|중에|충돌|겹치/.test(text)) return null;

  return {
    type: 'insight',
    title: '결정 필요',
    detail: text.slice(0, 46),
  };
}
```

- [ ] **Step 4: Run the focused test**

Run:

```bash
npm test -- src/services/roomActions.test.ts
```

Expected: PASS for the analyzer tests; other tests may still fail because room types are not fully wired yet.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/services/planAnalysisAgent.ts src/services/roomActions.test.ts
git commit -m "feat: add local plan analysis agent"
```

## Task 3: Wire Candidates Into Room Creation And Sending

**Files:**
- Modify: `src/services/roomActions.ts`
- Test: `src/services/roomActions.test.ts`

- [ ] **Step 1: Update tests for delayed confirmation**

Add this test to the `addMessageToRoom` describe block in `src/services/roomActions.test.ts`:

```ts
it('adds analysis candidates without updating confirmed plan lists', () => {
  const room = createRoom({
    title: '제주 준비',
    destination: '제주',
    period: '5월 20일-22일',
    nickname: '지수',
    userCode: 'user_1',
  });

  const updated = addMessageToRoom(room, {
    nickname: '지수',
    text: '토요일 오전에는 성산일출봉 가고 렌트카 120,000원 확인하자',
  });

  expect(updated.analysisCandidates).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: 'schedule', status: 'pending' }),
      expect.objectContaining({ type: 'task', status: 'pending' }),
      expect.objectContaining({ type: 'budget', status: 'pending' }),
    ]),
  );
  expect(updated.scheduleItems).toHaveLength(room.scheduleItems.length);
  expect(updated.tasks).toHaveLength(room.tasks.length);
  expect(updated.budgetItems).toHaveLength(room.budgetItems.length);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npm test -- src/services/roomActions.test.ts
```

Expected: FAIL because `addMessageToRoom` still confirms inferred items directly.

- [ ] **Step 3: Import and use the local analyzer**

At the top of `src/services/roomActions.ts`, update imports:

```ts
import type { AnalysisCandidate, ChatRoom, Message, MessageApplyTarget } from '../types';
import { analyzeMessageWithLocalAgent } from './planAnalysisAgent';
```

In `createRoom`, add:

```ts
    analysisCandidates: [],
```

after `messages: [firstMessage],`.

Replace the inference block inside `addMessageToRoom` with:

```ts
  const analysisCandidates = [
    ...room.analysisCandidates,
    ...analyzeMessageWithLocalAgent({
      message,
      destination: room.destination,
      nickname,
    }).map((candidate, index) => ({
      ...candidate,
      id: nextId(room.analysisCandidates) + index,
    })),
  ];
```

Return this from `addMessageToRoom`:

```ts
  return {
    ...room,
    lastMessage: cleanText,
    messages: [...room.messages, message],
    analysisCandidates,
  };
```

Leave `applyMessageToRoom` as the manual direct-apply path.

- [ ] **Step 4: Run the focused test**

Run:

```bash
npm test -- src/services/roomActions.test.ts
```

Expected: Existing direct-inference expectations fail if they expected automatic plan list updates. Update those expectations so automatic extraction creates candidates first, while `applyMessageToRoom` tests keep verifying direct apply behavior.

- [ ] **Step 5: Commit**

```bash
git add src/services/roomActions.ts src/services/roomActions.test.ts
git commit -m "feat: queue chat analysis candidates"
```

## Task 4: Add Candidate Lifecycle Actions

**Files:**
- Modify: `src/services/roomActions.ts`
- Test: `src/services/roomActions.test.ts`

- [ ] **Step 1: Add tests for confirming, holding, and deleting candidates**

Append these imports if missing:

```ts
import type { AnalysisCandidate } from '../types';
```

Add this test block:

```ts
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

    const updated = confirmAnalysisCandidate(room, { candidateId: 1, nickname: '지수' });

    expect(updated.scheduleItems).toContainEqual(
      expect.objectContaining({
        title: '토요일 오전 성산일출봉',
        status: '후보',
      }),
    );
    expect(updated.analysisCandidates[0]).toEqual(expect.objectContaining({ status: 'confirmed' }));
    expect(updated.finalPlan.summary).toContain('일정');
    expect(updated.finalPlan.shareText).toContain('계획 업데이트');
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
    const deleted = deleteAnalysisCandidate(held, 2);

    expect(held.analysisCandidates[0].status).toBe('held');
    expect(held.tasks).toHaveLength(room.tasks.length);
    expect(deleted.analysisCandidates).toHaveLength(0);
    expect(deleted.tasks).toHaveLength(room.tasks.length);
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npm test -- src/services/roomActions.test.ts
```

Expected: FAIL because candidate action functions are not implemented.

- [ ] **Step 3: Implement candidate actions**

Add exports to `src/services/roomActions.ts`:

```ts
type ConfirmCandidateInput = {
  candidateId: number;
  nickname: string;
};

export function confirmAnalysisCandidate(room: ChatRoom, { candidateId, nickname }: ConfirmCandidateInput): ChatRoom {
  const candidate = room.analysisCandidates.find((item) => item.id === candidateId);
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
  return {
    ...room,
    analysisCandidates: room.analysisCandidates.map((item) =>
      item.id === candidateId ? { ...item, status: item.status === 'held' ? 'pending' : 'held' } : item,
    ),
  };
}

export function deleteAnalysisCandidate(room: ChatRoom, candidateId: number): ChatRoom {
  return {
    ...room,
    analysisCandidates: room.analysisCandidates.filter((item) => item.id !== candidateId),
  };
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
          status: /확정/.test(candidate.detail) ? '확정' : '후보',
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
  return {
    ...room,
    finalPlan: {
      ...room.finalPlan,
      status: room.analysisCandidates.some((candidate) => candidate.status === 'pending') ? '검토 중' : '확정 정리',
      summary: buildSummary(room.destination, room.scheduleItems.length, room.tasks.length, room.decisions.length),
      shareText: `${room.title} 계획 업데이트: 일정 ${room.scheduleItems.length}개, 할 일 ${room.tasks.length}개, 결정사항 ${room.decisions.length}개`,
    },
  };
}
```

- [ ] **Step 4: Run the focused test**

Run:

```bash
npm test -- src/services/roomActions.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/roomActions.ts src/services/roomActions.test.ts
git commit -m "feat: confirm analysis candidates"
```

## Task 5: Render Candidate Inbox In Plan Note

**Files:**
- Modify: `src/components/PlanNote.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add Plan Note props**

Update the import in `PlanNote.tsx`:

```ts
import type { AnalysisCandidate, BudgetItem, ChatRoom, DecisionItem, FinalPlan, ScheduleItem, TaskItem } from '../types';
```

Add these props to `PlanNoteProps`:

```ts
  analysisCandidates: AnalysisCandidate[];
  onConfirmAnalysisCandidate?: (candidateId: number) => void;
  onHoldAnalysisCandidate?: (candidateId: number) => void;
  onDeleteAnalysisCandidate?: (candidateId: number) => void;
```

Destructure them in `PlanNote`.

- [ ] **Step 2: Render the analysis section below the briefing card**

Add this after the `briefing-card` section:

```tsx
      <section className="plan-card analysis-card">
        <div className="card-title">
          <Sparkles size={18} />
          <h3>분석 후보</h3>
          <span className="candidate-count">
            {analysisCandidates.filter((candidate) => candidate.status !== 'confirmed').length}
          </span>
        </div>
        <div className="candidate-list">
          {analysisCandidates.filter((candidate) => candidate.status !== 'confirmed').length === 0 && (
            <p className="candidate-empty">새로 검토할 후보가 없습니다.</p>
          )}
          {analysisCandidates
            .filter((candidate) => candidate.status !== 'confirmed')
            .map((candidate) => (
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
```

Add `Sparkles` to the lucide import:

```ts
import { CalendarCheck2, CheckCircle2, Circle, Clock3, Coins, Link2, ListTodo, MapPinned, MoreVertical, Send, Sparkles, Trash2, Vote } from 'lucide-react';
```

- [ ] **Step 3: Wire actions in App**

Update imports from `roomActions`:

```ts
import { addMessageToRoom, applyMessageToRoom, confirmAnalysisCandidate, createRoom, deleteAnalysisCandidate, holdAnalysisCandidate } from './services/roomActions';
```

Add handlers near `handleApplyMessage`:

```ts
  const handleConfirmAnalysisCandidate = (candidateId: number) => {
    if (!profile) return;
    updateActiveRoom((room) => confirmAnalysisCandidate(room, { candidateId, nickname: profile.nickname }));
  };

  const handleHoldAnalysisCandidate = (candidateId: number) => {
    updateActiveRoom((room) => holdAnalysisCandidate(room, candidateId));
  };

  const handleDeleteAnalysisCandidate = (candidateId: number) => {
    updateActiveRoom((room) => deleteAnalysisCandidate(room, candidateId));
  };
```

Pass props to `PlanNote`:

```tsx
              analysisCandidates={activeRoom.analysisCandidates}
              onConfirmAnalysisCandidate={handleConfirmAnalysisCandidate}
              onHoldAnalysisCandidate={handleHoldAnalysisCandidate}
              onDeleteAnalysisCandidate={handleDeleteAnalysisCandidate}
```

- [ ] **Step 4: Add compact candidate styles**

Append to `src/styles.css`:

```css
.analysis-card {
  border-color: rgba(251, 191, 36, 0.55);
}

.candidate-count {
  min-width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 800;
}

.candidate-list {
  display: grid;
  gap: 10px;
}

.candidate-empty {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.candidate-item {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(17, 24, 39, 0.09);
  border-radius: 8px;
  background: #fffdf6;
}

.candidate-item.held {
  background: #f8fafc;
  opacity: 0.78;
}

.candidate-item strong,
.candidate-item p,
.candidate-item small {
  display: block;
}

.candidate-item strong {
  margin-top: 6px;
  color: #111827;
  font-size: 0.94rem;
}

.candidate-item p {
  margin: 4px 0;
  color: #374151;
  font-size: 0.86rem;
}

.candidate-item small {
  color: #6b7280;
  line-height: 1.35;
}

.candidate-type {
  display: inline-flex;
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #111827;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}

.candidate-type.schedule {
  background: #dbeafe;
  color: #1d4ed8;
}

.candidate-type.task {
  background: #dcfce7;
  color: #15803d;
}

.candidate-type.decision,
.candidate-type.insight {
  background: #fef3c7;
  color: #92400e;
}

.candidate-type.budget {
  background: #fee2e2;
  color: #b91c1c;
}

.candidate-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.candidate-actions button {
  min-height: 34px;
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 8px;
  background: #fff;
  color: #111827;
  font-weight: 800;
  cursor: pointer;
}

.candidate-actions button:first-child {
  background: #111827;
  color: #fff;
}

.candidate-actions button.danger {
  color: #b91c1c;
}
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/PlanNote.tsx src/App.tsx src/styles.css
git commit -m "feat: show analysis candidate inbox"
```

## Task 6: Verify In Browser

**Files:**
- No source files unless fixing issues discovered during verification.

- [ ] **Step 1: Start the dev server**

Run:

```bash
npm run dev
```

Expected: Vite serves the app on a local URL.

- [ ] **Step 2: Smoke test the workflow**

Open the local app and create a room. Send:

```text
토요일 오전에는 성산일출봉 가고 렌트카 120,000원 확인하자
```

Expected:

- The chat message appears.
- Plan Note shows pending analysis candidates.
- Schedule, task, and budget lists do not update yet.

- [ ] **Step 3: Confirm candidates**

Click `확정` on schedule, task, and budget candidates.

Expected:

- Confirmed candidates disappear from the active candidate inbox.
- Schedule, task, and budget sections gain new items.
- Top briefing summary and share text update.

- [ ] **Step 4: Check hold and delete**

Send:

```text
숙소는 서귀포랑 제주 시내 중에 아직 못 정했어
```

Click `보류`, then `다시 검토`, then `삭제` on a candidate.

Expected:

- Hold changes the visual state.
- 다시 검토 returns it to pending.
- Delete removes it without changing confirmed plan lists.

- [ ] **Step 5: Commit verification fixes if needed**

If source files changed during verification:

```bash
git add src
git commit -m "fix: polish analysis candidate workflow"
```

Expected: No commit if no source files changed.

## Self-Review

- Spec coverage: The plan covers candidate creation, user confirmation, Plan Note rendering, briefing refresh, local agent boundary, and future remote AI readiness.
- Placeholder scan: The plan contains no TBD or TODO placeholders. Each code-changing step includes concrete code or exact instructions.
- Type consistency: Candidate property names match the spec: `type`, `title`, `detail`, `sourceMessageId`, `sourceText`, and `status`.
