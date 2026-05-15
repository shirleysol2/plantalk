import { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { ChatView } from './components/ChatView';
import { PanelTabs } from './components/PanelTabs';
import { PlanNote } from './components/PlanNote';
import { ProfileGate } from './components/ProfileGate';
import { SettingsView } from './components/SettingsView';
import { chatRooms, summaryStyles } from './data';
import type { PanelId, Profile, TabId, TaskItem } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [activePanel, setActivePanel] = useState<PanelId>('plan');
  const [activeRoomId, setActiveRoomId] = useState(chatRooms[0].id);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasksByRoom, setTasksByRoom] = useState<Record<string, TaskItem[]>>(() =>
    Object.fromEntries(chatRooms.map((room) => [room.id, room.tasks])),
  );
  const [summaryStyle, setSummaryStyle] = useState(summaryStyles[0]);

  const toggleTask = (taskId: number) => {
    setTasksByRoom((current) => ({
      ...current,
      [activeRoomId]: current[activeRoomId].map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    }));
  };

  const activeRoom = chatRooms.find((room) => room.id === activeRoomId) ?? chatRooms[0];
  const activeTasks = tasksByRoom[activeRoom.id] ?? activeRoom.tasks;
  const showSettings = activeTab === 'settings' || (activeTab === 'chat' && activePanel === 'settings');
  const showPlan = activeTab === 'plan' || (activeTab === 'chat' && activePanel === 'plan');

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
          rooms={chatRooms}
          onSelectRoom={setActiveRoomId}
        />
      </section>

      <aside className={`side-panel ${activeTab !== 'chat' ? 'is-active' : ''}`}>
        <PanelTabs activePanel={activePanel} onChange={setActivePanel} />
        <div className={showSettings ? 'panel-view' : 'panel-view is-hidden-mobile'}>
          {showSettings && (
            <SettingsView
              members={activeRoom.members}
              summaryStyles={summaryStyles}
              summaryStyle={summaryStyle}
              onSummaryStyleChange={setSummaryStyle}
            />
          )}
        </div>
        <div className={showPlan ? 'panel-view' : 'panel-view is-hidden-mobile'}>
          {showPlan && (
            <PlanNote
              room={activeRoom}
              rooms={chatRooms}
              activeRoomId={activeRoomId}
              finalPlan={activeRoom.finalPlan}
              scheduleItems={activeRoom.scheduleItems}
              tasks={activeTasks}
              decisions={activeRoom.decisions}
              budgetItems={activeRoom.budgetItems}
              onSelectRoom={setActiveRoomId}
              onToggleTask={toggleTask}
            />
          )}
        </div>
      </aside>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </main>
  );
}
