import type { AnalysisCandidate, AnalyzeMessageInput } from '../types';

type CandidateSeed = Omit<AnalysisCandidate, 'id' | 'sourceMessageId' | 'sourceText' | 'status'>;

export type PlanAnalysisAgent = {
  analyzeMessage: (input: AnalyzeMessageInput) => AnalysisCandidate[];
};

export const localPlanAnalysisAgent: PlanAnalysisAgent = {
  analyzeMessage: analyzeMessageWithLocalAgent,
};

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
    detail: /변경|바꾸|수정|대신/.test(text) ? '변경 일정 후보' : /확정|완료/.test(text) ? '확정 일정 후보' : '일정 후보',
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
