import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { command, planState, recentMessages = [] } = await req.json();

    const scheduleList = (planState.scheduleItems ?? [])
      .map((i: { date: string; title: string; status: string }) =>
        `  - date="${i.date}", title="${i.title}", status="${i.status}"`)
      .join("\n") || "  (없음)";

    const taskList = (planState.tasks ?? [])
      .map((i: { title: string; owner: string; done: boolean }) =>
        `  - title="${i.title}", owner="${i.owner}", done=${i.done}`)
      .join("\n") || "  (없음)";

    const decisionList = (planState.decisions ?? [])
      .map((i: { question: string; options: string[]; state: string }) =>
        `  - question="${i.question}", options=[${i.options?.join(", ")}], state="${i.state}"`)
      .join("\n") || "  (없음)";

    const budgetList = (planState.budgetItems ?? [])
      .filter((i: { amount: string }) => i.amount !== "0원")
      .map((i: { category: string; amount: string; note: string }) =>
        `  - category="${i.category}", amount="${i.amount}", note="${i.note}"`)
      .join("\n") || "  (없음)";

    const contextMessages = recentMessages.length > 0
      ? recentMessages
          .map((m: { sender: string; text: string }) => `  ${m.sender}: ${m.text}`)
          .join("\n")
      : "  (없음)";

    const prompt = `당신은 Plink라는 스마트 계획 관리 어시스턴트입니다.
사용자의 자연어 명령을 이해하여 계획 노트를 수정하거나, 질문에 답하거나, 대화를 나눕니다.
수정이 필요하면 operations 배열에 작업을 담고, 그냥 대화면 operations는 빈 배열로 reply만 반환하세요.

===현재 계획 노트 상태===
계획 제목: ${planState.title ?? "(없음)"}
여행지: ${planState.destination ?? "(없음)"}
여행 기간: ${planState.period ?? "(없음)"}

일정 목록:
${scheduleList}

할 일 목록:
${taskList}

결정 사항:
${decisionList}

예산 목록:
${budgetList}
========================

최근 대화 내용 (맥락 참고용):
${contextMessages}

사용자 명령: "${command}"

===응답 형식===
아래 JSON만 반환 (마크다운/코드블록 없이, 순수 JSON):
{
  "operations": [ ... ],
  "reply": "친근하고 자연스러운 한국어 응답. 수정했으면 무엇을 바꿨는지 구체적으로. 질문이면 답변만."
}

===사용 가능한 operation 타입===

여행지 변경:
{ "type": "updateDestination", "newDestination": "새 여행지" }

계획 제목 변경:
{ "type": "updateTitle", "newTitle": "새 제목" }

여행 기간 변경:
{ "type": "updatePeriod", "newPeriod": "새 기간 (예: 7/1~7/4, 2박3일 등)" }

일정 시각 변경 (date 필드를 fromDate → toDate):
{ "type": "updateScheduleDate", "fromDate": "현재 date값 그대로", "toDate": "새 date값" }

특정 날짜의 일정 전체 삭제:
{ "type": "deleteByDate", "date": "삭제할 date값 그대로" }

키워드로 항목 삭제:
{ "type": "deleteByKeyword", "section": "schedule|task|decision|all", "keyword": "항목 title/question에 포함된 텍스트" }

항목 상태 변경:
{ "type": "updateItemStatus", "section": "schedule|task|decision", "keyword": "항목 키워드", "newStatus": "새 상태" }
  - schedule 상태: 확정 / 후보 / 변경
  - task 상태: 완료 / 진행중
  - decision 상태: 확정 / 결정 필요 / 검토 필요

일정 추가:
{ "type": "addSchedule", "date": "시각 또는 날짜", "title": "일정 제목", "status": "확정|후보" }

할 일 추가:
{ "type": "addTask", "title": "할 일 제목" }

결정 사항 추가:
{ "type": "addDecision", "question": "결정할 내용", "options": ["선택지1", "선택지2"], "state": "결정 필요" }

예산 추가:
{ "type": "addBudget", "category": "항목명", "amount": "금액 (예: 50000원)", "note": "메모" }

예산 수정:
{ "type": "updateBudget", "keyword": "항목 키워드", "newAmount": "새 금액", "newNote": "새 메모" }

항목 이름 변경:
{ "type": "renameItem", "section": "schedule|task|decision", "keyword": "현재 키워드", "newTitle": "새 이름" }

섹션 전체 초기화:
{ "type": "clearSection", "section": "schedule|task|decision|budget|all" }

===중요 규칙===
- fromDate / date 값: 반드시 현재 일정의 date 필드 값을 그대로 복사 (예: "2시", "오후 2시", "준비 중")
- keyword: 항목의 title 또는 question에 실제로 포함된 텍스트를 사용
- 여러 작업이 필요하면 operations 배열에 여러 개 포함
- 최근 대화 내용을 참고해서 "그거", "아까 말한 거", "방금 얘기한" 같은 표현도 정확히 이해
- 단순 질문 ("뭐가 있어?", "어디 가기로 했어?") → operations 빈 배열, reply에 현재 상태 요약해서 답변
- 명확하지 않은 요청 → operations 빈 배열, reply에 어떻게 말하면 되는지 친절하게 안내
- reply는 항상 반환, 1~3문장의 자연스러운 한국어로`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
    };

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("plink-command error:", e);
    return new Response(
      JSON.stringify({ operations: [], reply: "처리 중 오류가 발생했어요. 다시 시도해 주세요." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
