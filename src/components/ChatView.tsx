import { ArrowLeft, CalendarDays, Link2, MessageCircle, MoreVertical, Search, SendHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { FormEvent, MouseEvent, PointerEvent, useEffect, useRef, useState } from 'react';
import { NewRoomForm } from './NewRoomForm';
import { PlinkLogo } from './PlinkLogo';
import { isMessageMineForUser } from '../services/roomActions';
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
  onDeleteRoom?: (roomId: string) => void;
  onApplyMessage?: (message: Message, targetType: MessageApplyTarget) => void;
};

const applyActions: { label: string; targetType: MessageApplyTarget }[] = [
  { label: '일정으로 반영', targetType: 'schedule' },
  { label: '할 일로 반영', targetType: 'task' },
  { label: '결정으로 반영', targetType: 'decision' },
  { label: '예산으로 반영', targetType: 'budget' },
];

const displaySender = (sender: string) => (sender === 'PlanTalk' ? 'Plink' : sender);

export function ChatView({
  activeRoom,
  activeRoomId,
  profile,
  rooms,
  onCopyRoomLink,
  onCreateRoom,
  onSendMessage,
  onSelectRoom,
  onDeleteRoom,
  onApplyMessage,
}: ChatViewProps) {
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [openActionMessageId, setOpenActionMessageId] = useState<number | null>(null);
  const [openRoomMenuId, setOpenRoomMenuId] = useState<string | null>(null);
  const [isMobileRoomOpen, setIsMobileRoomOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!messageText.trim()) return;

    onSendMessage(messageText);
    setMessageText('');
  };

  const closeActionMenu = () => setOpenActionMessageId(null);
  const closeRoomMenu = () => setOpenRoomMenuId(null);

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

  const handleCreateRoom = (input: { title: string; destination: string; period: string }) => {
    onCreateRoom(input);
    setIsMobileRoomOpen(true);
  };

  const handleSelectRoom = (roomId: string) => {
    onSelectRoom(roomId);
    setIsMobileRoomOpen(true);
    setSearchQuery('');
    closeRoomMenu();
  };

  const handleBackToRooms = () => {
    setIsMobileRoomOpen(false);
    closeActionMenu();
  };

  useEffect(() => {
    const handlePointerDownOutside = (event: globalThis.PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('.message-action-menu') || event.target.closest('.message-action-button')) return;
      if (event.target.closest('.room-more-menu') || event.target.closest('.room-more-button')) return;
      closeActionMenu();
      closeRoomMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeActionMenu();
        closeRoomMenu();
      }
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
    closeRoomMenu();
  }, [activeRoomId]);

  const viewClassName = `chat-view ${rooms.length > 0 ? 'has-rooms' : 'is-empty'} ${isMobileRoomOpen ? 'is-room-open' : ''}`;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleMessages = activeRoom?.messages.filter((message) => {
    if (!normalizedSearchQuery) return true;
    return `${message.sender} ${message.text}`.toLowerCase().includes(normalizedSearchQuery);
  });

  return (
    <div className={viewClassName}>
      <aside className="room-list">
        <div className="room-list-header">
          <div className="profile-pill">
            <span>{profile.image.startsWith('data:') ? <img src={profile.image} alt="" /> : profile.image}</span>
            <strong>{profile.nickname}</strong>
          </div>
          <div className="room-list-title">
            <p>채팅방</p>
            <small>{rooms.length > 0 ? `${rooms.length}개의 계획 노트` : '새 계획을 시작해보세요'}</small>
          </div>
        </div>
        {rooms.length > 0 && <NewRoomForm compact ctaLabel="채팅방 만들기" onCreateRoom={handleCreateRoom} />}
        <div className="room-items">
          {rooms.map((room) => (
            <div
              className={`room-item ${activeRoomId === room.id ? 'active' : ''} ${room.coverTone}`}
              key={room.id}
            >
              <button className="room-select-button" onClick={() => handleSelectRoom(room.id)} type="button">
                <span className="room-icon">{room.destination.slice(0, 1)}</span>
                <span>
                  <strong>{room.title}</strong>
                  <small>{room.lastMessage}</small>
                </span>
              </button>
              {room.unread > 0 && <em>{room.unread}</em>}
              <div className="room-more-wrap">
                <button
                  aria-expanded={openRoomMenuId === room.id}
                  aria-haspopup="menu"
                  aria-label={`${room.title} 메뉴`}
                  className="room-more-button"
                  onClick={() => setOpenRoomMenuId((current) => (current === room.id ? null : room.id))}
                  type="button"
                >
                  <MoreVertical size={15} />
                </button>
                {openRoomMenuId === room.id && (
                  <div className="room-more-menu" role="menu">
                    <button
                      onClick={() => {
                        closeRoomMenu();
                        if (window.confirm(`${room.title} 채팅방을 삭제할까요?`)) onDeleteRoom?.(room.id);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <Trash2 size={14} />
                      채팅방 삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="chat-main">
        {activeRoom ? (
          <>
            <header className="chat-header">
              <button aria-label="채팅방 목록으로 돌아가기" className="mobile-back-button" onClick={handleBackToRooms} type="button">
                <ArrowLeft size={18} />
              </button>
              <div className="chat-title-block">
                <p className="eyebrow">{activeRoom.subtitle}</p>
                <PlinkLogo className="chat-logo" />
                <p className="chat-room-name">{activeRoom.destination}</p>
              </div>
              <div className="header-meta">
                <CalendarDays size={18} />
                <span>{activeRoom.period}</span>
              </div>
              <button aria-label="공유 링크 복사" className="share-room-button" onClick={() => onCopyRoomLink(activeRoom)} type="button">
                <Link2 size={17} />
                <span>공유</span>
              </button>
            </header>

            <div className="chat-summary">
              <Sparkles size={17} />
              <span>대화가 자연스럽게 일정, 할 일, 결정사항으로 정리되고 있어요.</span>
            </div>

            <label className="chat-search">
              <Search size={16} />
              <input
                aria-label="채팅 검색"
                placeholder="채팅 검색"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {normalizedSearchQuery && <span>{visibleMessages?.length ?? 0}</span>}
            </label>

            <div className="message-list">
              {visibleMessages?.length === 0 && <p className="empty-search-result">검색 결과가 없습니다.</p>}
              {visibleMessages?.map((message) => {
                const isMine = isMessageMineForUser(message, profile);

                return (
                  <article
                    className={`message-row ${isMine ? 'mine' : ''}`}
                    key={message.id}
                    onContextMenu={(event) => handleMessageContextMenu(event, message.id)}
                    onPointerCancel={clearLongPressTimer}
                    onPointerDown={(event) => handlePointerDown(event, message.id)}
                    onPointerLeave={clearLongPressTimer}
                    onPointerUp={clearLongPressTimer}
                  >
                    {!isMine && <div className="avatar">{message.initials}</div>}
                    <div className="message-stack">
                      {!isMine && <span className="sender">{displaySender(message.sender)}</span>}
                      <div className="message-action-line">
                        <div className={`message-bubble ${isMine ? 'mine' : ''}`}>{message.text}</div>
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
                );
              })}
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
            <PlinkLogo className="empty-logo" />
            <h1>새로운 계획 노트 만들기</h1>
            <p>첫 채팅방을 만들면 대화에서 일정, 할 일, 결정사항, 예산을 정리해드릴게요.</p>
            <NewRoomForm ctaLabel="새로운 계획 노트 만들기" onCreateRoom={handleCreateRoom} />
          </div>
        )}
      </section>
    </div>
  );
}
