# Chat Plan Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished first-draft web app where group chat is the main surface and a generated Plan Note dashboard sits beside it on desktop or behind a bottom tab on mobile.

**Architecture:** Create a small Vite React app with static sample planning data. Keep UI responsibilities split across focused components: chat, plan note, settings, desktop panel tabs, and mobile bottom navigation. Use plain CSS for responsive layout and visual polish.

**Tech Stack:** Vite, React, TypeScript, plain CSS, lucide-react icons.

---

## File Structure

- `package.json`: project scripts and dependencies.
- `index.html`: Vite entry HTML.
- `tsconfig.json`: TypeScript compiler settings.
- `tsconfig.node.json`: TypeScript config for Vite config.
- `vite.config.ts`: Vite React plugin setup.
- `src/main.tsx`: React entry point.
- `src/App.tsx`: app shell, state for tabs, and sample data wiring.
- `src/data.ts`: static messages, schedule items, tasks, decisions, budget items, members, and summary styles.
- `src/types.ts`: shared TypeScript types.
- `src/components/ChatView.tsx`: chat header, message list, extraction chips, composer.
- `src/components/PlanNote.tsx`: schedule, tasks, decisions, and budget dashboard.
- `src/components/SettingsView.tsx`: members, notifications, and summary style controls.
- `src/components/BottomNav.tsx`: mobile tab navigation.
- `src/components/PanelTabs.tsx`: desktop right-panel tab switcher.
- `src/styles.css`: layout, theme, responsive rules, and component styling.

## Task 1: Scaffold Vite React App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`

- [ ] **Step 1: Add package metadata and scripts**

```json
{
  "name": "chat-plan-dashboard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "vite": "^7.0.0",
    "typescript": "^5.8.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {}
}
```

- [ ] **Step 2: Add Vite HTML entry**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PlanTalk</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Add TypeScript configs**

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.node.json" }],
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Add Vite config**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 5: Add React entry point**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and dependencies install successfully.

## Task 2: Add Types And Sample Data

**Files:**
- Create: `src/types.ts`
- Create: `src/data.ts`

- [ ] **Step 1: Add shared types**

```ts
export type TabId = 'chat' | 'plan' | 'settings';

export type PanelId = 'plan' | 'settings';

export type Message = {
  id: number;
  sender: string;
  initials: string;
  time: string;
  text: string;
  mine?: boolean;
  extraction?: {
    label: string;
    tone: 'schedule' | 'decision' | 'budget' | 'task';
  };
};

export type ScheduleItem = {
  id: number;
  date: string;
  title: string;
  status: string;
};

export type TaskItem = {
  id: number;
  title: string;
  owner: string;
  done: boolean;
};

export type DecisionItem = {
  id: number;
  question: string;
  options: string[];
  state: string;
};

export type BudgetItem = {
  id: number;
  category: string;
  amount: string;
  note: string;
};

export type Member = {
  id: number;
  name: string;
  initials: string;
  role: string;
};
```

- [ ] **Step 2: Add sample planning data**

```ts
import type { BudgetItem, DecisionItem, Member, Message, ScheduleItem, TaskItem } from './types';

export const messages: Message[] = [
  {
    id: 1,
    sender: '민지',
    initials: '민',
    time: '오전 10:12',
    text: '제주 2박 3일이면 금요일 밤 비행기 타고 일요일 저녁에 돌아오는 게 제일 낫지 않아?',
    extraction: { label: '일정 후보', tone: 'schedule' },
  },
  {
    id: 2,
    sender: '나',
    initials: '나',
    time: '오전 10:14',
    text: '좋아. 그럼 이번 주 금요일 밤 항공권부터 찾아볼게.',
    mine: true,
    extraction: { label: '할 일 생성', tone: 'task' },
  },
  {
    id: 3,
    sender: '지수',
    initials: '지',
    time: '오전 10:18',
    text: '숙소는 제주시 쪽이 편할까? 아니면 서귀포 쪽이 동선 예쁠 것 같기도 해.',
    extraction: { label: '결정 필요', tone: 'decision' },
  },
  {
    id: 4,
    sender: '현',
    initials: '현',
    time: '오전 10:21',
    text: '렌트까지 하면 1인 40만원 초반 정도로 잡으면 될 듯!',
    extraction: { label: '예산 업데이트', tone: 'budget' },
  },
  {
    id: 5,
    sender: '나',
    initials: '나',
    time: '오전 10:25',
    text: '일요일까지 숙소 위치 정하고, 동쪽 코스 맛집 후보도 같이 모아보자.',
    mine: true,
    extraction: { label: '마감 추가', tone: 'schedule' },
  },
];

export const scheduleItems: ScheduleItem[] = [
  { id: 1, date: '금요일 밤', title: '항공권 후보 비교', status: '진행 전' },
  { id: 2, date: '일요일까지', title: '숙소 위치 결정', status: '결정 필요' },
  { id: 3, date: 'Day 2', title: '동쪽 코스와 맛집 루트', status: '초안' },
];

export const taskItems: TaskItem[] = [
  { id: 1, title: '항공권 가격 비교하기', owner: '나', done: false },
  { id: 2, title: '렌트카 가격 확인', owner: '현', done: true },
  { id: 3, title: '숙소 후보 3개 모으기', owner: '지수', done: false },
  { id: 4, title: '동쪽 맛집 저장', owner: '민지', done: false },
];

export const decisions: DecisionItem[] = [
  { id: 1, question: '숙소 위치', options: ['제주시', '서귀포'], state: '투표 대기' },
  { id: 2, question: '이동 방식', options: ['렌트카', '택시'], state: '렌트카 우세' },
];

export const budgetItems: BudgetItem[] = [
  { id: 1, category: '항공', amount: '160,000원', note: '금요일 밤 출발 기준' },
  { id: 2, category: '숙소', amount: '140,000원', note: '2박 4인 분할' },
  { id: 3, category: '렌트', amount: '70,000원', note: '보험 포함 예상' },
  { id: 4, category: '식비', amount: '55,000원', note: '카페 포함 여유분' },
];

export const members: Member[] = [
  { id: 1, name: '나', initials: '나', role: '계획 정리' },
  { id: 2, name: '민지', initials: '민', role: '맛집 담당' },
  { id: 3, name: '지수', initials: '지', role: '숙소 담당' },
  { id: 4, name: '현', initials: '현', role: '이동 담당' },
];

export const summaryStyles = ['꼼꼼하게', '짧고 빠르게', '결정사항 위주'];
```

## Task 3: Build Component Structure

**Files:**
- Create: `src/App.tsx`
- Create: `src/components/ChatView.tsx`
- Create: `src/components/PlanNote.tsx`
- Create: `src/components/SettingsView.tsx`
- Create: `src/components/BottomNav.tsx`
- Create: `src/components/PanelTabs.tsx`

- [ ] **Step 1: Add app shell with desktop panel and mobile tabs**

```tsx
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
```

- [ ] **Step 2: Add ChatView**

```tsx
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
```

- [ ] **Step 3: Add PlanNote**

```tsx
import { CheckCircle2, Circle, Clock3, Coins, ListTodo, MapPinned, Vote } from 'lucide-react';
import type { BudgetItem, DecisionItem, ScheduleItem, TaskItem } from '../types';

type PlanNoteProps = {
  scheduleItems: ScheduleItem[];
  tasks: TaskItem[];
  decisions: DecisionItem[];
  budgetItems: BudgetItem[];
  onToggleTask: (taskId: number) => void;
};

export function PlanNote({ scheduleItems, tasks, decisions, budgetItems, onToggleTask }: PlanNoteProps) {
  const total = budgetItems.reduce((sum, item) => sum + Number(item.amount.replace(/[^0-9]/g, '')), 0);

  return (
    <div className="plan-note">
      <div className="panel-heading">
        <p className="eyebrow">계획 노트</p>
        <h2>대화에서 정리된 계획</h2>
      </div>

      <section className="plan-card accent">
        <div className="card-title">
          <MapPinned size={18} />
          <h3>일정</h3>
        </div>
        <div className="timeline">
          {scheduleItems.map((item) => (
            <div className="timeline-item" key={item.id}>
              <span>{item.date}</span>
              <strong>{item.title}</strong>
              <em>{item.status}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="plan-card">
        <div className="card-title">
          <ListTodo size={18} />
          <h3>할 일</h3>
        </div>
        <div className="task-list">
          {tasks.map((task) => (
            <button className={`task-item ${task.done ? 'done' : ''}`} key={task.id} onClick={() => onToggleTask(task.id)} type="button">
              {task.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              <span>{task.title}</span>
              <small>{task.owner}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="plan-card">
        <div className="card-title">
          <Vote size={18} />
          <h3>결정 필요</h3>
        </div>
        <div className="decision-list">
          {decisions.map((decision) => (
            <div className="decision-item" key={decision.id}>
              <strong>{decision.question}</strong>
              <div>
                {decision.options.map((option) => (
                  <span key={option}>{option}</span>
                ))}
              </div>
              <small>{decision.state}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="plan-card">
        <div className="card-title">
          <Coins size={18} />
          <h3>예산</h3>
        </div>
        <div className="budget-total">
          <Clock3 size={16} />
          <span>1인 예상 {total.toLocaleString('ko-KR')}원</span>
        </div>
        <div className="budget-grid">
          {budgetItems.map((item) => (
            <div className="budget-item" key={item.id}>
              <span>{item.category}</span>
              <strong>{item.amount}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Add SettingsView**

```tsx
import { Bell, UsersRound, WandSparkles } from 'lucide-react';
import type { Member } from '../types';

type SettingsViewProps = {
  members: Member[];
  summaryStyles: string[];
  summaryStyle: string;
  onSummaryStyleChange: (style: string) => void;
};

export function SettingsView({ members, summaryStyles, summaryStyle, onSummaryStyleChange }: SettingsViewProps) {
  return (
    <div className="settings-view">
      <div className="panel-heading">
        <p className="eyebrow">설정</p>
        <h2>방 설정</h2>
      </div>

      <section className="plan-card">
        <div className="card-title">
          <UsersRound size={18} />
          <h3>멤버</h3>
        </div>
        <div className="member-list">
          {members.map((member) => (
            <div className="member-item" key={member.id}>
              <div className="avatar">{member.initials}</div>
              <div>
                <strong>{member.name}</strong>
                <span>{member.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="plan-card">
        <div className="card-title">
          <Bell size={18} />
          <h3>알림</h3>
        </div>
        <label className="toggle-row">
          <span>결정 필요 알림</span>
          <input defaultChecked type="checkbox" />
        </label>
        <label className="toggle-row">
          <span>마감 전 리마인드</span>
          <input defaultChecked type="checkbox" />
        </label>
      </section>

      <section className="plan-card">
        <div className="card-title">
          <WandSparkles size={18} />
          <h3>AI 요약 스타일</h3>
        </div>
        <div className="segmented">
          {summaryStyles.map((style) => (
            <button
              className={style === summaryStyle ? 'selected' : ''}
              key={style}
              onClick={() => onSummaryStyleChange(style)}
              type="button"
            >
              {style}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Add navigation components**

```tsx
import { MessageCircle, NotebookTabs, Settings } from 'lucide-react';
import type { TabId } from '../types';

type BottomNavProps = {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
};

const tabs = [
  { id: 'chat' as const, label: '채팅', icon: MessageCircle },
  { id: 'plan' as const, label: '계획 노트', icon: NotebookTabs },
  { id: 'settings' as const, label: '설정', icon: Settings },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="주요 탭">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button className={activeTab === tab.id ? 'active' : ''} key={tab.id} onClick={() => onChange(tab.id)} type="button">
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

```tsx
import { NotebookTabs, Settings } from 'lucide-react';
import type { PanelId } from '../types';

type PanelTabsProps = {
  activePanel: PanelId;
  onChange: (panel: PanelId) => void;
};

export function PanelTabs({ activePanel, onChange }: PanelTabsProps) {
  return (
    <div className="panel-tabs" role="tablist" aria-label="사이드 패널">
      <button className={activePanel === 'plan' ? 'active' : ''} onClick={() => onChange('plan')} type="button">
        <NotebookTabs size={17} />
        <span>계획 노트</span>
      </button>
      <button className={activePanel === 'settings' ? 'active' : ''} onClick={() => onChange('settings')} type="button">
        <Settings size={17} />
        <span>설정</span>
      </button>
    </div>
  );
}
```

## Task 4: Add Responsive Styling

**Files:**
- Create: `src/styles.css`

- [ ] **Step 1: Add full stylesheet**

```css
:root {
  color: #171711;
  background: #ece7dd;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    linear-gradient(135deg, rgba(255, 234, 89, 0.28), transparent 32%),
    #ece7dd;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 420px);
  gap: 16px;
  height: 100vh;
  padding: 16px;
  overflow: hidden;
}

.chat-column,
.side-panel {
  min-height: 0;
}

.chat-view,
.side-panel {
  border: 1px solid rgba(40, 36, 28, 0.12);
  background: rgba(255, 253, 248, 0.88);
  box-shadow: 0 18px 60px rgba(35, 31, 24, 0.12);
}

.chat-view {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 16px;
  background: #fffaf0;
  border-bottom: 1px solid rgba(40, 36, 28, 0.08);
}

.eyebrow {
  margin: 0 0 5px;
  color: #8a6d18;
  font-size: 12px;
  font-weight: 800;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-size: 26px;
}

h2 {
  margin-bottom: 0;
  font-size: 21px;
}

h3 {
  margin-bottom: 0;
  font-size: 15px;
}

.header-meta,
.chat-summary,
.card-title,
.budget-total {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-meta {
  flex: 0 0 auto;
  color: #625a4b;
  font-size: 14px;
}

.chat-summary {
  margin: 14px 18px 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: #171711;
  color: #fff9dc;
  font-size: 14px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  padding: 22px 22px 20px;
  overflow-y: auto;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 82%;
}

.message-row.mine {
  align-self: flex-end;
}

.avatar {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  background: #2f3d32;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}

.message-stack {
  display: grid;
  gap: 5px;
}

.sender {
  color: #625a4b;
  font-size: 12px;
  font-weight: 700;
}

.message-bubble {
  padding: 12px 14px;
  border-radius: 18px 18px 18px 6px;
  background: #ffffff;
  color: #211f1a;
  line-height: 1.45;
  box-shadow: 0 8px 24px rgba(37, 32, 24, 0.08);
}

.message-bubble.mine {
  border-radius: 18px 18px 6px 18px;
  background: #ffe95c;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #827867;
  font-size: 11px;
}

.extract-chip {
  border-radius: 999px;
  padding: 3px 8px;
  color: #1f1d18;
  font-weight: 800;
}

.extract-chip.schedule {
  background: #dff3ff;
}

.extract-chip.task {
  background: #ddf8ce;
}

.extract-chip.decision {
  background: #ffe2b8;
}

.extract-chip.budget {
  background: #eee4ff;
}

.composer {
  display: flex;
  gap: 10px;
  padding: 16px 18px 18px;
  background: #fffaf0;
  border-top: 1px solid rgba(40, 36, 28, 0.08);
}

.composer input {
  min-width: 0;
  flex: 1;
  border: 1px solid rgba(40, 36, 28, 0.16);
  border-radius: 999px;
  padding: 12px 16px;
  outline: none;
}

.composer button {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #171711;
  color: #fff;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 14px;
  border-radius: 24px;
  overflow-y: auto;
}

.panel-tabs,
.bottom-nav {
  display: flex;
  gap: 8px;
}

.panel-tabs {
  position: sticky;
  top: 0;
  z-index: 2;
  padding-bottom: 4px;
  background: rgba(255, 253, 248, 0.92);
}

.panel-tabs button,
.bottom-nav button,
.segmented button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid rgba(40, 36, 28, 0.12);
  background: #fff;
  color: #4d463a;
}

.panel-tabs button {
  flex: 1;
  min-height: 42px;
  border-radius: 14px;
  font-weight: 800;
}

.panel-tabs button.active,
.bottom-nav button.active,
.segmented button.selected {
  border-color: #171711;
  background: #171711;
  color: #fff;
}

.panel-view {
  display: block;
}

.plan-note,
.settings-view {
  display: grid;
  gap: 12px;
}

.panel-heading {
  padding: 4px 4px 2px;
}

.plan-card {
  border: 1px solid rgba(40, 36, 28, 0.1);
  border-radius: 18px;
  padding: 15px;
  background: #fff;
}

.plan-card.accent {
  background: #fff8cf;
}

.card-title {
  margin-bottom: 12px;
}

.timeline,
.task-list,
.decision-list,
.member-list,
.budget-grid {
  display: grid;
  gap: 10px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 86px 1fr;
  gap: 4px 10px;
  padding: 10px 0;
  border-top: 1px solid rgba(40, 36, 28, 0.1);
}

.timeline-item:first-child {
  border-top: 0;
}

.timeline-item span,
.timeline-item em,
.budget-item span,
.budget-item small,
.member-item span,
.decision-item small,
.task-item small {
  color: #786f61;
  font-size: 12px;
  font-style: normal;
}

.timeline-item strong {
  min-width: 0;
}

.timeline-item em {
  grid-column: 2;
}

.task-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 9px;
  width: 100%;
  border: 1px solid rgba(40, 36, 28, 0.1);
  border-radius: 13px;
  padding: 10px;
  background: #fbfaf7;
  color: #211f1a;
  text-align: left;
}

.task-item.done span {
  color: #7a7468;
  text-decoration: line-through;
}

.decision-item,
.budget-item,
.member-item {
  border-radius: 14px;
  background: #fbfaf7;
  padding: 12px;
}

.decision-item div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 9px 0;
}

.decision-item div span {
  border-radius: 999px;
  padding: 5px 9px;
  background: #eee9dd;
  font-size: 12px;
  font-weight: 800;
}

.budget-total {
  margin-bottom: 10px;
  color: #5d541e;
  font-weight: 900;
}

.budget-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.budget-item {
  display: grid;
  gap: 3px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-item .avatar {
  background: #ffe95c;
  color: #171711;
}

.member-item div:last-child {
  display: grid;
  gap: 3px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  color: #332f28;
  font-weight: 700;
}

.toggle-row + .toggle-row {
  border-top: 1px solid rgba(40, 36, 28, 0.1);
}

.toggle-row input {
  width: 18px;
  height: 18px;
  accent-color: #171711;
}

.segmented {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.segmented button {
  min-height: 38px;
  border-radius: 12px;
  font-weight: 800;
}

.bottom-nav {
  display: none;
}

@media (max-width: 860px) {
  .app-shell {
    display: block;
    height: 100vh;
    padding: 0;
    overflow: hidden;
  }

  .chat-column,
  .side-panel {
    display: none;
    height: calc(100vh - 76px);
  }

  .chat-column.is-active,
  .side-panel.is-active {
    display: block;
  }

  .chat-view,
  .side-panel {
    height: 100%;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .side-panel {
    padding: 14px 14px 88px;
    background: #fffdf8;
  }

  .panel-tabs {
    display: none;
  }

  .panel-view.is-hidden-mobile {
    display: none;
  }

  .chat-header {
    padding: 18px 18px 14px;
  }

  h1 {
    font-size: 22px;
  }

  h2 {
    font-size: 20px;
  }

  .header-meta {
    font-size: 12px;
  }

  .message-row {
    max-width: 92%;
  }

  .composer {
    padding-bottom: 88px;
  }

  .bottom-nav {
    position: fixed;
    right: 12px;
    bottom: 12px;
    left: 12px;
    z-index: 10;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 8px;
    border: 1px solid rgba(40, 36, 28, 0.12);
    border-radius: 22px;
    background: rgba(255, 253, 248, 0.96);
    box-shadow: 0 12px 34px rgba(35, 31, 24, 0.18);
  }

  .bottom-nav button {
    min-width: 0;
    min-height: 48px;
    flex-direction: column;
    gap: 3px;
    border-radius: 16px;
    font-size: 11px;
    font-weight: 900;
  }

  .budget-grid {
    grid-template-columns: 1fr;
  }
}
```

## Task 5: Verify And Commit

**Files:**
- Modify: generated project files only.

- [ ] **Step 1: Build the app**

Run: `npm run build`

Expected: TypeScript succeeds and Vite writes a `dist` directory.

- [ ] **Step 2: Start dev server**

Run: `npm run dev -- --port 5173`

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 3: Check desktop layout**

Open `http://127.0.0.1:5173/` in the in-app browser at desktop width.

Expected:
- Chat is visible as the primary left column.
- Plan Note appears in the right panel.
- Right panel tab switcher can show Settings.
- No visible text overlap.

- [ ] **Step 4: Check mobile layout**

Use browser mobile width or a narrow viewport.

Expected:
- Chat is the default view.
- Bottom navigation switches between Chat, Plan Note, and Settings.
- Composer and bottom nav do not overlap incoherently.
- Cards stack cleanly.

- [ ] **Step 5: Commit implementation**

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts src docs/superpowers/plans/2026-05-15-chat-plan-dashboard.md
git commit -m "Build chat-first planning dashboard prototype"
```

