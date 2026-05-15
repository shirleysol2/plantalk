import { CalendarDays, MessageCircle, SendHorizontal, Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { NewRoomForm } from './NewRoomForm';
import type { ChatRoom, Profile } from '../types';

type ChatViewProps = {
  activeRoom?: ChatRoom;
  activeRoomId: string | null;
  profile: Profile;
  rooms: ChatRoom[];
  onCreateRoom: (input: { title: string; destination: string; period: string }) => void;
  onSendMessage: (text: string) => void;
  onSelectRoom: (roomId: string) => void;
};

export function ChatView({ activeRoom, activeRoomId, profile, rooms, onCreateRoom, onSendMessage, onSelectRoom }: ChatViewProps) {
  const [messageText, setMessageText] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!messageText.trim()) return;

    onSendMessage(messageText);
    setMessageText('');
  };

  return (
    <div className="chat-view">
      <aside className="room-list">
        <div className="room-list-header">
          <div className="profile-pill">
            <span>{profile.image.startsWith('data:') ? <img src={profile.image} alt="" /> : profile.image}</span>
            <strong>{profile.nickname}</strong>
          </div>
          <p>채팅방</p>
        </div>
        {rooms.length > 0 && <NewRoomForm compact ctaLabel="채팅방 만들기" onCreateRoom={onCreateRoom} />}
        <div className="room-items">
          {rooms.map((room) => (
            <button
              className={`room-item ${activeRoomId === room.id ? 'active' : ''} ${room.coverTone}`}
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              type="button"
            >
              <span className="room-icon">{room.destination.slice(0, 1)}</span>
              <span>
                <strong>{room.title}</strong>
                <small>{room.lastMessage}</small>
              </span>
              {room.unread > 0 && <em>{room.unread}</em>}
            </button>
          ))}
        </div>
      </aside>

      <section className="chat-main">
        {activeRoom ? (
          <>
            <header className="chat-header">
              <div>
                <p className="eyebrow">{activeRoom.subtitle}</p>
                <h1>
                  <span>{activeRoom.destination}</span>
                  <em>PlanTalk</em>
                </h1>
              </div>
              <div className="header-meta">
                <CalendarDays size={18} />
                <span>{activeRoom.period}</span>
              </div>
            </header>

            <div className="chat-summary">
              <Sparkles size={17} />
              <span>{activeRoom.title} 계획 노트가 이 채팅방 기준으로 정리되고 있어요.</span>
            </div>

            <div className="message-list">
              {activeRoom.messages.map((message) => (
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

            <form className="composer" onSubmit={handleSubmit}>
              <MessageCircle size={18} />
              <input
                aria-label="메시지 입력"
                placeholder={`${profile.nickname}님, 메시지를 입력하세요`}
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
              />
              <button aria-label="메시지 보내기" type="submit">
                <SendHorizontal size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="empty-chat">
            <Sparkles size={30} />
            <h1>새로운 계획 노트 만들기</h1>
            <p>첫 채팅방을 만들면 대화에서 일정, 할 일, 결정사항, 예산을 정리해드릴게요.</p>
            <NewRoomForm ctaLabel="새로운 계획 노트 만들기" onCreateRoom={onCreateRoom} />
          </div>
        )}
      </section>
    </div>
  );
}
