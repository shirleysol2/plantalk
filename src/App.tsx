import { useEffect, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { ChatView } from './components/ChatView';
import { PanelTabs } from './components/PanelTabs';
import { PlanNote } from './components/PlanNote';
import { ProfileGate } from './components/ProfileGate';
import { SettingsView } from './components/SettingsView';
import { chatRooms, summaryStyles } from './data';
import {
  addMessageToRoom,
  analyzeRoomConversation,
  applyMessageToRoom,
  confirmAnalysisCandidate,
  createRoom,
  deleteAnalysisCandidate,
  generateRoomBriefing,
  holdAnalysisCandidate,
  isBriefingCommand,
  joinRoomAsMember,
} from './services/roomActions';
import { appendRemoteInfoLog, loadRemoteRoom, saveRemoteRoom } from './services/remoteRooms';
import { appendInfoLog, findRoomByShareCode, loadProfile, loadRooms, saveProfile, saveRooms } from './services/storage';
import type { BudgetItem, ChatRoom, DecisionItem, Message, MessageApplyTarget, PanelId, Profile, ScheduleItem, TabId, TaskItem } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [activePanel, setActivePanel] = useState<PanelId>('plan');
  const [rooms, setRooms] = useState(() => loadRooms(chatRooms));
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => loadRooms(chatRooms)[0]?.id ?? null);
  const [profile, setProfileState] = useState<Profile | null>(() => loadProfile());
  const [summaryStyle, setSummaryStyle] = useState(summaryStyles[0]);
  const activeRoom = rooms.find((room) => room.id === activeRoomId);

  useEffect(() => {
    saveRooms(rooms);
  }, [rooms]);

  useEffect(() => {
    if (!activeRoom?.shareCode) return;

    let cancelled = false;

    const syncActiveRoom = async () => {
      const remoteRoom = await loadRemoteRoom(activeRoom.shareCode);
      if (cancelled || !remoteRoom) return;

      setRooms((current) =>
        current.map((room) => (room.shareCode === remoteRoom.shareCode ? remoteRoom : room)),
      );
    };

    void syncActiveRoom();
    const intervalId = window.setInterval(syncActiveRoom, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeRoom?.shareCode]);

  useEffect(() => {
    if (!profile) return;

    const roomCode = new URLSearchParams(window.location.search).get('room');
    if (!roomCode) return;

    const linkedRoom = findRoomByShareCode(rooms, roomCode);
    if (linkedRoom) {
      const joinedRoom = joinRoomAsMember(linkedRoom, { nickname: profile.nickname, userCode: profile.userCode });
      if (joinedRoom !== linkedRoom) {
        setRooms((current) => current.map((room) => (room.shareCode === joinedRoom.shareCode ? joinedRoom : room)));
        void saveRemoteRoom(joinedRoom);
      }
      setActiveRoomId(joinedRoom.id);
      return;
    }

    let cancelled = false;

    loadRemoteRoom(roomCode).then((remoteRoom) => {
      if (cancelled || !remoteRoom) return;

      const joinedRoom = joinRoomAsMember(remoteRoom, { nickname: profile.nickname, userCode: profile.userCode });
      setRooms((current) => [joinedRoom, ...current.filter((room) => room.shareCode !== joinedRoom.shareCode)]);
      setActiveRoomId(joinedRoom.id);
      void saveRemoteRoom(joinedRoom);
      logInfo({
        action: 'room_opened',
        userCode: profile.userCode,
        roomCode: joinedRoom.shareCode,
        message: `${profile.nickname}님이 공유 링크로 ${joinedRoom.title} 방을 열었어요.`,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [profile, rooms]);

  const logInfo = (entry: Parameters<typeof appendInfoLog>[0]) => {
    appendInfoLog(entry);
    void appendRemoteInfoLog(entry);
  };

  const setProfile = (nextProfile: Profile) => {
    setProfileState(nextProfile);
    saveProfile(nextProfile);
    logInfo({
      action: 'profile_created',
      userCode: nextProfile.userCode,
      message: `${nextProfile.nickname} 프로필이 생성됐어요.`,
    });
  };

  const updateProfile = (updates: Partial<Pick<Profile, 'nickname' | 'image'>>) => {
    if (!profile) return;
    const nextProfile = {
      ...profile,
      ...updates,
      nickname: updates.nickname?.trim() || profile.nickname,
    };
    setProfileState(nextProfile);
    saveProfile(nextProfile);
  };

  const toggleTask = (taskId: number) => {
    if (!activeRoomId) return;

    updateActiveRoom((room) => ({
      ...room,
      tasks: room.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    }));
  };

  const showSettings = activeTab === 'settings' || (activeTab === 'chat' && activePanel === 'settings');
  const showPlan = activeTab === 'plan' || (activeTab === 'chat' && activePanel === 'plan');

  const updateActiveRoom = (updater: (room: ChatRoom) => ChatRoom) => {
    if (!activeRoomId || !activeRoom) return;

    const optimisticRoom = updater(activeRoom);
    setRooms((current) =>
      current.map((room) => (room.id === activeRoomId ? optimisticRoom : room)),
    );
    void saveRemoteRoom(optimisticRoom);
  };

  const updateRoomList = <TItem extends { id: number }>(
    key: 'scheduleItems' | 'tasks' | 'decisions' | 'budgetItems',
    itemId: number,
    updates: Partial<TItem>,
  ) => {
    updateActiveRoom((room) => ({
      ...room,
      [key]: (room[key] as TItem[]).map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    }));
  };

  const deleteRoomListItem = (key: 'scheduleItems' | 'tasks' | 'decisions' | 'budgetItems', itemId: number) => {
    updateActiveRoom((room) => ({
      ...room,
      [key]: room[key].filter((item) => item.id !== itemId),
    }));
  };

  const handleCreateRoom = (input: { title: string; destination: string; period: string }) => {
    if (!profile) return;
    const room = createRoom({ ...input, nickname: profile.nickname, userCode: profile.userCode });
    setRooms((current) => [room, ...current]);
    setActiveRoomId(room.id);
    setActiveTab('chat');
    void saveRemoteRoom(room);
    logInfo({
      action: 'room_created',
      userCode: profile.userCode,
      roomCode: room.shareCode,
      message: `${profile.nickname}님이 ${room.title} 방을 만들었어요.`,
    });
  };

  const handleCopyRoomLink = async (room: ChatRoom) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${room.shareCode}`;

    await navigator.clipboard?.writeText(shareUrl);
    logInfo({
      action: 'share_link_copied',
      userCode: profile.userCode,
      roomCode: room.shareCode,
      message: `${profile.nickname}님이 ${room.title} 공유 링크를 복사했어요.`,
    });
  };

  const handleSendMessage = (text: string) => {
    if (!profile || !activeRoomId) return;
    updateActiveRoom((room) => {
      const roomWithMessage = addMessageToRoom(room, { nickname: profile.nickname, userCode: profile.userCode, text, summaryStyle });
      return isBriefingCommand(text)
        ? generateRoomBriefing(roomWithMessage, { nickname: profile.nickname, summaryStyle })
        : roomWithMessage;
    });
  };

  const handleApplyMessage = (message: Message, target: MessageApplyTarget) => {
    if (!profile) return;

    updateActiveRoom((room) => applyMessageToRoom(room, { message, target, nickname: profile.nickname, summaryStyle }));
    logInfo({
      action: 'message_applied',
      userCode: profile.userCode,
      roomCode: activeRoom?.shareCode,
      message: `${profile.nickname}님이 메시지를 ${target} 항목으로 반영했어요.`,
    });
  };

  const handleConfirmAnalysisCandidate = (candidateId: number) => {
    if (!profile) return;
    updateActiveRoom((room) => confirmAnalysisCandidate(room, { candidateId, nickname: profile.nickname, summaryStyle }));
  };

  const handleHoldAnalysisCandidate = (candidateId: number) => {
    updateActiveRoom((room) => holdAnalysisCandidate(room, candidateId));
  };

  const handleDeleteAnalysisCandidate = (candidateId: number) => {
    updateActiveRoom((room) => deleteAnalysisCandidate(room, candidateId));
  };

  const handleAnalyzeRoom = () => {
    if (!profile) return;
    updateActiveRoom((room) => generateRoomBriefing(room, { nickname: profile.nickname, summaryStyle }));
  };

  const handleSummaryStyleChange = (style: string) => {
    setSummaryStyle(style);
    if (!profile || !activeRoomId) return;
    updateActiveRoom((room) => analyzeRoomConversation(room, { nickname: profile.nickname, summaryStyle: style }));
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms((current) => {
      const deletedRoom = current.find((room) => room.id === roomId);
      const nextRooms = current.filter((room) => room.id !== roomId);
      const roomCode = new URLSearchParams(window.location.search).get('room');
      if (deletedRoom?.shareCode && roomCode === deletedRoom.shareCode) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      if (roomId === activeRoomId) {
        setActiveRoomId(nextRooms[0]?.id ?? null);
      }
      return nextRooms;
    });
  };

  const handleEditProfile = () => {
    setActiveTab('settings');
    setActivePanel('settings');
  };

  if (!profile) {
    return <ProfileGate onComplete={setProfile} />;
  }

  return (
    <main className="app-shell">
      <div className="sky-sticker cloud-one" />
      <div className="sky-sticker cloud-two" />
      <div className="plane-sticker" />
      <section className={`chat-column ${activeTab === 'chat' ? 'is-active' : ''}`}>
        <ChatView
          activeRoom={activeRoom}
          activeRoomId={activeRoomId}
          profile={profile}
          rooms={rooms}
          onCreateRoom={handleCreateRoom}
          onCopyRoomLink={handleCopyRoomLink}
          onApplyMessage={handleApplyMessage}
          onSendMessage={handleSendMessage}
          onSelectRoom={setActiveRoomId}
          onDeleteRoom={handleDeleteRoom}
          onEditProfile={handleEditProfile}
        />
      </section>

      <aside className={`side-panel ${activeTab !== 'chat' ? 'is-active' : ''}`}>
        <PanelTabs activePanel={activePanel} onChange={setActivePanel} />
        <div className={showSettings ? 'panel-view' : 'panel-view is-hidden-mobile'}>
          {showSettings && activeRoom && (
            <SettingsView
              members={activeRoom.members}
              summaryStyles={summaryStyles}
              summaryStyle={summaryStyle}
              profile={profile}
              userCode={profile.userCode}
              onProfileChange={updateProfile}
              onSummaryStyleChange={handleSummaryStyleChange}
            />
          )}
          {showSettings && !activeRoom && (
            <div className="empty-panel">
              <h2>방 설정</h2>
              <p>계획 노트를 만들면 멤버와 알림 설정을 관리할 수 있어요.</p>
            </div>
          )}
        </div>
        <div className={showPlan ? 'panel-view' : 'panel-view is-hidden-mobile'}>
          {showPlan && activeRoom && (
            <PlanNote
              room={activeRoom}
              rooms={rooms}
              activeRoomId={activeRoomId}
              finalPlan={activeRoom.finalPlan}
              analysisCandidates={activeRoom.analysisCandidates ?? []}
              linkItems={activeRoom.linkItems ?? []}
              scheduleItems={activeRoom.scheduleItems}
              tasks={activeRoom.tasks}
              decisions={activeRoom.decisions}
              budgetItems={activeRoom.budgetItems}
              onSelectRoom={setActiveRoomId}
              onCopyRoomLink={handleCopyRoomLink}
              onToggleTask={toggleTask}
              onUpdateScheduleItem={(itemId, updates) => updateRoomList<ScheduleItem>('scheduleItems', itemId, updates)}
              onDeleteScheduleItem={(itemId) => deleteRoomListItem('scheduleItems', itemId)}
              onUpdateTaskItem={(taskId, updates) => updateRoomList<TaskItem>('tasks', taskId, updates)}
              onDeleteTaskItem={(taskId) => deleteRoomListItem('tasks', taskId)}
              onUpdateDecisionItem={(decisionId, updates) => updateRoomList<DecisionItem>('decisions', decisionId, updates)}
              onDeleteDecisionItem={(decisionId) => deleteRoomListItem('decisions', decisionId)}
              onUpdateBudgetItem={(itemId, updates) => updateRoomList<BudgetItem>('budgetItems', itemId, updates)}
              onDeleteBudgetItem={(itemId) => deleteRoomListItem('budgetItems', itemId)}
              onConfirmAnalysisCandidate={handleConfirmAnalysisCandidate}
              onHoldAnalysisCandidate={handleHoldAnalysisCandidate}
              onDeleteAnalysisCandidate={handleDeleteAnalysisCandidate}
              onAnalyzeRoom={handleAnalyzeRoom}
            />
          )}
          {showPlan && !activeRoom && (
            <div className="empty-panel">
              <h2>계획 노트</h2>
              <p>첫 채팅방을 만들면 이곳에 일정표와 준비 목록이 정리됩니다.</p>
            </div>
          )}
        </div>
      </aside>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </main>
  );
}
