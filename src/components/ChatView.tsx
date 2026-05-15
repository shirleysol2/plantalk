import { CalendarDays, Link2, MessageCircle, MoreVertical, SendHorizontal, Sparkles } from 'lucide-react';
import { FormEvent, MouseEvent, PointerEvent, useEffect, useRef, useState } from 'react';
import { NewRoomForm } from './NewRoomForm';
import type { ChatRoom, Message, MessageApplyTarget, Profile } from '../types';

type ChatViewProps = {
  activeRoom?: ChatRoom;
  activeRoomId: string | null;
  profile: Profile;
  rooms: ChatRoom[];
  onCreateRoom: (input: { title: string; destination: string; period: string }) => void;
  onCopyRoomLink: (room: ChatRoom) => void;
  onSendMessage: (text: string) => void;
  onSelectRoom: (roomId: string) => void;
  onApplyMessage?: (message: Message, targetType: MessageApplyTarget) => void;
};

const applyActions: { label: string; targetType: MessageApplyTarget }[] = [
  { label: '일정으로 반영', targetType: 'schedule' },
  { label: '할 일로 반영', targetType: 'task' },
  { label: '결정으로 반영', targetType: 'decision' },
  { label: '예산으로 반영', targetType: 'budget' },
];

export function ChatView({
  activeRoom,
  activeRoomId,
  profile,
  rooms,
  onCopyRoomLink,
  onCreateRoom,
  onSendMessage,
  onSelectRoom,
  onApplyMessage,
}: ChatViewProps) {
  const [messageText, setMessageText] = useState('');
  const [openActionMessageId, setOpenActionMessageId] = useState<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!messageText.trim()) return;

    onSendMessage(messageText);
    setMessageText('');
  };

  const closeActionMenu = () => setOpenActionMessageId(null);

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleOpenActionMenu = (messageId: number) => {
    setOpenActionMessageId((current) => (current === messageId ? null : messageId));
  };

  const handleMessageContextMenu = (event: MouseEvent, messageId: number) => {
    event.preventDefault();
    setOpenActionMessageId(messageId);
  };

  const handlePointerDown = (event: PointerEvent, messageId: number) => {
    if (event.pointerType === 'mouse' || event.button !== 0) return;

    clearLongPressTimer();
    longPressTimer.current = setTimeout(() => {
      setOpenActionMessageId(messageId);
      longPressTimer.current = null;
    }, 550);
  };

  const handleApplyMessage = (message: Message, targetType: MessageApplyTarget) => {
    onApplyMessage?.(message, targetType);
    closeActionMenu();
  };

  useEffect(() => {
    const handlePointerDownOutside = (event: globalThis.PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('.message-action-menu') || event.target.closest('.message-action-button')) return;
      closeActionMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeActionMenu();
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
      clearLongPressTimer();
    };
  }, []);

  useEffect(() => {
    closeActionMenu();
  }, [activeRoomId]);

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
              <button aria-label="공유 링크 복사" className="share-room-button" onClick={() => onCopyRoomLink(activeRoom)} type="button">
                <Link2 size={17} />
              </button>
            </header>

            <div className="chat-summary">
              <Sparkles size={17} />
              <span>{activeRoom.title} 계획 노트가 이 채팅방 기준으로 정리되고 있어요.</span>
            </div>

            <div className="message-list">
              {activeRoom.messages.map((message) => (
                <article
                  className={`message-row ${message.mine ? 'mine' : ''}`}
                  key={message.id}
                  onContextMenu={(event) => handleMessageContextMenu(event, message.id)}
                  onPointerCancel={clearLongPressTimer}
                  onPointerDown={(event) => handlePointerDown(event, message.id)}
                  onPointerLeave={clearLongPressTimer}
                  onPointerUp={clearLongPressTimer}
                >
                  {!message.mine && <div className="avatar">{message.initials}</div>}
                  <div className="message-stack">
                    {!message.mine && <span className="sender">{message.sender}</span>}
                    <div className="message-action-line">
                      <div className={`message-bubble ${message.mine ? 'mine' : ''}`}>{message.text}</div>
                      <button
                        aria-expanded={openActionMessageId === message.id}
                        aria-haspopup="menu"
                        aria-label="메시지 반영 메뉴"
                        className="message-action-button"
                        onClick={() => handleOpenActionMenu(message.id)}
                        type="button"
                      >
                        <MoreVertical size={15} />
                      </button>
                      {openActionMessageId === message.id && (
                        <div className="message-action-menu" role="menu">
                          {applyActions.map((action) => (
                            <button
                              key={action.targetType}
                              onClick={() => handleApplyMessage(message, action.targetType)}
                              role="menuitem"
                              type="button"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
