import { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { ChatView } from './components/ChatView';
import { PanelTabs } from './components/PanelTabs';
import { PlanNote } from './components/PlanNote';
import { SettingsView } from './components/SettingsView';
import { budgetItems, decisions, members, messages, scheduleItems, summaryStyles, taskItems } from './data';
import type { PanelId, TabId } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [activePanel, setActivePanel] = useState<PanelId>('plan');
  const [tasks, setTasks] = useState(taskItems);
  const [summaryStyle, setSummaryStyle] = useState(summaryStyles[0]);

  const toggleTask = (taskId: number) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    );
  };

  return (
    <main className="app-shell">
      <section className={`chat-column ${activeTab === 'chat' ? 'is-active' : ''}`}>
        <ChatView messages={messages} />
      </section>

      <aside className={`side-panel ${activeTab !== 'chat' ? 'is-active' : ''}`}>
        <PanelTabs activePanel={activePanel} onChange={setActivePanel} />
        <div className={activeTab === 'settings' || activePanel === 'settings' ? 'panel-view' : 'panel-view is-hidden-mobile'}>
          {(activeTab === 'settings' || activePanel === 'settings') && (
            <SettingsView
              members={members}
              summaryStyles={summaryStyles}
              summaryStyle={summaryStyle}
              onSummaryStyleChange={setSummaryStyle}
            />
          )}
        </div>
        <div className={activeTab === 'plan' || activePanel === 'plan' ? 'panel-view' : 'panel-view is-hidden-mobile'}>
          {(activeTab === 'plan' || activePanel === 'plan') && (
            <PlanNote
              scheduleItems={scheduleItems}
              tasks={tasks}
              decisions={decisions}
              budgetItems={budgetItems}
              onToggleTask={toggleTask}
            />
          )}
        </div>
      </aside>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </main>
  );
}
