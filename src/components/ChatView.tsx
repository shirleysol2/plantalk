import { CalendarDays, SendHorizontal, Sparkles } from 'lucide-react';
import type { Message } from '../types';

type ChatViewProps = {
  messages: Message[];
};

export function ChatView({ messages }: ChatViewProps) {
  return (
    <div className="chat-view">
      <header className="chat-header">
        <div>
          <p className="eyebrow">PlanTalk</p>
          <h1>제주 2박 3일</h1>
        </div>
        <div className="header-meta">
          <CalendarDays size={18} />
          <span>4명 · 계획 생성 중</span>
        </div>
      </header>

      <div className="chat-summary">
        <Sparkles size={17} />
        <span>대화에서 일정 3개, 할 일 4개, 결정사항 2개를 찾았어요.</span>
      </div>

      <div className="message-list">
        {messages.map((message) => (
          <article className={`message-row ${message.mine ? 'mine' : ''}`} key={message.id}>
            {!message.mine && <div className="avatar">{message.initials}</div>}
            <div className="message-stack">
              {!message.mine && <span className="sender">{message.sender}</span>}
              <div className={`message-bubble ${message.mine ? 'mine' : ''}`}>{message.text}</div>
              <div className="message-meta">
                <span>{message.time}</span>
                {message.extraction && (
                  <span className={`extract-chip ${message.extraction.tone}`}>{message.extraction.label}</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <form className="composer">
        <input aria-label="메시지 입력" placeholder="메시지를 입력하세요" />
        <button aria-label="메시지 보내기" type="button">
          <SendHorizontal size={18} />
        </button>
      </form>
    </div>
  );
}
