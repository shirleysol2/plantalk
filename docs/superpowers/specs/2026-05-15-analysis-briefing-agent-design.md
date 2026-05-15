# Analysis Briefing Agent Design

## Summary

Add a review layer between chat and the generated plan. The app should no longer feel like a simple chat room with manual notes beside it. It should read the conversation, produce structured planning candidates, let the user confirm them, and update the final briefing only from confirmed results.

The approved direction is:

- Build a **chat analysis candidate inbox** first.
- Confirmed candidates update the existing Plan Note sections.
- Confirmed results also refresh the top briefing card.
- Add an AI agent interface now, backed by a local analyzer first, so a remote AI agent can be plugged in later without rewriting the UI flow.

## Product Behavior

When a user sends a chat message, the system analyzes the message and creates one or more candidates:

- Schedule candidate
- Task candidate
- Decision candidate
- Budget candidate
- Insight candidate for missing information or conflicts

Candidates are not treated as final plan data immediately. They appear in a new analysis candidate area inside Plan Note. The user can confirm, hold, or delete each candidate.

Only confirmed candidates update:

- `scheduleItems`
- `tasks`
- `decisions`
- `budgetItems`
- `finalPlan`

This gives the app a system-like planning workflow: conversation creates raw signals, the analysis layer converts them into structured candidates, and confirmation produces the final briefing.

## UI Design

Plan Note keeps its current structure and gains one new section below the top briefing card:

1. **Top briefing card**
   - Shows the confirmed plan status.
   - Summarizes confirmed schedule, task, decision, and budget counts.
   - Displays share-ready briefing text.

2. **Analysis candidates**
   - Shows pending candidates extracted from chat.
   - Each candidate displays type, short title, source message, and status.
   - Actions:
     - Confirm: applies the candidate to the relevant Plan Note section.
     - Hold: keeps it visible but marks it as deferred.
     - Delete: removes it from review.

3. **Existing Plan Note sections**
   - Schedule
   - Tasks
   - Decisions
   - Budget

The candidate section should be compact and operational, not explanatory. The product should feel like a planner workspace, not a tutorial.

## Data Model

Add a new candidate type:

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
```

Add `analysisCandidates: AnalysisCandidate[]` to `ChatRoom`.

The existing list models remain the confirmed plan source of truth. Candidates are a review queue, not a replacement for the confirmed plan sections.

## Agent Boundary

Create a small analysis agent boundary in the services layer:

```ts
export type PlanAnalysisAgent = {
  analyzeMessage(input: AnalyzeMessageInput): AnalysisCandidate[];
};
```

The first implementation uses a local deterministic analyzer. It can reuse and improve the current keyword-based logic in `roomActions.ts`.

Later, a remote AI agent can implement the same contract through a server-side function. The browser should not call a paid AI API directly because API keys would be exposed.

## Data Flow

1. User sends a chat message.
2. `addMessageToRoom` creates the message.
3. The local analysis agent creates candidates from the new message.
4. The room stores the candidates in `analysisCandidates`.
5. Plan Note displays pending and held candidates.
6. User confirms a candidate.
7. Confirmation applies that candidate to the matching confirmed plan list.
8. `finalPlan` is regenerated from confirmed data.

Manual message actions can keep working. They should directly apply a selected message to a confirmed list, while the candidate inbox handles system-generated analysis.

## Error Handling

For the local analyzer, failures are unlikely and should simply produce no candidates.

For a future remote AI agent:

- Network/API failures should leave the chat message intact.
- The UI should show that analysis could not be produced for that message.
- No partial remote result should update confirmed plan data without user confirmation.

## Testing

Add focused tests for:

- Sending a message creates analysis candidates.
- Candidates do not update confirmed plan lists until confirmed.
- Confirming a schedule/task/decision/budget candidate updates the matching list.
- Confirming a candidate refreshes `finalPlan.summary` and `finalPlan.shareText`.
- Holding and deleting candidates update only the candidate queue.

Run the project build after implementation.

## Out Of Scope

The first pass will not call an external AI provider. It will create the agent interface and local analyzer so the app is ready for a server-side AI implementation.

The first pass will not add authentication, billing controls, prompt management, or background jobs.
